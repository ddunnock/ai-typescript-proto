"use client";

import { useTraceStore, Trace, TraceSpan } from "@/stores/trace-store";
import {
    Activity,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronRight,
    Trash2,
    Bot,
    Cpu,
    Wrench,
    Code2,
} from "lucide-react";
import { useState } from "react";

export default function TracesPage() {
    const {
        traces,
        selectedTraceId,
        selectedSpanId,
        setSelectedTrace,
        setSelectedSpan,
        clearTraces,
    } = useTraceStore();

    const selectedTrace = traces.find((t) => t.id === selectedTraceId);
    const selectedSpanData = selectedTrace?.spans.find((s) => s.id === selectedSpanId);

    return (
        <div className="flex h-full">
            {/* Trace List */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Traces
                        </h1>
                        {traces.length > 0 && (
                            <button
                                onClick={clearTraces}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Clear all traces"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {traces.length} trace{traces.length !== 1 ? "s" : ""} recorded
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {traces.length === 0 ? (
                        <EmptyTraceList />
                    ) : (
                        traces.map((trace) => (
                            <TraceListItem
                                key={trace.id}
                                trace={trace}
                                isSelected={trace.id === selectedTraceId}
                                onClick={() => setSelectedTrace(trace.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Trace Detail */}
            <div className="flex-1 flex bg-gray-50 dark:bg-gray-900">
                {selectedTrace ? (
                    <>
                        {/* Span Tree */}
                        <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="font-medium text-gray-900 dark:text-white">
                                    {selectedTrace.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedTrace.spans.length} spans
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                <SpanTree
                                    spans={selectedTrace.spans}
                                    selectedSpanId={selectedSpanId}
                                    onSelectSpan={setSelectedSpan}
                                />
                            </div>
                        </div>

                        {/* Span Detail */}
                        <div className="flex-1 overflow-y-auto">
                            {selectedSpanData ? (
                                <SpanDetail span={selectedSpanData} />
                            ) : (
                                <EmptySpanDetail />
                            )}
                        </div>
                    </>
                ) : (
                    <EmptyTraceDetail />
                )}
            </div>
        </div>
    );
}

function EmptyTraceList() {
    return (
        <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
                No traces recorded yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start chatting with an agent to see traces
            </p>
        </div>
    );
}

function TraceListItem({
    trace,
    isSelected,
    onClick,
}: {
    trace: Trace;
    isSelected: boolean;
    onClick: () => void;
}) {
    const statusIcons = {
        running: <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />,
        success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        error: <XCircle className="h-4 w-4 text-red-500" />,
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
        >
            {statusIcons[trace.status]}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                    {trace.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{trace.spans.length} spans</span>
                    {trace.duration && (
                        <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {trace.duration}ms
                            </span>
                        </>
                    )}
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>
    );
}

function SpanTree({
    spans,
    selectedSpanId,
    onSelectSpan,
    parentSpanId,
    depth = 0,
}: {
    spans: TraceSpan[];
    selectedSpanId: string | null;
    onSelectSpan: (id: string) => void;
    parentSpanId?: string;
    depth?: number;
}) {
    const childSpans = spans.filter((s) => s.parentSpanId === parentSpanId);

    if (childSpans.length === 0) return null;

    return (
        <div className={depth > 0 ? "ml-4 border-l border-gray-200 dark:border-gray-700 pl-2" : ""}>
            {childSpans.map((span) => (
                <div key={span.id}>
                    <SpanTreeItem
                        span={span}
                        isSelected={span.id === selectedSpanId}
                        onClick={() => onSelectSpan(span.id)}
                    />
                    <SpanTree
                        spans={spans}
                        selectedSpanId={selectedSpanId}
                        onSelectSpan={onSelectSpan}
                        parentSpanId={span.id}
                        depth={depth + 1}
                    />
                </div>
            ))}
        </div>
    );
}

function SpanTreeItem({
    span,
    isSelected,
    onClick,
}: {
    span: TraceSpan;
    isSelected: boolean;
    onClick: () => void;
}) {
    const kindIcons = {
        agent: <Bot className="h-4 w-4 text-purple-500" />,
        llm: <Cpu className="h-4 w-4 text-blue-500" />,
        tool: <Wrench className="h-4 w-4 text-orange-500" />,
        internal: <Code2 className="h-4 w-4 text-gray-500" />,
    };

    const statusColors = {
        running: "text-yellow-600 dark:text-yellow-400",
        success: "text-green-600 dark:text-green-400",
        error: "text-red-600 dark:text-red-400",
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                isSelected
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
        >
            {kindIcons[span.kind]}
            <span className="flex-1 truncate text-gray-900 dark:text-white">
                {span.name}
            </span>
            {span.duration && (
                <span className={`text-xs ${statusColors[span.status]}`}>
                    {span.duration}ms
                </span>
            )}
        </button>
    );
}

function SpanDetail({ span }: { span: TraceSpan }) {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <StatusBadge status={span.status} />
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {span.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {span.kind} span
                    </p>
                </div>
            </div>

            {/* Timing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Timing
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Start</p>
                        <p className="font-mono text-gray-900 dark:text-white">
                            {new Date(span.startTime).toISOString()}
                        </p>
                    </div>
                    {span.endTime && (
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">End</p>
                            <p className="font-mono text-gray-900 dark:text-white">
                                {new Date(span.endTime).toISOString()}
                            </p>
                        </div>
                    )}
                    {span.duration && (
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Duration</p>
                            <p className="font-mono text-gray-900 dark:text-white">
                                {span.duration}ms
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Attributes */}
            {Object.keys(span.attributes).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Attributes
                    </h3>
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">
                            {JSON.stringify(span.attributes, null, 2)}
                        </code>
                    </pre>
                </div>
            )}

            {/* Events */}
            {span.events.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Events ({span.events.length})
                    </h3>
                    <div className="space-y-2">
                        {span.events.map((event, i) => (
                            <div
                                key={i}
                                className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {event.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(event.timestamp).toISOString()}
                                    </span>
                                </div>
                                {event.attributes && (
                                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                                        {JSON.stringify(event.attributes, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {span.error && (
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Error
                    </h3>
                    <p className="text-red-700 dark:text-red-300">{span.error.message}</p>
                    {span.error.stack && (
                        <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-x-auto">
                            {span.error.stack}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: TraceSpan["status"] }) {
    const configs = {
        running: {
            icon: <Loader2 className="h-4 w-4 animate-spin" />,
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        },
        success: {
            icon: <CheckCircle2 className="h-4 w-4" />,
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        },
        error: {
            icon: <XCircle className="h-4 w-4" />,
            className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        },
    };

    const config = configs[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${config.className}`}
        >
            {config.icon}
            {status}
        </span>
    );
}

function EmptyTraceDetail() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a trace
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a trace from the list to view its spans
                </p>
            </div>
        </div>
    );
}

function EmptySpanDetail() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a span
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a span from the tree to view its details
                </p>
            </div>
        </div>
    );
}
