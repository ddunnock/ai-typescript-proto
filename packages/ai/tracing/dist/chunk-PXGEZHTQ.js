import { generateId } from '@repo/shared';

// src/tracer.ts
var AgentTracer = class {
  serviceName;
  enabled;
  activeSpans = /* @__PURE__ */ new Map();
  activeTraces = /* @__PURE__ */ new Map();
  completedTraces = [];
  exporters = [];
  spanStack = [];
  constructor(config) {
    this.serviceName = config.serviceName;
    this.enabled = config.enabled ?? true;
  }
  addExporter(exporter) {
    this.exporters.push(exporter);
  }
  startTrace(name, metadata) {
    if (!this.enabled) return "";
    const traceId = generateId("trace");
    const trace = {
      id: traceId,
      name,
      startTime: Date.now(),
      status: "running",
      spans: [],
      metadata
    };
    this.activeTraces.set(traceId, trace);
    return traceId;
  }
  endTrace(traceId, status) {
    if (!this.enabled) return void 0;
    const trace = this.activeTraces.get(traceId);
    if (!trace) return void 0;
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status ?? "success";
    this.activeTraces.delete(traceId);
    this.completedTraces.push(trace);
    this.exportSpans(trace.spans).catch(console.error);
    return trace;
  }
  startSpan(name, traceId, options) {
    if (!this.enabled) return "";
    const spanId = generateId("span");
    const parentSpanId = options?.parentSpanId ?? this.spanStack[this.spanStack.length - 1];
    const span = {
      id: spanId,
      traceId,
      parentSpanId,
      name,
      kind: options?.kind ?? "agent",
      status: "running",
      startTime: Date.now(),
      attributes: {
        "service.name": this.serviceName,
        ...options?.attributes
      },
      events: []
    };
    this.activeSpans.set(spanId, span);
    this.spanStack.push(spanId);
    const trace = this.activeTraces.get(traceId);
    if (trace) {
      trace.spans.push(span);
      if (!trace.rootSpan) {
        trace.rootSpan = span;
      }
    }
    return spanId;
  }
  endSpan(spanId, status, error) {
    if (!this.enabled) return void 0;
    const span = this.activeSpans.get(spanId);
    if (!span) return void 0;
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = error ? "error" : status ?? "success";
    if (error) {
      span.attributes["error.message"] = error.message;
      span.attributes["error.stack"] = error.stack;
      this.addSpanEvent(spanId, "exception", {
        "exception.message": error.message,
        "exception.type": error.name
      });
    }
    this.activeSpans.delete(spanId);
    const stackIndex = this.spanStack.indexOf(spanId);
    if (stackIndex !== -1) {
      this.spanStack.splice(stackIndex, 1);
    }
    return span;
  }
  addSpanEvent(spanId, name, attributes) {
    if (!this.enabled) return;
    const span = this.activeSpans.get(spanId);
    if (!span) return;
    const event = {
      name,
      timestamp: Date.now(),
      attributes
    };
    span.events.push(event);
  }
  setSpanAttribute(spanId, key, value) {
    if (!this.enabled) return;
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.attributes[key] = value;
    }
  }
  setSpanAttributes(spanId, attributes) {
    if (!this.enabled) return;
    const span = this.activeSpans.get(spanId);
    if (span) {
      Object.assign(span.attributes, attributes);
    }
  }
  // Convenience methods for specific span types
  startAgentSpan(agentName, agentType, traceId, parentSpanId) {
    return this.startSpan(`agent.${agentName}`, traceId, {
      kind: "agent",
      parentSpanId,
      attributes: {
        "agent.name": agentName,
        "agent.type": agentType
      }
    });
  }
  startLLMSpan(provider, model, operation, traceId, parentSpanId) {
    return this.startSpan(`llm.${operation}`, traceId, {
      kind: "llm",
      parentSpanId,
      attributes: {
        "llm.provider": provider,
        "llm.model": model,
        "llm.operation": operation
      }
    });
  }
  startToolSpan(toolName, args, traceId, parentSpanId) {
    return this.startSpan(`tool.${toolName}`, traceId, {
      kind: "tool",
      parentSpanId,
      attributes: {
        "tool.name": toolName,
        "tool.args": JSON.stringify(args)
      }
    });
  }
  startMCPSpan(serverName, operation, traceId, parentSpanId) {
    return this.startSpan(`mcp.${serverName}.${operation}`, traceId, {
      kind: "mcp",
      parentSpanId,
      attributes: {
        "mcp.server": serverName,
        "mcp.operation": operation
      }
    });
  }
  // Utility methods
  getActiveSpan(spanId) {
    return this.activeSpans.get(spanId);
  }
  getActiveTrace(traceId) {
    return this.activeTraces.get(traceId);
  }
  getCompletedTraces() {
    return [...this.completedTraces];
  }
  getCurrentSpanId() {
    return this.spanStack[this.spanStack.length - 1];
  }
  clearCompletedTraces() {
    this.completedTraces = [];
  }
  async exportSpans(spans) {
    if (spans.length === 0) return;
    await Promise.all(
      this.exporters.map(
        (exporter) => exporter.export(spans).catch((err) => {
          console.error("Failed to export spans:", err);
        })
      )
    );
  }
  async shutdown() {
    for (const spanId of this.activeSpans.keys()) {
      this.endSpan(spanId, "error", new Error("Tracer shutdown"));
    }
    for (const traceId of this.activeTraces.keys()) {
      this.endTrace(traceId, "error");
    }
    await Promise.all(
      this.exporters.map((exporter) => exporter.shutdown())
    );
  }
};
var globalTracer = null;
function initTracer(config) {
  globalTracer = new AgentTracer(config);
  return globalTracer;
}
function getTracer() {
  if (!globalTracer) {
    globalTracer = new AgentTracer({
      serviceName: "convergence-agents",
      enabled: true
    });
  }
  return globalTracer;
}
function resetTracer() {
  globalTracer = null;
}

export { AgentTracer, getTracer, initTracer, resetTracer };
//# sourceMappingURL=chunk-PXGEZHTQ.js.map
//# sourceMappingURL=chunk-PXGEZHTQ.js.map