import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PromptTemplate {
    id: string;
    name: string;
    systemPrompt: string;
    userPrompt: string;
    provider: "anthropic" | "openai" | "google" | "local";
    model: string;
    temperature: number;
    maxTokens: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlaygroundMessage {
    id: string;
    role: "system" | "user" | "assistant";
    content: string;
    timestamp: Date;
    tokenCount?: number;
    latency?: number;
}

export interface PlaygroundSession {
    id: string;
    name: string;
    messages: PlaygroundMessage[];
    settings: {
        provider: "anthropic" | "openai" | "google" | "local";
        model: string;
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

interface PlaygroundStore {
    // Sessions
    sessions: PlaygroundSession[];
    activeSessionId: string | null;

    // Templates
    templates: PromptTemplate[];

    // UI State
    isGenerating: boolean;
    error: string | null;

    // Session actions
    createSession: (settings?: Partial<PlaygroundSession["settings"]>) => string;
    deleteSession: (id: string) => void;
    setActiveSession: (id: string | null) => void;
    updateSessionSettings: (id: string, settings: Partial<PlaygroundSession["settings"]>) => void;
    renameSession: (id: string, name: string) => void;
    clearSessionMessages: (id: string) => void;

    // Message actions
    addMessage: (sessionId: string, message: Omit<PlaygroundMessage, "id" | "timestamp">) => void;
    updateMessage: (sessionId: string, messageId: string, updates: Partial<PlaygroundMessage>) => void;
    deleteMessage: (sessionId: string, messageId: string) => void;

    // Template actions
    saveTemplate: (template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">) => string;
    deleteTemplate: (id: string) => void;
    loadTemplate: (id: string) => PromptTemplate | undefined;

    // Generation state
    setGenerating: (isGenerating: boolean) => void;
    setError: (error: string | null) => void;

    // Helpers
    getActiveSession: () => PlaygroundSession | undefined;
}

const DEFAULT_SETTINGS: PlaygroundSession["settings"] = {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: "You are a helpful AI assistant.",
};

export const usePlaygroundStore = create<PlaygroundStore>()(
    persist(
        (set, get) => ({
            sessions: [],
            activeSessionId: null,
            templates: [],
            isGenerating: false,
            error: null,

            createSession: (settings) => {
                const id = crypto.randomUUID();
                const now = new Date();
                const newSession: PlaygroundSession = {
                    id,
                    name: `Session ${get().sessions.length + 1}`,
                    messages: [],
                    settings: { ...DEFAULT_SETTINGS, ...settings },
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({
                    sessions: [...state.sessions, newSession],
                    activeSessionId: id,
                }));
                return id;
            },

            deleteSession: (id) =>
                set((state) => ({
                    sessions: state.sessions.filter((s) => s.id !== id),
                    activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
                })),

            setActiveSession: (id) => set({ activeSessionId: id }),

            updateSessionSettings: (id, settings) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === id
                            ? { ...s, settings: { ...s.settings, ...settings }, updatedAt: new Date() }
                            : s
                    ),
                })),

            renameSession: (id, name) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === id ? { ...s, name, updatedAt: new Date() } : s
                    ),
                })),

            clearSessionMessages: (id) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === id ? { ...s, messages: [], updatedAt: new Date() } : s
                    ),
                })),

            addMessage: (sessionId, message) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: [
                                    ...s.messages,
                                    {
                                        ...message,
                                        id: crypto.randomUUID(),
                                        timestamp: new Date(),
                                    },
                                ],
                                updatedAt: new Date(),
                            }
                            : s
                    ),
                })),

            updateMessage: (sessionId, messageId, updates) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: s.messages.map((m) =>
                                    m.id === messageId ? { ...m, ...updates } : m
                                ),
                                updatedAt: new Date(),
                            }
                            : s
                    ),
                })),

            deleteMessage: (sessionId, messageId) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: s.messages.filter((m) => m.id !== messageId),
                                updatedAt: new Date(),
                            }
                            : s
                    ),
                })),

            saveTemplate: (template) => {
                const id = crypto.randomUUID();
                const now = new Date();
                set((state) => ({
                    templates: [
                        ...state.templates,
                        { ...template, id, createdAt: now, updatedAt: now },
                    ],
                }));
                return id;
            },

            deleteTemplate: (id) =>
                set((state) => ({
                    templates: state.templates.filter((t) => t.id !== id),
                })),

            loadTemplate: (id) => get().templates.find((t) => t.id === id),

            setGenerating: (isGenerating) => set({ isGenerating }),

            setError: (error) => set({ error }),

            getActiveSession: () => {
                const { sessions, activeSessionId } = get();
                return activeSessionId ? sessions.find((s) => s.id === activeSessionId) : undefined;
            },
        }),
        {
            name: "playground-store",
            partialize: (state) => ({
                sessions: state.sessions,
                templates: state.templates,
            }),
        }
    )
);
