import { StateGraph, END, START } from "@langchain/langgraph";
import {
    type AgentConfig,
    type Message,
    createMessage,
    createAgentEvent,
    type AgentEvent,
} from "@repo/shared";
import type { BaseProvider } from "@repo/providers";
import { BaseAgent } from "../base";
import { AgentStateAnnotation, type AgentState } from "../state";

interface SubAgentConfig {
    name: string;
    description: string;
    agent: BaseAgent;
}

export class OrchestratorAgent extends BaseAgent {
    private subAgents: Map<string, SubAgentConfig> = new Map();

    constructor(provider: BaseProvider, config?: Partial<AgentConfig>) {
        super(provider, {
            ...config,
            type: "orchestrator",
            name: config?.name ?? "Orchestrator",
            description: config?.description ?? "Multi-agent coordinator that routes to specialized agents",
        });
    }

    registerSubAgent(name: string, description: string, agent: BaseAgent): void {
        this.subAgents.set(name, { name, description, agent });
    }

    unregisterSubAgent(name: string): void {
        this.subAgents.delete(name);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override buildGraph(): any {
        const workflow = new StateGraph(AgentStateAnnotation)
            .addNode("initialize", this.initializeNode.bind(this))
            .addNode("analyze", this.analyzeNode.bind(this))
            .addNode("delegate", this.delegateNode.bind(this))
            .addNode("synthesize", this.synthesizeNode.bind(this))
            .addNode("finalize", this.finalizeNode.bind(this))
            .addEdge(START, "initialize")
            .addEdge("initialize", "analyze")
            .addConditionalEdges("analyze", this.routeFromAnalyze.bind(this), {
                delegate: "delegate",
                synthesize: "synthesize",
            })
            .addEdge("delegate", "synthesize")
            .addEdge("synthesize", "finalize")
            .addEdge("finalize", END);

        return workflow.compile();
    }

    protected async analyzeNode(state: AgentState): Promise<Partial<AgentState>> {
        const agentDescriptions = Array.from(this.subAgents.entries())
            .map(([name, config]) => `- ${name}: ${config.description}`)
            .join("\n");

        const analysisPrompt = `You are an orchestrator that coordinates specialized agents.

Available agents:
${agentDescriptions || "No specialized agents registered."}

Based on the user's request, determine:
1. Which agent(s) should handle this request
2. What specific query to send to each agent

Respond in JSON format:
{
  "delegation": [
    { "agent": "agent_name", "query": "specific query for this agent" }
  ],
  "directResponse": null or "response if no delegation needed"
}

If the request doesn't require any specialized agent, provide a direct response.
If no agents are available, explain that no specialized agents are configured.`;

        const messages: Message[] = [
            createMessage("system", analysisPrompt),
            ...state.messages,
        ];

        try {
            const response = await this.provider.generate(messages, {
                temperature: 0.3,
                maxTokens: 1024,
            });

            let analysis: {
                delegation?: Array<{ agent: string; query: string }>;
                directResponse?: string | null;
            };

            try {
                const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { directResponse: response.content };
            } catch {
                analysis = { directResponse: response.content };
            }

            return {
                status: "thinking",
                context: {
                    ...state.context,
                    analysis,
                    delegations: analysis.delegation ?? [],
                    directResponse: analysis.directResponse,
                },
            };
        } catch (error) {
            return {
                error: (error as Error).message,
                status: "error",
            };
        }
    }

    protected async delegateNode(state: AgentState): Promise<Partial<AgentState>> {
        const delegations = state.context.delegations as Array<{ agent: string; query: string }> | undefined;

        if (!delegations || delegations.length === 0) {
            return { status: "thinking" };
        }

        const delegationResults: Array<{ agent: string; query: string; response: string }> = [];

        for (const delegation of delegations) {
            const subAgentConfig = this.subAgents.get(delegation.agent);

            if (!subAgentConfig) {
                delegationResults.push({
                    agent: delegation.agent,
                    query: delegation.query,
                    response: `Agent "${delegation.agent}" not found`,
                });
                continue;
            }

            try {
                const response = await subAgentConfig.agent.process(delegation.query);
                delegationResults.push({
                    agent: delegation.agent,
                    query: delegation.query,
                    response,
                });
            } catch (error) {
                delegationResults.push({
                    agent: delegation.agent,
                    query: delegation.query,
                    response: `Error: ${(error as Error).message}`,
                });
            }
        }

        return {
            status: "thinking",
            context: {
                ...state.context,
                delegationResults,
            },
        };
    }

    protected async synthesizeNode(state: AgentState): Promise<Partial<AgentState>> {
        const directResponse = state.context.directResponse as string | undefined;
        const delegationResults = state.context.delegationResults as Array<{
            agent: string;
            query: string;
            response: string;
        }> | undefined;

        if (directResponse) {
            return {
                messages: [createMessage("assistant", directResponse)],
                status: "complete",
            };
        }

        if (!delegationResults || delegationResults.length === 0) {
            return {
                messages: [createMessage("assistant", "I couldn't process your request.")],
                status: "complete",
            };
        }

        if (delegationResults.length === 1 && delegationResults[0]) {
            return {
                messages: [createMessage("assistant", delegationResults[0].response)],
                status: "complete",
            };
        }

        const synthesisPrompt = `You received responses from multiple specialized agents.
Synthesize these into a cohesive response for the user.

Agent responses:
${delegationResults.map((r) => `[${r.agent}]: ${r.response}`).join("\n\n")}

Provide a unified, helpful response that combines the insights from all agents.`;

        const messages: Message[] = [
            createMessage("system", synthesisPrompt),
            ...state.messages,
        ];

        try {
            const response = await this.provider.generate(messages, {
                temperature: 0.5,
                maxTokens: 2048,
            });

            return {
                messages: [createMessage("assistant", response.content)],
                status: "complete",
            };
        } catch (error) {
            const fallbackResponse = delegationResults
                .map((r) => `**${r.agent}**: ${r.response}`)
                .join("\n\n");

            return {
                messages: [createMessage("assistant", fallbackResponse)],
                status: "complete",
            };
        }
    }

    protected routeFromAnalyze(state: AgentState): "delegate" | "synthesize" {
        const delegations = state.context.delegations as Array<unknown> | undefined;
        if (delegations && delegations.length > 0) {
            return "delegate";
        }
        return "synthesize";
    }

    protected override getSystemPrompt(): string {
        return `You are an AI orchestrator coordinating specialized agents for email, notes, documents, and research tasks.`;
    }

    override async *streamProcess(query: string): AsyncIterable<AgentEvent> {
        const initialState: Partial<AgentState> = {
            messages: [createMessage("user", query)],
        };

        const stream = await this.graph.stream(initialState);

        for await (const event of stream) {
            const [nodeName, nodeState] = Object.entries(event)[0] ?? [];

            if (!nodeName || !nodeState) continue;

            const state = nodeState as Partial<AgentState>;

            switch (nodeName) {
                case "initialize":
                    yield createAgentEvent("thinking", "Analyzing request...", this.config.type);
                    break;
                case "analyze":
                    yield createAgentEvent("thinking", "Determining which agents to use...", this.config.type);
                    break;
                case "delegate":
                    yield createAgentEvent("thinking", "Delegating to specialized agents...", this.config.type);
                    break;
                case "synthesize":
                    if (state.messages && state.messages.length > 0) {
                        const lastMsg = state.messages[state.messages.length - 1];
                        yield createAgentEvent("response", lastMsg?.content, this.config.type);
                    }
                    break;
                case "finalize":
                    yield createAgentEvent("complete", null, this.config.type);
                    break;
            }
        }
    }

    get registeredAgents(): string[] {
        return Array.from(this.subAgents.keys());
    }
}
