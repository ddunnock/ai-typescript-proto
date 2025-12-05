import { getConfig, type ProviderType, ConfigError } from "@repo/shared";
import type { BaseProvider } from "./base";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { GoogleProvider } from "./google";
import { LocalProvider } from "./local";

export interface ProviderOptions {
    apiKey?: string;
    modelId?: string;
}

export class ProviderFactory {
    static create(type: ProviderType, options?: ProviderOptions): BaseProvider {
        switch (type) {
            case "anthropic":
                return new AnthropicProvider(options);
            case "openai":
                return new OpenAIProvider(options);
            case "google":
                return new GoogleProvider(options);
            case "local":
                return new LocalProvider(options);
            default:
                throw new ConfigError(`Unknown provider type: ${type}`, "defaultProvider");
        }
    }

    static createFromEnv(): BaseProvider {
        const config = getConfig();
        return this.create(config.defaultProvider);
    }

    static createAll(): Record<ProviderType, BaseProvider | null> {
        const config = getConfig();
        return {
            anthropic: config.anthropicApiKey ? new AnthropicProvider() : null,
            openai: config.openaiApiKey ? new OpenAIProvider() : null,
            google: config.googleApiKey ? new GoogleProvider() : null,
            local: new LocalProvider(),
        };
    }
}