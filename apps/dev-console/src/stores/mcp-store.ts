import { create } from "zustand";

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface MCPServer {
    id: string;
    name: string;
    description: string;
    status: "connected" | "disconnected" | "error";
    transport: "stdio" | "sse" | "internal";
    tools: MCPTool[];
    connectionUrl?: string;
    lastConnectedAt?: Date;
    error?: string;
}

interface MCPStore {
    servers: MCPServer[];
    selectedServerId: string | null;
    selectedToolName: string | null;
    setSelectedServer: (id: string | null) => void;
    setSelectedTool: (name: string | null) => void;
    addServer: (server: MCPServer) => void;
    updateServer: (id: string, updates: Partial<MCPServer>) => void;
    removeServer: (id: string) => void;
    getServer: (id: string) => MCPServer | undefined;
    getTool: (serverId: string, toolName: string) => MCPTool | undefined;
}

export const useMCPStore = create<MCPStore>((set, get) => ({
    servers: [],
    selectedServerId: null,
    selectedToolName: null,

    setSelectedServer: (id) => set({ selectedServerId: id, selectedToolName: null }),

    setSelectedTool: (name) => set({ selectedToolName: name }),

    addServer: (server) =>
        set((state) => ({
            servers: [...state.servers, server],
        })),

    updateServer: (id, updates) =>
        set((state) => ({
            servers: state.servers.map((server) =>
                server.id === id ? { ...server, ...updates } : server
            ),
        })),

    removeServer: (id) =>
        set((state) => ({
            servers: state.servers.filter((server) => server.id !== id),
            selectedServerId:
                state.selectedServerId === id ? null : state.selectedServerId,
        })),

    getServer: (id) => get().servers.find((server) => server.id === id),

    getTool: (serverId, toolName) => {
        const server = get().servers.find((s) => s.id === serverId);
        return server?.tools.find((t) => t.name === toolName);
    },
}));
