import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { getConfig, type Message, type MCPTool, ProviderError } from "@repo/shared";
import { BaseProvider, type GenerateOptions, type StreamOptions, type ProviderResponse } from "./base";

export class AnthropicProvider extends BaseProvider {
    readonly type = "anthropic" as const;
    readonly modelId: string;
    private client: ReturnType<typeof createAnthropic>;

    constructor(options?: { apiKey?: string; modelId?: string }) {
        super();
        const config = getConfig();
        const apiKey = options?.apiKey ?? config.anthropicApiKey;

        if (!apiKey) {
            throw new ProviderError("Missing Anthropic API key", "anthropic");
        }

        this.client = createAnthropic({ apiKey });
        this.modelId = options?.modelId ?? config.anthropicModel;
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
            throw new ProviderError(
                `Anthropic generation failed: ${(error as Error).message}`,
                "anthropic",
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
            throw new ProviderError(
                `Anthropic streaming failed: ${(error as Error).message}`,
                "anthropic",
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
            throw new ProviderError(
                `Anthropic tool generation failed: ${(error as Error).message}`,
                "anthropic",
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