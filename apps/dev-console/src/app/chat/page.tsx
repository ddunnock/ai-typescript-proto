"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentStore, type Agent } from "@/stores/agent-store";
import { useChatStore, type ChatMessage } from "@/stores/chat-store";
import { useAgentStream } from "@/hooks/useAgentStream";
import { FlowPanel, FlowPanelToggle } from "@/components/FlowPanel";
import { Send, Bot, User, Loader2, Wrench, AlertCircle, Brain, StopCircle, GitBranch } from "lucide-react";

export default function ChatPage() {
    const { agents } = useAgentStore();
    const {
        activeSessionId,
        createSession,
        getActiveSession,
    } = useChatStore();

    const { isStreaming, error, currentTraceId, sendMessage, abort } = useAgentStream();

    const [input, setInput] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [showFlowPanel, setShowFlowPanel] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const activeSession = getActiveSession();
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming || !selectedAgentId) return;

        let sessionId = activeSessionId;

        // Create session if needed
        if (!sessionId) {
            sessionId = createSession(selectedAgentId);
        }

        if (!sessionId) return;

        const message = input.trim();
        setInput("");

        // Build conversation history from previous messages
        const history = activeSession?.messages
            .filter(m => m.role === "user" || m.role === "assistant")
            .map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })) ?? [];

        // Send message via streaming hook
        await sendMessage({
            agentId: selectedAgentId,
            message,
            sessionId,
            history,
            agentConfig: selectedAgent ? {
                type: selectedAgent.type as "orchestrator" | "email" | "notes" | "document" | "research",
                provider: (selectedAgent.provider ?? "anthropic") as "anthropic" | "openai" | "google" | "local",
                model: selectedAgent.model ?? "claude-3-5-sonnet-20241022",
                systemPrompt: selectedAgent.systemPrompt,
            } : undefined,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Chat
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Test your AI agents in real-time
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedAgentId ?? ""}
                            onChange={(e) => setSelectedAgentId(e.target.value || null)}
                            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select an agent...</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                            {agents.length === 0 && (
                                <option disabled>No agents configured</option>
                            )}
                        </select>
                        {/* Flow Panel Toggle */}
                        {currentTraceId && !showFlowPanel && (
                            <button
                                onClick={() => setShowFlowPanel(true)}
                                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                title="Show Agent Flow"
                            >
                                <GitBranch className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
                    {!activeSession || activeSession.messages.length === 0 ? (
                        <EmptyState />
                    ) : (
                        activeSession.messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="px-6 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-end gap-3 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    selectedAgentId
                                        ? "Type your message..."
                                        : "Select an agent to start chatting"
                                }
                                disabled={!selectedAgentId || isStreaming}
                                rows={1}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                style={{ minHeight: "48px", maxHeight: "200px" }}
                            />
                        </div>
                        {isStreaming ? (
                            <button
                                onClick={abort}
                                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                title="Stop generation"
                            >
                                <StopCircle className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || !selectedAgentId}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Flow Panel - shows agent execution flow */}
            {showFlowPanel && currentTraceId && (
                <FlowPanel
                    traceId={currentTraceId}
                    onSpanSelect={(spanId) => {
                        // Could navigate to trace view - for now just log
                        console.log("Selected span:", spanId);
                    }}
                />
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start a conversation
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Select an agent from the dropdown above and send a message to begin
                testing your AI agent configuration.
            </p>
        </div>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`flex gap-3 max-w-2xl ${isUser ? "flex-row-reverse" : "flex-row"
                    }`}
            >
                {/* Avatar */}
                <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isUser
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-gray-700"
                        }`}
                >
                    {isUser ? (
                        <User className="h-4 w-4 text-white" />
                    ) : (
                        <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    )}
                </div>

                {/* Content */}
                <div
                    className={`px-4 py-3 rounded-2xl ${isUser
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                        }`}
                >
                    {/* Thinking Steps (collapsible) */}
                    {isAssistant && message.thinkingSteps && message.thinkingSteps.length > 0 && (
                        <details className="mb-3 text-sm">
                            <summary className="cursor-pointer text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                <Brain className="h-3 w-3" />
                                <span>{message.thinkingSteps.length} thinking step{message.thinkingSteps.length !== 1 ? 's' : ''}</span>
                            </summary>
                            <div className="mt-2 pl-4 border-l-2 border-purple-300 dark:border-purple-700 space-y-1">
                                {message.thinkingSteps.map((step) => (
                                    <div key={step.id} className="text-xs text-gray-600 dark:text-gray-400">
                                        {step.agentType && (
                                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                                                [{step.agentType}]{" "}
                                            </span>
                                        )}
                                        {step.content}
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Tool Calls */}
                    {isAssistant && message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                            {message.toolCalls.map((toolCall) => (
                                <div
                                    key={toolCall.id}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    {toolCall.status === "running" ? (
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                    ) : toolCall.status === "error" ? (
                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                    ) : (
                                        <Wrench className="h-3 w-3 text-green-500" />
                                    )}
                                    <span className="font-mono text-xs">
                                        {toolCall.name}
                                    </span>
                                    {toolCall.endTime && toolCall.startTime && (
                                        <span className="text-xs text-gray-400">
                                            ({toolCall.endTime - toolCall.startTime}ms)
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Streaming indicator */}
                    {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                    )}
                </div>
            </div>
        </div>
    );
}
