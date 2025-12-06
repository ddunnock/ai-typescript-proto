import { type AgentConfig } from "@repo/shared";
import type { BaseProvider } from "@repo/providers";
import { BaseAgent } from "../base";

export class NotesAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>) {
        super(provider, {
            ...config,
            type: "notes",
            name: config?.name ?? "Notes Agent",
            description: config?.description ?? "Handles note-taking, retrieval, and knowledge linking",
        });
    }

    protected override getSystemPrompt(): string {
        return `You are an AI assistant specialized in note-taking and knowledge management.

Your capabilities include:
1. **Note Creation**: Help structure and organize new notes
2. **Note Retrieval**: Find relevant notes based on semantic similarity
3. **Knowledge Linking**: Suggest connections between notes
4. **Summarization**: Create summaries of note collections
5. **Tagging**: Suggest appropriate tags and categories
6. **Outline Generation**: Create structured outlines from ideas

When working with notes:
- Preserve the user's voice and style
- Suggest logical organization structures
- Identify related concepts and potential links
- Use clear, hierarchical formatting when appropriate

Available tools allow you to:
- Search notes semantically
- Find similar content across your knowledge base
- Generate embeddings for note content`;
    }

    async createNote(content: string, context?: string): Promise<{
        title: string;
        formattedContent: string;
        suggestedTags: string[];
        relatedTopics: string[];
    }> {
        const prompt = `Help structure this note content:

${content}
${context ? `\nContext: ${context}` : ""}

Respond in JSON format:
{
  "title": "suggested title",
  "formattedContent": "formatted markdown content",
  "suggestedTags": ["tag1", "tag2"],
  "relatedTopics": ["topic1", "topic2"]
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      title: "Untitled Note",
                      formattedContent: content,
                      suggestedTags: [],
                      relatedTopics: [],
                  };
        } catch {
            return {
                title: "Untitled Note",
                formattedContent: content,
                suggestedTags: [],
                relatedTopics: [],
            };
        }
    }

    async summarizeNotes(notes: string[]): Promise<string> {
        const prompt = `Summarize these notes into a cohesive overview:

${notes.map((n, i) => `--- Note ${i + 1} ---\n${n}`).join("\n\n")}

Provide:
1. Main themes across the notes
2. Key insights
3. Connections between notes
4. Areas that could use more development`;

        return this.process(prompt);
    }

    async suggestLinks(noteContent: string, availableNotes: string[]): Promise<Array<{
        noteIndex: number;
        relevance: string;
        suggestedLinkText: string;
    }>> {
        const prompt = `Find connections between this note and the available notes:

Current note:
${noteContent}

Available notes:
${availableNotes.map((n, i) => `[${i}]: ${n.substring(0, 200)}...`).join("\n")}

Respond in JSON format:
{
  "links": [
    { "noteIndex": 0, "relevance": "why these are related", "suggestedLinkText": "text for the link" }
  ]
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { links: [] };
            return parsed.links ?? [];
        } catch {
            return [];
        }
    }

    async generateOutline(topic: string, depth: number = 3): Promise<string> {
        const prompt = `Create a structured outline for the topic: "${topic}"

Requirements:
- Maximum depth: ${depth} levels
- Include key subtopics
- Use clear hierarchical formatting
- Add brief descriptions where helpful`;

        return this.process(prompt);
    }
}
