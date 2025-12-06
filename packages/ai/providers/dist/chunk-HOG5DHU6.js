import { BaseProvider } from './chunk-IIGHJ6CW.js';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
import { getConfig, ProviderError } from '@repo/shared';

var GoogleProvider = class extends BaseProvider {
  type = "google";
  modelId;
  client;
  constructor(options) {
    super();
    const config = getConfig();
    const apiKey = options?.apiKey ?? config.googleApiKey;
    if (!apiKey) {
      throw new ProviderError("Missing Google API key", "google");
    }
    this.client = createGoogleGenerativeAI({ apiKey });
    this.modelId = options?.modelId ?? config.googleModel;
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
      throw new ProviderError(
        `Google generation failed: ${error.message}`,
        "google",
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
      throw new ProviderError(
        `Google streaming failed: ${error.message}`,
        "google",
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
      throw new ProviderError(
        `Google tool generation failed: ${error.message}`,
        "google",
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

export { GoogleProvider };
//# sourceMappingURL=chunk-HOG5DHU6.js.map
//# sourceMappingURL=chunk-HOG5DHU6.js.map