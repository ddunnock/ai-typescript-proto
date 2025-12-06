import { type AgentConfig, createMessage, type Message } from "@repo/shared";
import type { BaseProvider } from "@repo/providers";
import { BaseAgent } from "../base";
import type { AgentState } from "../state";

export class EmailAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>) {
        super(provider, {
            ...config,
            type: "email",
            name: config?.name ?? "Email Agent",
            description: config?.description ?? "Handles email categorization, summarization, and response drafting",
        });
    }

    protected override getSystemPrompt(): string {
        return `You are an AI assistant specialized in email management.

Your capabilities include:
1. **Categorization**: Classify emails by type (work, personal, newsletter, promotional, urgent, etc.)
2. **Summarization**: Create concise summaries of email threads
3. **Response Drafting**: Help compose professional email responses
4. **Priority Assessment**: Identify urgent or important emails
5. **Action Extraction**: Identify action items and deadlines from emails

When analyzing emails:
- Be concise but thorough
- Maintain professional tone
- Identify key information: sender, subject, urgency, required actions
- For response drafts, match the formality level of the original

Available tools allow you to:
- Search for related emails semantically
- Find similar correspondence patterns
- Generate embeddings for email content`;
    }

    async categorize(emailContent: string): Promise<{
        category: string;
        confidence: number;
        labels: string[];
    }> {
        const prompt = `Categorize this email and provide labels.

Email:
${emailContent}

Respond in JSON format:
{
  "category": "primary category",
  "confidence": 0.0-1.0,
  "labels": ["label1", "label2"]
}

Categories: work, personal, newsletter, promotional, transactional, social, urgent, spam`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : { category: "unknown", confidence: 0.5, labels: [] };
        } catch {
            return { category: "unknown", confidence: 0.5, labels: [] };
        }
    }

    async summarize(emailThread: string): Promise<string> {
        const prompt = `Summarize this email thread concisely:

${emailThread}

Provide:
1. Main topic/purpose
2. Key points discussed
3. Any decisions made
4. Outstanding action items`;

        return this.process(prompt);
    }

    async draftResponse(originalEmail: string, intent: string): Promise<string> {
        const prompt = `Draft a response to this email.

Original email:
${originalEmail}

User's intent: ${intent}

Write a professional response that:
1. Addresses all points in the original email
2. Matches the formality level
3. Is clear and concise`;

        return this.process(prompt);
    }

    async extractActions(emailContent: string): Promise<Array<{
        action: string;
        deadline?: string;
        priority: "high" | "medium" | "low";
    }>> {
        const prompt = `Extract action items from this email:

${emailContent}

Respond in JSON format:
{
  "actions": [
    { "action": "description", "deadline": "date or null", "priority": "high|medium|low" }
  ]
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { actions: [] };
            return parsed.actions ?? [];
        } catch {
            return [];
        }
    }
}
