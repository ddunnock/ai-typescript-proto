import { BaseAgent } from '../base.js';
import { AgentState } from '../state.js';
import { AgentConfig, AgentEvent } from '@repo/shared';
import { BaseProvider } from '@repo/providers';
import '@langchain/langgraph';

declare class OrchestratorAgent extends BaseAgent {
    private subAgents;
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>);
    registerSubAgent(name: string, description: string, agent: BaseAgent): void;
    unregisterSubAgent(name: string): void;
    protected buildGraph(): any;
    protected analyzeNode(state: AgentState): Promise<Partial<AgentState>>;
    protected delegateNode(state: AgentState): Promise<Partial<AgentState>>;
    protected synthesizeNode(state: AgentState): Promise<Partial<AgentState>>;
    protected routeFromAnalyze(state: AgentState): "delegate" | "synthesize";
    protected getSystemPrompt(): string;
    streamProcess(query: string): AsyncIterable<AgentEvent>;
    get registeredAgents(): string[];
}

declare class EmailAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>);
    protected getSystemPrompt(): string;
    categorize(emailContent: string): Promise<{
        category: string;
        confidence: number;
        labels: string[];
    }>;
    summarize(emailThread: string): Promise<string>;
    draftResponse(originalEmail: string, intent: string): Promise<string>;
    extractActions(emailContent: string): Promise<Array<{
        action: string;
        deadline?: string;
        priority: "high" | "medium" | "low";
    }>>;
}

declare class NotesAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>);
    protected getSystemPrompt(): string;
    createNote(content: string, context?: string): Promise<{
        title: string;
        formattedContent: string;
        suggestedTags: string[];
        relatedTopics: string[];
    }>;
    summarizeNotes(notes: string[]): Promise<string>;
    suggestLinks(noteContent: string, availableNotes: string[]): Promise<Array<{
        noteIndex: number;
        relevance: string;
        suggestedLinkText: string;
    }>>;
    generateOutline(topic: string, depth?: number): Promise<string>;
}

declare class DocumentAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>);
    protected getSystemPrompt(): string;
    answerQuestion(document: string, question: string): Promise<{
        answer: string;
        confidence: "high" | "medium" | "low";
        relevantPassages: string[];
    }>;
    summarize(document: string, options?: {
        style?: "executive" | "detailed" | "bullet";
        maxLength?: number;
    }): Promise<string>;
    extractKeyPoints(document: string): Promise<Array<{
        point: string;
        importance: "critical" | "important" | "supporting";
        location?: string;
    }>>;
    compare(documents: string[]): Promise<{
        similarities: string[];
        differences: string[];
        synthesis: string;
    }>;
}

declare class ResearchAgent extends BaseAgent {
    constructor(provider: BaseProvider, config?: Partial<AgentConfig>);
    protected getSystemPrompt(): string;
    research(topic: string, options?: {
        depth?: "quick" | "standard" | "comprehensive";
        focus?: string[];
    }): Promise<{
        summary: string;
        keyFindings: string[];
        sources: string[];
        furtherResearch: string[];
    }>;
    synthesize(sources: Array<{
        title: string;
        content: string;
    }>): Promise<{
        synthesis: string;
        agreements: string[];
        contradictions: string[];
        gaps: string[];
    }>;
    generateReport(topic: string, findings: string[]): Promise<string>;
    verifyFact(claim: string, context?: string): Promise<{
        verdict: "supported" | "partially_supported" | "contradicted" | "unverifiable";
        confidence: number;
        explanation: string;
        evidence: string[];
    }>;
}

export { DocumentAgent, EmailAgent, NotesAgent, OrchestratorAgent, ResearchAgent };
