import { MCPServerWrapper } from './server.js';
export { ToolHandler } from './server.js';
export { MCPClient, TransportConfig } from './client.js';
export { MCPRegistry, getMCPRegistry } from './registry.js';
import '@repo/shared';

/**
 * Search MCP Server - Integrates with ML service for semantic search
 */
declare function createSearchMCPServer(): MCPServerWrapper;

export { MCPServerWrapper, createSearchMCPServer };
