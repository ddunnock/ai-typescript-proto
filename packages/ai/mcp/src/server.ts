import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { MCPTool } from "@repo/shared";

export type ToolHandler = (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
}>;

interface RegisteredTool {
    schema: MCPTool;
    handler: ToolHandler;
}

export class MCPServerWrapper {
    private server: Server;
    private tools: Map<string, RegisteredTool> = new Map();
    private started = false;

    constructor(
        public readonly name: string,
        public readonly version: string
    ) {
        this.server = new Server(
            { name, version },
            { capabilities: { tools: {} } }
        );
        this.setupHandlers();
    }

    registerTool(
        name: string,
        description: string,
        inputSchema: Record<string, unknown>,
        handler: ToolHandler
    ): void {
        if (this.started) {
            throw new Error("Cannot register tools after server has started");
        }

        this.tools.set(name, {
            schema: { name, description, inputSchema },
            handler,
        });
    }

    private setupHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: Array.from(this.tools.values()).map((t) => ({
                name: t.schema.name,
                description: t.schema.description,
                inputSchema: t.schema.inputSchema,
            })),
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolName = request.params.name;
            const tool = this.tools.get(toolName);

            if (!tool) {
                throw new Error(`Unknown tool: ${toolName}`);
            }

            const args = (request.params.arguments ?? {}) as Record<string, unknown>;
            return tool.handler(args);
        });
    }

    async start(): Promise<void> {
        if (this.started) {
            throw new Error("Server already started");
        }

        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.started = true;
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        return tool.handler(args);
    }

    getTools(): MCPTool[] {
        return Array.from(this.tools.values()).map((t) => t.schema);
    }

    getToolNames(): string[] {
        return Array.from(this.tools.keys());
    }

    hasTool(name: string): boolean {
        return this.tools.has(name);
    }

    get isStarted(): boolean {
        return this.started;
    }
}
