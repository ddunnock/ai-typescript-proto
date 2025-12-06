import { BaseAgent } from './chunk-3CXXBFFK.js';
import { AgentStateAnnotation } from './chunk-TLEG54VS.js';
import { StateGraph, START, END } from '@langchain/langgraph';
import { createMessage, createAgentEvent } from '@repo/shared';

var OrchestratorAgent = class extends BaseAgent {
  subAgents = /* @__PURE__ */ new Map();
  constructor(provider, config) {
    super(provider, {
      ...config,
      type: "orchestrator",
      name: config?.name ?? "Orchestrator",
      description: config?.description ?? "Multi-agent coordinator that routes to specialized agents"
    });
  }
  registerSubAgent(name, description, agent) {
    this.subAgents.set(name, { name, description, agent });
  }
  unregisterSubAgent(name) {
    this.subAgents.delete(name);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildGraph() {
    const workflow = new StateGraph(AgentStateAnnotation).addNode("initialize", this.initializeNode.bind(this)).addNode("analyze", this.analyzeNode.bind(this)).addNode("delegate", this.delegateNode.bind(this)).addNode("synthesize", this.synthesizeNode.bind(this)).addNode("finalize", this.finalizeNode.bind(this)).addEdge(START, "initialize").addEdge("initialize", "analyze").addConditionalEdges("analyze", this.routeFromAnalyze.bind(this), {
      delegate: "delegate",
      synthesize: "synthesize"
    }).addEdge("delegate", "synthesize").addEdge("synthesize", "finalize").addEdge("finalize", END);
    return workflow.compile();
  }
  async analyzeNode(state) {
    const agentDescriptions = Array.from(this.subAgents.entries()).map(([name, config]) => `- ${name}: ${config.description}`).join("\n");
    const analysisPrompt = `You are an orchestrator that coordinates specialized agents.

Available agents:
${agentDescriptions || "No specialized agents registered."}

Based on the user's request, determine:
1. Which agent(s) should handle this request
2. What specific query to send to each agent

Respond in JSON format:
{
  "delegation": [
    { "agent": "agent_name", "query": "specific query for this agent" }
  ],
  "directResponse": null or "response if no delegation needed"
}

If the request doesn't require any specialized agent, provide a direct response.
If no agents are available, explain that no specialized agents are configured.`;
    const messages = [
      createMessage("system", analysisPrompt),
      ...state.messages
    ];
    try {
      const response = await this.provider.generate(messages, {
        temperature: 0.3,
        maxTokens: 1024
      });
      let analysis;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { directResponse: response.content };
      } catch {
        analysis = { directResponse: response.content };
      }
      return {
        status: "thinking",
        context: {
          ...state.context,
          analysis,
          delegations: analysis.delegation ?? [],
          directResponse: analysis.directResponse
        }
      };
    } catch (error) {
      return {
        error: error.message,
        status: "error"
      };
    }
  }
  async delegateNode(state) {
    const delegations = state.context.delegations;
    if (!delegations || delegations.length === 0) {
      return { status: "thinking" };
    }
    const delegationResults = [];
    for (const delegation of delegations) {
      const subAgentConfig = this.subAgents.get(delegation.agent);
      if (!subAgentConfig) {
        delegationResults.push({
          agent: delegation.agent,
          query: delegation.query,
          response: `Agent "${delegation.agent}" not found`
        });
        continue;
      }
      try {
        const response = await subAgentConfig.agent.process(delegation.query);
        delegationResults.push({
          agent: delegation.agent,
          query: delegation.query,
          response
        });
      } catch (error) {
        delegationResults.push({
          agent: delegation.agent,
          query: delegation.query,
          response: `Error: ${error.message}`
        });
      }
    }
    return {
      status: "thinking",
      context: {
        ...state.context,
        delegationResults
      }
    };
  }
  async synthesizeNode(state) {
    const directResponse = state.context.directResponse;
    const delegationResults = state.context.delegationResults;
    if (directResponse) {
      return {
        messages: [createMessage("assistant", directResponse)],
        status: "complete"
      };
    }
    if (!delegationResults || delegationResults.length === 0) {
      return {
        messages: [createMessage("assistant", "I couldn't process your request.")],
        status: "complete"
      };
    }
    if (delegationResults.length === 1 && delegationResults[0]) {
      return {
        messages: [createMessage("assistant", delegationResults[0].response)],
        status: "complete"
      };
    }
    const synthesisPrompt = `You received responses from multiple specialized agents.
Synthesize these into a cohesive response for the user.

Agent responses:
${delegationResults.map((r) => `[${r.agent}]: ${r.response}`).join("\n\n")}

Provide a unified, helpful response that combines the insights from all agents.`;
    const messages = [
      createMessage("system", synthesisPrompt),
      ...state.messages
    ];
    try {
      const response = await this.provider.generate(messages, {
        temperature: 0.5,
        maxTokens: 2048
      });
      return {
        messages: [createMessage("assistant", response.content)],
        status: "complete"
      };
    } catch (error) {
      const fallbackResponse = delegationResults.map((r) => `**${r.agent}**: ${r.response}`).join("\n\n");
      return {
        messages: [createMessage("assistant", fallbackResponse)],
        status: "complete"
      };
    }
  }
  routeFromAnalyze(state) {
    const delegations = state.context.delegations;
    if (delegations && delegations.length > 0) {
      return "delegate";
    }
    return "synthesize";
  }
  getSystemPrompt() {
    return `You are an AI orchestrator coordinating specialized agents for email, notes, documents, and research tasks.`;
  }
  async *streamProcess(query) {
    const initialState = {
      messages: [createMessage("user", query)]
    };
    const stream = await this.graph.stream(initialState);
    for await (const event of stream) {
      const [nodeName, nodeState] = Object.entries(event)[0] ?? [];
      if (!nodeName || !nodeState) continue;
      const state = nodeState;
      switch (nodeName) {
        case "initialize":
          yield createAgentEvent("thinking", "Analyzing request...", this.config.type);
          break;
        case "analyze":
          yield createAgentEvent("thinking", "Determining which agents to use...", this.config.type);
          break;
        case "delegate":
          yield createAgentEvent("thinking", "Delegating to specialized agents...", this.config.type);
          break;
        case "synthesize":
          if (state.messages && state.messages.length > 0) {
            const lastMsg = state.messages[state.messages.length - 1];
            yield createAgentEvent("response", lastMsg?.content, this.config.type);
          }
          break;
        case "finalize":
          yield createAgentEvent("complete", null, this.config.type);
          break;
      }
    }
  }
  get registeredAgents() {
    return Array.from(this.subAgents.keys());
  }
};
var EmailAgent = class extends BaseAgent {
  constructor(provider, config) {
    super(provider, {
      ...config,
      type: "email",
      name: config?.name ?? "Email Agent",
      description: config?.description ?? "Handles email categorization, summarization, and response drafting"
    });
  }
  getSystemPrompt() {
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
  async categorize(emailContent) {
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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { category: "unknown", confidence: 0.5, labels: [] };
    } catch {
      return { category: "unknown", confidence: 0.5, labels: [] };
    }
  }
  async summarize(emailThread) {
    const prompt = `Summarize this email thread concisely:

${emailThread}

Provide:
1. Main topic/purpose
2. Key points discussed
3. Any decisions made
4. Outstanding action items`;
    return this.process(prompt);
  }
  async draftResponse(originalEmail, intent) {
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
  async extractActions(emailContent) {
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
};
var NotesAgent = class extends BaseAgent {
  constructor(provider, config) {
    super(provider, {
      ...config,
      type: "notes",
      name: config?.name ?? "Notes Agent",
      description: config?.description ?? "Handles note-taking, retrieval, and knowledge linking"
    });
  }
  getSystemPrompt() {
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
  async createNote(content, context) {
    const prompt = `Help structure this note content:

${content}
${context ? `
Context: ${context}` : ""}

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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        title: "Untitled Note",
        formattedContent: content,
        suggestedTags: [],
        relatedTopics: []
      };
    } catch {
      return {
        title: "Untitled Note",
        formattedContent: content,
        suggestedTags: [],
        relatedTopics: []
      };
    }
  }
  async summarizeNotes(notes) {
    const prompt = `Summarize these notes into a cohesive overview:

${notes.map((n, i) => `--- Note ${i + 1} ---
${n}`).join("\n\n")}

Provide:
1. Main themes across the notes
2. Key insights
3. Connections between notes
4. Areas that could use more development`;
    return this.process(prompt);
  }
  async suggestLinks(noteContent, availableNotes) {
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
  async generateOutline(topic, depth = 3) {
    const prompt = `Create a structured outline for the topic: "${topic}"

Requirements:
- Maximum depth: ${depth} levels
- Include key subtopics
- Use clear hierarchical formatting
- Add brief descriptions where helpful`;
    return this.process(prompt);
  }
};
var DocumentAgent = class extends BaseAgent {
  constructor(provider, config) {
    super(provider, {
      ...config,
      type: "document",
      name: config?.name ?? "Document Agent",
      description: config?.description ?? "Handles document Q&A, summarization, and analysis"
    });
  }
  getSystemPrompt() {
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
  async answerQuestion(document, question) {
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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        answer: response,
        confidence: "low",
        relevantPassages: []
      };
    } catch {
      return {
        answer: response,
        confidence: "low",
        relevantPassages: []
      };
    }
  }
  async summarize(document, options) {
    const style = options?.style ?? "executive";
    const maxLength = options?.maxLength ?? 500;
    const prompt = `Summarize this document in ${style} style (max ~${maxLength} words):

${document}

${style === "executive" ? "Focus on key decisions, conclusions, and action items." : ""}
${style === "bullet" ? "Use bullet points for key information." : ""}
${style === "detailed" ? "Include supporting details and context." : ""}`;
    return this.process(prompt);
  }
  async extractKeyPoints(document) {
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
  async compare(documents) {
    const prompt = `Compare these documents:

${documents.map((d, i) => `--- Document ${i + 1} ---
${d}`).join("\n\n")}

Respond in JSON format:
{
  "similarities": ["common point 1", "common point 2"],
  "differences": ["difference 1", "difference 2"],
  "synthesis": "overall synthesis of the documents"
}`;
    const response = await this.process(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        similarities: [],
        differences: [],
        synthesis: response
      };
    } catch {
      return {
        similarities: [],
        differences: [],
        synthesis: response
      };
    }
  }
};
var ResearchAgent = class extends BaseAgent {
  constructor(provider, config) {
    super(provider, {
      ...config,
      type: "research",
      name: config?.name ?? "Research Agent",
      description: config?.description ?? "Handles research tasks, information gathering, and synthesis"
    });
  }
  getSystemPrompt() {
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
  async research(topic, options) {
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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        summary: response,
        keyFindings: [],
        sources: [],
        furtherResearch: []
      };
    } catch {
      return {
        summary: response,
        keyFindings: [],
        sources: [],
        furtherResearch: []
      };
    }
  }
  async synthesize(sources) {
    const prompt = `Synthesize these sources:

${sources.map((s, i) => `--- ${s.title} ---
${s.content}`).join("\n\n")}

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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        synthesis: response,
        agreements: [],
        contradictions: [],
        gaps: []
      };
    } catch {
      return {
        synthesis: response,
        agreements: [],
        contradictions: [],
        gaps: []
      };
    }
  }
  async generateReport(topic, findings) {
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
  async verifyFact(claim, context) {
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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        verdict: "unverifiable",
        confidence: 0.5,
        explanation: response,
        evidence: []
      };
    } catch {
      return {
        verdict: "unverifiable",
        confidence: 0.5,
        explanation: response,
        evidence: []
      };
    }
  }
};

export { DocumentAgent, EmailAgent, NotesAgent, OrchestratorAgent, ResearchAgent };
//# sourceMappingURL=chunk-PR52YFQA.js.map
//# sourceMappingURL=chunk-PR52YFQA.js.map