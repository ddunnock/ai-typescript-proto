import { MCPClient } from './chunk-ZTLXC3XU.js';

// src/registry.ts
var MCPRegistry = class _MCPRegistry {
  static instance;
  servers = /* @__PURE__ */ new Map();
  agentToolMappings = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeDefaultMappings();
  }
  initializeDefaultMappings() {
    this.agentToolMappings.set("email", [
      "semantic_search",
      "generate_embedding",
      "find_similar_highlights"
    ]);
    this.agentToolMappings.set("research", [
      "semantic_search",
      "generate_embedding"
    ]);
    this.agentToolMappings.set("notes", [
      "semantic_search",
      "generate_embedding",
      "find_similar_highlights"
    ]);
    this.agentToolMappings.set("document", [
      "semantic_search",
      "generate_embedding",
      "find_similar_highlights"
    ]);
    this.agentToolMappings.set("orchestrator", []);
  }
  static getInstance() {
    if (!_MCPRegistry.instance) {
      _MCPRegistry.instance = new _MCPRegistry();
    }
    return _MCPRegistry.instance;
  }
  static resetInstance() {
    _MCPRegistry.instance = void 0;
  }
  registerServer(server) {
    if (this.servers.has(server.name)) {
      throw new Error(`Server "${server.name}" already registered`);
    }
    this.servers.set(server.name, { wrapper: server, isRemote: false });
  }
  async registerRemoteServer(name, config) {
    if (this.servers.has(name)) {
      throw new Error(`Server "${name}" already registered`);
    }
    const client = new MCPClient(name, config);
    await client.connect();
    this.servers.set(name, { client, isRemote: true });
  }
  unregisterServer(name) {
    const server = this.servers.get(name);
    if (server?.client) {
      server.client.disconnect().catch(console.error);
    }
    this.servers.delete(name);
  }
  setAgentToolMapping(agentType, toolNames) {
    this.agentToolMappings.set(agentType, toolNames);
  }
  addToolToAgent(agentType, toolName) {
    const existing = this.agentToolMappings.get(agentType) ?? [];
    if (!existing.includes(toolName)) {
      this.agentToolMappings.set(agentType, [...existing, toolName]);
    }
  }
  getToolsForAgent(agentType) {
    const allowedToolNames = this.agentToolMappings.get(agentType) ?? [];
    const tools = [];
    for (const [, server] of this.servers) {
      const serverTools = server.wrapper?.getTools() ?? [];
      for (const tool of serverTools) {
        if (allowedToolNames.includes(tool.name)) {
          tools.push(tool);
        }
      }
    }
    return tools;
  }
  getAllTools() {
    const tools = [];
    for (const [, server] of this.servers) {
      if (server.wrapper) {
        tools.push(...server.wrapper.getTools());
      }
    }
    return tools;
  }
  async callTool(name, args) {
    for (const [, server] of this.servers) {
      if (server.wrapper?.hasTool(name)) {
        return server.wrapper.callTool(name, args);
      }
      if (server.client) {
        const tools = await server.client.listTools();
        if (tools.some((t) => t.name === name)) {
          return server.client.callTool(name, args);
        }
      }
    }
    throw new Error(`Tool not found: ${name}`);
  }
  getServer(name) {
    return this.servers.get(name);
  }
  getServerNames() {
    return Array.from(this.servers.keys());
  }
  hasServer(name) {
    return this.servers.has(name);
  }
  get serverCount() {
    return this.servers.size;
  }
};
function getMCPRegistry() {
  return MCPRegistry.getInstance();
}

export { MCPRegistry, getMCPRegistry };
//# sourceMappingURL=chunk-77USWBA6.js.map
//# sourceMappingURL=chunk-77USWBA6.js.map