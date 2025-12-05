import { StateGraph, END, START } from "@langchain/langgraph";
import {
    type AgentConfig,
    type AgentTask,
    type AgentResult,
    type AgentEvent,
    type Message,
    generateId,
    createMessage,
    createAgentEvent,
    AgentError,
} from "@repo/shared";
import type { BaseProvider } from "@repo/providers";
import { getMCPRegistry } from "@repo/mcp";
import { AgentStateAnnotation, type AgentState } from "./state";

export abstract class BaseAgent {
    protected provider: BaseProvider;
    protected config: AgentConfig;
    protected graph: ReturnType<typeof StateGraph.prototype.compile>;

    constructor(provider: BaseProvider, config: Partial<AgentConfig>) {
        this.provider = provider;
        this.config = {
            type: config.type ?? "orchestrator",
            name: config.name ?? "Agent",
            description: config.description,
            mcpServers: config.mcpServers ?? [],
            maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
            timeout: config.timeout ?? 30000,
        };
        this.graph = this.buildGraph();
    }

    /**
     * Build the LangGraph state machine
     */
    protected buildGraph() {
        const workflow = new StateGraph(AgentStateAnnotation)
            .addNode("initialize", this.initializeNode.bind(this))
            .addNode("process", this.processNode.bind(this))
            .addNode("tool_call", this.toolCallNode.bind(this))
            .addNode("finalize", this.finalizeNode.bind(this))
            .addEdge(START, "initialize")
            .addEdge("initialize", "process")
            .addConditionalEdges("process", this.routeFromProcess.bind(this), {
                tool_call: "tool_call",
                finalize: "finalize",
            })
            .addEdge("tool_call", "process")
            .addEdge("finalize", END);

        return workflow.compile();
    }

    /**
     * Initialize the agent state
     */
    protected async initializeNode(state: AgentState): Promise<Partial<AgentState>> {
        return {
            status: "thinking",
            currentAgent: this.config.type,
            context: {
                ...state.context,
                agentName: this.config.name,
                startedAt: new Date().toISOString(),
            },
        };
    }

    /**
     * Process the current state and generate a response
     */
    protected async processNode(state: AgentState): Promise<Partial<AgentState>> {
        const tools = this.getTools();
        const systemPrompt = this.getSystemPrompt();

        const messages: Message[] = [
            createMessage("system", systemPrompt),
            ...state.messages,
        ];

        try {
            const response = await this.provider.generateWithTools(messages, tools, {
                temperature: 0.7,
                maxTokens: 4096,
            });

            if (response.toolCalls && response.toolCalls.length > 0) {
                return {
                    status: "executing",
                    context: {
                        ...state.context,
                        pendingToolCalls: response.toolCalls,
                    },
                };
            }

            return {
                messages: [createMessage("assistant", response.content)],
                status: "complete",
            };
        } catch (error) {
            return {
                error: (error as Error).message,
                status: "error",
            };
        }
    }

    /**
     * Execute tool calls
     */
    protected async toolCallNode(state: AgentState): Promise<Partial<AgentState>> {
        const pendingCalls = state.context.pendingToolCalls as Array<{
            id: string;
            name: string;
            arguments: Record<string, unknown>;
        }>;

        if (!pendingCalls || pendingCalls.length === 0) {
            return { status: "thinking" };
        }

        const registry = getMCPRegistry();
        const results: Array<{ tool: string; result: unknown }> = [];

        for (const call of pendingCalls) {
            try {
                const result = await registry.callTool(call.name, call.arguments);
                results.push({ tool: call.name, result });
            } catch (error) {
                results.push({ tool: call.name, result: { error: (error as Error).message } });
            }
        }

        return {
            toolResults: results,
            status: "thinking",
            context: {
                ...state.context,
                pendingToolCalls: undefined,
            },
        };
    }

    /**
     * Finalize the agent response
     */
    protected async finalizeNode(state: AgentState): Promise<Partial<AgentState>> {
        return {
            completed: true,
            status: "complete",
            context: {
                ...state.context,
                completedAt: new Date().toISOString(),
            },
        };
    }

    /**
     * Route from process node
     */
    protected routeFromProcess(state: AgentState): "tool_call" | "finalize" {
        const pendingCalls = state.context.pendingToolCalls;
        if (pendingCalls && Array.isArray(pendingCalls) && pendingCalls.length > 0) {
            return "tool_call";
        }
        return "finalize";
    }

    /**
     * Get available tools for this agent
     */
    protected getTools() {
        const registry = getMCPRegistry();
        return registry.getToolsForAgent(this.config.type);
    }

    /**
     * Get the system prompt for this agent
     */
    protected abstract getSystemPrompt(): string;

    /**
     * Process a query and return the response
     */
    async process(query: string): Promise<string> {
        const initialState: Partial<AgentState> = {
            messages: [createMessage("user", query)],
        };

        const result = await this.graph.invoke(initialState);

        if (result.error) {
            throw new AgentError(result.error, this.config.type);
        }

        const lastMessage = result.messages[result.messages.length - 1];
        return lastMessage?.content ?? "";
    }

    /**
     * Stream process with events
     */
    async *streamProcess(query: string): AsyncIterable<AgentEvent> {
        const initialState: Partial<AgentState> = {
            messages: [createMessage("user", query)],
        };

        for await (const event of this.graph.stream(initialState)) {
            const [nodeName, nodeState] = Object.entries(event)[0] ?? [];

            if (!nodeName || !nodeState) continue;

            const state = nodeState as Partial<AgentState>;

            switch (nodeName) {
                case "initialize":
                    yield createAgentEvent("thinking", "Starting...", this.config.type);
                    break;
                case "process":
                    if (state.messages && state.messages.length > 0) {
                        const lastMsg = state.messages[state.messages.length - 1];
                        yield createAgentEvent("response", lastMsg?.content, this.config.type);
                    }
                    break;
                case "tool_call":
                    if (state.toolResults) {
                        for (const result of state.toolResults) {
                            yield createAgentEvent("tool_result", result, this.config.type);
                        }
                    }
                    break;
                case "finalize":
                    yield createAgentEvent("complete", null, this.config.type);
                    break;
            }
        }
    }

    /**
     * Execute a structured task
     */
    async execute(task: AgentTask): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            const response = await this.process(
                typeof task.data.query === "string" ? task.data.query : JSON.stringify(task.data)
            );

            return {
                taskId: task.id,
                success: true,
                data: { response },
                duration: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            return {
                taskId: task.id,
                success: false,
                error: (error as Error).message,
                duration: Date.now() - startTime,
                completedAt: new Date(),
            };
        }
    }
}