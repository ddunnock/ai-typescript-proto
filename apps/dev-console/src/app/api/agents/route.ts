import { NextRequest, NextResponse } from "next/server";

// Agent configuration stored in memory (in production, use database)
// This is shared across requests but reset on server restart
const agentStore = new Map<string, AgentConfig>();

export interface AgentConfig {
    id: string;
    name: string;
    type: "orchestrator" | "email" | "notes" | "document" | "research" | "custom";
    description: string;
    status: "idle" | "running" | "error";
    provider: "anthropic" | "openai" | "google" | "local";
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    subAgents?: string[];
    createdAt: string;
    updatedAt: string;
}

// GET /api/agents - List all agents
export async function GET() {
    const agents = Array.from(agentStore.values());
    return NextResponse.json({ agents });
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { name, type, description, provider, model, systemPrompt, temperature, maxTokens, tools, subAgents } = body;

        if (!name || !type || !provider || !model) {
            return NextResponse.json(
                { error: "Missing required fields: name, type, provider, model" },
                { status: 400 }
            );
        }

        const validTypes = ["orchestrator", "email", "notes", "document", "research", "custom"];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        const validProviders = ["anthropic", "openai", "google", "local"];
        if (!validProviders.includes(provider)) {
            return NextResponse.json(
                { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
                { status: 400 }
            );
        }

        const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        const agent: AgentConfig = {
            id,
            name,
            type,
            description: description ?? "",
            status: "idle",
            provider,
            model,
            systemPrompt,
            temperature: temperature ?? 0.7,
            maxTokens: maxTokens ?? 4096,
            tools: tools ?? [],
            subAgents: subAgents ?? [],
            createdAt: now,
            updatedAt: now,
        };

        agentStore.set(id, agent);

        return NextResponse.json({ agent }, { status: 201 });

    } catch (error) {
        console.error("Create agent error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create agent" },
            { status: 500 }
        );
    }
}

// PUT /api/agents - Update an existing agent (by id in body)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Missing required field: id" },
                { status: 400 }
            );
        }

        const existing = agentStore.get(id);
        if (!existing) {
            return NextResponse.json(
                { error: `Agent not found: ${id}` },
                { status: 404 }
            );
        }

        const updated: AgentConfig = {
            ...existing,
            ...updates,
            id, // Preserve original ID
            createdAt: existing.createdAt, // Preserve original creation time
            updatedAt: new Date().toISOString(),
        };

        agentStore.set(id, updated);

        return NextResponse.json({ agent: updated });

    } catch (error) {
        console.error("Update agent error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update agent" },
            { status: 500 }
        );
    }
}

// DELETE /api/agents - Delete an agent (by id in query or body)
export async function DELETE(request: NextRequest) {
    try {
        // Try to get id from query params first
        const { searchParams } = new URL(request.url);
        let id = searchParams.get("id");

        // If not in query, try body
        if (!id) {
            try {
                const body = await request.json();
                id = body.id;
            } catch {
                // Body parsing failed, continue with null id
            }
        }

        if (!id) {
            return NextResponse.json(
                { error: "Missing required field: id (in query params or body)" },
                { status: 400 }
            );
        }

        if (!agentStore.has(id)) {
            return NextResponse.json(
                { error: `Agent not found: ${id}` },
                { status: 404 }
            );
        }

        agentStore.delete(id);

        return NextResponse.json({ success: true, deletedId: id });

    } catch (error) {
        console.error("Delete agent error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete agent" },
            { status: 500 }
        );
    }
}
