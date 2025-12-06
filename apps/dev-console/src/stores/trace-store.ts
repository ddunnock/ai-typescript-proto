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
    setSelectedTrace: (id: string | null) => void;
    setSelectedSpan: (id: string | null) => void;
    addTrace: (trace: Trace) => void;
    updateTrace: (id: string, updates: Partial<Trace>) => void;
    addSpan: (traceId: string, span: TraceSpan) => void;
    updateSpan: (traceId: string, spanId: string, updates: Partial<TraceSpan>) => void;
    clearTraces: () => void;
    getTrace: (id: string) => Trace | undefined;
    getSpan: (traceId: string, spanId: string) => TraceSpan | undefined;
}

export const useTraceStore = create<TraceStore>((set, get) => ({
    traces: [],
    selectedTraceId: null,
    selectedSpanId: null,

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

    clearTraces: () => set({ traces: [], selectedTraceId: null, selectedSpanId: null }),

    getTrace: (id) => get().traces.find((trace) => trace.id === id),

    getSpan: (traceId, spanId) => {
        const trace = get().traces.find((t) => t.id === traceId);
        return trace?.spans.find((s) => s.id === spanId);
    },
}));
