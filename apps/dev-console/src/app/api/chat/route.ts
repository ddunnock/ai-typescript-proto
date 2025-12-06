import { NextRequest, NextResponse } from "next/server";

// SSE event types that map to AgentEvent types from @repo/shared
export interface StreamEvent {
    type: "thinking" | "tool_call" | "tool_result" | "response" | "error" | "complete" | "trace";
    content: unknown;
    agentType?: string;
    timestamp: string;
    traceId?: string;
    spanId?: string;
}

// Request body for chat endpoint
export interface ChatRequest {
    agentId: string;
    message: string;
    sessionId: string;
    history?: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    agentConfig?: {
        type: "orchestrator" | "email" | "notes" | "document" | "research";
        provider: "anthropic" | "openai" | "google" | "local";
        model: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
    };
}

// Helper to format SSE messages
function formatSSE(event: StreamEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
}

// Helper to create a streaming response
function createStreamResponse(stream: ReadableStream): Response {
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ChatRequest;
        const { agentId, message, sessionId, history = [], agentConfig } = body;

        if (!agentId || !message || !sessionId) {
            return NextResponse.json(
                { error: "Missing required fields: agentId, message, sessionId" },
                { status: 400 }
            );
        }

        // Create a readable stream for SSE
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                const sendEvent = (event: StreamEvent) => {
                    controller.enqueue(encoder.encode(formatSSE(event)));
                };

                // Import tracer bridge
                const { StreamingTraceCollector } = await import("@/lib/tracer-bridge");

                // Create trace collector that emits events to the stream
                const traceCollector = new StreamingTraceCollector(
                    `Chat: ${message.substring(0, 50)}...`,
                    (traceEvent) => {
                        // Send trace events as a separate event type
                        sendEvent({
                            type: "trace",
                            content: traceEvent,
                            timestamp: traceEvent.timestamp,
                            traceId: traceEvent.traceId,
                        });
                    }
                );

                const traceId = traceCollector.id;

                try {
                    // Send initial thinking event
                    sendEvent({
                        type: "thinking",
                        content: "Initializing agent...",
                        timestamp: new Date().toISOString(),
                        traceId,
                    });


                    // Get provider configuration from environment or request
                    const providerConfig = await getProviderConfig(agentConfig?.provider ?? "anthropic");

                    if (!providerConfig.apiKey) {
                        sendEvent({
                            type: "error",
                            content: `No API key configured for ${agentConfig?.provider ?? "anthropic"}. Please configure in Settings.`,
                            timestamp: new Date().toISOString(),
                            traceId,
                        });
                        controller.close();
                        return;
                    }

                    // Start provider initialization span
                    const providerSpanId = traceCollector.startSpan(
                        "Initialize Provider",
                        "internal",
                        undefined,
                        { provider: agentConfig?.provider ?? "anthropic" }
                    );

                    // Import agent and provider modules dynamically to avoid bundling issues
                    const { ProviderFactory } = await import("@repo/providers");
                    const { OrchestratorAgent, EmailAgent, NotesAgent, DocumentAgent, ResearchAgent } = await import("@repo/agents/specialized");

                    // Create provider using factory
                    const provider = ProviderFactory.create(
                        agentConfig?.provider ?? "anthropic",
                        {
                            apiKey: providerConfig.apiKey ?? undefined,
                            modelId: agentConfig?.model ?? providerConfig.defaultModel,
                        }
                    );

                    traceCollector.endSpan(providerSpanId, "success");

                    // Create agent based on type
                    const agentType = agentConfig?.type ?? "orchestrator";

                    // Start agent creation span
                    const agentSpanId = traceCollector.startSpan(
                        `Create ${agentType} Agent`,
                        "agent",
                        undefined,
                        { agentType, model: agentConfig?.model }
                    );

                    let agent;

                    switch (agentType) {
                        case "email":
                            agent = new EmailAgent(provider, {
                                name: "Email Agent",
                                description: agentConfig?.systemPrompt,
                            });
                            break;
                        case "notes":
                            agent = new NotesAgent(provider, {
                                name: "Notes Agent",
                                description: agentConfig?.systemPrompt,
                            });
                            break;
                        case "document":
                            agent = new DocumentAgent(provider, {
                                name: "Document Agent",
                                description: agentConfig?.systemPrompt,
                            });
                            break;
                        case "research":
                            agent = new ResearchAgent(provider, {
                                name: "Research Agent",
                                description: agentConfig?.systemPrompt,
                            });
                            break;
                        case "orchestrator":
                        default:
                            agent = new OrchestratorAgent(provider, {
                                name: "Orchestrator",
                                description: agentConfig?.systemPrompt,
                            });
                            break;
                    }

                    sendEvent({
                        type: "thinking",
                        content: `Agent initialized: ${agentType}`,
                        agentType,
                        timestamp: new Date().toISOString(),
                        traceId,
                    });

                    // Stream process the query
                    const queryWithHistory = history.length > 0
                        ? `Previous conversation:\n${history.map(h => `${h.role}: ${h.content}`).join("\n")}\n\nCurrent message: ${message}`
                        : message;

                    // Start processing span
                    const processSpanId = traceCollector.startSpan(
                        "Process Query",
                        "llm",
                        agentSpanId,
                        { query: queryWithHistory.substring(0, 200) }
                    );

                    // Record LLM prompt content for deep inspection
                    traceCollector.setLLMPrompt(processSpanId, queryWithHistory);
                    traceCollector.setModel(
                        processSpanId,
                        agentConfig?.provider ?? "anthropic",
                        agentConfig?.model ?? providerConfig.defaultModel
                    );

                    let lastEventType = "";
                    let toolSpanId: string | null = null;
                    let responseContent = "";

                    for await (const event of agent.streamProcess(queryWithHistory)) {
                        // Track tool call spans
                        if (event.type === "tool_call" && event.content) {
                            const toolName = typeof event.content === "object" && "name" in event.content
                                ? (event.content as { name: string }).name
                                : "unknown tool";
                            toolSpanId = traceCollector.startSpan(
                                `Tool: ${toolName}`,
                                "tool",
                                processSpanId,
                                { tool: toolName, args: event.content }
                            );
                        } else if (event.type === "tool_result" && toolSpanId) {
                            traceCollector.endSpan(toolSpanId, "success");
                            toolSpanId = null;
                        }

                        // Add thinking events to span
                        if (event.type === "thinking") {
                            traceCollector.addSpanEvent(
                                processSpanId,
                                "thinking",
                                { content: event.content }
                            );
                        }

                        // Capture response content for deep inspection
                        if (event.type === "response" && typeof event.content === "string") {
                            responseContent += event.content;
                        }

                        lastEventType = event.type;

                        sendEvent({
                            type: event.type,
                            content: event.content,
                            agentType: event.agentType,
                            timestamp: event.timestamp?.toISOString() ?? new Date().toISOString(),
                            traceId,
                        });
                    }

                    // Record the full response for deep inspection
                    if (responseContent) {
                        traceCollector.setLLMResponse(processSpanId, responseContent);
                    }

                    // End processing span
                    traceCollector.endSpan(processSpanId, "success");
                    traceCollector.endSpan(agentSpanId, "success");

                    // End the trace successfully
                    traceCollector.endTrace("success");

                    // Send completion event
                    sendEvent({
                        type: "complete",
                        content: null,
                        agentType,
                        timestamp: new Date().toISOString(),
                        traceId,
                    });

                } catch (error) {
                    console.error("Agent streaming error:", error);

                    // End trace with error
                    traceCollector.endTrace("error");

                    sendEvent({
                        type: "error",
                        content: error instanceof Error ? error.message : "Unknown error occurred",
                        timestamp: new Date().toISOString(),
                        traceId,
                    });
                } finally {
                    controller.close();
                }
            },
        });

        return createStreamResponse(stream);

    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// Provider configuration helper
async function getProviderConfig(provider: string): Promise<{
    apiKey: string | null;
    defaultModel: string;
}> {
    // In a real implementation, these would come from:
    // 1. Environment variables (for server-side)
    // 2. Encrypted storage via API call (for client-configured keys)

    const configs: Record<string, { envKey: string; defaultModel: string }> = {
        anthropic: {
            envKey: "ANTHROPIC_API_KEY",
            defaultModel: "claude-3-5-sonnet-20241022",
        },
        openai: {
            envKey: "OPENAI_API_KEY",
            defaultModel: "gpt-4-turbo-preview",
        },
        google: {
            envKey: "GOOGLE_AI_API_KEY",
            defaultModel: "gemini-1.5-pro",
        },
        local: {
            envKey: "OLLAMA_BASE_URL",
            defaultModel: "llama3.2",
        },
    };

    const config = configs[provider] ?? configs.anthropic;

    return {
        apiKey: process.env[config.envKey] ?? null,
        defaultModel: config.defaultModel,
    };
}

// GET endpoint for checking service health
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "agent-chat",
        timestamp: new Date().toISOString(),
    });
}
