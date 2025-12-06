"use client";

import { useCallback, useRef, useState } from "react";
import { useChatStore, type ChatMessage, type ToolCall } from "@/stores/chat-store";
import { useTraceStore } from "@/stores/trace-store";
import { parseTraceEvent, traceEventToStoreFormat, type TraceStreamEvent } from "@/lib/tracer-bridge";

export interface StreamEvent {
    type: "thinking" | "tool_call" | "tool_result" | "response" | "error" | "complete" | "trace";
    content: unknown;
    agentType?: string;
    timestamp: string;
    traceId?: string;
    spanId?: string;
}

export interface AgentStreamConfig {
    agentId: string;
    message: string;
    sessionId: string;
    history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    agentConfig?: {
        type: "orchestrator" | "email" | "notes" | "document" | "research";
        provider: "anthropic" | "openai" | "google" | "local";
        model: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    };
}

export interface UseAgentStreamReturn {
    isStreaming: boolean;
    error: string | null;
    currentTraceId: string | null;
    sendMessage: (config: AgentStreamConfig) => Promise<void>;
    abort: () => void;
}

export function useAgentStream(): UseAgentStreamReturn {
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const {
        addMessage,
        updateMessage,
        appendToMessage,
        setStreaming,
        addThinkingStep,
        addToolCallToMessage,
        updateToolCallInMessage,
    } = useChatStore();

    const {
        startLiveTrace,
        endLiveTrace,
        upsertSpan,
        updateTrace,
    } = useTraceStore();

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setStreaming(false);
    }, [setStreaming]);

    const sendMessage = useCallback(async (config: AgentStreamConfig) => {
        const { agentId, message, sessionId, history, agentConfig } = config;

        // Abort any existing stream
        abort();

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setIsStreaming(true);
        setStreaming(true);
        setError(null);

        // Add user message
        const userMessageId = crypto.randomUUID();
        const userMessage: ChatMessage = {
            id: userMessageId,
            role: "user",
            content: message,
            timestamp: new Date(),
            agentId,
        };
        addMessage(sessionId, userMessage);

        // Create placeholder assistant message
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            agentId,
            agentName: agentConfig?.type ?? "Agent",
            isStreaming: true,
            toolCalls: [],
        };
        addMessage(sessionId, assistantMessage);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    agentId,
                    message,
                    sessionId,
                    history,
                    agentConfig,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error ?? `HTTP error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE messages
                const lines = buffer.split("\n\n");
                buffer = lines.pop() ?? ""; // Keep incomplete message in buffer

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;

                    try {
                        const eventData = JSON.parse(line.slice(6)) as StreamEvent;
                        await processStreamEvent(
                            eventData,
                            sessionId,
                            assistantMessageId,
                        );
                    } catch (parseError) {
                        console.warn("Failed to parse SSE event:", parseError);
                    }
                }
            }

            // Mark message as complete
            updateMessage(sessionId, assistantMessageId, { isStreaming: false });

        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                // User aborted, not an error
                updateMessage(sessionId, assistantMessageId, {
                    isStreaming: false,
                    content: assistantMessage.content || "[Cancelled]",
                });
            } else {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                setError(errorMessage);
                updateMessage(sessionId, assistantMessageId, {
                    isStreaming: false,
                    content: `Error: ${errorMessage}`,
                });
            }
        } finally {
            setIsStreaming(false);
            setStreaming(false);
            abortControllerRef.current = null;
        }

        // Process a single stream event
        async function processStreamEvent(
            event: StreamEvent,
            sessionId: string,
            messageId: string,
        ) {
            // Track trace ID
            if (event.traceId && event.traceId !== currentTraceId) {
                setCurrentTraceId(event.traceId);
            }

            switch (event.type) {
                case "thinking":
                    // Add thinking step for UI display
                    if (typeof event.content === "string") {
                        addThinkingStep(sessionId, messageId, {
                            content: event.content,
                            agentType: event.agentType,
                            timestamp: event.timestamp,
                        });
                    }
                    break;

                case "tool_call":
                    // Add tool call to message
                    if (event.content && typeof event.content === "object") {
                        const toolCallData = event.content as {
                            id?: string;
                            name: string;
                            arguments?: Record<string, unknown>;
                        };
                        const toolCall: ToolCall = {
                            id: toolCallData.id ?? crypto.randomUUID(),
                            name: toolCallData.name,
                            args: toolCallData.arguments ?? {},
                            status: "running",
                            startTime: Date.now(),
                        };
                        addToolCallToMessage(sessionId, messageId, toolCall);
                    }
                    break;

                case "tool_result":
                    // Update tool call with result
                    if (event.content && typeof event.content === "object") {
                        const resultData = event.content as {
                            tool: string;
                            result: unknown;
                        };
                        updateToolCallInMessage(sessionId, messageId, resultData.tool, {
                            result: resultData.result,
                            status: "success",
                            endTime: Date.now(),
                        });
                    }
                    break;

                case "response":
                    // Append response content
                    if (typeof event.content === "string") {
                        appendToMessage(sessionId, messageId, event.content);
                    }
                    break;

                case "error":
                    // Handle error
                    const errorContent = typeof event.content === "string"
                        ? event.content
                        : "An error occurred";
                    appendToMessage(sessionId, messageId, `\n\n**Error:** ${errorContent}`);
                    setError(errorContent);
                    break;

                case "complete":
                    // Stream complete
                    break;

                case "trace":
                    // Handle trace events for live tracing
                    if (event.content && typeof event.content === "object") {
                        const traceEvent = parseTraceEvent(event.content);
                        if (traceEvent) {
                            const storeData = traceEventToStoreFormat(traceEvent);

                            // Handle trace start/end
                            if (traceEvent.type === "trace_start" && storeData.trace) {
                                startLiveTrace(
                                    traceEvent.traceId,
                                    storeData.trace.name ?? "Trace",
                                    storeData.trace.metadata
                                );
                            } else if (traceEvent.type === "trace_end" && storeData.trace) {
                                const status = storeData.trace.status === "running" ? "success" : (storeData.trace.status ?? "success");
                                endLiveTrace(
                                    traceEvent.traceId,
                                    status
                                );
                            }

                            // Handle span events
                            if (storeData.span) {
                                upsertSpan(traceEvent.traceId, storeData.span as { id: string } & typeof storeData.span);
                            }
                        }
                    }
                    break;
            }
        }
    }, [
        abort,
        addMessage,
        updateMessage,
        appendToMessage,
        setStreaming,
        addThinkingStep,
        addToolCallToMessage,
        updateToolCallInMessage,
        currentTraceId,
        startLiveTrace,
        endLiveTrace,
        upsertSpan,
    ]);

    return {
        isStreaming,
        error,
        currentTraceId,
        sendMessage,
        abort,
    };
}
