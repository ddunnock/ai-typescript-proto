import { AgentType, MCPTool } from '@repo/shared';
import { MCPServerWrapper } from './server.js';
import { TransportConfig, MCPClient } from './client.js';

interface RegisteredServer {
    wrapper?: MCPServerWrapper;
    client?: MCPClient;
    isRemote: boolean;
}
declare class MCPRegistry {
    private static instance;
    private servers;
    private agentToolMappings;
    private constructor();
    private initializeDefaultMappings;
    static getInstance(): MCPRegistry;
    static resetInstance(): void;
    registerServer(server: MCPServerWrapper): void;
    registerRemoteServer(name: string, config: TransportConfig): Promise<void>;
    unregisterServer(name: string): void;
    setAgentToolMapping(agentType: AgentType, toolNames: string[]): void;
    addToolToAgent(agentType: AgentType, toolName: string): void;
    getToolsForAgent(agentType: AgentType): MCPTool[];
    getAllTools(): MCPTool[];
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    getServer(name: string): RegisteredServer | undefined;
    getServerNames(): string[];
    hasServer(name: string): boolean;
    get serverCount(): number;
}
declare function getMCPRegistry(): MCPRegistry;

export { MCPRegistry, getMCPRegistry };
