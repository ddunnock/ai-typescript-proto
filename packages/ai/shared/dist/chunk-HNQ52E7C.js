import { z } from 'zod';

// src/types.ts
var ProviderTypeSchema = z.enum([
  "anthropic",
  "openai",
  "google",
  "local"
]);
var MessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);
var MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
  toolCalls: z.array(z.any()).optional(),
  toolResults: z.array(z.any()).optional()
});
var AgentTypeSchema = z.enum([
  "email",
  "notes",
  "document",
  "research",
  "orchestrator"
]);
var AgentStatusSchema = z.enum([
  "idle",
  "thinking",
  "executing",
  "waiting",
  "error",
  "complete"
]);
var AgentTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()),
  priority: z.number().default(0),
  createdAt: z.date().default(() => /* @__PURE__ */ new Date()),
  metadata: z.record(z.any()).optional()
});
var AgentResultSchema = z.object({
  taskId: z.string(),
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  duration: z.number().optional(),
  completedAt: z.date().default(() => /* @__PURE__ */ new Date())
});
var AgentConfigSchema = z.object({
  type: AgentTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  mcpServers: z.array(z.string()).default([]),
  maxConcurrentTasks: z.number().default(5),
  timeout: z.number().default(3e4)
});
var MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any())
});
var MCPServerConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  tools: z.array(MCPToolSchema).default([])
});
var WorkflowStateSchema = z.object({
  messages: z.array(MessageSchema),
  context: z.record(z.any()),
  currentAgent: AgentTypeSchema.optional(),
  toolCalls: z.array(z.any()).default([]),
  toolResults: z.array(z.any()).default([]),
  error: z.string().optional(),
  completed: z.boolean().default(false)
});
var AgentEventTypeSchema = z.enum([
  "thinking",
  "tool_call",
  "tool_result",
  "response",
  "error",
  "complete"
]);
var AgentEventSchema = z.object({
  type: AgentEventTypeSchema,
  agentType: AgentTypeSchema.optional(),
  content: z.any(),
  timestamp: z.date().default(() => /* @__PURE__ */ new Date())
});

export { AgentConfigSchema, AgentEventSchema, AgentEventTypeSchema, AgentResultSchema, AgentStatusSchema, AgentTaskSchema, AgentTypeSchema, MCPServerConfigSchema, MCPToolSchema, MessageRoleSchema, MessageSchema, ProviderTypeSchema, WorkflowStateSchema };
//# sourceMappingURL=chunk-HNQ52E7C.js.map
//# sourceMappingURL=chunk-HNQ52E7C.js.map