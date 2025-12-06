import { createOllama } from "ollama-ai-provider";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { getConfig, type Message, type MCPTool, ProviderError } from "@repo/shared";
import { BaseProvider, type GenerateOptions, type StreamOptions, type ProviderResponse } from "./base";

export class LocalProvider extends BaseProvider {
    readonly type = "local" as const;
    readonly modelId: string;
    private client: ReturnType<typeof createOllama>;
    private baseUrl: string;

    constructor(options?: { baseUrl?: string; modelId?: string }) {
        super();
        const config = getConfig();

        this.baseUrl = options?.baseUrl ?? config.ollamaBaseUrl;
        this.client = createOllama({ baseURL: this.baseUrl });
        this.modelId = options?.modelId ?? config.ollamaModel;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return [];
            }
            const data = await response.json() as { models?: Array<{ name: string }> };
            return data.models?.map((m) => m.name) ?? [];
        } catch {
            return [];
        }
    }

    async generate(messages: Message[], options?: GenerateOptions): Promise<ProviderResponse> {
        try {
            const result = await generateText({
                model: this.client(this.modelId),
                messages: this.formatMessages(messages),
                temperature: options?.temperature,
                maxTokens: options?.maxTokens,
                stopSequences: options?.stopSequences,
            });

            return {
                content: result.text,
                usage: result.usage ? {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.totalTokens,
                } : undefined,
                finishReason: result.finishReason,
            };
        } catch (error) {
            const isConnectionError = (error as Error).message?.includes("ECONNREFUSED") ||
                (error as Error).message?.includes("fetch failed");

            if (isConnectionError) {
                throw new ProviderError(
                    `Ollama is not running. Start it with: ollama serve`,
                    "local",
                    { error, baseUrl: this.baseUrl }
                );
            }

            throw new ProviderError(
                `Local generation failed: ${(error as Error).message}`,
                "local",
                { error }
            );
        }
    }

    async *stream(messages: Message[], options?: StreamOptions): AsyncIterable<{ content: string; done: boolean }> {
        try {
            const result = await streamText({
                model: this.client(this.modelId),
                messages: this.formatMessages(messages),
                temperature: options?.temperature,
                maxTokens: options?.maxTokens,
            });

            for await (const chunk of result.textStream) {
                options?.onToken?.(chunk);
                yield { content: chunk, done: false };
            }

            yield { content: "", done: true };
        } catch (error) {
            const isConnectionError = (error as Error).message?.includes("ECONNREFUSED") ||
                (error as Error).message?.includes("fetch failed");

            if (isConnectionError) {
                throw new ProviderError(
                    `Ollama is not running. Start it with: ollama serve`,
                    "local",
                    { error, baseUrl: this.baseUrl }
                );
            }

            throw new ProviderError(
                `Local streaming failed: ${(error as Error).message}`,
                "local",
                { error }
            );
        }
    }

    async generateWithTools(
        messages: Message[],
        tools: MCPTool[],
        options?: GenerateOptions
    ): Promise<ProviderResponse> {
        try {
            const aiTools = this.convertTools(tools);

            const result = await generateText({
                model: this.client(this.modelId),
                messages: this.formatMessages(messages),
                tools: aiTools,
                temperature: options?.temperature,
                maxTokens: options?.maxTokens,
            });

            return {
                content: result.text,
                toolCalls: result.toolCalls?.map((tc) => ({
                    id: tc.toolCallId,
                    name: tc.toolName,
                    arguments: tc.args as Record<string, unknown>,
                })),
                usage: result.usage ? {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.totalTokens,
                } : undefined,
                finishReason: result.finishReason,
            };
        } catch (error) {
            const isConnectionError = (error as Error).message?.includes("ECONNREFUSED") ||
                (error as Error).message?.includes("fetch failed");

            if (isConnectionError) {
                throw new ProviderError(
                    `Ollama is not running. Start it with: ollama serve`,
                    "local",
                    { error, baseUrl: this.baseUrl }
                );
            }

            throw new ProviderError(
                `Local tool generation failed: ${(error as Error).message}`,
                "local",
                { error }
            );
        }
    }

    private formatMessages(messages: Message[]): Array<{ role: "user" | "assistant" | "system"; content: string }> {
        return messages.map((m) => ({
            role: m.role === "tool" ? "assistant" : m.role,
            content: m.content,
        }));
    }

    private convertTools(tools: MCPTool[]): Record<string, ReturnType<typeof tool>> {
        const result: Record<string, ReturnType<typeof tool>> = {};

        for (const t of tools) {
            result[t.name] = tool({
                description: t.description,
                parameters: z.object(t.inputSchema as Record<string, z.ZodTypeAny>),
            });
        }

        return result;
    }
}
