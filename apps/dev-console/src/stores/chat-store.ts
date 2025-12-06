import { create } from "zustand";

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: "pending" | "running" | "success" | "error";
    error?: string;
    startTime: number;
    endTime?: number;
}

export interface ThinkingStep {
    id: string;
    content: string;
    agentType?: string;
    timestamp: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp: Date;
    agentId?: string;
    agentName?: string;
    toolCalls?: ToolCall[];
    thinkingSteps?: ThinkingStep[];
    isStreaming?: boolean;
    traceId?: string;
}

export interface ChatSession {
    id: string;
    name: string;
    agentId: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

interface ChatStore {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isStreaming: boolean;
    setActiveSession: (id: string | null) => void;
    createSession: (agentId: string, name?: string) => string;
    deleteSession: (id: string) => void;
    addMessage: (sessionId: string, message: ChatMessage) => void;
    updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
    appendToMessage: (sessionId: string, messageId: string, content: string) => void;
    setStreaming: (isStreaming: boolean) => void;
    getSession: (id: string) => ChatSession | undefined;
    getActiveSession: () => ChatSession | undefined;
    clearSession: (id: string) => void;
    // New methods for thinking and tool tracking
    addThinkingStep: (sessionId: string, messageId: string, step: Omit<ThinkingStep, "id">) => void;
    addToolCallToMessage: (sessionId: string, messageId: string, toolCall: ToolCall) => void;
    updateToolCallInMessage: (sessionId: string, messageId: string, toolName: string, updates: Partial<ToolCall>) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    isStreaming: false,

    setActiveSession: (id) => set({ activeSessionId: id }),

    createSession: (agentId, name) => {
        const id = crypto.randomUUID();
        const session: ChatSession = {
            id,
            name: name ?? `Chat ${new Date().toLocaleString()}`,
            agentId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        set((state) => ({
            sessions: [...state.sessions, session],
            activeSessionId: id,
        }));
        return id;
    },

    deleteSession: (id) =>
        set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
            activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        })),

    addMessage: (sessionId, message) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? {
                        ...session,
                        messages: [...session.messages, message],
                        updatedAt: new Date(),
                    }
                    : session
            ),
        })),

    updateMessage: (sessionId, messageId, updates) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? {
                        ...session,
                        messages: session.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, ...updates } : msg
                        ),
                        updatedAt: new Date(),
                    }
                    : session
            ),
        })),

    appendToMessage: (sessionId, messageId, content) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? {
                        ...session,
                        messages: session.messages.map((msg) =>
                            msg.id === messageId
                                ? { ...msg, content: msg.content + content }
                                : msg
                        ),
                        updatedAt: new Date(),
                    }
                    : session
            ),
        })),

    setStreaming: (isStreaming) => set({ isStreaming }),

    getSession: (id) => get().sessions.find((s) => s.id === id),

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId);
    },

    clearSession: (id) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === id
                    ? { ...session, messages: [], updatedAt: new Date() }
                    : session
            ),
        })),

    addThinkingStep: (sessionId, messageId, step) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? {
                        ...session,
                        messages: session.messages.map((msg) =>
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    thinkingSteps: [
                                        ...(msg.thinkingSteps ?? []),
                                        { ...step, id: crypto.randomUUID() },
                                    ],
                                }
                                : msg
                        ),
                        updatedAt: new Date(),
                    }
                    : session
            ),
        })),

    addToolCallToMessage: (sessionId, messageId, toolCall) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? {
                        ...session,
                        messages: session.messages.map((msg) =>
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    toolCalls: [...(msg.toolCalls ?? []), toolCall],
                                }
                                : msg
                        ),
                        updatedAt: new Date(),
                    }
                    : session
            ),
        })),

    updateToolCallInMessage: (sessionId, messageId, toolName, updates) =>
        set((state) => ({
            sessions: state.sessions.map((session) =>
                session.id === sessionId
                    ? {
                        ...session,
                        messages: session.messages.map((msg) =>
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    toolCalls: msg.toolCalls?.map((tc) =>
                                        tc.name === toolName ? { ...tc, ...updates } : tc
                                    ),
                                }
                                : msg
                        ),
                        updatedAt: new Date(),
                    }
                    : session
            ),
        })),
}));

