import { z } from 'zod';

declare const ProviderTypeSchema: z.ZodEnum<["anthropic", "openai", "google", "local"]>;
type ProviderType = z.infer<typeof ProviderTypeSchema>;
declare const MessageRoleSchema: z.ZodEnum<["system", "user", "assistant", "tool"]>;
type MessageRole = z.infer<typeof MessageRoleSchema>;
declare const MessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant", "tool"]>;
    content: z.ZodString;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    toolResults: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCalls?: any[] | undefined;
    toolResults?: any[] | undefined;
}, {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCalls?: any[] | undefined;
    toolResults?: any[] | undefined;
}>;
type Message = z.infer<typeof MessageSchema>;
declare const AgentTypeSchema: z.ZodEnum<["email", "notes", "document", "research", "orchestrator"]>;
type AgentType = z.infer<typeof AgentTypeSchema>;
declare const AgentStatusSchema: z.ZodEnum<["idle", "thinking", "executing", "waiting", "error", "complete"]>;
type AgentStatus = z.infer<typeof AgentStatusSchema>;
declare const AgentTaskSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    priority: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDefault<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    data: Record<string, any>;
    priority: number;
    createdAt: Date;
    metadata?: Record<string, any> | undefined;
}, {
    type: string;
    id: string;
    data: Record<string, any>;
    priority?: number | undefined;
    createdAt?: Date | undefined;
    metadata?: Record<string, any> | undefined;
}>;
type AgentTask = z.infer<typeof AgentTaskSchema>;
declare const AgentResultSchema: z.ZodObject<{
    taskId: z.ZodString;
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    completedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    success: boolean;
    completedAt: Date;
    error?: string | undefined;
    data?: any;
    duration?: number | undefined;
}, {
    taskId: string;
    success: boolean;
    error?: string | undefined;
    data?: any;
    duration?: number | undefined;
    completedAt?: Date | undefined;
}>;
type AgentResult = z.infer<typeof AgentResultSchema>;
declare const AgentConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["email", "notes", "document", "research", "orchestrator"]>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    mcpServers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    maxConcurrentTasks: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    type: "email" | "notes" | "document" | "research" | "orchestrator";
    name: string;
    mcpServers: string[];
    maxConcurrentTasks: number;
    description?: string | undefined;
}, {
    type: "email" | "notes" | "document" | "research" | "orchestrator";
    name: string;
    timeout?: number | undefined;
    description?: string | undefined;
    mcpServers?: string[] | undefined;
    maxConcurrentTasks?: number | undefined;
}>;
type AgentConfig = z.infer<typeof AgentConfigSchema>;
declare const MCPToolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}, {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}>;
type MCPTool = z.infer<typeof MCPToolSchema>;
declare const MCPServerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    tools: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        inputSchema: Record<string, any>;
    }, {
        name: string;
        description: string;
        inputSchema: Record<string, any>;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    tools: {
        name: string;
        description: string;
        inputSchema: Record<string, any>;
    }[];
}, {
    name: string;
    version: string;
    tools?: {
        name: string;
        description: string;
        inputSchema: Record<string, any>;
    }[] | undefined;
}>;
type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
declare const WorkflowStateSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant", "tool"]>;
        content: z.ZodString;
        toolCalls: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        toolResults: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        toolCalls?: any[] | undefined;
        toolResults?: any[] | undefined;
    }, {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        toolCalls?: any[] | undefined;
        toolResults?: any[] | undefined;
    }>, "many">;
    context: z.ZodRecord<z.ZodString, z.ZodAny>;
    currentAgent: z.ZodOptional<z.ZodEnum<["email", "notes", "document", "research", "orchestrator"]>>;
    toolCalls: z.ZodDefault<z.ZodArray<z.ZodAny, "many">>;
    toolResults: z.ZodDefault<z.ZodArray<z.ZodAny, "many">>;
    error: z.ZodOptional<z.ZodString>;
    completed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    toolCalls: any[];
    toolResults: any[];
    messages: {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        toolCalls?: any[] | undefined;
        toolResults?: any[] | undefined;
    }[];
    context: Record<string, any>;
    completed: boolean;
    error?: string | undefined;
    currentAgent?: "email" | "notes" | "document" | "research" | "orchestrator" | undefined;
}, {
    messages: {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        toolCalls?: any[] | undefined;
        toolResults?: any[] | undefined;
    }[];
    context: Record<string, any>;
    toolCalls?: any[] | undefined;
    toolResults?: any[] | undefined;
    error?: string | undefined;
    currentAgent?: "email" | "notes" | "document" | "research" | "orchestrator" | undefined;
    completed?: boolean | undefined;
}>;
type WorkflowState = z.infer<typeof WorkflowStateSchema>;
declare const AgentEventTypeSchema: z.ZodEnum<["thinking", "tool_call", "tool_result", "response", "error", "complete"]>;
type AgentEventType = z.infer<typeof AgentEventTypeSchema>;
declare const AgentEventSchema: z.ZodObject<{
    type: z.ZodEnum<["thinking", "tool_call", "tool_result", "response", "error", "complete"]>;
    agentType: z.ZodOptional<z.ZodEnum<["email", "notes", "document", "research", "orchestrator"]>>;
    content: z.ZodAny;
    timestamp: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type: "thinking" | "error" | "complete" | "tool_call" | "tool_result" | "response";
    timestamp: Date;
    agentType?: "email" | "notes" | "document" | "research" | "orchestrator" | undefined;
    content?: any;
}, {
    type: "thinking" | "error" | "complete" | "tool_call" | "tool_result" | "response";
    agentType?: "email" | "notes" | "document" | "research" | "orchestrator" | undefined;
    content?: any;
    timestamp?: Date | undefined;
}>;
type AgentEvent = z.infer<typeof AgentEventSchema>;

export { type AgentConfig, AgentConfigSchema, type AgentEvent, AgentEventSchema, type AgentEventType, AgentEventTypeSchema, type AgentResult, AgentResultSchema, type AgentStatus, AgentStatusSchema, type AgentTask, AgentTaskSchema, type AgentType, AgentTypeSchema, type MCPServerConfig, MCPServerConfigSchema, type MCPTool, MCPToolSchema, type Message, type MessageRole, MessageRoleSchema, MessageSchema, type ProviderType, ProviderTypeSchema, type WorkflowState, WorkflowStateSchema };
