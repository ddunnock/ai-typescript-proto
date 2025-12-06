import { Message, MCPTool } from '@repo/shared';
import { BaseProvider, GenerateOptions, ProviderResponse, StreamOptions } from './base.js';

declare class OpenAIProvider extends BaseProvider {
    readonly type: "openai";
    readonly modelId: string;
    private client;
    constructor(options?: {
        apiKey?: string;
        modelId?: string;
    });
    generate(messages: Message[], options?: GenerateOptions): Promise<ProviderResponse>;
    stream(messages: Message[], options?: StreamOptions): AsyncIterable<{
        content: string;
        done: boolean;
    }>;
    generateWithTools(messages: Message[], tools: MCPTool[], options?: GenerateOptions): Promise<ProviderResponse>;
    private formatMessages;
    private convertTools;
}

export { OpenAIProvider };
