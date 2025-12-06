import { AgentType } from '@repo/shared';

type SpanKind = "agent" | "llm" | "tool" | "mcp" | "workflow";
type SpanStatus = "running" | "success" | "error";
interface SpanEvent {
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
}
interface TraceSpan {
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
interface Trace {
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
interface TracerConfig {
    serviceName: string;
    enabled?: boolean;
    exporterType?: "console" | "memory" | "websocket";
    websocketUrl?: string;
    sampleRate?: number;
}
interface SpanOptions {
    kind?: SpanKind;
    attributes?: Record<string, unknown>;
    parentSpanId?: string;
}
interface AgentSpanAttributes {
    "agent.name": string;
    "agent.type": AgentType;
    "agent.status"?: string;
}
interface LLMSpanAttributes {
    "llm.provider": string;
    "llm.model": string;
    "llm.operation": "generate" | "stream" | "generateWithTools";
    "llm.prompt_tokens"?: number;
    "llm.completion_tokens"?: number;
    "llm.total_tokens"?: number;
}
interface ToolSpanAttributes {
    "tool.name": string;
    "tool.server"?: string;
    "tool.args"?: string;
    "tool.result"?: string;
}
interface TraceExporter {
    export(spans: TraceSpan[]): Promise<void>;
    shutdown(): Promise<void>;
}

export type { AgentSpanAttributes, LLMSpanAttributes, SpanEvent, SpanKind, SpanOptions, SpanStatus, ToolSpanAttributes, Trace, TraceExporter, TraceSpan, TracerConfig };
