// src/errors.ts
var ConvergenceError = class extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "ConvergenceError";
  }
};
var ProviderError = class extends ConvergenceError {
  constructor(message, provider, details) {
    super(message, `PROVIDER_${provider.toUpperCase()}_ERROR`, { provider, ...details });
    this.name = "ProviderError";
  }
};
var MCPError = class extends ConvergenceError {
  constructor(message, server, details) {
    super(message, `MCP_${server.toUpperCase()}_ERROR`, { server, ...details });
    this.name = "MCPError";
  }
};
var AgentError = class extends ConvergenceError {
  constructor(message, agentType, details) {
    super(message, `AGENT_${agentType.toUpperCase()}_ERROR`, { agentType, ...details });
    this.name = "AgentError";
  }
};
var ConfigError = class extends ConvergenceError {
  constructor(message, key) {
    super(message, "CONFIG_ERROR", { key });
    this.name = "ConfigError";
  }
};
var TimeoutError = class extends ConvergenceError {
  constructor(operation, timeout) {
    super(`Operation "${operation}" timed out after ${timeout}ms`, "TIMEOUT_ERROR", {
      operation,
      timeout
    });
    this.name = "TimeoutError";
  }
};

export { AgentError, ConfigError, ConvergenceError, MCPError, ProviderError, TimeoutError };
//# sourceMappingURL=chunk-66HTTWO4.js.map
//# sourceMappingURL=chunk-66HTTWO4.js.map