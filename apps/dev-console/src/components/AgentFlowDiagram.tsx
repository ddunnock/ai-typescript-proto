"use client";

import { useCallback, useMemo } from "react";
import {
    ReactFlow,
    Node,
    Edge,
    Position,
    MarkerType,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    Bot,
    Mail,
    FileText,
    Search,
    StickyNote,
    GitBranch,
    Loader2,
    CheckCircle2,
    XCircle,
    Wrench,
} from "lucide-react";
import type { TraceSpan, Trace } from "@/stores/trace-store";

// Node types for different agent kinds
export interface AgentNode extends Node {
    data: {
        label: string;
        type: "orchestrator" | "email" | "notes" | "document" | "research" | "tool" | "user";
        status: "running" | "success" | "error" | "pending";
        duration?: number;
        spanId?: string;
    };
}

export interface AgentEdge extends Edge {
    data?: {
        label?: string;
        type: "delegation" | "response" | "tool_call";
    };
}

// Custom node component for agents
function AgentNodeComponent({ data, selected }: NodeProps<AgentNode>) {
    const icons = {
        orchestrator: GitBranch,
        email: Mail,
        notes: StickyNote,
        document: FileText,
        research: Search,
        tool: Wrench,
        user: Bot,
    };

    const colors = {
        orchestrator: "from-purple-500 to-indigo-600",
        email: "from-blue-500 to-cyan-600",
        notes: "from-yellow-500 to-orange-600",
        document: "from-green-500 to-emerald-600",
        research: "from-pink-500 to-rose-600",
        tool: "from-gray-500 to-slate-600",
        user: "from-sky-500 to-blue-600",
    };

    const Icon = icons[data.type] || Bot;
    const gradient = colors[data.type] || colors.orchestrator;

    const statusStyles = {
        pending: "ring-gray-300 dark:ring-gray-600",
        running: "ring-yellow-400 ring-2 animate-pulse",
        success: "ring-green-400",
        error: "ring-red-400",
    };

    return (
        <div
            className={`min-w-[150px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${selected ? "border-blue-500" : "border-gray-200 dark:border-gray-700"
                } ${statusStyles[data.status]}`}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-gray-400 !w-3 !h-3"
            />

            {/* Header with gradient */}
            <div className={`px-3 py-2 rounded-t-lg bg-gradient-to-r ${gradient} text-white`}>
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">{data.type}</span>
                    {data.status === "running" && (
                        <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                    {data.status === "success" && (
                        <CheckCircle2 className="h-3 w-3 ml-auto" />
                    )}
                    {data.status === "error" && (
                        <XCircle className="h-3 w-3 ml-auto" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-3 py-2">
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                    {data.label}
                </p>
                {data.duration !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {data.duration}ms
                    </p>
                )}
            </div>

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-gray-400 !w-3 !h-3"
            />
        </div>
    );
}

// Custom node for tool calls
function ToolNodeComponent({ data, selected }: NodeProps<AgentNode>) {
    return (
        <div
            className={`min-w-[120px] bg-gray-50 dark:bg-gray-900 rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300 dark:border-gray-600"
                } ${data.status === "running" ? "ring-2 ring-yellow-400 animate-pulse" : ""}`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-gray-400 !w-2 !h-2"
            />

            <div className="px-3 py-2 flex items-center gap-2">
                <Wrench className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {data.label}
                </span>
                {data.status === "running" && (
                    <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
                )}
                {data.status === "success" && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-gray-400 !w-2 !h-2"
            />
        </div>
    );
}

const nodeTypes = {
    agent: AgentNodeComponent,
    tool: ToolNodeComponent,
};

// Convert trace spans to flow nodes and edges
export function traceToFlow(trace: Trace): { nodes: AgentNode[]; edges: AgentEdge[] } {
    const nodes: AgentNode[] = [];
    const edges: AgentEdge[] = [];
    const spanToNodeId = new Map<string, string>();

    // First pass: create nodes for each span
    trace.spans.forEach((span, index) => {
        const nodeId = `node-${index}`;
        spanToNodeId.set(span.id, nodeId);

        // Determine node type from span kind and name
        let nodeType: AgentNode["data"]["type"] = "orchestrator";
        if (span.kind === "tool") {
            nodeType = "tool";
        } else if (span.name.toLowerCase().includes("email")) {
            nodeType = "email";
        } else if (span.name.toLowerCase().includes("notes")) {
            nodeType = "notes";
        } else if (span.name.toLowerCase().includes("document")) {
            nodeType = "document";
        } else if (span.name.toLowerCase().includes("research")) {
            nodeType = "research";
        }

        nodes.push({
            id: nodeId,
            type: span.kind === "tool" ? "tool" : "agent",
            position: { x: 0, y: 0 }, // Will be layouted later
            data: {
                label: span.name,
                type: nodeType,
                status: span.status,
                duration: span.duration,
                spanId: span.id,
            },
        });
    });

    // Second pass: create edges based on parent-child relationships
    trace.spans.forEach((span) => {
        if (span.parentSpanId) {
            const sourceNodeId = spanToNodeId.get(span.parentSpanId);
            const targetNodeId = spanToNodeId.get(span.id);

            if (sourceNodeId && targetNodeId) {
                edges.push({
                    id: `edge-${sourceNodeId}-${targetNodeId}`,
                    source: sourceNodeId,
                    target: targetNodeId,
                    type: "smoothstep",
                    animated: span.status === "running",
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 15,
                        height: 15,
                    },
                    style: {
                        stroke: span.kind === "tool" ? "#9ca3af" : "#6366f1",
                        strokeWidth: 2,
                    },
                    data: {
                        type: span.kind === "tool" ? "tool_call" : "delegation",
                    },
                });
            }
        }
    });

    // Simple layout: tree from top to bottom
    const layoutNodes = layoutTree(nodes, edges);

    return { nodes: layoutNodes, edges };
}

// Simple tree layout algorithm
function layoutTree(nodes: AgentNode[], edges: AgentEdge[]): AgentNode[] {
    if (nodes.length === 0) return nodes;

    // Build adjacency list
    const children = new Map<string, string[]>();
    const hasParent = new Set<string>();

    edges.forEach((edge) => {
        const existing = children.get(edge.source) || [];
        existing.push(edge.target);
        children.set(edge.source, existing);
        hasParent.add(edge.target);
    });

    // Find root nodes (no parent)
    const roots = nodes.filter((n) => !hasParent.has(n.id)).map((n) => n.id);

    // Position nodes level by level
    const nodePositions = new Map<string, { x: number; y: number }>();
    const levelWidth = 200;
    const levelHeight = 120;

    function positionNode(nodeId: string, x: number, y: number): number {
        nodePositions.set(nodeId, { x, y });

        const childIds = children.get(nodeId) || [];
        if (childIds.length === 0) return x;

        let currentX = x - ((childIds.length - 1) * levelWidth) / 2;
        childIds.forEach((childId) => {
            const childWidth = positionNode(childId, currentX, y + levelHeight);
            currentX = childWidth + levelWidth;
        });

        return x;
    }

    // Position each root and its subtree
    let rootX = 0;
    roots.forEach((rootId, index) => {
        positionNode(rootId, rootX + index * levelWidth * 2, 0);
    });

    // Apply positions to nodes
    return nodes.map((node) => {
        const pos = nodePositions.get(node.id) || { x: 0, y: 0 };
        return {
            ...node,
            position: pos,
        };
    });
}

interface AgentFlowDiagramProps {
    trace: Trace;
    onSpanSelect?: (spanId: string) => void;
    className?: string;
}

export function AgentFlowDiagram({ trace, onSpanSelect, className = "" }: AgentFlowDiagramProps) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => traceToFlow(trace),
        [trace]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            const spanId = (node as AgentNode).data?.spanId;
            if (spanId && onSpanSelect) {
                onSpanSelect(spanId);
            }
        },
        [onSpanSelect]
    );

    if (nodes.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
                <p>No spans to visualize</p>
            </div>
        );
    }

    return (
        <div className={`h-full w-full ${className}`}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: "smoothstep",
                }}
            >
                <Background color="#e5e7eb" gap={20} />
                <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                <MiniMap
                    nodeColor={(node) => {
                        const data = (node as AgentNode).data;
                        switch (data?.type) {
                            case "orchestrator":
                                return "#8b5cf6";
                            case "email":
                                return "#3b82f6";
                            case "notes":
                                return "#f59e0b";
                            case "document":
                                return "#10b981";
                            case "research":
                                return "#ec4899";
                            case "tool":
                                return "#6b7280";
                            default:
                                return "#6366f1";
                        }
                    }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
            </ReactFlow>
        </div>
    );
}
