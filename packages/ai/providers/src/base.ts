import type { Message, ProviderType, MCPTool } from "@repo/shared";

export interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    tools?: MCPTool[];
}

export interface StreamOptions extends GenerateOptions {
    onToken?: (token: string) => void;
    onToolCall?: (tool: string, args: unknown) => void;
}

export interface ProviderResponse {
    content: string;
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: string;
}

export abstract class BaseProvider {
    abstract readonly type: ProviderType;
    abstract readonly modelId: string;

    abstract generate(
        messages: Message[],
        options?: GenerateOptions
    ): Promise<ProviderResponse>;

    abstract stream(
        messages: Message[],
        options?: StreamOptions
    ): AsyncIterable<{ content: string; done: boolean }>;

    abstract generateWithTools(
        messages: Message[],
        tools: MCPTool[],
        options?: GenerateOptions
    ): Promise<ProviderResponse>;
}