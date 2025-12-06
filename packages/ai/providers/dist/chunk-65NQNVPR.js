import { AnthropicProvider } from './chunk-GATJQ7L3.js';
import { GoogleProvider } from './chunk-HOG5DHU6.js';
import { LocalProvider } from './chunk-6DMJN72X.js';
import { OpenAIProvider } from './chunk-IW4VUVDV.js';
import { ConfigError, getConfig } from '@repo/shared';

var ProviderFactory = class {
  static create(type, options) {
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
  static createFromEnv() {
    const config = getConfig();
    return this.create(config.defaultProvider);
  }
  static createAll() {
    const config = getConfig();
    return {
      anthropic: config.anthropicApiKey ? new AnthropicProvider() : null,
      openai: config.openaiApiKey ? new OpenAIProvider() : null,
      google: config.googleApiKey ? new GoogleProvider() : null,
      local: new LocalProvider()
    };
  }
};

export { ProviderFactory };
//# sourceMappingURL=chunk-65NQNVPR.js.map
//# sourceMappingURL=chunk-65NQNVPR.js.map