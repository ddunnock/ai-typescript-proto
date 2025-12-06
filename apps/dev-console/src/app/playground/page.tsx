"use client";

import { useState, useRef, useEffect } from "react";
import {
    usePlaygroundStore,
    type PlaygroundSession,
    type PlaygroundMessage,
} from "@/stores/playground-store";
import {
    Send,
    Plus,
    Trash2,
    Settings2,
    Save,
    Copy,
    Check,
    Loader2,
    Sparkles,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    RotateCcw,
    Clock,
    Zap,
} from "lucide-react";

const PROVIDERS = [
    { id: "anthropic", name: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"] },
    { id: "openai", name: "OpenAI", models: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"] },
    { id: "google", name: "Google AI", models: ["gemini-pro", "gemini-pro-vision"] },
    { id: "local", name: "Ollama (Local)", models: ["llama2", "mistral", "codellama"] },
] as const;

export default function PlaygroundPage() {
    const {
        sessions,
        activeSessionId,
        templates,
        isGenerating,
        error,
        createSession,
        deleteSession,
        setActiveSession,
        updateSessionSettings,
        clearSessionMessages,
        addMessage,
        updateMessage,
        saveTemplate,
        setGenerating,
        setError,
        getActiveSession,
    } = usePlaygroundStore();

    const [userInput, setUserInput] = useState("");
    const [showSettings, setShowSettings] = useState(true);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeSession = getActiveSession();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeSession?.messages]);

    // Create initial session if none exists
    useEffect(() => {
        if (sessions.length === 0) {
            createSession();
        }
    }, [sessions.length, createSession]);

    const handleSend = async () => {
        if (!userInput.trim() || isGenerating || !activeSession) return;

        const message = userInput.trim();
        setUserInput("");
        setError(null);

        // Add user message
        addMessage(activeSession.id, {
            role: "user",
            content: message,
        });

        // Create placeholder assistant message
        const assistantMsgId = crypto.randomUUID();
        addMessage(activeSession.id, {
            role: "assistant",
            content: "",
        });

        setGenerating(true);
        const startTime = Date.now();

        try {
            // Build messages array for API
            const messagesForApi = [
                { role: "system" as const, content: activeSession.settings.systemPrompt },
                ...activeSession.messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                { role: "user" as const, content: message },
            ];

            const response = await fetch("/api/playground", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messagesForApi,
                    provider: activeSession.settings.provider,
                    model: activeSession.settings.model,
                    temperature: activeSession.settings.temperature,
                    maxTokens: activeSession.settings.maxTokens,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Request failed");
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let fullContent = "";
            let tokenCount = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;

                    try {
                        const event = JSON.parse(line.slice(6));

                        if (event.type === "content" && event.content) {
                            fullContent += event.content;
                            // Update the last message (assistant)
                            const currentSession = getActiveSession();
                            if (currentSession) {
                                const lastMsg = currentSession.messages[currentSession.messages.length - 1];
                                if (lastMsg && lastMsg.role === "assistant") {
                                    updateMessage(currentSession.id, lastMsg.id, {
                                        content: fullContent,
                                    });
                                }
                            }
                        } else if (event.type === "usage") {
                            tokenCount = event.usage?.outputTokens ?? 0;
                        } else if (event.type === "error") {
                            throw new Error(event.error);
                        }
                    } catch (parseError) {
                        console.warn("Failed to parse event:", parseError);
                    }
                }
            }

            // Update final message with stats
            const latency = Date.now() - startTime;
            const currentSession = getActiveSession();
            if (currentSession) {
                const lastMsg = currentSession.messages[currentSession.messages.length - 1];
                if (lastMsg && lastMsg.role === "assistant") {
                    updateMessage(currentSession.id, lastMsg.id, {
                        tokenCount,
                        latency,
                    });
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            // Remove the empty assistant message on error
            const currentSession = getActiveSession();
            if (currentSession) {
                const lastMsg = currentSession.messages[currentSession.messages.length - 1];
                if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content) {
                    // Clear the empty message - we'll just update it with error info
                    updateMessage(currentSession.id, lastMsg.id, {
                        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
                    });
                }
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyConversation = () => {
        if (!activeSession) return;
        const text = activeSession.messages
            .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
            .join("\n\n---\n\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveTemplate = () => {
        if (!activeSession) return;
        saveTemplate({
            name: `Template from ${activeSession.name}`,
            systemPrompt: activeSession.settings.systemPrompt,
            userPrompt: activeSession.messages.find((m) => m.role === "user")?.content ?? "",
            provider: activeSession.settings.provider,
            model: activeSession.settings.model,
            temperature: activeSession.settings.temperature,
            maxTokens: activeSession.settings.maxTokens,
        });
    };

    const selectedProvider = PROVIDERS.find((p) => p.id === activeSession?.settings.provider);

    return (
        <div className="flex h-full">
            {/* Sidebar - Sessions */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => createSession()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Session
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => setActiveSession(session.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${session.id === activeSessionId
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                }`}
                        >
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate text-sm">{session.name}</span>
                            {session.messages.length > 0 && (
                                <span className="ml-auto text-xs text-gray-400">
                                    {session.messages.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Templates Section */}
                {templates.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                        <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                            Templates
                        </p>
                        {templates.slice(0, 5).map((template) => (
                            <button
                                key={template.id}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm"
                            >
                                <Sparkles className="h-3 w-3" />
                                <span className="truncate">{template.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Prompt Playground
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Test prompts directly with LLM providers
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSettings
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                }`}
                            title="Toggle settings"
                        >
                            <Settings2 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={copyConversation}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
                            title="Copy conversation"
                        >
                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={handleSaveTemplate}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
                            title="Save as template"
                        >
                            <Save className="h-5 w-5" />
                        </button>
                        {activeSession && (
                            <button
                                onClick={() => clearSessionMessages(activeSession.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                                title="Clear messages"
                            >
                                <RotateCcw className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
                            {!activeSession || activeSession.messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <Sparkles className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-lg font-medium">Start a conversation</p>
                                    <p className="text-sm">Type a message to test your prompt</p>
                                </div>
                            ) : (
                                activeSession.messages.map((message) => (
                                    <MessageBubble key={message.id} message={message} />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={textareaRef}
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your message..."
                                        disabled={isGenerating}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg resize-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!userInput.trim() || isGenerating}
                                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && activeSession && (
                        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-white">Settings</h3>

                                {/* Provider */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Provider
                                    </label>
                                    <select
                                        value={activeSession.settings.provider}
                                        onChange={(e) =>
                                            updateSessionSettings(activeSession.id, {
                                                provider: e.target.value as PlaygroundSession["settings"]["provider"],
                                                model: PROVIDERS.find((p) => p.id === e.target.value)?.models[0] ?? "",
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                    >
                                        {PROVIDERS.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Model */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Model
                                    </label>
                                    <select
                                        value={activeSession.settings.model}
                                        onChange={(e) =>
                                            updateSessionSettings(activeSession.id, { model: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                    >
                                        {selectedProvider?.models.map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Temperature */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Temperature: {activeSession.settings.temperature}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={activeSession.settings.temperature}
                                        onChange={(e) =>
                                            updateSessionSettings(activeSession.id, {
                                                temperature: parseFloat(e.target.value),
                                            })
                                        }
                                        className="w-full"
                                    />
                                </div>

                                {/* Max Tokens */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Max Tokens
                                    </label>
                                    <input
                                        type="number"
                                        value={activeSession.settings.maxTokens}
                                        onChange={(e) =>
                                            updateSessionSettings(activeSession.id, {
                                                maxTokens: parseInt(e.target.value) || 4096,
                                            })
                                        }
                                        min="1"
                                        max="32000"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                    />
                                </div>

                                {/* System Prompt */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        System Prompt
                                    </label>
                                    <textarea
                                        value={activeSession.settings.systemPrompt}
                                        onChange={(e) =>
                                            updateSessionSettings(activeSession.id, {
                                                systemPrompt: e.target.value,
                                            })
                                        }
                                        rows={6}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
                                        placeholder="You are a helpful AI assistant..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: PlaygroundMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${isUser
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    }`}
            >
                <pre className="whitespace-pre-wrap font-sans text-sm">{message.content || "..."}</pre>

                {/* Stats for assistant messages */}
                {!isUser && (message.latency || message.tokenCount) && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        {message.latency && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {message.latency}ms
                            </span>
                        )}
                        {message.tokenCount && (
                            <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                ~{message.tokenCount} tokens
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
