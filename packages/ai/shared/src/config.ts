import { z } from "zod";

const ConfigSchema = z.object({
    // Provider settings
    defaultProvider: z.enum(["anthropic", "openai", "google", "local"]).default("anthropic"),
    anthropicApiKey: z.string().optional(),
    openaiApiKey: z.string().optional(),
    googleApiKey: z.string().optional(),

    // Model defaults
    anthropicModel: z.string().default("claude-sonnet-4-20250514"),
    openaiModel: z.string().default("gpt-4-turbo"),
    googleModel: z.string().default("gemini-1.5-pro"),

    // ML Service
    mlServiceUrl: z.string().default("http://localhost:8100"),
    mlServiceEnabled: z.boolean().default(true),

    // MCP Configuration
    mcpEnabled: z.boolean().default(true),

    // Agent Configuration
    agentTimeout: z.number().default(30000),

    // Development
    isDevelopment: z.boolean().default(process.env.NODE_ENV !== "production"),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

let config: Config | null = null;

export function getConfig(): Config {
    if (config) return config;

    config = ConfigSchema.parse({
        defaultProvider: process.env.DEFAULT_PROVIDER,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        openaiApiKey: process.env.OPENAI_API_KEY,
        googleApiKey: process.env.GOOGLE_API_KEY,
        anthropicModel: process.env.ANTHROPIC_MODEL,
        openaiModel: process.env.OPENAI_MODEL,
        googleModel: process.env.GOOGLE_MODEL,
        mlServiceUrl: process.env.ML_SERVICE_URL,
        mlServiceEnabled: process.env.ML_SERVICE_ENABLED !== "false",
        mcpEnabled: process.env.MCP_ENABLED !== "false",
        agentTimeout: process.env.AGENT_TIMEOUT ? parseInt(process.env.AGENT_TIMEOUT) : undefined,
        isDevelopment: process.env.NODE_ENV !== "production",
        logLevel: process.env.LOG_LEVEL,
    });

    return config;
}

export function resetConfig(): void {
    config = null;
}