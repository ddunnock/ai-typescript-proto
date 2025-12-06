import { create } from "zustand";

export interface TraceSpan {
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
    events: SpanEvent[];
    error?: {
        message: string;
        stack?: string;
    };
}

export interface SpanEvent {
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
}

export interface Trace {
    id: string;
    name: string;
    status: "running" | "success" | "error";
    startTime: number;
    endTime?: number;
    duration?: number;
    spans: TraceSpan[];
    metadata: Record<string, unknown>;
}

interface TraceStore {
    traces: Trace[];
    selectedTraceId: string | null;
    selectedSpanId: string | null;
    liveTraceId: string | null; // Currently streaming trace
    setSelectedTrace: (id: string | null) => void;
    setSelectedSpan: (id: string | null) => void;
    addTrace: (trace: Trace) => void;
    updateTrace: (id: string, updates: Partial<Trace>) => void;
    addSpan: (traceId: string, span: TraceSpan) => void;
    updateSpan: (traceId: string, spanId: string, updates: Partial<TraceSpan>) => void;
    clearTraces: () => void;
    getTrace: (id: string) => Trace | undefined;
    getSpan: (traceId: string, spanId: string) => TraceSpan | undefined;
    // Live trace methods
    startLiveTrace: (traceId: string, name: string, metadata?: Record<string, unknown>) => void;
    endLiveTrace: (traceId: string, status: "success" | "error") => void;
    upsertSpan: (traceId: string, span: Partial<TraceSpan> & { id: string }) => void;
    appendSpanEvent: (traceId: string, spanId: string, event: SpanEvent) => void;
    getLiveTrace: () => Trace | undefined;
}

export const useTraceStore = create<TraceStore>((set, get) => ({
    traces: [],
    selectedTraceId: null,
    selectedSpanId: null,
    liveTraceId: null,

    setSelectedTrace: (id) => set({ selectedTraceId: id, selectedSpanId: null }),

    setSelectedSpan: (id) => set({ selectedSpanId: id }),

    addTrace: (trace) =>
        set((state) => ({
            traces: [...state.traces, trace],
        })),

    updateTrace: (id, updates) =>
        set((state) => ({
            traces: state.traces.map((trace) =>
                trace.id === id ? { ...trace, ...updates } : trace
            ),
        })),

    addSpan: (traceId, span) =>
        set((state) => ({
            traces: state.traces.map((trace) =>
                trace.id === traceId
                    ? { ...trace, spans: [...trace.spans, span] }
                    : trace
            ),
        })),

    updateSpan: (traceId, spanId, updates) =>
        set((state) => ({
            traces: state.traces.map((trace) =>
                trace.id === traceId
                    ? {
                        ...trace,
                        spans: trace.spans.map((span) =>
                            span.id === spanId ? { ...span, ...updates } : span
                        ),
                    }
                    : trace
            ),
        })),

    clearTraces: () => set({ traces: [], selectedTraceId: null, selectedSpanId: null, liveTraceId: null }),

    getTrace: (id) => get().traces.find((trace) => trace.id === id),

    getSpan: (traceId, spanId) => {
        const trace = get().traces.find((t) => t.id === traceId);
        return trace?.spans.find((s) => s.id === spanId);
    },

    // Live trace methods
    startLiveTrace: (traceId, name, metadata) => {
        const newTrace: Trace = {
            id: traceId,
            name,
            status: "running",
            startTime: Date.now(),
            spans: [],
            metadata: metadata ?? {},
        };
        set((state) => ({
            traces: [...state.traces, newTrace],
            liveTraceId: traceId,
            selectedTraceId: traceId, // Auto-select the live trace
        }));
    },

    endLiveTrace: (traceId, status) => {
        set((state) => ({
            traces: state.traces.map((trace) =>
                trace.id === traceId
                    ? {
                        ...trace,
                        status,
                        endTime: Date.now(),
                        duration: Date.now() - trace.startTime,
                    }
                    : trace
            ),
            liveTraceId: state.liveTraceId === traceId ? null : state.liveTraceId,
        }));
    },

    upsertSpan: (traceId, span) => {
        set((state) => ({
            traces: state.traces.map((trace) => {
                if (trace.id !== traceId) return trace;

                const existingSpanIndex = trace.spans.findIndex((s) => s.id === span.id);

                if (existingSpanIndex >= 0) {
                    // Update existing span
                    const updatedSpans = [...trace.spans];
                    const existingSpan = updatedSpans[existingSpanIndex]!;
                    updatedSpans[existingSpanIndex] = {
                        ...existingSpan,
                        ...span,
                        // Merge attributes
                        attributes: { ...existingSpan.attributes, ...span.attributes },
                        // Merge events (append new ones)
                        events: span.events
                            ? [...existingSpan.events, ...span.events.filter(
                                (e) => !existingSpan.events.some((ex) => ex.timestamp === e.timestamp && ex.name === e.name)
                            )]
                            : existingSpan.events,
                    };
                    return { ...trace, spans: updatedSpans };
                } else {
                    // Add new span with defaults
                    const newSpan: TraceSpan = {
                        id: span.id,
                        traceId,
                        parentSpanId: span.parentSpanId,
                        name: span.name ?? "Unknown",
                        kind: span.kind ?? "internal",
                        status: span.status ?? "running",
                        startTime: span.startTime ?? Date.now(),
                        endTime: span.endTime,
                        duration: span.duration,
                        attributes: span.attributes ?? {},
                        events: span.events ?? [],
                        error: span.error,
                    };
                    return { ...trace, spans: [...trace.spans, newSpan] };
                }
            }),
        }));
    },

    appendSpanEvent: (traceId, spanId, event) => {
        set((state) => ({
            traces: state.traces.map((trace) =>
                trace.id === traceId
                    ? {
                        ...trace,
                        spans: trace.spans.map((span) =>
                            span.id === spanId
                                ? { ...span, events: [...span.events, event] }
                                : span
                        ),
                    }
                    : trace
            ),
        }));
    },

    getLiveTrace: () => {
        const { traces, liveTraceId } = get();
        return liveTraceId ? traces.find((t) => t.id === liveTraceId) : undefined;
    },
}));
