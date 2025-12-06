import type { MCPTool, AgentType } from "@repo/shared";
import { MCPServerWrapper } from "./server";
import { MCPClient, type TransportConfig } from "./client";

interface RegisteredServer {
    wrapper?: MCPServerWrapper;
    client?: MCPClient;
    isRemote: boolean;
}

export class MCPRegistry {
    private static instance: MCPRegistry;
    private servers: Map<string, RegisteredServer> = new Map();
    private agentToolMappings: Map<AgentType, string[]> = new Map();

    private constructor() {
        this.initializeDefaultMappings();
    }

    private initializeDefaultMappings(): void {
        this.agentToolMappings.set("email", [
            "semantic_search",
            "generate_embedding",
            "find_similar_highlights",
        ]);
        this.agentToolMappings.set("research", [
            "semantic_search",
            "generate_embedding",
        ]);
        this.agentToolMappings.set("notes", [
            "semantic_search",
            "generate_embedding",
            "find_similar_highlights",
        ]);
        this.agentToolMappings.set("document", [
            "semantic_search",
            "generate_embedding",
            "find_similar_highlights",
        ]);
        this.agentToolMappings.set("orchestrator", []);
    }

    static getInstance(): MCPRegistry {
        if (!MCPRegistry.instance) {
            MCPRegistry.instance = new MCPRegistry();
        }
        return MCPRegistry.instance;
    }

    static resetInstance(): void {
        MCPRegistry.instance = undefined as unknown as MCPRegistry;
    }

    registerServer(server: MCPServerWrapper): void {
        if (this.servers.has(server.name)) {
            throw new Error(`Server "${server.name}" already registered`);
        }
        this.servers.set(server.name, { wrapper: server, isRemote: false });
    }

    async registerRemoteServer(name: string, config: TransportConfig): Promise<void> {
        if (this.servers.has(name)) {
            throw new Error(`Server "${name}" already registered`);
        }

        const client = new MCPClient(name, config);
        await client.connect();
        this.servers.set(name, { client, isRemote: true });
    }

    unregisterServer(name: string): void {
        const server = this.servers.get(name);
        if (server?.client) {
            server.client.disconnect().catch(console.error);
        }
        this.servers.delete(name);
    }

    setAgentToolMapping(agentType: AgentType, toolNames: string[]): void {
        this.agentToolMappings.set(agentType, toolNames);
    }

    addToolToAgent(agentType: AgentType, toolName: string): void {
        const existing = this.agentToolMappings.get(agentType) ?? [];
        if (!existing.includes(toolName)) {
            this.agentToolMappings.set(agentType, [...existing, toolName]);
        }
    }

    getToolsForAgent(agentType: AgentType): MCPTool[] {
        const allowedToolNames = this.agentToolMappings.get(agentType) ?? [];
        const tools: MCPTool[] = [];

        for (const [, server] of this.servers) {
            const serverTools = server.wrapper?.getTools() ?? [];
            for (const tool of serverTools) {
                if (allowedToolNames.includes(tool.name)) {
                    tools.push(tool);
                }
            }
        }

        return tools;
    }

    getAllTools(): MCPTool[] {
        const tools: MCPTool[] = [];

        for (const [, server] of this.servers) {
            if (server.wrapper) {
                tools.push(...server.wrapper.getTools());
            }
        }

        return tools;
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        for (const [, server] of this.servers) {
            if (server.wrapper?.hasTool(name)) {
                return server.wrapper.callTool(name, args);
            }
            if (server.client) {
                const tools = await server.client.listTools();
                if (tools.some((t) => t.name === name)) {
                    return server.client.callTool(name, args);
                }
            }
        }

        throw new Error(`Tool not found: ${name}`);
    }

    getServer(name: string): RegisteredServer | undefined {
        return this.servers.get(name);
    }

    getServerNames(): string[] {
        return Array.from(this.servers.keys());
    }

    hasServer(name: string): boolean {
        return this.servers.has(name);
    }

    get serverCount(): number {
        return this.servers.size;
    }
}

export function getMCPRegistry(): MCPRegistry {
    return MCPRegistry.getInstance();
}
