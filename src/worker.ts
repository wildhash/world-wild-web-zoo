/**
 * World Wild Web Zoo - Main Worker Entry Point
 * Cloudflare Worker with MCP server integration
 */

import { fetchPage } from './fetchPage';
import { runExplain, generateChatResponse, CREATURE_PERSONALITIES } from './agent';
import { handleMcpRequest } from './mcp';
import { Env, Creature, CreaturePersonality } from './types';

/**
 * Helper to generate creature ID
 */
function generateCreatureId(): string {
  return `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store creature data in KV
 */
async function storeCreature(kv: KVNamespace, creatureId: string, creatureData: any): Promise<void> {
  await kv.put(creatureId, JSON.stringify(creatureData), {
    expirationTtl: 86400 // 24 hours
  });
}

/**
 * Retrieve creature data from KV
 */
async function getCreature(kv: KVNamespace, creatureId: string): Promise<any | null> {
  const data = await kv.get(creatureId);
  return data ? JSON.parse(data) : null;
}

/**
 * Generate the HTML interface
 */
function getHtmlInterface(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>World Wild Web Zoo 🌐✨</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .header p {
      font-size: 1.1em;
      opacity: 0.95;
    }
    
    .content {
      padding: 30px;
    }
    
    .creature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .creature-card {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 20px;
      border-radius: 15px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      color: white;
    }
    
    .creature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    
    .creature-emoji {
      font-size: 3em;
      margin-bottom: 10px;
    }
    
    .creature-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .creature-desc {
      font-size: 0.85em;
      opacity: 0.9;
    }
    
    .form-section {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 25px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
      color: #555;
    }
    
    input[type="url"], input[type="text"], select {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1em;
      transition: border-color 0.3s;
    }
    
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 1em;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      font-weight: bold;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .response-area {
      margin-top: 25px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 15px;
      border-left: 5px solid #667eea;
      display: none;
    }
    
    .response-area.active {
      display: block;
    }
    
    .creature-response {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 15px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    
    .info-box {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      border-left: 5px solid #2196F3;
    }
    
    .mcp-box {
      background: #fff3e0;
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      border-left: 5px solid #ff9800;
    }
    
    .mcp-box h3 {
      margin-bottom: 10px;
      color: #e65100;
    }
    
    .mcp-box code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: #667eea;
      font-weight: bold;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .loading::after {
      content: '...';
      animation: pulse 1.5s infinite;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌐 World Wild Web Zoo ✨</h1>
      <p>Where AI creatures explore the web and tell its tales</p>
    </div>
    
    <div class="content">
      <div class="info-box">
        <strong>Welcome to the Zoo!</strong> Our magical creatures can visit any website and tell you about it in their own unique way. Choose a creature, give them a URL to explore, and watch the magic happen!
      </div>
      
      <div class="form-section">
        <h2 style="margin-bottom: 20px;">🎪 Choose Your Creature</h2>
        <div class="creature-grid" id="creatureGrid"></div>
        
        <div class="form-group">
          <label for="url">🔗 Website URL to Explore:</label>
          <input type="url" id="url" placeholder="https://example.com" required />
        </div>
        
        <div class="form-group">
          <label for="mode">🎭 Expression Mode:</label>
          <select id="mode">
            <option value="plain">Plain - Clear explanation</option>
            <option value="poem">Poem - Beautiful verse</option>
            <option value="song">Song - Lyrics with chorus</option>
            <option value="dialogue">Dialogue - Two characters talking</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="mood">😊 Creature Mood (optional):</label>
          <input type="text" id="mood" placeholder="e.g., wizard, playful, mystical..." />
        </div>
        
        <button onclick="spawnCreature()" id="spawnBtn">🚀 Spawn Creature & Explore!</button>
      </div>
      
      <div class="response-area" id="responseArea">
        <div class="creature-response" id="creatureResponse"></div>
        
        <div style="margin-top: 20px;">
          <input type="text" id="memoryInput" placeholder="Add a memory..." style="margin-bottom: 10px;" />
          <button onclick="addMemory()">📝 Evolve Memory</button>
        </div>
      </div>
      
      <div class="mcp-box">
        <h3>🔌 MCP Server Integration</h3>
        <p>This zoo is now an <strong>MCP (Model Context Protocol)</strong> server! Connect with:</p>
        <ul style="margin: 10px 0 10px 20px;">
          <li><strong>Endpoint:</strong> <code>POST /mcp</code></li>
          <li><strong>Tools:</strong> fetch_url, explain_url, memory_add, memory_list</li>
          <li><strong>Clients:</strong> MCP Inspector, Claude Desktop, Claude Code</li>
        </ul>
        <p style="margin-top: 10px; font-size: 0.9em;">
          Use MCP clients to programmatically interact with the zoo! 
          <a href="https://github.com/Nlea/World-Wild-Web-AI-And-MCP-Hack-Night" target="_blank" style="color: #e65100;">Learn more</a>
        </p>
      </div>
    </div>
  </div>

  <script>
    const creatures = ${JSON.stringify(CREATURE_PERSONALITIES)};
    let selectedCreature = null;
    let currentCreatureId = null;
    
    const grid = document.getElementById('creatureGrid');
    creatures.forEach((creature, index) => {
      const card = document.createElement('div');
      card.className = 'creature-card';
      card.onclick = () => selectCreature(index);
      card.innerHTML = \`
        <div class="creature-emoji">\${creature.emoji}</div>
        <div class="creature-name">\${creature.name}</div>
        <div class="creature-desc">\${creature.description}</div>
      \`;
      grid.appendChild(card);
    });
    
    function selectCreature(index) {
      selectedCreature = creatures[index];
      document.querySelectorAll('.creature-card').forEach((card, i) => {
        card.style.opacity = i === index ? '1' : '0.5';
      });
    }
    
    selectCreature(0);
    
    async function spawnCreature() {
      const url = document.getElementById('url').value;
      const mode = document.getElementById('mode').value;
      const mood = document.getElementById('mood').value;
      
      if (!url || !selectedCreature) {
        alert('Please enter a URL and select a creature!');
        return;
      }
      
      const responseArea = document.getElementById('responseArea');
      const creatureResponse = document.getElementById('creatureResponse');
      const spawnBtn = document.getElementById('spawnBtn');
      
      responseArea.classList.add('active');
      creatureResponse.innerHTML = '<div class="loading">Creature is analyzing the website</div>';
      spawnBtn.disabled = true;
      
      try {
        const response = await fetch('/api/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, creatureName: selectedCreature.name, mode, mood })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to spawn creature');
        
        currentCreatureId = data.creatureId;
        creatureResponse.innerHTML = data.response;
      } catch (error) {
        creatureResponse.innerHTML = \`Error: \${error.message}\`;
      } finally {
        spawnBtn.disabled = false;
      }
    }
    
    async function addMemory() {
      const memory = document.getElementById('memoryInput').value.trim();
      if (!memory || !currentCreatureId) return;
      
      try {
        const response = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatureId: currentCreatureId, memory })
        });
        
        const data = await response.json();
        if (response.ok) {
          alert('Memory added! Creature has ' + data.totalMemories + ' memories now.');
          document.getElementById('memoryInput').value = '';
        } else {
          alert('Failed to add memory: ' + data.error);
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Handle /explain endpoint
 */
async function handleExplain(request: Request, env: Env): Promise<Response> {
  try {
    const { url, mode, creatureId, mood } = await request.json() as any;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch page content
    const pageContent = await fetchPage(url);
    
    // Get or create creature
    let creature: Creature;
    if (creatureId) {
      const data = await getCreature(env.CREATURE_KV, creatureId);
      if (data) {
        creature = data;
      } else {
        return new Response(JSON.stringify({ error: 'Creature not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      const personality = CREATURE_PERSONALITIES[0];
      const newId = generateCreatureId();
      creature = {
        id: newId,
        name: personality.name,
        species: personality.specialty,
        region: (request as any).cf?.colo || 'EDGE',
        mood: mood || 'curious',
        memories: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    // Find personality
    const personality = CREATURE_PERSONALITIES.find(p => p.name === creature.name) || CREATURE_PERSONALITIES[0];
    
    // Run explanation
    const result = await runExplain(env.AI, {
      snippet: pageContent.snippet,
      mode,
      mood: creature.mood,
      systemPersona: personality.systemPrompt
    });
    
    // Add memory
    const host = new URL(url).hostname;
    creature.memories.push(`Explained ${host} in ${mode || 'plain'} mode.`);
    creature.updatedAt = Date.now();
    
    // Store creature
    await storeCreature(env.CREATURE_KV, creature.id, creature);
    
    return new Response(JSON.stringify({
      success: true,
      creature,
      summary: result.summary,
      buildSteps: result.buildSteps,
      expression: result.expression
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle /api/spawn endpoint
 */
async function handleSpawn(request: Request, env: Env): Promise<Response> {
  try {
    const { url, creatureName, mode, mood } = await request.json() as any;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Find personality
    let personality: CreaturePersonality = creatureName
      ? CREATURE_PERSONALITIES.find(c => c.name === creatureName) || CREATURE_PERSONALITIES[0]
      : CREATURE_PERSONALITIES[Math.floor(Math.random() * CREATURE_PERSONALITIES.length)];
    
    const creatureId = generateCreatureId();
    
    // Fetch URL content
    const pageContent = await fetchPage(url);
    
    // Generate AI response
    const result = await runExplain(env.AI, {
      snippet: pageContent.snippet,
      mode,
      mood,
      systemPersona: personality.systemPrompt
    });
    
    // Store creature data
    const creatureData = {
      id: creatureId,
      personality,
      url,
      mode,
      mood,
      createdAt: Date.now(),
      conversationHistory: [
        { role: 'assistant', content: result.summary }
      ]
    };
    
    await storeCreature(env.CREATURE_KV, creatureId, creatureData);
    
    return new Response(JSON.stringify({
      success: true,
      creatureId,
      creature: {
        name: personality.name,
        emoji: personality.emoji,
        specialty: personality.specialty
      },
      response: result.summary
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle /api/memory endpoint
 */
async function handleMemory(request: Request, env: Env): Promise<Response> {
  try {
    const { creatureId, memory } = await request.json() as any;
    
    if (!creatureId || !memory) {
      return new Response(JSON.stringify({ error: 'Creature ID and memory required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const creatureData = await getCreature(env.CREATURE_KV, creatureId);
    if (!creatureData) {
      return new Response(JSON.stringify({ error: 'Creature not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!creatureData.conversationHistory) {
      creatureData.conversationHistory = [];
    }
    creatureData.conversationHistory.push({
      role: 'user',
      content: `[Memory added: ${memory}]`
    });
    
    await storeCreature(env.CREATURE_KV, creatureId, creatureData);
    
    return new Response(JSON.stringify({
      success: true,
      totalMemories: creatureData.conversationHistory.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle /creature/:id endpoint
 */
async function handleGetCreature(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/')[2];
    
    const creature = await getCreature(env.CREATURE_KV, id);
    if (!creature) {
      return new Response(JSON.stringify({ error: 'Creature not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(creature), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main worker export
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Route: GET /
    if (path === '/' && method === 'GET') {
      return new Response(getHtmlInterface(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Route: GET /health
    if (path === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Route: POST /explain
    if (path === '/explain' && method === 'POST') {
      return handleExplain(request, env);
    }
    
    // Route: POST /api/spawn
    if (path === '/api/spawn' && method === 'POST') {
      return handleSpawn(request, env);
    }
    
    // Route: POST /api/memory
    if (path === '/api/memory' && method === 'POST') {
      return handleMemory(request, env);
    }
    
    // Route: GET /creature/:id
    if (path.startsWith('/creature/') && method === 'GET') {
      return handleGetCreature(request, env);
    }
    
    // Route: POST /mcp
    if (path === '/mcp' && method === 'POST') {
      return handleMcpRequest(request, env);
    }
    
    // 404 for other paths
    return new Response('Not Found', { status: 404 });
  }
};
