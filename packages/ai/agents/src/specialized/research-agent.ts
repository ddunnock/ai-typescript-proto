import { type AgentConfig } from "@repo/shared";
import type { BaseProvider } from "@repo/providers";
import { BaseAgent } from "../base";

export class ResearchAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>) {
        super(provider, {
            ...config,
            type: "research",
            name: config?.name ?? "Research Agent",
            description: config?.description ?? "Handles research tasks, information gathering, and synthesis",
        });
    }

    protected override getSystemPrompt(): string {
        return `You are an AI research assistant specialized in gathering, analyzing, and synthesizing information.

Your capabilities include:
1. **Information Gathering**: Collect relevant information on topics
2. **Analysis**: Evaluate sources and identify key findings
3. **Synthesis**: Combine information from multiple sources
4. **Report Generation**: Create structured research reports
5. **Fact Verification**: Cross-reference claims across sources
6. **Gap Identification**: Find areas needing more research

When conducting research:
- Be thorough and systematic
- Cite sources and note confidence levels
- Distinguish facts from opinions
- Identify contradictions between sources
- Note limitations and areas of uncertainty

Available tools allow you to:
- Search your knowledge base semantically
- Find similar content and patterns
- Generate embeddings for research content`;
    }

    async research(topic: string, options?: {
        depth?: "quick" | "standard" | "comprehensive";
        focus?: string[];
    }): Promise<{
        summary: string;
        keyFindings: string[];
        sources: string[];
        furtherResearch: string[];
    }> {
        const depth = options?.depth ?? "standard";
        const focus = options?.focus?.join(", ") ?? "general overview";

        const prompt = `Research the topic: "${topic}"

Depth: ${depth}
Focus areas: ${focus}

Respond in JSON format:
{
  "summary": "comprehensive summary",
  "keyFindings": ["finding 1", "finding 2"],
  "sources": ["source 1", "source 2"],
  "furtherResearch": ["suggested area 1", "suggested area 2"]
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      summary: response,
                      keyFindings: [],
                      sources: [],
                      furtherResearch: [],
                  };
        } catch {
            return {
                summary: response,
                keyFindings: [],
                sources: [],
                furtherResearch: [],
            };
        }
    }

    async synthesize(sources: Array<{ title: string; content: string }>): Promise<{
        synthesis: string;
        agreements: string[];
        contradictions: string[];
        gaps: string[];
    }> {
        const prompt = `Synthesize these sources:

${sources.map((s, i) => `--- ${s.title} ---\n${s.content}`).join("\n\n")}

Respond in JSON format:
{
  "synthesis": "unified synthesis of all sources",
  "agreements": ["point sources agree on"],
  "contradictions": ["point sources disagree on"],
  "gaps": ["information that's missing"]
}`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      synthesis: response,
                      agreements: [],
                      contradictions: [],
                      gaps: [],
                  };
        } catch {
            return {
                synthesis: response,
                agreements: [],
                contradictions: [],
                gaps: [],
            };
        }
    }

    async generateReport(topic: string, findings: string[]): Promise<string> {
        const prompt = `Generate a research report on: "${topic}"

Key findings to include:
${findings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Create a well-structured report with:
1. Executive Summary
2. Introduction
3. Methodology
4. Findings
5. Analysis
6. Conclusions
7. Recommendations

Use clear headings and professional formatting.`;

        return this.process(prompt);
    }

    async verifyFact(claim: string, context?: string): Promise<{
        verdict: "supported" | "partially_supported" | "contradicted" | "unverifiable";
        confidence: number;
        explanation: string;
        evidence: string[];
    }> {
        const prompt = `Verify this claim:

Claim: ${claim}
${context ? `Context: ${context}` : ""}

Respond in JSON format:
{
  "verdict": "supported|partially_supported|contradicted|unverifiable",
  "confidence": 0.0-1.0,
  "explanation": "why this verdict",
  "evidence": ["supporting evidence 1", "supporting evidence 2"]
}

Be honest about uncertainty.`;

        const response = await this.process(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      verdict: "unverifiable" as const,
                      confidence: 0.5,
                      explanation: response,
                      evidence: [],
                  };
        } catch {
            return {
                verdict: "unverifiable",
                confidence: 0.5,
                explanation: response,
                evidence: [],
            };
        }
    }
}
