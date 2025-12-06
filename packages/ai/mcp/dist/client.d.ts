import { MCPTool } from '@repo/shared';

interface TransportConfig {
    type: "stdio" | "sse" | "websocket";
    command?: string;
    args?: string[];
    url?: string;
}
declare class MCPClient {
    private name;
    private config;
    private client;
    private connected;
    private cachedTools;
    constructor(name: string, config: TransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private createTransport;
    listTools(): Promise<MCPTool[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    get isConnected(): boolean;
    get serverName(): string;
    invalidateToolCache(): void;
}

export { MCPClient, type TransportConfig };
