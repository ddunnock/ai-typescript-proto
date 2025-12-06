// src/exporters.ts
var ConsoleExporter = class {
  prefix;
  constructor(prefix = "[TRACE]") {
    this.prefix = prefix;
  }
  async export(spans) {
    for (const span of spans) {
      const duration = span.duration ? `${span.duration}ms` : "running";
      const status = span.status === "error" ? "\u274C" : span.status === "success" ? "\u2705" : "\u23F3";
      console.log(
        `${this.prefix} ${status} ${span.name} [${span.kind}] - ${duration}`,
        span.attributes
      );
      if (span.events.length > 0) {
        for (const event of span.events) {
          console.log(`  \u2514\u2500 ${event.name}`, event.attributes);
        }
      }
    }
  }
  async shutdown() {
  }
};
var MemoryExporter = class {
  spans = [];
  maxSpans;
  constructor(maxSpans = 1e3) {
    this.maxSpans = maxSpans;
  }
  async export(spans) {
    this.spans.push(...spans);
    if (this.spans.length > this.maxSpans) {
      this.spans = this.spans.slice(-this.maxSpans);
    }
  }
  getSpans() {
    return [...this.spans];
  }
  getSpansByTraceId(traceId) {
    return this.spans.filter((s) => s.traceId === traceId);
  }
  getSpansByKind(kind) {
    return this.spans.filter((s) => s.kind === kind);
  }
  clear() {
    this.spans = [];
  }
  async shutdown() {
    this.clear();
  }
};
var WebSocketExporter = class {
  url;
  ws = null;
  buffer = [];
  maxBufferSize;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectDelay = 1e3;
  constructor(url, maxBufferSize = 100) {
    this.url = url;
    this.maxBufferSize = maxBufferSize;
  }
  async connect() {
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
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch(console.error);
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  flushBuffer() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    while (this.buffer.length > 0) {
      const span = this.buffer.shift();
      if (span) {
        this.ws.send(JSON.stringify({ type: "span", data: span }));
      }
    }
  }
  async export(spans) {
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
  async shutdown() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.buffer = [];
  }
};
var CallbackExporter = class {
  callback;
  constructor(callback) {
    this.callback = callback;
  }
  async export(spans) {
    await this.callback(spans);
  }
  async shutdown() {
  }
};

export { CallbackExporter, ConsoleExporter, MemoryExporter, WebSocketExporter };
//# sourceMappingURL=chunk-VQ67DVYZ.js.map
//# sourceMappingURL=chunk-VQ67DVYZ.js.map