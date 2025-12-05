import { Annotation } from "@langchain/langgraph";
import type { Message, AgentType, AgentStatus } from "@repo/shared";

/**
 * LangGraph state annotation for agent workflows
 */
export const AgentStateAnnotation = Annotation.Root({
    // Conversation messages
    messages: Annotation<Message[]>({
        reducer: (current, update) => [...current, ...update],
        default: () => [],
    }),

    // Current agent status
    status: Annotation<AgentStatus>({
        reducer: (_, update) => update,
        default: () => "idle",
    }),

    // Active agent type
    currentAgent: Annotation<AgentType | undefined>({
        reducer: (_, update) => update,
        default: () => undefined,
    }),

    // Tool execution results
    toolResults: Annotation<Array<{ tool: string; result: unknown }>>({
        reducer: (current, update) => [...current, ...update],
        default: () => [],
    }),

    // Workflow context
    context: Annotation<Record<string, unknown>>({
        reducer: (current, update) => ({ ...current, ...update }),
        default: () => ({}),
    }),

    // Error state
    error: Annotation<string | undefined>({
        reducer: (_, update) => update,
        default: () => undefined,
    }),

    // Completion flag
    completed: Annotation<boolean>({
        reducer: (_, update) => update,
        default: () => false,
    }),
});

export type AgentState = typeof AgentStateAnnotation.State;