import * as _langchain_langgraph from '@langchain/langgraph';
import { AgentConfig, AgentEvent, AgentTask, AgentResult } from '@repo/shared';
import { BaseProvider } from '@repo/providers';
import { AgentState } from './state.js';

declare abstract class BaseAgent {
    protected provider: BaseProvider;
    protected config: AgentConfig;
    protected graph: any;
    constructor(provider: BaseProvider, config: Partial<AgentConfig>);
    /**
     * Build the LangGraph state machine
     */
    protected buildGraph(): _langchain_langgraph.CompiledStateGraph<_langchain_langgraph.StateType<{
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
    }>, _langchain_langgraph.UpdateType<{
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
    }>, "__start__" | "initialize" | "process" | "tool_call" | "finalize", {
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
    }, {
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
    }, _langchain_langgraph.StateDefinition>;
    /**
     * Initialize the agent state
     */
    protected initializeNode(state: AgentState): Promise<Partial<AgentState>>;
    /**
     * Process the current state and generate a response
     */
    protected processNode(state: AgentState): Promise<Partial<AgentState>>;
    /**
     * Execute tool calls
     */
    protected toolCallNode(state: AgentState): Promise<Partial<AgentState>>;
    /**
     * Finalize the agent response
     */
    protected finalizeNode(state: AgentState): Promise<Partial<AgentState>>;
    /**
     * Route from process node
     */
    protected routeFromProcess(state: AgentState): "tool_call" | "finalize";
    /**
     * Get available tools for this agent
     */
    protected getTools(): {
        name: string;
        description: string;
        inputSchema: Record<string, any>;
    }[];
    /**
     * Get the system prompt for this agent
     */
    protected abstract getSystemPrompt(): string;
    /**
     * Process a query and return the response
     */
    process(query: string): Promise<string>;
    /**
     * Stream process with events
     */
    streamProcess(query: string): AsyncIterable<AgentEvent>;
    /**
     * Execute a structured task
     */
    execute(task: AgentTask): Promise<AgentResult>;
}

export { BaseAgent };
