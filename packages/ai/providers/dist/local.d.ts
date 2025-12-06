import { Message, MCPTool } from '@repo/shared';
import { BaseProvider, GenerateOptions, ProviderResponse, StreamOptions } from './base.js';

declare class LocalProvider extends BaseProvider {
    readonly type: "local";
    readonly modelId: string;
    private client;
    private baseUrl;
    constructor(options?: {
        baseUrl?: string;
        modelId?: string;
    });
    isAvailable(): Promise<boolean>;
    listModels(): Promise<string[]>;
    generate(messages: Message[], options?: GenerateOptions): Promise<ProviderResponse>;
    stream(messages: Message[], options?: StreamOptions): AsyncIterable<{
        content: string;
        done: boolean;
    }>;
    generateWithTools(messages: Message[], tools: MCPTool[], options?: GenerateOptions): Promise<ProviderResponse>;
    private formatMessages;
    private convertTools;
}

export { LocalProvider };
