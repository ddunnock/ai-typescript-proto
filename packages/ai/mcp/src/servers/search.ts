import { MCPServerWrapper } from "../server";
import { getConfig, MCPError } from "@repo/shared";

/**
 * Search MCP Server - Integrates with ML service for semantic search
 */
export function createSearchMCPServer(): MCPServerWrapper {
    const server = new MCPServerWrapper("search", "1.0.0");
    const config = getConfig();

    server.registerTool(
        "semantic_search",
        "Search for semantically similar content using embeddings",
        {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query text" },
                limit: { type: "number", description: "Maximum results (default: 10)" },
                threshold: { type: "number", description: "Similarity threshold 0-1 (default: 0.7)" },
            },
            required: ["query"],
        },
        async (args) => {
            const { query, limit = 10, threshold = 0.7 } = args as {
                query: string;
                limit?: number;
                threshold?: number;
            };

            try {
                const response = await fetch(`${config.mlServiceUrl}/api/ml/embeddings/search`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, limit, threshold }),
                });

                if (!response.ok) {
                    throw new MCPError(
                        `ML service search failed: ${response.statusText}`,
                        "search"
                    );
                }

                const data = await response.json();
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                throw new MCPError(
                    `Semantic search failed: ${(error as Error).message}`,
                    "search"
                );
            }
        }
    );

    server.registerTool(
        "generate_embedding",
        "Generate an embedding vector for text",
        {
            type: "object",
            properties: {
                text: { type: "string", description: "Text to embed" },
                document_id: { type: "string", description: "Optional document ID for storage" },
            },
            required: ["text"],
        },
        async (args) => {
            const { text, document_id } = args as { text: string; document_id?: string };

            try {
                const response = await fetch(`${config.mlServiceUrl}/api/ml/embeddings`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, document_id }),
                });

                if (!response.ok) {
                    throw new MCPError(
                        `ML service embedding failed: ${response.statusText}`,
                        "search"
                    );
                }

                const data = await response.json();
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                throw new MCPError(
                    `Embedding generation failed: ${(error as Error).message}`,
                    "search"
                );
            }
        }
    );

    server.registerTool(
        "find_similar_highlights",
        "Find content similar to a highlighted text selection",
        {
            type: "object",
            properties: {
                highlight_text: { type: "string", description: "The highlighted text" },
                context: { type: "string", description: "Surrounding context" },
                source_document_id: { type: "string", description: "Source document ID" },
                limit: { type: "number", description: "Maximum results" },
            },
            required: ["highlight_text"],
        },
        async (args) => {
            const { highlight_text, context, source_document_id, limit = 5 } = args as {
                highlight_text: string;
                context?: string;
                source_document_id?: string;
                limit?: number;
            };

            try {
                const response = await fetch(`${config.mlServiceUrl}/api/ml/highlights/similar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        highlight_text,
                        context,
                        source_document_id,
                        limit,
                    }),
                });

                if (!response.ok) {
                    throw new MCPError(
                        `ML service highlights failed: ${response.statusText}`,
                        "search"
                    );
                }

                const data = await response.json();
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                throw new MCPError(
                    `Find similar highlights failed: ${(error as Error).message}`,
                    "search"
                );
            }
        }
    );

    return server;
}