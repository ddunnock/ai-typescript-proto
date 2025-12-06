import { type AgentConfig } from "@repo/shared";
import type { BaseProvider } from "@repo/providers";
import { BaseAgent } from "../base";

export class DocumentAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>) {
        super(provider, {
            ...config,
            type: "document",
            name: config?.name ?? "Document Agent",
            description: config?.description ?? "Handles document Q&A, summarization, and analysis",
        });
    }

    protected override getSystemPrompt(): string {
        return `You are an AI assistant specialized in document analysis and question-answering.

Your capabilities include:
1. **Document Q&A**: Answer questions based on document content
2. **Summarization**: Create executive summaries of documents
3. **Key Point Extraction**: Identify main arguments and conclusions
4. **Comparison**: Compare and contrast multiple documents
5. **Citation**: Reference specific sections when answering
6. **Structure Analysis**: Understand document organization

When analyzing documents:
- Be precise and cite relevant sections
- Distinguish between what the document says vs. inference
- Acknowledge limitations in the available information
- Use direct quotes when appropriate

Available tools allow you to:
- Search document content semantically
- Find similar passages across documents
- Generate embeddings for document sections`;
    }

    async answerQuestion(document: string, question: string): Promise<{
        answer: string;
        confidence: "high" | "medium" | "low";
        relevantPassages: string[];
    }> {
        const prompt = `Answer this question based on the document:

Document:
${document}

Question: ${question}

Respond in JSON format:
{
  "answer": "your answer",
  "confidence": "high|medium|low",
  "relevantPassages": ["relevant quote 1", "relevant quote 2"]
}

If the answer cannot be found in the document, say so clearly.`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      answer: response,
                      confidence: "low" as const,
                      relevantPassages: [],
                  };
        } catch {
            return {
                answer: response,
                confidence: "low",
                relevantPassages: [],
            };
        }
    }

    async summarize(document: string, options?: {
        style?: "executive" | "detailed" | "bullet";
        maxLength?: number;
    }): Promise<string> {
        const style = options?.style ?? "executive";
        const maxLength = options?.maxLength ?? 500;

        const prompt = `Summarize this document in ${style} style (max ~${maxLength} words):

${document}

${style === "executive" ? "Focus on key decisions, conclusions, and action items." : ""}
${style === "bullet" ? "Use bullet points for key information." : ""}
${style === "detailed" ? "Include supporting details and context." : ""}`;

        return this.process(prompt);
    }

    async extractKeyPoints(document: string): Promise<Array<{
        point: string;
        importance: "critical" | "important" | "supporting";
        location?: string;
    }>> {
        const prompt = `Extract key points from this document:

${document}

Respond in JSON format:
{
  "keyPoints": [
    { "point": "key point text", "importance": "critical|important|supporting", "location": "section/page if identifiable" }
  ]
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { keyPoints: [] };
            return parsed.keyPoints ?? [];
        } catch {
            return [];
        }
    }

    async compare(documents: string[]): Promise<{
        similarities: string[];
        differences: string[];
        synthesis: string;
    }> {
        const prompt = `Compare these documents:

${documents.map((d, i) => `--- Document ${i + 1} ---\n${d}`).join("\n\n")}

Respond in JSON format:
{
  "similarities": ["common point 1", "common point 2"],
  "differences": ["difference 1", "difference 2"],
  "synthesis": "overall synthesis of the documents"
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      similarities: [],
                      differences: [],
                      synthesis: response,
                  };
        } catch {
            return {
                similarities: [],
                differences: [],
                synthesis: response,
            };
        }
    }
}
