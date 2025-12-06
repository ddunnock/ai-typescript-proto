"use client";

import { useAgentStore } from "@/stores/agent-store";
import { useTraceStore } from "@/stores/trace-store";
import { useMCPStore } from "@/stores/mcp-store";
import {
    Bot,
    Server,
    Activity,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";

export default function DashboardPage() {
    const { agents } = useAgentStore();
    const { traces } = useTraceStore();
    const { servers } = useMCPStore();

    const recentTraces = traces.slice(-5).reverse();
    const successfulTraces = traces.filter((t) => t.status === "success").length;
    const failedTraces = traces.filter((t) => t.status === "error").length;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI Dev Console
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Monitor and debug your AI agents, MCP servers, and execution traces
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Agents"
                    value={agents.length}
                    icon={<Bot className="h-5 w-5" />}
                    color="blue"
                />
                <StatCard
                    title="MCP Servers"
                    value={servers.length}
                    icon={<Server className="h-5 w-5" />}
                    color="purple"
                />
                <StatCard
                    title="Successful Traces"
                    value={successfulTraces}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    color="green"
                />
                <StatCard
                    title="Failed Traces"
                    value={failedTraces}
                    icon={<XCircle className="h-5 w-5" />}
                    color="red"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Traces
                        </h2>
                        <Activity className="h-5 w-5 text-gray-400" />
                    </div>
                    {recentTraces.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No traces yet. Start chatting with an agent to see traces.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentTraces.map((trace) => (
                                <div
                                    key={trace.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={trace.status} />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                {trace.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {trace.spans.length} spans
                                            </p>
                                        </div>
                                    </div>
                                    {trace.duration && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {trace.duration}ms
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Chat */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Quick Chat
                        </h2>
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                        Start a conversation with an agent to test your AI setup.
                    </p>
                    <a
                        href="/chat"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Chat
                    </a>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: "blue" | "purple" | "green" | "red";
}) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
        green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
        red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const classes = {
        running: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
        <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
                classes[status as keyof typeof classes] ?? classes.running
            }`}
        >
            {status}
        </span>
    );
}
