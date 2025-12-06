"use client";

import { useState } from "react";
import {
    Info,
    MessageSquare,
    MessageCircle,
    Brain,
    Code2,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
} from "lucide-react";
import type { TraceSpan } from "@/stores/trace-store";

type TabId = "info" | "prompt" | "response" | "thinking" | "raw";

interface Tab {
    id: TabId;
    label: string;
    icon: React.ElementType;
    show: (span: TraceSpan) => boolean;
}

const TABS: Tab[] = [
    {
        id: "info",
        label: "Info",
        icon: Info,
        show: () => true,
    },
    {
        id: "prompt",
        label: "Prompt",
        icon: MessageSquare,
        show: (span) => hasLLMContent(span, "prompt"),
    },
    {
        id: "response",
        label: "Response",
        icon: MessageCircle,
        show: (span) => hasLLMContent(span, "response"),
    },
    {
        id: "thinking",
        label: "Thinking",
        icon: Brain,
        show: (span) => hasLLMContent(span, "thinking") || span.events.length > 0,
    },
    {
        id: "raw",
        label: "Raw",
        icon: Code2,
        show: () => true,
    },
];

function hasLLMContent(span: TraceSpan, key: "prompt" | "response" | "thinking"): boolean {
    const attr = span.attributes[`llm.${key}`];
    return attr !== undefined && attr !== null && attr !== "";
}

interface ThinkingInspectorProps {
    span: TraceSpan;
}

export function ThinkingInspector({ span }: ThinkingInspectorProps) {
    const [activeTab, setActiveTab] = useState<TabId>("info");
    const [copied, setCopied] = useState(false);

    const visibleTabs = TABS.filter((tab) => tab.show(span));

    // Reset to info tab if current tab is not visible
    if (!visibleTabs.some((t) => t.id === activeTab)) {
        setActiveTab("info");
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${isActive
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "info" && <InfoTab span={span} />}
                {activeTab === "prompt" && (
                    <ContentTab
                        title="LLM Prompt"
                        content={span.attributes["llm.prompt"] as string | undefined}
                        onCopy={copyToClipboard}
                        copied={copied}
                    />
                )}
                {activeTab === "response" && (
                    <ContentTab
                        title="LLM Response"
                        content={span.attributes["llm.response"] as string | undefined}
                        onCopy={copyToClipboard}
                        copied={copied}
                    />
                )}
                {activeTab === "thinking" && <ThinkingTab span={span} />}
                {activeTab === "raw" && (
                    <RawTab span={span} onCopy={copyToClipboard} copied={copied} />
                )}
            </div>
        </div>
    );
}

function InfoTab({ span }: { span: TraceSpan }) {
    const duration = span.duration ?? (span.endTime ? span.endTime - span.startTime : undefined);
    const tokenInput = span.attributes["llm.tokens.input"] as number | undefined;
    const tokenOutput = span.attributes["llm.tokens.output"] as number | undefined;

    return (
        <div className="space-y-6">
            {/* Overview */}
            <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Overview
                </h3>
                <dl className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className="text-xs text-gray-500 dark:text-gray-400">Name</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white">
                            {span.name}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500 dark:text-gray-400">Kind</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {span.kind}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500 dark:text-gray-400">Status</dt>
                        <dd className={`text-sm font-medium ${span.status === "success" ? "text-green-600" :
                                span.status === "error" ? "text-red-600" :
                                    "text-yellow-600"
                            }`}>
                            {span.status}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500 dark:text-gray-400">Duration</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white">
                            {duration !== undefined ? `${duration}ms` : "Running..."}
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Token Usage */}
            {(tokenInput !== undefined || tokenOutput !== undefined) && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Token Usage
                    </h3>
                    <dl className="grid grid-cols-3 gap-4">
                        <div>
                            <dt className="text-xs text-gray-500 dark:text-gray-400">Input</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {tokenInput?.toLocaleString() ?? "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 dark:text-gray-400">Output</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {tokenOutput?.toLocaleString() ?? "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500 dark:text-gray-400">Total</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                {(tokenInput ?? 0) + (tokenOutput ?? 0)}
                            </dd>
                        </div>
                    </dl>
                </section>
            )}

            {/* Attributes */}
            {Object.keys(span.attributes).length > 0 && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Attributes
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                        {Object.entries(span.attributes)
                            .filter(([key]) => !key.startsWith("llm."))
                            .map(([key, value]) => (
                                <div key={key} className="flex justify-between items-start">
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                        {key}
                                    </span>
                                    <span className="text-xs font-mono text-gray-900 dark:text-white text-right max-w-[60%] break-all">
                                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </section>
            )}

            {/* Error */}
            {span.error && (
                <section>
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                        Error
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                            {span.error.message}
                        </p>
                        {span.error.stack && (
                            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-x-auto">
                                {span.error.stack}
                            </pre>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

function ContentTab({
    title,
    content,
    onCopy,
    copied,
}: {
    title: string;
    content: string | undefined;
    onCopy: (text: string) => void;
    copied: boolean;
}) {
    if (!content) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No {title.toLowerCase()} captured
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {title}
                </h3>
                <button
                    onClick={() => onCopy(content)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-green-500" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                    {content}
                </pre>
            </div>
        </div>
    );
}

function ThinkingTab({ span }: { span: TraceSpan }) {
    const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

    const thinkingContent = span.attributes["llm.thinking"] as string | undefined;
    const thinkingEvents = span.events.filter((e) => e.name === "thinking");

    const toggleEvent = (index: number) => {
        const newExpanded = new Set(expandedEvents);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedEvents(newExpanded);
    };

    return (
        <div className="space-y-6">
            {/* Chain of Thought Content */}
            {thinkingContent && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Chain of Thought
                    </h3>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <pre className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap">
                            {thinkingContent}
                        </pre>
                    </div>
                </section>
            )}

            {/* Thinking Events Timeline */}
            {thinkingEvents.length > 0 && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Thinking Steps ({thinkingEvents.length})
                    </h3>
                    <div className="space-y-2">
                        {thinkingEvents.map((event, index) => {
                            const isExpanded = expandedEvents.has(index);
                            const content = event.attributes?.content as string | undefined;
                            return (
                                <div
                                    key={index}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <button
                                        onClick={() => toggleEvent(index)}
                                        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        )}
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                            {content?.substring(0, 100) ?? "Thinking step"}
                                            {(content?.length ?? 0) > 100 && "..."}
                                        </span>
                                    </button>
                                    {isExpanded && content && (
                                        <div className="px-3 pb-3 pt-0">
                                            <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-600">
                                                <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                                    {content}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {!thinkingContent && thinkingEvents.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No thinking content captured for this span
                </div>
            )}
        </div>
    );
}

function RawTab({
    span,
    onCopy,
    copied,
}: {
    span: TraceSpan;
    onCopy: (text: string) => void;
    copied: boolean;
}) {
    const jsonContent = JSON.stringify(span, null, 2);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Raw Span Data
                </h3>
                <button
                    onClick={() => onCopy(jsonContent)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-green-500" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            Copy JSON
                        </>
                    )}
                </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                    {jsonContent}
                </pre>
            </div>
        </div>
    );
}
