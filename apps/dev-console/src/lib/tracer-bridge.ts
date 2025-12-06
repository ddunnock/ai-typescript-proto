/**
 * Tracer Bridge
 * 
 * Bridges the server-side @repo/tracing system to client-side trace store.
 * Streams trace and span events via SSE alongside agent events.
 */

import type { TraceSpan, Trace } from "@repo/tracing";

// Event types for trace streaming
export interface TraceStreamEvent {
    type: "trace_start" | "trace_end" | "span_start" | "span_update" | "span_end";
    traceId: string;
    data: TraceEventData;
    timestamp: string;
}

export type TraceEventData =
    | TraceStartData
    | TraceEndData
    | SpanStartData
    | SpanUpdateData
    | SpanEndData;

export interface TraceStartData {
    name: string;
    metadata?: Record<string, unknown>;
}

export interface TraceEndData {
    status: "running" | "success" | "error";
    duration?: number;
}

export interface SpanStartData {
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: "agent" | "llm" | "tool" | "mcp" | "internal";
    attributes?: Record<string, unknown>;
}

export interface SpanUpdateData {
    spanId: string;
    attributes?: Record<string, unknown>;
    events?: Array<{
        name: string;
        timestamp: number;
        attributes?: Record<string, unknown>;
    }>;
}

export interface SpanEndData {
    spanId: string;
    status: "running" | "success" | "error";
    duration?: number;
    error?: {
        message: string;
        stack?: string;
    };
}

/**
 * Creates trace stream events for SSE transmission
 */
