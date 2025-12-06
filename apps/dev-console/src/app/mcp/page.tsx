"use client";

import { useMCPStore, MCPServer, MCPTool } from "@/stores/mcp-store";
import {
    Server,
    Plus,
    Power,
    PowerOff,
    Wrench,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { useState } from "react";

export default function MCPPage() {
    const { servers, addServer, selectedServerId, setSelectedServer } = useMCPStore();
    const [showToolPanel, setShowToolPanel] = useState(false);

    const selectedServer = servers.find((s) => s.id === selectedServerId);

    const createDemoServer = () => {
        const demoServer: MCPServer = {
            id: crypto.randomUUID(),
            name: `Demo Server ${servers.length + 1}`,
            description: "A demo MCP server for testing",
            status: "connected",
            transport: "internal",
            tools: [
                {
                    name: "search",
                    description: "Search the web for information",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Search query" },
                        },
                        required: ["query"],
                    },
                },
                {
                    name: "calculator",
                    description: "Perform mathematical calculations",
                    inputSchema: {
                        type: "object",
                        properties: {
                            expression: { type: "string", description: "Math expression" },
                        },
                        required: ["expression"],
                    },
                },
            ],
            lastConnectedAt: new Date(),
        };
        addServer(demoServer);
    };

    return (
        <div className="flex h-full">
            {/* Server List */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            MCP Servers
                        </h1>
                        <button
                            onClick={createDemoServer}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Add Server"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {servers.length} server{servers.length !== 1 ? "s" : ""} configured
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {servers.length === 0 ? (
                        <div className="text-center py-8">
                            <Server className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No servers configured
                            </p>
                            <button
                                onClick={createDemoServer}
                                className="mt-2 text-sm text-blue-600 hover:underline"
                            >
                                Add a demo server
                            </button>
                        </div>
                    ) : (
                        servers.map((server) => (
                            <ServerListItem
                                key={server.id}
                                server={server}
                                isSelected={server.id === selectedServerId}
                                onClick={() => {
                                    setSelectedServer(server.id);
                                    setShowToolPanel(true);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Server Detail / Tool Panel */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900">
                {selectedServer ? (
                    <ServerDetail server={selectedServer} />
                ) : (
                    <EmptyServerDetail />
                )}
            </div>
        </div>
    );
}

function ServerListItem({
    server,
    isSelected,
    onClick,
}: {
    server: MCPServer;
    isSelected: boolean;
    onClick: () => void;
}) {
    const statusIcons = {
        connected: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        disconnected: <XCircle className="h-4 w-4 text-gray-400" />,
        error: <AlertCircle className="h-4 w-4 text-red-500" />,
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
        >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                        {server.name}
                    </span>
                    {statusIcons[server.status]}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {server.tools.length} tool{server.tools.length !== 1 ? "s" : ""}
                </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>
    );
}

function ServerDetail({ server }: { server: MCPServer }) {
    const { updateServer } = useMCPStore();
    const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);

    const toggleConnection = () => {
        updateServer(server.id, {
            status: server.status === "connected" ? "disconnected" : "connected",
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Server Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <Server className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {server.name}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {server.description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleConnection}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            server.status === "connected"
                                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                    >
                        {server.status === "connected" ? (
                            <>
                                <PowerOff className="h-4 w-4" />
                                Disconnect
                            </>
                        ) : (
                            <>
                                <Power className="h-4 w-4" />
                                Connect
                            </>
                        )}
                    </button>
                </div>

                {/* Server Info */}
                <div className="mt-4 flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Transport:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {server.transport}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <span
                            className={`ml-2 font-medium ${
                                server.status === "connected"
                                    ? "text-green-600 dark:text-green-400"
                                    : server.status === "error"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-400"
                            }`}
                        >
                            {server.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tools List */}
            <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Available Tools ({server.tools.length})
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {server.tools.map((tool) => (
                        <ToolCard
                            key={tool.name}
                            tool={tool}
                            isSelected={selectedTool?.name === tool.name}
                            onClick={() =>
                                setSelectedTool(
                                    selectedTool?.name === tool.name ? null : tool
                                )
                            }
                        />
                    ))}
                </div>

                {/* Tool Detail */}
                {selectedTool && (
                    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Input Schema
                        </h4>
                        <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                            <code className="text-gray-800 dark:text-gray-200">
                                {JSON.stringify(selectedTool.inputSchema, null, 2)}
                            </code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

function ToolCard({
    tool,
    isSelected,
    onClick,
}: {
    tool: MCPTool;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-lg border text-left transition-colors ${
                isSelected
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                    : "bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
            }`}
        >
            <div className="flex items-center gap-3 mb-2">
                <Wrench className="h-4 w-4 text-gray-500" />
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                    {tool.name}
                </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {tool.description}
            </p>
        </button>
    );
}

function EmptyServerDetail() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a server
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose an MCP server from the list to view its details and tools
                </p>
            </div>
        </div>
    );
}
