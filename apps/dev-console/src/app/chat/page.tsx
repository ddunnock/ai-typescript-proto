"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentStore } from "@/stores/agent-store";
import { useChatStore, ChatMessage } from "@/stores/chat-store";
import { Send, Bot, User, Loader2, Wrench, AlertCircle } from "lucide-react";

export default function ChatPage() {
    const { agents } = useAgentStore();
    const {
        sessions,
        activeSessionId,
        isStreaming,
        createSession,
        addMessage,
        getActiveSession,
        setStreaming,
        appendToMessage,
        updateMessage,
    } = useChatStore();

    const [input, setInput] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const activeSession = getActiveSession();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;

        let sessionId = activeSessionId;

        // Create session if needed
        if (!sessionId && selectedAgentId) {
            sessionId = createSession(selectedAgentId);
        }

        if (!sessionId) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        addMessage(sessionId, userMessage);
        setInput("");
        setStreaming(true);

        // Create placeholder assistant message for streaming
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true,
        };
        addMessage(sessionId, assistantMessage);

        // TODO: Implement actual agent streaming via API route
        // For now, simulate a response
        await simulateResponse(sessionId, assistantMessageId);

        setStreaming(false);
    };

    const simulateResponse = async (sessionId: string, messageId: string) => {
        const response =
            "This is a simulated response. Connect to the agent API route to enable real conversations with your AI agents.";
        const words = response.split(" ");

        for (const word of words) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            appendToMessage(sessionId, messageId, word + " ");
        }

        updateMessage(sessionId, messageId, { isStreaming: false });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
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
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !selectedAgentId || isStreaming}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isStreaming ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
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
                className={`flex gap-3 max-w-2xl ${
                    isUser ? "flex-row-reverse" : "flex-row"
                }`}
            >
                {/* Avatar */}
                <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        isUser
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
                    className={`px-4 py-3 rounded-2xl ${
                        isUser
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                    }`}
                >
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
