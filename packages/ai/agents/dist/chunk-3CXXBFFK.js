import { AgentStateAnnotation } from './chunk-TLEG54VS.js';
import { StateGraph, START, END } from '@langchain/langgraph';
import { createMessage, AgentError, createAgentEvent } from '@repo/shared';
import { getMCPRegistry } from '@repo/mcp';

var BaseAgent = class {
  provider;
  config;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph;
  constructor(provider, config) {
    this.provider = provider;
    this.config = {
      type: config.type ?? "orchestrator",
      name: config.name ?? "Agent",
      description: config.description,
      mcpServers: config.mcpServers ?? [],
      maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
      timeout: config.timeout ?? 3e4
    };
    this.graph = this.buildGraph();
  }
  /**
   * Build the LangGraph state machine
   */
  buildGraph() {
    const workflow = new StateGraph(AgentStateAnnotation).addNode("initialize", this.initializeNode.bind(this)).addNode("process", this.processNode.bind(this)).addNode("tool_call", this.toolCallNode.bind(this)).addNode("finalize", this.finalizeNode.bind(this)).addEdge(START, "initialize").addEdge("initialize", "process").addConditionalEdges("process", this.routeFromProcess.bind(this), {
      tool_call: "tool_call",
      finalize: "finalize"
    }).addEdge("tool_call", "process").addEdge("finalize", END);
    return workflow.compile();
  }
  /**
   * Initialize the agent state
   */
  async initializeNode(state) {
    return {
      status: "thinking",
      currentAgent: this.config.type,
      context: {
        ...state.context,
        agentName: this.config.name,
        startedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  /**
   * Process the current state and generate a response
   */
  async processNode(state) {
    const tools = this.getTools();
    const systemPrompt = this.getSystemPrompt();
    const messages = [
      createMessage("system", systemPrompt),
      ...state.messages
    ];
    try {
      const response = await this.provider.generateWithTools(messages, tools, {
        temperature: 0.7,
        maxTokens: 4096
      });
      if (response.toolCalls && response.toolCalls.length > 0) {
        return {
          status: "executing",
          context: {
            ...state.context,
            pendingToolCalls: response.toolCalls
          }
        };
      }
      return {
        messages: [createMessage("assistant", response.content)],
        status: "complete"
      };
    } catch (error) {
      return {
        error: error.message,
        status: "error"
      };
    }
  }
  /**
   * Execute tool calls
   */
  async toolCallNode(state) {
    const pendingCalls = state.context.pendingToolCalls;
    if (!pendingCalls || pendingCalls.length === 0) {
      return { status: "thinking" };
    }
    const registry = getMCPRegistry();
    const results = [];
    for (const call of pendingCalls) {
      try {
        const result = await registry.callTool(call.name, call.arguments);
        results.push({ tool: call.name, result });
      } catch (error) {
        results.push({ tool: call.name, result: { error: error.message } });
      }
    }
    return {
      toolResults: results,
      status: "thinking",
      context: {
        ...state.context,
        pendingToolCalls: void 0
      }
    };
  }
  /**
   * Finalize the agent response
   */
  async finalizeNode(state) {
    return {
      completed: true,
      status: "complete",
      context: {
        ...state.context,
        completedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  /**
   * Route from process node
   */
  routeFromProcess(state) {
    const pendingCalls = state.context.pendingToolCalls;
    if (pendingCalls && Array.isArray(pendingCalls) && pendingCalls.length > 0) {
      return "tool_call";
    }
    return "finalize";
  }
  /**
   * Get available tools for this agent
   */
  getTools() {
    const registry = getMCPRegistry();
    return registry.getToolsForAgent(this.config.type);
  }
  /**
   * Process a query and return the response
   */
  async process(query) {
    const initialState = {
      messages: [createMessage("user", query)]
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
  async *streamProcess(query) {
    const initialState = {
      messages: [createMessage("user", query)]
    };
    const stream = await this.graph.stream(initialState);
    for await (const event of stream) {
      const [nodeName, nodeState] = Object.entries(event)[0] ?? [];
      if (!nodeName || !nodeState) continue;
      const state = nodeState;
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
  async execute(task) {
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
        completedAt: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        completedAt: /* @__PURE__ */ new Date()
      };
    }
  }
};

export { BaseAgent };
//# sourceMappingURL=chunk-3CXXBFFK.js.map
//# sourceMappingURL=chunk-3CXXBFFK.js.map