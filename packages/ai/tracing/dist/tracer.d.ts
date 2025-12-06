import { TracerConfig, TraceExporter, SpanStatus, Trace, SpanOptions, TraceSpan } from './types.js';
import '@repo/shared';

declare class AgentTracer {
    private serviceName;
    private enabled;
    private activeSpans;
    private activeTraces;
    private completedTraces;
    private exporters;
    private spanStack;
    constructor(config: TracerConfig);
    addExporter(exporter: TraceExporter): void;
    startTrace(name: string, metadata?: Record<string, unknown>): string;
    endTrace(traceId: string, status?: SpanStatus): Trace | undefined;
    startSpan(name: string, traceId: string, options?: SpanOptions): string;
    endSpan(spanId: string, status?: SpanStatus, error?: Error): TraceSpan | undefined;
    addSpanEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void;
    setSpanAttribute(spanId: string, key: string, value: unknown): void;
    setSpanAttributes(spanId: string, attributes: Record<string, unknown>): void;
    startAgentSpan(agentName: string, agentType: string, traceId: string, parentSpanId?: string): string;
    startLLMSpan(provider: string, model: string, operation: "generate" | "stream" | "generateWithTools", traceId: string, parentSpanId?: string): string;
    startToolSpan(toolName: string, args: Record<string, unknown>, traceId: string, parentSpanId?: string): string;
    startMCPSpan(serverName: string, operation: string, traceId: string, parentSpanId?: string): string;
    getActiveSpan(spanId: string): TraceSpan | undefined;
    getActiveTrace(traceId: string): Trace | undefined;
    getCompletedTraces(): Trace[];
    getCurrentSpanId(): string | undefined;
    clearCompletedTraces(): void;
    private exportSpans;
    shutdown(): Promise<void>;
}
declare function initTracer(config: TracerConfig): AgentTracer;
declare function getTracer(): AgentTracer;
declare function resetTracer(): void;

export { AgentTracer, getTracer, initTracer, resetTracer };
