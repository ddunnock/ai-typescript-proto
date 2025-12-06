import { NextRequest, NextResponse } from "next/server";

export interface ProviderInfo {
    id: string;
    name: string;
    description: string;
    models: Array<{
        id: string;
        name: string;
        contextWindow: number;
        maxOutput: number;
    }>;
    configured: boolean;
    supportsStreaming: boolean;
    supportsTools: boolean;
}

// Provider definitions with their available models
const PROVIDERS: Record<string, Omit<ProviderInfo, "configured">> = {
    anthropic: {
        id: "anthropic",
        name: "Anthropic",
        description: "Claude models with strong reasoning and instruction-following capabilities",
        models: [
            { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextWindow: 200000, maxOutput: 8192 },
            { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextWindow: 200000, maxOutput: 8192 },
            { id: "claude-3-opus-20240229", name: "Claude 3 Opus", contextWindow: 200000, maxOutput: 4096 },
        ],
        supportsStreaming: true,
        supportsTools: true,
    },
    openai: {
        id: "openai",
        name: "OpenAI",
        description: "GPT models with broad capabilities and function calling",
        models: [
            { id: "gpt-4-turbo-preview", name: "GPT-4 Turbo", contextWindow: 128000, maxOutput: 4096 },
            { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxOutput: 16384 },
            { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000, maxOutput: 16384 },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", contextWindow: 16385, maxOutput: 4096 },
        ],
        supportsStreaming: true,
        supportsTools: true,
    },
    google: {
        id: "google",
        name: "Google AI",
        description: "Gemini models with multimodal capabilities",
        models: [
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 2000000, maxOutput: 8192 },
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1000000, maxOutput: 8192 },
            { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", contextWindow: 1000000, maxOutput: 8192 },
        ],
        supportsStreaming: true,
        supportsTools: true,
    },
    local: {
        id: "local",
        name: "Local (Ollama)",
        description: "Run models locally with Ollama",
        models: [
            { id: "llama3.2", name: "Llama 3.2", contextWindow: 128000, maxOutput: 4096 },
            { id: "llama3.2:1b", name: "Llama 3.2 1B", contextWindow: 128000, maxOutput: 4096 },
            { id: "llama3.1", name: "Llama 3.1", contextWindow: 128000, maxOutput: 4096 },
            { id: "mistral", name: "Mistral", contextWindow: 32768, maxOutput: 4096 },
            { id: "codellama", name: "Code Llama", contextWindow: 16384, maxOutput: 4096 },
        ],
        supportsStreaming: true,
        supportsTools: false,
    },
};

// Environment variable names for each provider
const ENV_KEYS: Record<string, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    google: "GOOGLE_AI_API_KEY",
    local: "OLLAMA_BASE_URL",
};

// GET /api/providers - List all providers with configuration status
export async function GET() {
    const providers: ProviderInfo[] = Object.entries(PROVIDERS).map(([id, info]) => ({
        ...info,
        configured: !!process.env[ENV_KEYS[id]],
    }));

    return NextResponse.json({ providers });
}

// POST /api/providers/test - Test a provider's API key
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey } = body;

        if (!provider) {
            return NextResponse.json(
                { error: "Missing required field: provider" },
                { status: 400 }
            );
        }

        if (!PROVIDERS[provider]) {
            return NextResponse.json(
                { error: `Unknown provider: ${provider}` },
                { status: 400 }
            );
        }

        // Use provided API key or fall back to environment variable
        const keyToTest = apiKey ?? process.env[ENV_KEYS[provider]];

        if (!keyToTest && provider !== "local") {
            return NextResponse.json(
                {
                    success: false,
                    error: `No API key available for ${provider}`,
                    configured: false,
                },
                { status: 200 }
            );
        }

        // Test the provider
        try {
            const result = await testProvider(provider, keyToTest);
            return NextResponse.json({
                success: result.success,
                message: result.message,
                configured: true,
            });
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : "Test failed",
                configured: false,
            });
        }

    } catch (error) {
        console.error("Provider test error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Test failed" },
            { status: 500 }
        );
    }
}

// Test provider connectivity
async function testProvider(
    provider: string,
    apiKey: string | undefined
): Promise<{ success: boolean; message: string }> {
    switch (provider) {
        case "anthropic": {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey ?? "",
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "claude-3-5-haiku-20241022",
                    max_tokens: 10,
                    messages: [{ role: "user", content: "Hi" }],
                }),
            });

            if (response.ok) {
                return { success: true, message: "Anthropic API key is valid" };
            }
            const error = await response.json();
            throw new Error(error.error?.message ?? "Invalid API key");
        }

        case "openai": {
            const response = await fetch("https://api.openai.com/v1/models", {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                },
            });

            if (response.ok) {
                return { success: true, message: "OpenAI API key is valid" };
            }
            const error = await response.json();
            throw new Error(error.error?.message ?? "Invalid API key");
        }

        case "google": {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            if (response.ok) {
                return { success: true, message: "Google AI API key is valid" };
            }
            const error = await response.json();
            throw new Error(error.error?.message ?? "Invalid API key");
        }

        case "local": {
            const baseUrl = apiKey ?? "http://localhost:11434";
            const response = await fetch(`${baseUrl}/api/tags`);

            if (response.ok) {
                return { success: true, message: "Ollama is running" };
            }
            throw new Error("Cannot connect to Ollama. Is it running?");
        }

        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
