import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPTool } from "@repo/shared";

export interface TransportConfig {
    type: "stdio" | "sse" | "websocket";
    command?: string;
    args?: string[];
    url?: string;
}

export class MCPClient {
    private client: Client;
    private connected = false;
    private cachedTools: MCPTool[] | null = null;

    constructor(
        private name: string,
        private config: TransportConfig
    ) {
        this.client = new Client(
            { name: `${name}-client`, version: "1.0.0" },
            { capabilities: {} }
        );
    }

    async connect(): Promise<void> {
        if (this.connected) {
            return;
        }

        const transport = this.createTransport();
        await this.client.connect(transport);
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        if (!this.connected) {
            return;
        }

        await this.client.close();
        this.connected = false;
        this.cachedTools = null;
    }

    private createTransport(): StdioClientTransport {
        if (this.config.type !== "stdio") {
            throw new Error(`Transport type "${this.config.type}" not yet supported`);
        }

        if (!this.config.command) {
            throw new Error("stdio transport requires a command");
        }

        return new StdioClientTransport({
            command: this.config.command,
            args: this.config.args,
        });
    }

    async listTools(): Promise<MCPTool[]> {
        if (!this.connected) {
            throw new Error("Client not connected");
        }

        if (this.cachedTools) {
            return this.cachedTools;
        }

        const result = await this.client.listTools();
        this.cachedTools = result.tools.map((t) => ({
            name: t.name,
            description: t.description ?? "",
            inputSchema: t.inputSchema as Record<string, unknown>,
        }));

        return this.cachedTools;
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        if (!this.connected) {
            throw new Error("Client not connected");
        }

        const result = await this.client.callTool({ name, arguments: args });
        return result;
    }

    get isConnected(): boolean {
        return this.connected;
    }

    get serverName(): string {
        return this.name;
    }

    invalidateToolCache(): void {
        this.cachedTools = null;
    }
}
