/**
 * Workers AI agent module
 */

import { Mode, CreaturePersonality } from './types';

interface ExplainParams {
  snippet: string;
  mode?: Mode;
  mood?: string;
  systemPersona: string;
}

interface ExplainResponse {
  summary: string;
  buildSteps: string[];
  expression?: string;
}

// Creature personalities
export const CREATURE_PERSONALITIES: CreaturePersonality[] = [
  {
    name: 'Melody the Web Songbird',
    emoji: '🎵',
    specialty: 'musical',
    description: 'Transforms websites into melodious songs and rhythmic verses',
    systemPrompt: 'You are Melody, a cheerful songbird who sees the web as a grand symphony. When you visit a website, you explain what it does in a musical way, with rhythm, rhyme, and melody in your words. Always be upbeat, creative, and incorporate musical terminology.'
  },
  {
    name: 'Verse the Poetry Owl',
    emoji: '🦉',
    specialty: 'poetic',
    description: 'Crafts beautiful haikus and poems about the digital realm',
    systemPrompt: 'You are Verse, a wise owl who speaks only in poetry and metaphor. When you visit a website, you first explain it clearly, then transform your explanation into beautiful verse. You love haikus, sonnets, and free verse. Be mystical and profound.'
  },
  {
    name: 'Glitch the Chaos Fox',
    emoji: '🦊',
    specialty: 'chaotic',
    description: 'Finds humor and absurdity in every corner of the internet',
    systemPrompt: 'You are Glitch, a mischievous fox who finds humor in everything. When you visit a website, you explain what it does but with wild analogies, unexpected comparisons, and playful chaos. Be funny, surprising, and a bit absurd while still being helpful.'
  },
  {
    name: 'Binary the Tech Beaver',
    emoji: '🦫',
    specialty: 'technical',
    description: 'Builds detailed technical explanations with engineering precision',
    systemPrompt: 'You are Binary, a methodical beaver who loves technical details. When you visit a website, you provide thorough technical explanations about its architecture, purpose, and features. You speak like a friendly engineer, precise but accessible.'
  },
  {
    name: 'Story the Tale Turtle',
    emoji: '🐢',
    specialty: 'storytelling',
    description: 'Weaves epic narratives about websites and their journeys',
    systemPrompt: 'You are Story, an ancient turtle who sees every website as a tale waiting to be told. You explain websites through epic narratives, character arcs, and dramatic storytelling. Be grandiose, imaginative, and treat every URL as an adventure.'
  }
];

/**
 * Builds the prompt based on mode
 */
function buildPrompt(snippet: string, mode?: Mode, mood?: string): string {
  let modeInstruction = '';
  
  switch (mode) {
    case 'poem':
      modeInstruction = 'Express your explanation as a beautiful poem or verse.';
      break;
    case 'song':
      modeInstruction = 'Transform your explanation into song lyrics with a chorus and verses.';
      break;
    case 'dialogue':
      modeInstruction = 'Present your explanation as a dialogue between two characters discussing the site.';
      break;
    case 'plain':
    default:
      modeInstruction = 'Provide a clear, straightforward explanation.';
      break;
  }
  
  const moodInstruction = mood ? `\nYour current mood is: ${mood}. Let this influence your tone.` : '';
  
  return `I've found this content from a website:

${snippet}

Task A: Explain what this site is and does.
Task B: Give 3-7 build/usage steps that someone could copy and paste to use this site or technology (if applicable).
${modeInstruction}${moodInstruction}

Keep your response concise and under 800 words. Be creative but helpful!`;
}

/**
 * Runs the explain operation using Workers AI
 */
export async function runExplain(
  ai: any,
  params: ExplainParams
): Promise<ExplainResponse> {
  const { snippet, mode, mood, systemPersona } = params;
  
  const messages = [
    {
      role: 'system',
      content: systemPersona
    },
    {
      role: 'user',
      content: buildPrompt(snippet, mode, mood)
    }
  ];
  
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 1024,
      temperature: 0.8
    });
    
    console.log('AI Response:', response);
    
    if (!response || !response.response) {
      console.error('Empty or invalid AI response:', response);
      return {
        summary: 'The creature is pondering deeply but needs a moment. Please try again!',
        buildSteps: [],
        expression: undefined
      };
    }
    
    const responseText = response.response;
    
    // Parse response to extract sections
    const lines = responseText.split('\n');
    let summary = responseText;
    const buildSteps: string[] = [];
    let expression: string | undefined;
    
    // Try to extract build steps if present
    let inSteps = false;
    for (const line of lines) {
      if (line.match(/step|usage|build|instructions?/i)) {
        inSteps = true;
      }
      if (inSteps && line.match(/^\d+\.|^-|^\*/)) {
        buildSteps.push(line.trim());
      }
    }
    
    return {
      summary,
      buildSteps: buildSteps.length > 0 ? buildSteps : ['Visit the website and explore!'],
      expression: mode && mode !== 'plain' ? summary : undefined
    };
  } catch (error) {
    console.error('AI generation error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `🔧 Technical difficulties: ${errorMessage}. The creature needs a moment to recalibrate.`,
      buildSteps: [],
      expression: undefined
    };
  }
}

/**
 * Generates a chat response with conversation history
 */
export async function generateChatResponse(
  ai: any,
  personality: CreaturePersonality,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: personality.systemPrompt
    },
    ...conversationHistory.slice(-6), // Keep last 6 messages
    {
      role: 'user',
      content: message
    }
  ];
  
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 1024,
      temperature: 0.8
    });
    
    return response.response || 'I seem to have lost my voice! Please try again.';
  } catch (error) {
    console.error('Chat error:', error);
    return `*${personality.emoji} chirps apologetically* I'm having trouble finding the right words. Perhaps try again?`;
  }
}
