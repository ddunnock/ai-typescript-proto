import { TraceExporter, TraceSpan } from './types.js';
import '@repo/shared';

/**
 * Console exporter - logs spans to console (for development)
 */
declare class ConsoleExporter implements TraceExporter {
    private prefix;
    constructor(prefix?: string);
    export(spans: TraceSpan[]): Promise<void>;
    shutdown(): Promise<void>;
}
/**
 * Memory exporter - stores spans in memory (for testing/dev console)
 */
declare class MemoryExporter implements TraceExporter {
    private spans;
    private maxSpans;
    constructor(maxSpans?: number);
    export(spans: TraceSpan[]): Promise<void>;
    getSpans(): TraceSpan[];
    getSpansByTraceId(traceId: string): TraceSpan[];
    getSpansByKind(kind: string): TraceSpan[];
    clear(): void;
    shutdown(): Promise<void>;
}
/**
 * WebSocket exporter - sends spans to dev console in real-time
 */
declare class WebSocketExporter implements TraceExporter {
    private url;
    private ws;
    private buffer;
    private maxBufferSize;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(url: string, maxBufferSize?: number);
    connect(): Promise<void>;
    private attemptReconnect;
    private flushBuffer;
    export(spans: TraceSpan[]): Promise<void>;
    shutdown(): Promise<void>;
}
/**
 * Callback exporter - calls a function with spans (for custom handling)
 */
declare class CallbackExporter implements TraceExporter {
    private callback;
    constructor(callback: (spans: TraceSpan[]) => void | Promise<void>);
    export(spans: TraceSpan[]): Promise<void>;
    shutdown(): Promise<void>;
}

export { CallbackExporter, ConsoleExporter, MemoryExporter, WebSocketExporter };
