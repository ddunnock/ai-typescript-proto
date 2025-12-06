import { Message, AgentEventType, AgentEvent } from './types.js';
import 'zod';

/**
 * Generate a unique ID with optional prefix
 */
declare function generateId(prefix?: string): string;
/**
 * Create a message object
 */
declare function createMessage(role: Message["role"], content: string, options?: Partial<Omit<Message, "role" | "content">>): Message;
/**
 * Create an agent event
 */
declare function createAgentEvent(type: AgentEventType, content: unknown, agentType?: string): AgentEvent;
/**
 * Safe JSON parse with fallback
 */
declare function safeJsonParse<T>(json: string, fallback: T): T;
/**
 * Delay execution
 */
declare function delay(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    baseDelay?: number;
}): Promise<T>;
/**
 * Truncate text to specified length
 */
declare function truncate(text: string, maxLength: number, suffix?: string): string;

export { createAgentEvent, createMessage, delay, generateId, retry, safeJsonParse, truncate };
