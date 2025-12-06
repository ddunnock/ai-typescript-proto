import { NextRequest, NextResponse } from "next/server";

interface PlaygroundRequest {
    messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>;
    provider: "anthropic" | "openai" | "google" | "local";
    model: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

interface StreamEvent {
    type: "content" | "done" | "error" | "usage";
    content?: string;
    error?: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

// Get provider configuration from environment
async function getProviderConfig(provider: string) {
    const configs: Record<string, { apiKey: string | null; defaultModel: string }> = {
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY ?? null,
            defaultModel: "claude-3-5-sonnet-20241022",
        },
        openai: {
            apiKey: process.env.OPENAI_API_KEY ?? null,
            defaultModel: "gpt-4-turbo-preview",
        },
        google: {
            apiKey: process.env.GOOGLE_AI_API_KEY ?? null,
            defaultModel: "gemini-pro",
        },
        local: {
            apiKey: null,
            defaultModel: "llama2",
        },
    };

    return configs[provider] ?? configs.anthropic;
}

function formatSSE(event: StreamEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
}

function createStreamResponse(stream: ReadableStream): Response {
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const body: PlaygroundRequest = await request.json();
        const { messages, provider, model, temperature = 0.7, maxTokens = 4096, stream = true } = body;

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        const providerConfig = await getProviderConfig(provider);

        if (!providerConfig.apiKey && provider !== "local") {
            return NextResponse.json(
                { error: `No API key configured for ${provider}. Set the appropriate environment variable.` },
                { status: 400 }
            );
        }

        if (stream) {
            // Streaming response
            const responseStream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();

                    const sendEvent = (event: StreamEvent) => {
                        controller.enqueue(encoder.encode(formatSSE(event)));
                    };

                    try {
                        const { ProviderFactory } = await import("@repo/providers");

                        const llmProvider = ProviderFactory.create(provider, {
                            apiKey: providerConfig.apiKey ?? undefined,
                            modelId: model || providerConfig.defaultModel,
                        });

                        // Build messages for provider (excluding system which goes in options)
                        const formattedMessages = messages
                            .filter((m) => m.role !== "system")
                            .map((m) => ({
                                role: m.role as "user" | "assistant",
                                content: m.content,
                            }));

                        // Stream the response
                        const startTime = Date.now();
                        let fullContent = "";

                        for await (const chunk of llmProvider.stream(
                            formattedMessages,
                            {
                                temperature,
                                maxTokens,
                            }
                        )) {
                            if (chunk.content) {
                                fullContent += chunk.content;
                                sendEvent({
                                    type: "content",
                                    content: chunk.content,
                                });
                            }
                        }

                        const endTime = Date.now();

                        // Send usage info (estimated)
                        sendEvent({
                            type: "usage",
                            usage: {
                                inputTokens: Math.ceil(messages.reduce((acc, m) => acc + m.content.length / 4, 0)),
                                outputTokens: Math.ceil(fullContent.length / 4),
                            },
                        });

                        sendEvent({
                            type: "done",
                            content: `Completed in ${endTime - startTime}ms`,
                        });

                    } catch (error) {
                        console.error("Playground generation error:", error);
                        sendEvent({
                            type: "error",
                            error: error instanceof Error ? error.message : "Unknown error",
                        });
                    } finally {
                        controller.close();
                    }
                },
            });

            return createStreamResponse(responseStream);

        } else {
            // Non-streaming response
            const { ProviderFactory } = await import("@repo/providers");

            const llmProvider = ProviderFactory.create(provider, {
                apiKey: providerConfig.apiKey ?? undefined,
                modelId: model || providerConfig.defaultModel,
            });

            // Build messages for provider (excluding system which goes in options)
            const formattedMessages = messages
                .filter((m) => m.role !== "system")
                .map((m) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                }));

            const startTime = Date.now();

            const response = await llmProvider.generate(
                formattedMessages,
                {
                    temperature,
                    maxTokens,
                }
            );

            const endTime = Date.now();

            return NextResponse.json({
                content: response.content,
                latency: endTime - startTime,
                usage: {
                    inputTokens: Math.ceil(messages.reduce((acc, m) => acc + m.content.length / 4, 0)),
                    outputTokens: Math.ceil((response.content?.length ?? 0) / 4),
                },
            });
        }

    } catch (error) {
        console.error("Playground API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
