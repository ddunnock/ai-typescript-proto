"use client";

import { useState } from "react";
import { GitBranch, X, Maximize2, Minimize2 } from "lucide-react";
import { AgentFlowDiagram } from "@/components/AgentFlowDiagram";
import { useTraceStore } from "@/stores/trace-store";

interface FlowPanelProps {
    traceId?: string;
    onSpanSelect?: (spanId: string) => void;
}

export function FlowPanel({ traceId, onSpanSelect }: FlowPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const { traces, liveTraceId } = useTraceStore();

    // Use provided traceId or fall back to live trace
    const activeTraceId = traceId ?? liveTraceId;
    const trace = traces.find((t) => t.id === activeTraceId);

    if (!trace || !isVisible) {
        return null;
    }

    return (
        <div
            className={`border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 ${isExpanded ? "w-[600px]" : "w-80"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Agent Flow
                    </span>
                    {liveTraceId === activeTraceId && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
                            Live
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? (
                            <Minimize2 className="h-4 w-4 text-gray-500" />
                        ) : (
                            <Maximize2 className="h-4 w-4 text-gray-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Close"
                    >
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Flow Diagram */}
            <div className="flex-1 min-h-[300px]">
                <AgentFlowDiagram
                    trace={trace}
                    onSpanSelect={onSpanSelect}
                />
            </div>

            {/* Footer Stats */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{trace.spans.length} spans</span>
                    <span>
                        {trace.status === "running" ? (
                            <span className="text-yellow-500">Running...</span>
                        ) : trace.duration ? (
                            `${trace.duration}ms`
                        ) : (
                            "—"
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Toggle button to show the flow panel when hidden
export function FlowPanelToggle({ onClick }: { onClick: () => void }) {
    const { liveTraceId, traces } = useTraceStore();

    if (!liveTraceId && traces.length === 0) {
        return null;
    }

    return (
        <button
            onClick={onClick}
            className="fixed right-4 bottom-20 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors z-50"
            title="Show Agent Flow"
        >
            <GitBranch className="h-5 w-5" />
        </button>
    );
}
