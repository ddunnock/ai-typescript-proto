import * as _langchain_langgraph from '@langchain/langgraph';

/**
 * LangGraph state annotation for agent workflows
 */
declare const AgentStateAnnotation: _langchain_langgraph.AnnotationRoot<{
    messages: _langchain_langgraph.BinaryOperatorAggregate<{
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        toolCalls?: any[] | undefined;
        toolResults?: any[] | undefined;
    }[], {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        toolCalls?: any[] | undefined;
        toolResults?: any[] | undefined;
    }[]>;
    status: _langchain_langgraph.BinaryOperatorAggregate<"idle" | "thinking" | "executing" | "waiting" | "error" | "complete", "idle" | "thinking" | "executing" | "waiting" | "error" | "complete">;
    currentAgent: _langchain_langgraph.BinaryOperatorAggregate<"email" | "notes" | "document" | "research" | "orchestrator" | undefined, "email" | "notes" | "document" | "research" | "orchestrator" | undefined>;
    toolResults: _langchain_langgraph.BinaryOperatorAggregate<{
        tool: string;
        result: unknown;
    }[], {
        tool: string;
        result: unknown;
    }[]>;
    context: _langchain_langgraph.BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
    error: _langchain_langgraph.BinaryOperatorAggregate<string | undefined, string | undefined>;
    completed: _langchain_langgraph.BinaryOperatorAggregate<boolean, boolean>;
}>;
type AgentState = typeof AgentStateAnnotation.State;

export { type AgentState, AgentStateAnnotation };
