export class ConvergenceError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = "ConvergenceError";
    }
}

export class ProviderError extends ConvergenceError {
    constructor(message: string, provider: string, details?: Record<string, unknown>) {
        super(message, `PROVIDER_${provider.toUpperCase()}_ERROR`, { provider, ...details });
        this.name = "ProviderError";
    }
}

export class MCPError extends ConvergenceError {
    constructor(message: string, server: string, details?: Record<string, unknown>) {
        super(message, `MCP_${server.toUpperCase()}_ERROR`, { server, ...details });
        this.name = "MCPError";
    }
}

export class AgentError extends ConvergenceError {
    constructor(message: string, agentType: string, details?: Record<string, unknown>) {
        super(message, `AGENT_${agentType.toUpperCase()}_ERROR`, { agentType, ...details });
        this.name = "AgentError";
    }
}

export class ConfigError extends ConvergenceError {
    constructor(message: string, key: string) {
        super(message, "CONFIG_ERROR", { key });
        this.name = "ConfigError";
    }
}

export class TimeoutError extends ConvergenceError {
    constructor(operation: string, timeout: number) {
        super(`Operation "${operation}" timed out after ${timeout}ms`, "TIMEOUT_ERROR", {
            operation,
            timeout,
        });
        this.name = "TimeoutError";
    }
}
