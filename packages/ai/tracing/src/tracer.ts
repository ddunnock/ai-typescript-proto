import { generateId } from "@repo/shared";
import type {
    TraceSpan,
    Trace,
    SpanKind,
    SpanStatus,
    SpanOptions,
    SpanEvent,
    TracerConfig,
    TraceExporter,
} from "./types";

export class AgentTracer {
    private serviceName: string;
    private enabled: boolean;
    private activeSpans: Map<string, TraceSpan> = new Map();
    private activeTraces: Map<string, Trace> = new Map();
    private completedTraces: Trace[] = [];
    private exporters: TraceExporter[] = [];
    private spanStack: string[] = [];

    constructor(config: TracerConfig) {
        this.serviceName = config.serviceName;
        this.enabled = config.enabled ?? true;
    }

    addExporter(exporter: TraceExporter): void {
        this.exporters.push(exporter);
    }

    startTrace(name: string, metadata?: Record<string, unknown>): string {
        if (!this.enabled) return "";

        const traceId = generateId("trace");
        const trace: Trace = {
            id: traceId,
            name,
            startTime: Date.now(),
            status: "running",
            spans: [],
            metadata,
        };

        this.activeTraces.set(traceId, trace);
        return traceId;
    }

    endTrace(traceId: string, status?: SpanStatus): Trace | undefined {
        if (!this.enabled) return undefined;

        const trace = this.activeTraces.get(traceId);
        if (!trace) return undefined;

        trace.endTime = Date.now();
        trace.duration = trace.endTime - trace.startTime;
        trace.status = status ?? "success";

        this.activeTraces.delete(traceId);
        this.completedTraces.push(trace);

        // Export completed trace spans
        this.exportSpans(trace.spans).catch(console.error);

        return trace;
    }

    startSpan(
        name: string,
        traceId: string,
        options?: SpanOptions
    ): string {
        if (!this.enabled) return "";

        const spanId = generateId("span");
        const parentSpanId = options?.parentSpanId ?? this.spanStack[this.spanStack.length - 1];

        const span: TraceSpan = {
            id: spanId,
            traceId,
            parentSpanId,
            name,
            kind: options?.kind ?? "agent",
            status: "running",
            startTime: Date.now(),
            attributes: {
                "service.name": this.serviceName,
                ...options?.attributes,
            },
            events: [],
        };

        this.activeSpans.set(spanId, span);
        this.spanStack.push(spanId);

        // Add to trace
        const trace = this.activeTraces.get(traceId);
        if (trace) {
            trace.spans.push(span);
            if (!trace.rootSpan) {
                trace.rootSpan = span;
            }
        }

        return spanId;
    }

    endSpan(spanId: string, status?: SpanStatus, error?: Error): TraceSpan | undefined {
        if (!this.enabled) return undefined;

        const span = this.activeSpans.get(spanId);
        if (!span) return undefined;

        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.status = error ? "error" : (status ?? "success");

        if (error) {
            span.attributes["error.message"] = error.message;
            span.attributes["error.stack"] = error.stack;
            this.addSpanEvent(spanId, "exception", {
                "exception.message": error.message,
                "exception.type": error.name,
            });
        }

        this.activeSpans.delete(spanId);

        // Remove from stack
        const stackIndex = this.spanStack.indexOf(spanId);
        if (stackIndex !== -1) {
            this.spanStack.splice(stackIndex, 1);
        }

        return span;
    }

    addSpanEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
        if (!this.enabled) return;

        const span = this.activeSpans.get(spanId);
        if (!span) return;

        const event: SpanEvent = {
            name,
            timestamp: Date.now(),
            attributes,
        };

        span.events.push(event);
    }

    setSpanAttribute(spanId: string, key: string, value: unknown): void {
        if (!this.enabled) return;

        const span = this.activeSpans.get(spanId);
        if (span) {
            span.attributes[key] = value;
        }
    }

    setSpanAttributes(spanId: string, attributes: Record<string, unknown>): void {
        if (!this.enabled) return;

        const span = this.activeSpans.get(spanId);
        if (span) {
            Object.assign(span.attributes, attributes);
        }
    }

    // Convenience methods for specific span types

    startAgentSpan(
        agentName: string,
        agentType: string,
        traceId: string,
        parentSpanId?: string
    ): string {
        return this.startSpan(`agent.${agentName}`, traceId, {
            kind: "agent",
            parentSpanId,
            attributes: {
                "agent.name": agentName,
                "agent.type": agentType,
            },
        });
    }

    startLLMSpan(
        provider: string,
        model: string,
        operation: "generate" | "stream" | "generateWithTools",
        traceId: string,
        parentSpanId?: string
    ): string {
        return this.startSpan(`llm.${operation}`, traceId, {
            kind: "llm",
            parentSpanId,
            attributes: {
                "llm.provider": provider,
                "llm.model": model,
                "llm.operation": operation,
            },
        });
    }

    startToolSpan(
        toolName: string,
        args: Record<string, unknown>,
        traceId: string,
        parentSpanId?: string
    ): string {
        return this.startSpan(`tool.${toolName}`, traceId, {
            kind: "tool",
            parentSpanId,
            attributes: {
                "tool.name": toolName,
                "tool.args": JSON.stringify(args),
            },
        });
    }

    startMCPSpan(
        serverName: string,
        operation: string,
        traceId: string,
        parentSpanId?: string
    ): string {
        return this.startSpan(`mcp.${serverName}.${operation}`, traceId, {
            kind: "mcp",
            parentSpanId,
            attributes: {
                "mcp.server": serverName,
                "mcp.operation": operation,
            },
        });
    }

    // Utility methods

    getActiveSpan(spanId: string): TraceSpan | undefined {
        return this.activeSpans.get(spanId);
    }

    getActiveTrace(traceId: string): Trace | undefined {
        return this.activeTraces.get(traceId);
    }

    getCompletedTraces(): Trace[] {
        return [...this.completedTraces];
    }

    getCurrentSpanId(): string | undefined {
        return this.spanStack[this.spanStack.length - 1];
    }

    clearCompletedTraces(): void {
        this.completedTraces = [];
    }

    private async exportSpans(spans: TraceSpan[]): Promise<void> {
        if (spans.length === 0) return;

        await Promise.all(
            this.exporters.map((exporter) =>
                exporter.export(spans).catch((err) => {
                    console.error("Failed to export spans:", err);
                })
            )
        );
    }

    async shutdown(): Promise<void> {
        // End all active spans
        for (const spanId of this.activeSpans.keys()) {
            this.endSpan(spanId, "error", new Error("Tracer shutdown"));
        }

        // End all active traces
        for (const traceId of this.activeTraces.keys()) {
            this.endTrace(traceId, "error");
        }

        // Shutdown exporters
        await Promise.all(
            this.exporters.map((exporter) => exporter.shutdown())
        );
    }
}

// Singleton instance
let globalTracer: AgentTracer | null = null;

export function initTracer(config: TracerConfig): AgentTracer {
    globalTracer = new AgentTracer(config);
    return globalTracer;
}

export function getTracer(): AgentTracer {
    if (!globalTracer) {
        globalTracer = new AgentTracer({
            serviceName: "convergence-agents",
            enabled: true,
        });
    }
    return globalTracer;
}

export function resetTracer(): void {
    globalTracer = null;
}
