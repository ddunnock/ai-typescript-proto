import { z } from "zod";

// ============================================================================
// Provider Types
// ============================================================================

export const ProviderTypeSchema = z.enum([
    "anthropic",
    "openai",
    "google",
    "local",
]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const MessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
    role: MessageRoleSchema,
    content: z.string(),
    toolCalls: z.array(z.any()).optional(),
    toolResults: z.array(z.any()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

// ============================================================================
// Agent Types
// ============================================================================

export const AgentTypeSchema = z.enum([
    "email",
    "notes",
    "document",
    "research",
    "orchestrator",
]);
export type AgentType = z.infer<typeof AgentTypeSchema>;

export const AgentStatusSchema = z.enum([
    "idle",
    "thinking",
    "executing",
    "waiting",
    "error",
    "complete",
]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentTaskSchema = z.object({
    id: z.string(),
    type: z.string(),
    data: z.record(z.any()),
    priority: z.number().default(0),
    createdAt: z.date().default(() => new Date()),
    metadata: z.record(z.any()).optional(),
});
export type AgentTask = z.infer<typeof AgentTaskSchema>;

export const AgentResultSchema = z.object({
    taskId: z.string(),
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    duration: z.number().optional(),
    completedAt: z.date().default(() => new Date()),
});
export type AgentResult = z.infer<typeof AgentResultSchema>;

export const AgentConfigSchema = z.object({
    type: AgentTypeSchema,
    name: z.string(),
    description: z.string().optional(),
    mcpServers: z.array(z.string()).default([]),
    maxConcurrentTasks: z.number().default(5),
    timeout: z.number().default(30000),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ============================================================================
// MCP Types
// ============================================================================

export const MCPToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.record(z.any()),
});
export type MCPTool = z.infer<typeof MCPToolSchema>;

export const MCPServerConfigSchema = z.object({
    name: z.string(),
    version: z.string(),
    tools: z.array(MCPToolSchema).default([]),
});
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

// ============================================================================
// Workflow Types
// ============================================================================

export const WorkflowStateSchema = z.object({
    messages: z.array(MessageSchema),
    context: z.record(z.any()),
    currentAgent: AgentTypeSchema.optional(),
    toolCalls: z.array(z.any()).default([]),
    toolResults: z.array(z.any()).default([]),
    error: z.string().optional(),
    completed: z.boolean().default(false),
});
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

// ============================================================================
// Event Types (for streaming)
// ============================================================================

export const AgentEventTypeSchema = z.enum([
    "thinking",
    "tool_call",
    "tool_result",
    "response",
    "error",
    "complete",
]);
export type AgentEventType = z.infer<typeof AgentEventTypeSchema>;

export const AgentEventSchema = z.object({
    type: AgentEventTypeSchema,
    agentType: AgentTypeSchema.optional(),
    content: z.any(),
    timestamp: z.date().default(() => new Date()),
});
export type AgentEvent = z.infer<typeof AgentEventSchema>;