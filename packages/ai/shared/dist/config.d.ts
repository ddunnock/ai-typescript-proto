import { z } from 'zod';

declare const ConfigSchema: z.ZodObject<{
    defaultProvider: z.ZodDefault<z.ZodEnum<["anthropic", "openai", "google", "local"]>>;
    anthropicApiKey: z.ZodOptional<z.ZodString>;
    openaiApiKey: z.ZodOptional<z.ZodString>;
    googleApiKey: z.ZodOptional<z.ZodString>;
    anthropicModel: z.ZodDefault<z.ZodString>;
    openaiModel: z.ZodDefault<z.ZodString>;
    googleModel: z.ZodDefault<z.ZodString>;
    ollamaBaseUrl: z.ZodDefault<z.ZodString>;
    ollamaModel: z.ZodDefault<z.ZodString>;
    mlServiceUrl: z.ZodDefault<z.ZodString>;
    mlServiceEnabled: z.ZodDefault<z.ZodBoolean>;
    mcpEnabled: z.ZodDefault<z.ZodBoolean>;
    agentTimeout: z.ZodDefault<z.ZodNumber>;
    isDevelopment: z.ZodDefault<z.ZodBoolean>;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    defaultProvider: "anthropic" | "openai" | "google" | "local";
    anthropicModel: string;
    openaiModel: string;
    googleModel: string;
    ollamaBaseUrl: string;
    ollamaModel: string;
    mlServiceUrl: string;
    mlServiceEnabled: boolean;
    mcpEnabled: boolean;
    agentTimeout: number;
    isDevelopment: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
    anthropicApiKey?: string | undefined;
    openaiApiKey?: string | undefined;
    googleApiKey?: string | undefined;
}, {
    defaultProvider?: "anthropic" | "openai" | "google" | "local" | undefined;
    anthropicApiKey?: string | undefined;
    openaiApiKey?: string | undefined;
    googleApiKey?: string | undefined;
    anthropicModel?: string | undefined;
    openaiModel?: string | undefined;
    googleModel?: string | undefined;
    ollamaBaseUrl?: string | undefined;
    ollamaModel?: string | undefined;
    mlServiceUrl?: string | undefined;
    mlServiceEnabled?: boolean | undefined;
    mcpEnabled?: boolean | undefined;
    agentTimeout?: number | undefined;
    isDevelopment?: boolean | undefined;
    logLevel?: "debug" | "info" | "warn" | "error" | undefined;
}>;
type Config = z.infer<typeof ConfigSchema>;
declare function getConfig(): Config;
declare function resetConfig(): void;

export { type Config, getConfig, resetConfig };
