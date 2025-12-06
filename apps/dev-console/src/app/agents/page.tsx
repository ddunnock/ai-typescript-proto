"use client";

import { useState } from "react";
import { useAgentStore, Agent } from "@/stores/agent-store";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import {
    Bot,
    Plus,
    Play,
    Square,
    Settings,
    Trash2,
} from "lucide-react";

const agentTypeColors = {
    orchestrator: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    email: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    notes: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    document: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    research: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    custom: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function AgentsPage() {
    const { agents, addAgent, removeAgent, updateAgent } = useAgentStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | undefined>();

    const handleCreateAgent = () => {
        setEditingAgent(undefined);
        setIsDialogOpen(true);
    };

    const handleEditAgent = (agent: Agent) => {
        setEditingAgent(agent);
        setIsDialogOpen(true);
    };

    const handleSaveAgent = (agent: Agent) => {
        if (editingAgent) {
            updateAgent(agent.id, agent);
        } else {
            addAgent(agent);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Agents
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage and configure your AI agents
                    </p>
                </div>
                <button
                    onClick={handleCreateAgent}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Agent
                </button>
            </div>

            {agents.length === 0 ? (
                <EmptyState onCreateAgent={handleCreateAgent} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onEdit={() => handleEditAgent(agent)}
                            onRemove={() => removeAgent(agent.id)}
                            onToggle={() =>
                                updateAgent(agent.id, {
                                    status: agent.status === "running" ? "idle" : "running",
                                })
                            }
                        />
                    ))}
                </div>
            )}

            {/* Agent Edit Dialog */}
            <AgentEditDialog
                agent={editingAgent}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveAgent}
            />
        </div>
    );
}

function EmptyState({ onCreateAgent }: { onCreateAgent: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Bot className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No agents configured
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md text-center">
                Create an agent to start testing your AI workflows. Agents can be
                orchestrators, specialized workers, or custom implementations.
            </p>
            <button
                onClick={onCreateAgent}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Plus className="h-4 w-4" />
                Create First Agent
            </button>
        </div>
    );
}

function AgentCard({
    agent,
    onEdit,
    onRemove,
    onToggle,
}: {
    agent: Agent;
    onEdit: () => void;
    onRemove: () => void;
    onToggle: () => void;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                            {agent.name}
                        </h3>
                        <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${agentTypeColors[agent.type]
                                }`}
                        >
                            {agent.type}
                        </span>
                    </div>
                </div>
                <StatusIndicator status={agent.status} />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {agent.description}
            </p>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                {agent.provider && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Provider:</span>
                        <span className="font-medium">{agent.provider}</span>
                    </div>
                )}
                {agent.model && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Model:</span>
                        <span className="font-mono text-xs">{agent.model}</span>
                    </div>
                )}
                {agent.tools && agent.tools.length > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tools:</span>
                        <span>{agent.tools.length} configured</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={agent.status === "running" ? "Stop" : "Start"}
                    >
                        {agent.status === "running" ? (
                            <Square className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
                <button
                    onClick={onRemove}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function StatusIndicator({ status }: { status: Agent["status"] }) {
    const colors = {
        idle: "bg-gray-400",
        running: "bg-green-500 animate-pulse",
        error: "bg-red-500",
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {status}
            </span>
        </div>
    );
}
