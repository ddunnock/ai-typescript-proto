import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// src/server.ts
var MCPServerWrapper = class {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.server = new Server(
      { name, version },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }
  server;
  tools = /* @__PURE__ */ new Map();
  started = false;
  registerTool(name, description, inputSchema, handler) {
    if (this.started) {
      throw new Error("Cannot register tools after server has started");
    }
    this.tools.set(name, {
      schema: { name, description, inputSchema },
      handler
    });
  }
  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()).map((t) => ({
        name: t.schema.name,
        description: t.schema.description,
        inputSchema: t.schema.inputSchema
      }))
    }));
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }
      const args = request.params.arguments ?? {};
      return tool.handler(args);
    });
  }
  async start() {
    if (this.started) {
      throw new Error("Server already started");
    }
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.started = true;
  }
  async callTool(name, args) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.handler(args);
  }
  getTools() {
    return Array.from(this.tools.values()).map((t) => t.schema);
  }
  getToolNames() {
    return Array.from(this.tools.keys());
  }
  hasTool(name) {
    return this.tools.has(name);
  }
  get isStarted() {
    return this.started;
  }
};

export { MCPServerWrapper };
//# sourceMappingURL=chunk-VZ3ZHLKV.js.map
//# sourceMappingURL=chunk-VZ3ZHLKV.js.map