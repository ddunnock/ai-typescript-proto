import type { AgentType } from "@repo/shared";

export type SpanKind = "agent" | "llm" | "tool" | "mcp" | "workflow";

export type SpanStatus = "running" | "success" | "error";

export interface SpanEvent {
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
}

export interface TraceSpan {
    id: string;
    traceId: string;
    parentSpanId?: string;
    name: string;
    kind: SpanKind;
    status: SpanStatus;
    startTime: number;
    endTime?: number;
    duration?: number;
    attributes: Record<string, unknown>;
    events: SpanEvent[];
}

export interface Trace {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: SpanStatus;
    rootSpan?: TraceSpan;
    spans: TraceSpan[];
    metadata?: Record<string, unknown>;
}

export interface TracerConfig {
    serviceName: string;
    enabled?: boolean;
    exporterType?: "console" | "memory" | "websocket";
    websocketUrl?: string;
    sampleRate?: number;
}

export interface SpanOptions {
    kind?: SpanKind;
    attributes?: Record<string, unknown>;
    parentSpanId?: string;
}

export interface AgentSpanAttributes {
    "agent.name": string;
    "agent.type": AgentType;
    "agent.status"?: string;
}

export interface LLMSpanAttributes {
    "llm.provider": string;
    "llm.model": string;
    "llm.operation": "generate" | "stream" | "generateWithTools";
    "llm.prompt_tokens"?: number;
    "llm.completion_tokens"?: number;
    "llm.total_tokens"?: number;
}

export interface ToolSpanAttributes {
    "tool.name": string;
    "tool.server"?: string;
    "tool.args"?: string;
    "tool.result"?: string;
}

export interface TraceExporter {
    export(spans: TraceSpan[]): Promise<void>;
    shutdown(): Promise<void>;
}
