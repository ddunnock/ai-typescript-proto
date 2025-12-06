import { create } from "zustand";

export interface Agent {
    id: string;
    name: string;
    type: "orchestrator" | "email" | "notes" | "document" | "research" | "custom";
    description: string;
    status: "idle" | "running" | "error";
    provider?: string;
    model?: string;
    systemPrompt?: string;
    tools?: string[];
    subAgents?: string[];
    createdAt: Date;
    lastActiveAt?: Date;
}

interface AgentStore {
    agents: Agent[];
    activeAgentId: string | null;
    setActiveAgent: (id: string | null) => void;
    addAgent: (agent: Agent) => void;
    updateAgent: (id: string, updates: Partial<Agent>) => void;
    removeAgent: (id: string) => void;
    getAgent: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
    agents: [],
    activeAgentId: null,

    setActiveAgent: (id) => set({ activeAgentId: id }),

    addAgent: (agent) =>
        set((state) => ({
            agents: [...state.agents, agent],
        })),

    updateAgent: (id, updates) =>
        set((state) => ({
            agents: state.agents.map((agent) =>
                agent.id === id ? { ...agent, ...updates } : agent
            ),
        })),

    removeAgent: (id) =>
        set((state) => ({
            agents: state.agents.filter((agent) => agent.id !== id),
            activeAgentId: state.activeAgentId === id ? null : state.activeAgentId,
        })),

    getAgent: (id) => get().agents.find((agent) => agent.id === id),
}));
