import type { Message, AgentEvent, AgentEventType } from "./types";

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix = ""): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Create a message object
 */
export function createMessage(
    role: Message["role"],
    content: string,
    options?: Partial<Omit<Message, "role" | "content">>
): Message {
    return { role, content, ...options };
}

/**
 * Create an agent event
 */
export function createAgentEvent(
    type: AgentEventType,
    content: unknown,
    agentType?: string
): AgentEvent {
    return {
        type,
        content,
        agentType: agentType as AgentEvent["agentType"],
        timestamp: new Date(),
    };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries - 1) {
                await delay(baseDelay * Math.pow(2, attempt));
            }
        }
    }

    throw lastError;
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number, suffix = "..."): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}