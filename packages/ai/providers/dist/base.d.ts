import { ProviderType, Message, MCPTool } from '@repo/shared';

interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    tools?: MCPTool[];
}
interface StreamOptions extends GenerateOptions {
    onToken?: (token: string) => void;
    onToolCall?: (tool: string, args: unknown) => void;
}
interface ProviderResponse {
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
declare abstract class BaseProvider {
    abstract readonly type: ProviderType;
    abstract readonly modelId: string;
    abstract generate(messages: Message[], options?: GenerateOptions): Promise<ProviderResponse>;
    abstract stream(messages: Message[], options?: StreamOptions): AsyncIterable<{
        content: string;
        done: boolean;
    }>;
    abstract generateWithTools(messages: Message[], tools: MCPTool[], options?: GenerateOptions): Promise<ProviderResponse>;
}

export { BaseProvider, type GenerateOptions, type ProviderResponse, type StreamOptions };
