declare class ConvergenceError extends Error {
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
declare class ProviderError extends ConvergenceError {
    constructor(message: string, provider: string, details?: Record<string, unknown>);
}
declare class MCPError extends ConvergenceError {
    constructor(message: string, server: string, details?: Record<string, unknown>);
}
declare class AgentError extends ConvergenceError {
    constructor(message: string, agentType: string, details?: Record<string, unknown>);
}
declare class ConfigError extends ConvergenceError {
    constructor(message: string, key: string);
}
declare class TimeoutError extends ConvergenceError {
    constructor(operation: string, timeout: number);
}

export { AgentError, ConfigError, ConvergenceError, MCPError, ProviderError, TimeoutError };
