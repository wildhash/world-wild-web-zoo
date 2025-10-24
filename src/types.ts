/**
 * Type definitions for World Wild Web Zoo
 */

export type Mode = "plain" | "poem" | "song" | "dialogue";

export interface Creature {
  id: string;
  name: string;
  species: string;
  region?: string;
  mood?: string;
  memories: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ExplainRequest {
  url: string;
  mode?: Mode;
  creatureId?: string;
  mood?: string;
}

export interface ExplainResult {
  creature: Creature;
  summary: string;
  buildSteps: string[];
  expression?: string;
  tokens?: number;
}

export interface CreaturePersonality {
  name: string;
  emoji: string;
  specialty: string;
  description: string;
  systemPrompt: string;
}

export interface PageContent {
  title: string;
  description: string;
  snippet: string;
}

export interface Env {
  AI: any; // Cloudflare AI binding
  CREATURE_KV: KVNamespace;
}
