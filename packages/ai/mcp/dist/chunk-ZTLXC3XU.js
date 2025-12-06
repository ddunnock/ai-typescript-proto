import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// src/client.ts
var MCPClient = class {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.client = new Client(
      { name: `${name}-client`, version: "1.0.0" },
      { capabilities: {} }
    );
  }
  client;
  connected = false;
  cachedTools = null;
  async connect() {
    if (this.connected) {
      return;
    }
    const transport = this.createTransport();
    await this.client.connect(transport);
    this.connected = true;
  }
  async disconnect() {
    if (!this.connected) {
      return;
    }
    await this.client.close();
    this.connected = false;
    this.cachedTools = null;
  }
  createTransport() {
    if (this.config.type !== "stdio") {
      throw new Error(`Transport type "${this.config.type}" not yet supported`);
    }
    if (!this.config.command) {
      throw new Error("stdio transport requires a command");
    }
    return new StdioClientTransport({
      command: this.config.command,
      args: this.config.args
    });
  }
  async listTools() {
    if (!this.connected) {
      throw new Error("Client not connected");
    }
    if (this.cachedTools) {
      return this.cachedTools;
    }
    const result = await this.client.listTools();
    this.cachedTools = result.tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: t.inputSchema
    }));
    return this.cachedTools;
  }
  async callTool(name, args) {
    if (!this.connected) {
      throw new Error("Client not connected");
    }
    const result = await this.client.callTool({ name, arguments: args });
    return result;
  }
  get isConnected() {
    return this.connected;
  }
  get serverName() {
    return this.name;
  }
  invalidateToolCache() {
    this.cachedTools = null;
  }
};

export { MCPClient };
//# sourceMappingURL=chunk-ZTLXC3XU.js.map
//# sourceMappingURL=chunk-ZTLXC3XU.js.map