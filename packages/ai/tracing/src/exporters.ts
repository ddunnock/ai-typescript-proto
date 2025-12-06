import type { TraceSpan, TraceExporter } from "./types";

/**
 * Console exporter - logs spans to console (for development)
 */
export class ConsoleExporter implements TraceExporter {
    private prefix: string;

    constructor(prefix: string = "[TRACE]") {
        this.prefix = prefix;
    }

    async export(spans: TraceSpan[]): Promise<void> {
        for (const span of spans) {
            const duration = span.duration ? `${span.duration}ms` : "running";
            const status = span.status === "error" ? "❌" : span.status === "success" ? "✅" : "⏳";

            console.log(
                `${this.prefix} ${status} ${span.name} [${span.kind}] - ${duration}`,
                span.attributes
            );

            if (span.events.length > 0) {
                for (const event of span.events) {
                    console.log(`  └─ ${event.name}`, event.attributes);
                }
            }
        }
    }

    async shutdown(): Promise<void> {
        // Nothing to clean up
    }
}

/**
 * Memory exporter - stores spans in memory (for testing/dev console)
 */
export class MemoryExporter implements TraceExporter {
    private spans: TraceSpan[] = [];
    private maxSpans: number;

    constructor(maxSpans: number = 1000) {
        this.maxSpans = maxSpans;
    }

    async export(spans: TraceSpan[]): Promise<void> {
        this.spans.push(...spans);

        // Trim if over limit
        if (this.spans.length > this.maxSpans) {
            this.spans = this.spans.slice(-this.maxSpans);
        }
    }

    getSpans(): TraceSpan[] {
        return [...this.spans];
    }

    getSpansByTraceId(traceId: string): TraceSpan[] {
        return this.spans.filter((s) => s.traceId === traceId);
    }

    getSpansByKind(kind: string): TraceSpan[] {
        return this.spans.filter((s) => s.kind === kind);
    }

    clear(): void {
        this.spans = [];
    }

    async shutdown(): Promise<void> {
        this.clear();
    }
}

/**
 * WebSocket exporter - sends spans to dev console in real-time
 */
export class WebSocketExporter implements TraceExporter {
    private url: string;
    private ws: WebSocket | null = null;
    private buffer: TraceSpan[] = [];
    private maxBufferSize: number;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;

    constructor(url: string, maxBufferSize: number = 100) {
        this.url = url;
        this.maxBufferSize = maxBufferSize;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.flushBuffer();
                    resolve();
                };

                this.ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    this.attemptReconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("Max reconnect attempts reached");
            return;
        }

        this.reconnectAttempts++;
        setTimeout(() => {
            this.connect().catch(console.error);
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    private flushBuffer(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        while (this.buffer.length > 0) {
            const span = this.buffer.shift();
            if (span) {
                this.ws.send(JSON.stringify({ type: "span", data: span }));
            }
        }
    }

    async export(spans: TraceSpan[]): Promise<void> {
        for (const span of spans) {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: "span", data: span }));
            } else {
                this.buffer.push(span);
                if (this.buffer.length > this.maxBufferSize) {
                    this.buffer.shift();
                }
            }
        }
    }

    async shutdown(): Promise<void> {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.buffer = [];
    }
}

/**
 * Callback exporter - calls a function with spans (for custom handling)
 */
export class CallbackExporter implements TraceExporter {
    private callback: (spans: TraceSpan[]) => void | Promise<void>;

    constructor(callback: (spans: TraceSpan[]) => void | Promise<void>) {
        this.callback = callback;
    }

    async export(spans: TraceSpan[]): Promise<void> {
        await this.callback(spans);
    }

    async shutdown(): Promise<void> {
        // Nothing to clean up
    }
}
