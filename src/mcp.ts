/**
 * MCP (Model Context Protocol) server implementation using mcp-lite
 */

import { McpServer, StreamableHttpTransport } from 'mcp-lite';
import { z } from 'zod';
import { fetchPage } from './fetchPage';
import { runExplain, CREATURE_PERSONALITIES } from './agent';
import { Env, Mode, Creature, ExplainResult } from './types';

/**
 * Helper to generate creature ID
 */
function generateCreatureId(): string {
  return `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to get or create a creature
 */
async function getOrCreateCreature(
  kv: KVNamespace,
  creatureId?: string,
  mood?: string,
  request?: any
): Promise<Creature> {
  if (creatureId) {
    const data = await kv.get(creatureId);
    if (data) {
      const creature = JSON.parse(data) as Creature;
      return creature;
    }
  }
  
  // Create new creature
  const personality = CREATURE_PERSONALITIES[Math.floor(Math.random() * CREATURE_PERSONALITIES.length)];
  const newId = generateCreatureId();
  const region = request?.cf?.colo || 'EDGE';
  
  const creature: Creature = {
    id: newId,
    name: personality.name,
    species: personality.specialty,
    region,
    mood: mood || 'curious',
    memories: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // Store in KV
  await kv.put(newId, JSON.stringify(creature), {
    expirationTtl: 86400 // 24 hours
  });
  
  return creature;
}

/**
 * Creates and configures the MCP server
 */
export function createMcpServer(env: Env, request?: Request): McpServer {
  const mcp = new McpServer({
    name: 'world-wild-web-zoo',
    version: '1.0.0',
    schemaAdapter: (schema) => z.toJSONSchema(schema as z.ZodType)
  });
  
  // Tool: fetch_url - Fetches and extracts content from a URL
  mcp.tool('fetch_url', {
    description: 'Fetches a URL and extracts its title, description, and text content snippet',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to fetch')
    }),
    handler: async ({ url }) => {
      try {
        const content = await fetchPage(url);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(content, null, 2)
          }],
          structuredContent: content
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });
  
  // Tool: explain_url - Full explanation with AI
  mcp.tool('explain_url', {
    description: 'Uses an AI creature to explain what a website is about, with optional mode (plain/poem/song/dialogue) and mood',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to explain'),
      mode: z.enum(['plain', 'poem', 'song', 'dialogue']).optional().describe('How to express the explanation'),
      mood: z.string().optional().describe('The mood of the creature (e.g., wizard, serpent, bard, playful)'),
      creatureId: z.string().optional().describe('Existing creature ID to use')
    }),
    handler: async ({ url, mode, mood, creatureId }) => {
      try {
        // Fetch page content
        const pageContent = await fetchPage(url);
        
        // Get or create creature
        const creature = await getOrCreateCreature(
          env.CREATURE_KV,
          creatureId,
          mood,
          request
        );
        
        // Find personality
        const personality = CREATURE_PERSONALITIES.find(p => p.name === creature.name) 
          || CREATURE_PERSONALITIES[0];
        
        // Run explanation
        const result = await runExplain(env.AI, {
          snippet: pageContent.snippet,
          mode: mode as Mode,
          mood: creature.mood,
          systemPersona: personality.systemPrompt
        });
        
        // Add memory
        const host = new URL(url).hostname;
        const memory = `Explained ${host} in ${mode || 'plain'} mode.`;
        creature.memories.push(memory);
        creature.updatedAt = Date.now();
        
        // Update creature in KV
        await env.CREATURE_KV.put(creature.id, JSON.stringify(creature), {
          expirationTtl: 86400
        });
        
        const explainResult: ExplainResult = {
          creature,
          summary: result.summary,
          buildSteps: result.buildSteps,
          expression: result.expression
        };
        
        return {
          content: [{
            type: 'text' as const,
            text: `${result.summary}\n\nBuild Steps:\n${result.buildSteps.join('\n')}`
          }],
          structuredContent: explainResult
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });
  
  // Tool: memory_add - Add a memory to a creature
  mcp.tool('memory_add', {
    description: 'Adds a memory or note to a creature\'s memory bank',
    inputSchema: z.object({
      creatureId: z.string().describe('The creature ID'),
      text: z.string().describe('The memory text to add')
    }),
    handler: async ({ creatureId, text }) => {
      try {
        const data = await env.CREATURE_KV.get(creatureId);
        
        if (!data) {
          return {
            content: [{
              type: 'text' as const,
              text: 'Error: Creature not found'
            }],
            isError: true
          };
        }
        
        const creature = JSON.parse(data) as Creature;
        creature.memories.push(text);
        creature.updatedAt = Date.now();
        
        await env.CREATURE_KV.put(creatureId, JSON.stringify(creature), {
          expirationTtl: 86400
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Memory added successfully! Total memories: ${creature.memories.length}`
          }],
          structuredContent: {
            success: true,
            totalMemories: creature.memories.length
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });
  
  // Tool: memory_list - List creature memories
  mcp.tool('memory_list', {
    description: 'Retrieves the memory bank of a creature',
    inputSchema: z.object({
      creatureId: z.string().describe('The creature ID')
    }),
    handler: async ({ creatureId }) => {
      try {
        const data = await env.CREATURE_KV.get(creatureId);
        
        if (!data) {
          return {
            content: [{
              type: 'text' as const,
              text: 'Error: Creature not found'
            }],
            isError: true
          };
        }
        
        const creature = JSON.parse(data) as Creature;
        
        const memoriesText = creature.memories.length > 0
          ? creature.memories.map((m, i) => `${i + 1}. ${m}`).join('\n')
          : 'No memories yet';
        
        return {
          content: [{
            type: 'text' as const,
            text: `Creature: ${creature.name} (${creature.species})\nRegion: ${creature.region}\nMood: ${creature.mood}\n\nMemories (${creature.memories.length}):\n${memoriesText}`
          }],
          structuredContent: {
            creature: {
              id: creature.id,
              name: creature.name,
              species: creature.species,
              region: creature.region,
              mood: creature.mood
            },
            memories: creature.memories,
            totalMemories: creature.memories.length
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });
  
  return mcp;
}

/**
 * Handles MCP requests
 */
export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  try {
    const mcpServer = createMcpServer(env, request);
    const transport = new StreamableHttpTransport();
    const httpHandler = transport.bind(mcpServer);
    
    return await httpHandler(request);
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : String(error)
      },
      id: null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
