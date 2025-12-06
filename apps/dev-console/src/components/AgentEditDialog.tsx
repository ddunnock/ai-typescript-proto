"use client";

import { useState, useEffect } from "react";
import type { Agent } from "@/stores/agent-store";
import { X, Save, Bot, Trash2 } from "lucide-react";

const PROVIDERS = [
    { id: "anthropic", name: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"] },
    { id: "openai", name: "OpenAI", models: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"] },
    { id: "google", name: "Google AI", models: ["gemini-pro", "gemini-pro-vision"] },
    { id: "local", name: "Ollama (Local)", models: ["llama2", "mistral", "codellama"] },
] as const;

const AGENT_TYPES = [
    { id: "orchestrator", name: "Orchestrator", description: "Coordinates multiple agents" },
    { id: "email", name: "Email Agent", description: "Handles email-related tasks" },
    { id: "notes", name: "Notes Agent", description: "Manages notes and documentation" },
    { id: "document", name: "Document Agent", description: "Processes documents" },
    { id: "research", name: "Research Agent", description: "Performs research tasks" },
    { id: "custom", name: "Custom", description: "Customizable agent" },
] as const;

interface AgentEditDialogProps {
    agent?: Agent;
    isOpen: boolean;
    onClose: () => void;
    onSave: (agent: Agent) => void;
}

export function AgentEditDialog({ agent, isOpen, onClose, onSave }: AgentEditDialogProps) {
    const isNew = !agent;
    const [formData, setFormData] = useState<Partial<Agent>>({
        name: "",
        type: "orchestrator",
        description: "",
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        tools: [],
        systemPrompt: "",
    });
    const [toolInput, setToolInput] = useState("");

    useEffect(() => {
        if (agent) {
            setFormData({
                name: agent.name,
                type: agent.type,
                description: agent.description,
                provider: agent.provider,
                model: agent.model,
                tools: agent.tools ?? [],
                systemPrompt: agent.systemPrompt ?? "",
            });
        } else {
            setFormData({
                name: "",
                type: "orchestrator",
                description: "",
                provider: "anthropic",
                model: "claude-3-5-sonnet-20241022",
                tools: [],
                systemPrompt: "",
            });
        }
    }, [agent, isOpen]);

    if (!isOpen) return null;

    const selectedProvider = PROVIDERS.find(p => p.id === formData.provider);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date();
        onSave({
            id: agent?.id ?? crypto.randomUUID(),
            name: formData.name ?? "Untitled Agent",
            type: formData.type ?? "custom",
            description: formData.description ?? "",
            status: agent?.status ?? "idle",
            provider: formData.provider,
            model: formData.model,
            tools: formData.tools,
            systemPrompt: formData.systemPrompt,
            createdAt: agent?.createdAt ?? now,
        });
        onClose();
    };

    const addTool = () => {
        if (toolInput.trim() && !formData.tools?.includes(toolInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tools: [...(prev.tools ?? []), toolInput.trim()],
            }));
            setToolInput("");
        }
    };

    const removeTool = (tool: string) => {
        setFormData(prev => ({
            ...prev,
            tools: (prev.tools ?? []).filter(t => t !== tool),
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isNew ? "Create Agent" : "Edit Agent"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="My Agent"
                            required
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Agent Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Agent["type"] }))}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {AGENT_TYPES.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} - {type.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Describe what this agent does..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Provider */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Provider
                            </label>
                            <select
                                value={formData.provider}
                                onChange={(e) => {
                                    const provider = e.target.value;
                                    const models = PROVIDERS.find(p => p.id === provider)?.models ?? [];
                                    setFormData(prev => ({
                                        ...prev,
                                        provider: provider as Agent["provider"],
                                        model: models[0] ?? prev.model,
                                    }));
                                }}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                {PROVIDERS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Model */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Model
                            </label>
                            <select
                                value={formData.model}
                                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                {selectedProvider?.models.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* System Prompt */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            System Prompt
                        </label>
                        <textarea
                            value={formData.systemPrompt}
                            onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                            placeholder="You are a helpful AI assistant..."
                        />
                    </div>

                    {/* Tools */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tools
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={toolInput}
                                onChange={(e) => setToolInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTool())}
                                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="Add a tool name..."
                            />
                            <button
                                type="button"
                                onClick={addTool}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {formData.tools && formData.tools.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tools.map((tool) => (
                                    <span
                                        key={tool}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-sm"
                                    >
                                        {tool}
                                        <button
                                            type="button"
                                            onClick={() => removeTool(tool)}
                                            className="hover:text-red-500"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Save className="h-4 w-4" />
                        {isNew ? "Create Agent" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
