import { BaseProvider } from './chunk-IIGHJ6CW.js';
import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
import { getConfig, ProviderError } from '@repo/shared';

var LocalProvider = class extends BaseProvider {
  type = "local";
  modelId;
  client;
  baseUrl;
  constructor(options) {
    super();
    const config = getConfig();
    this.baseUrl = options?.baseUrl ?? config.ollamaBaseUrl;
    this.client = createOllama({ baseURL: this.baseUrl });
    this.modelId = options?.modelId ?? config.ollamaModel;
  }
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.models?.map((m) => m.name) ?? [];
    } catch {
      return [];
    }
  }
  async generate(messages, options) {
    try {
      const result = await generateText({
        model: this.client(this.modelId),
        messages: this.formatMessages(messages),
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        stopSequences: options?.stopSequences
      });
      return {
        content: result.text,
        usage: result.usage ? {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens
        } : void 0,
        finishReason: result.finishReason
      };
    } catch (error) {
      const isConnectionError = error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed");
      if (isConnectionError) {
        throw new ProviderError(
          `Ollama is not running. Start it with: ollama serve`,
          "local",
          { error, baseUrl: this.baseUrl }
        );
      }
      throw new ProviderError(
        `Local generation failed: ${error.message}`,
        "local",
        { error }
      );
    }
  }
  async *stream(messages, options) {
    try {
      const result = await streamText({
        model: this.client(this.modelId),
        messages: this.formatMessages(messages),
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      });
      for await (const chunk of result.textStream) {
        options?.onToken?.(chunk);
        yield { content: chunk, done: false };
      }
      yield { content: "", done: true };
    } catch (error) {
      const isConnectionError = error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed");
      if (isConnectionError) {
        throw new ProviderError(
          `Ollama is not running. Start it with: ollama serve`,
          "local",
          { error, baseUrl: this.baseUrl }
        );
      }
      throw new ProviderError(
        `Local streaming failed: ${error.message}`,
        "local",
        { error }
      );
    }
  }
  async generateWithTools(messages, tools, options) {
    try {
      const aiTools = this.convertTools(tools);
      const result = await generateText({
        model: this.client(this.modelId),
        messages: this.formatMessages(messages),
        tools: aiTools,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      });
      return {
        content: result.text,
        toolCalls: result.toolCalls?.map((tc) => ({
          id: tc.toolCallId,
          name: tc.toolName,
          arguments: tc.args
        })),
        usage: result.usage ? {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens
        } : void 0,
        finishReason: result.finishReason
      };
    } catch (error) {
      const isConnectionError = error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed");
      if (isConnectionError) {
        throw new ProviderError(
          `Ollama is not running. Start it with: ollama serve`,
          "local",
          { error, baseUrl: this.baseUrl }
        );
      }
      throw new ProviderError(
        `Local tool generation failed: ${error.message}`,
        "local",
        { error }
      );
    }
  }
  formatMessages(messages) {
    return messages.map((m) => ({
      role: m.role === "tool" ? "assistant" : m.role,
      content: m.content
    }));
  }
  convertTools(tools) {
    const result = {};
    for (const t of tools) {
      result[t.name] = tool({
        description: t.description,
        parameters: z.object(t.inputSchema)
      });
    }
    return result;
  }
};

export { LocalProvider };
//# sourceMappingURL=chunk-6DMJN72X.js.map
//# sourceMappingURL=chunk-6DMJN72X.js.map