import { MCPTool } from '@repo/shared';

type ToolHandler = (args: Record<string, unknown>) => Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
declare class MCPServerWrapper {
    readonly name: string;
    readonly version: string;
    private server;
    private tools;
    private started;
    constructor(name: string, version: string);
    registerTool(name: string, description: string, inputSchema: Record<string, unknown>, handler: ToolHandler): void;
    private setupHandlers;
    start(): Promise<void>;
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    getTools(): MCPTool[];
    getToolNames(): string[];
    hasTool(name: string): boolean;
    get isStarted(): boolean;
}

export { MCPServerWrapper, type ToolHandler };