export function createTraceEvent(
    type: TraceStreamEvent["type"],
    traceId: string,
    data: TraceEventData
): TraceStreamEvent {
    return {
        type,
        traceId,
        data,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Server-side trace collector that emits events for streaming
 */
export class StreamingTraceCollector {
    private traceId: string;
    private traceName: string;
    private spans: Map<string, SpanStartData & { startTime: number }> = new Map();
    private events: TraceStreamEvent[] = [];
    private onEvent: (event: TraceStreamEvent) => void;

    constructor(
        traceName: string,
        onEvent: (event: TraceStreamEvent) => void
    ) {
        this.traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.traceName = traceName;
        this.onEvent = onEvent;

        // Emit trace start
        this.emit(createTraceEvent("trace_start", this.traceId, {
            name: traceName,
        }));
    }

    get id(): string {
        return this.traceId;
    }

    startSpan(
        name: string,
        kind: SpanStartData["kind"],
        parentSpanId?: string,
        attributes?: Record<string, unknown>
    ): string {
        const spanId = `span_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const spanData: SpanStartData & { startTime: number } = {
            spanId,
            parentSpanId,
            name,
            kind,
            attributes,
            startTime: Date.now(),
        };

        this.spans.set(spanId, spanData);

        this.emit(createTraceEvent("span_start", this.traceId, {
            spanId,
            parentSpanId,
            name,
            kind,
            attributes,
        }));

        return spanId;
    }

    updateSpan(spanId: string, attributes?: Record<string, unknown>): void {
        const span = this.spans.get(spanId);
        if (span && attributes) {
            span.attributes = { ...span.attributes, ...attributes };
            this.emit(createTraceEvent("span_update", this.traceId, {
                spanId,
                attributes,
            }));
        }
    }

    addSpanEvent(
        spanId: string,
        eventName: string,
        attributes?: Record<string, unknown>
    ): void {
        this.emit(createTraceEvent("span_update", this.traceId, {
            spanId,
            events: [{
                name: eventName,
                timestamp: Date.now(),
                attributes,
            }],
        }));
    }

    endSpan(
        spanId: string,
        status: "success" | "error" = "success",
        error?: Error
    ): void {
        const span = this.spans.get(spanId);
        if (!span) return;

        const duration = Date.now() - span.startTime;

        this.emit(createTraceEvent("span_end", this.traceId, {
            spanId,
            status,
            duration,
            error: error ? { message: error.message, stack: error.stack } : undefined,
        }));

        this.spans.delete(spanId);
    }

    endTrace(status: "success" | "error" = "success"): void {
        // End any remaining spans
        for (const [spanId] of this.spans) {
            this.endSpan(spanId, status);
        }

        this.emit(createTraceEvent("trace_end", this.traceId, {
            status,
        }));
    }

    /**
     * Record LLM prompt content for deep inspection
     */
    setLLMPrompt(spanId: string, prompt: string): void {
        this.updateSpan(spanId, { "llm.prompt": prompt });
    }

    /**
     * Record LLM response content for deep inspection
     */
    setLLMResponse(spanId: string, response: string): void {
        this.updateSpan(spanId, { "llm.response": response });
    }

    /**
     * Record LLM thinking/reasoning content (e.g., chain of thought)
     */
    setLLMThinking(spanId: string, thinking: string): void {
        this.updateSpan(spanId, { "llm.thinking": thinking });
    }

    /**
     * Record token usage for LLM spans
     */
    setTokenUsage(spanId: string, input: number, output: number): void {
        this.updateSpan(spanId, {
            "llm.tokens.input": input,
            "llm.tokens.output": output,
            "llm.tokens.total": input + output,
        });
    }

    /**
     * Record model information
     */
    setModel(spanId: string, provider: string, model: string): void {
        this.updateSpan(spanId, {
            "llm.provider": provider,
            "llm.model": model,
        });
    }

    private emit(event: TraceStreamEvent): void {
        this.events.push(event);
        this.onEvent(event);
    }

    getEvents(): TraceStreamEvent[] {
        return [...this.events];
    }
}

/**
 * Client-side utility to parse trace events from SSE stream
 */
export function parseTraceEvent(data: unknown): TraceStreamEvent | null {
    if (!data || typeof data !== "object") return null;

    const event = data as Record<string, unknown>;

    if (
        typeof event.type === "string" &&
        typeof event.traceId === "string" &&
        typeof event.data === "object" &&
        typeof event.timestamp === "string"
    ) {
        return event as unknown as TraceStreamEvent;
    }

    return null;
}

/**
 * Convert trace stream events to store-compatible format
 */
export function traceEventToStoreFormat(
    event: TraceStreamEvent
): {
    trace?: Partial<{
        id: string;
        name: string;
        status: "running" | "success" | "error";
        startTime: number;
        endTime?: number;
        duration?: number;
        metadata: Record<string, unknown>;
    }>;
    span?: Partial<{
        id: string;
        traceId: string;
        parentSpanId?: string;
        name: string;
        kind: "agent" | "llm" | "tool" | "internal";
        status: "running" | "success" | "error";
        startTime: number;
        endTime?: number;
        duration?: number;
        attributes: Record<string, unknown>;
        events: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
        error?: { message: string; stack?: string };
    }>;
} {
    const now = Date.now();

    switch (event.type) {
        case "trace_start": {
            const data = event.data as TraceStartData;
            return {
                trace: {
                    id: event.traceId,
                    name: data.name,
                    status: "running",
                    startTime: now,
                    metadata: data.metadata ?? {},
                },
            };
        }
        case "trace_end": {
            const data = event.data as TraceEndData;
            return {
                trace: {
                    id: event.traceId,
                    status: data.status,
                    endTime: now,
                    duration: data.duration,
                },
            };
        }
        case "span_start": {
            const data = event.data as SpanStartData;
            // Map mcp kind to internal for store compatibility
            const kind = data.kind === "mcp" ? "internal" : data.kind;
            return {
                span: {
                    id: data.spanId,
                    traceId: event.traceId,
                    parentSpanId: data.parentSpanId,
                    name: data.name,
                    kind,
                    status: "running",
                    startTime: now,
                    attributes: data.attributes ?? {},
                    events: [],
                },
            };
        }
        case "span_update": {
            const data = event.data as SpanUpdateData;
            return {
                span: {
                    id: data.spanId,
                    traceId: event.traceId,
                    attributes: data.attributes,
                    events: data.events,
                },
            };
        }
        case "span_end": {
            const data = event.data as SpanEndData;
            return {
                span: {
                    id: data.spanId,
                    traceId: event.traceId,
                    status: data.status,
                    endTime: now,
                    duration: data.duration,
                    error: data.error,
                },
            };
        }
        default:
            return {};
    }
}
