/**
 * World Wild Web Zoo - AI Creatures on Cloudflare Workers
 * Each creature reads a URL, explains it, and creates poetic/musical versions
 */

// Creature personalities with creative names and traits
const CREATURE_PERSONALITIES = [
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

// Helper to generate a random creature ID
function generateCreatureId() {
  return `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to pick a random creature personality
function getRandomCreaturePersonality() {
  return CREATURE_PERSONALITIES[Math.floor(Math.random() * CREATURE_PERSONALITIES.length)];
}

// Fetch and extract text content from a URL
async function fetchUrlContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WorldWildWebZoo-Crawler/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract text content for AI analysis only (never rendered as HTML)
    // Use a multi-pass approach to safely strip all markup
    let text = html;
    
    // Remove potentially dangerous content blocks
    // Using a greedy approach that handles malformed tags
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, ' ');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/gi, ' ');
    
    // Remove all HTML tags using iterative approach to prevent bypass
    let previousLength = 0;
    const maxIterations = 10; // Safety limit
    let iterations = 0;
    while (text.length !== previousLength && text.includes('<') && iterations < maxIterations) {
      previousLength = text.length;
      text = text.replace(/<[^>]*>/g, ' ');
      iterations++;
    }
    
    // Decode common HTML entities in correct order (& last to avoid double-decoding)
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')  // Process & last to prevent double-decoding
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);
    
    return text || 'Unable to extract meaningful content from this URL.';
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

// Generate AI response using Workers AI
async function generateCreatureResponse(ai, creaturePersonality, urlContent, userMessage, conversationHistory) {
  const messages = [
    {
      role: 'system',
      content: creaturePersonality.systemPrompt
    },
    {
      role: 'user',
      content: `I've found this content from a website:\n\n${urlContent}\n\nPlease explain what this website is about in your unique style.`
    }
  ];
  
  // Add conversation history for chat
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }
  
  // Add current user message
  if (userMessage) {
    messages.push({
      role: 'user',
      content: userMessage
    });
  }
  
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: messages,
      max_tokens: 1024,
      temperature: 0.8
    });
    
    return response.response || 'I seem to have lost my voice! Please try again.';
  } catch (error) {
    console.error('AI generation error:', error);
    return `*${creaturePersonality.emoji} chirps apologetically* I'm having trouble finding the right words. Perhaps try again?`;
  }
}

// Store creature data in KV
async function storeCreature(kv, creatureId, creatureData) {
  await kv.put(creatureId, JSON.stringify(creatureData), {
    expirationTtl: 86400 // 24 hours
  });
}

// Retrieve creature data from KV
async function getCreature(kv, creatureId) {
  const data = await kv.get(creatureId);
  return data ? JSON.parse(data) : null;
}

// Generate the HTML interface
function getHtmlInterface() {
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
    
    input[type="url"], select {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1em;
      transition: border-color 0.3s;
    }
    
    input[type="url"]:focus, select:focus {
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
    
    button:active {
      transform: translateY(0);
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
    
    .creature-intro {
      font-size: 1.2em;
      margin-bottom: 15px;
      padding: 15px;
      background: white;
      border-radius: 10px;
    }
    
    .creature-response {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 15px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    
    .chat-section {
      margin-top: 20px;
    }
    
    .chat-input-group {
      display: flex;
      gap: 10px;
    }
    
    .chat-input-group input {
      flex: 1;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: #667eea;
      font-weight: bold;
    }
    
    .error {
      background: #fee;
      border-left-color: #f00;
      color: #c00;
    }
    
    .info-box {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      border-left: 5px solid #2196F3;
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
        <div class="creature-grid" id="creatureGrid">
          <!-- Creatures will be populated here -->
        </div>
        
        <div class="form-group">
          <label for="url">🔗 Website URL to Explore:</label>
          <input 
            type="url" 
            id="url" 
            placeholder="https://example.com" 
            required
          />
        </div>
        
        <button onclick="spawnCreature()" id="spawnBtn">
          🚀 Spawn Creature & Explore!
        </button>
      </div>
      
      <div class="response-area" id="responseArea">
        <div class="creature-intro" id="creatureIntro"></div>
        <div class="creature-response" id="creatureResponse"></div>
        
        <div class="chat-section">
          <h3 style="margin-bottom: 15px;">💬 Chat with the Creature</h3>
          <div class="chat-input-group">
            <input 
              type="text" 
              id="chatInput" 
              placeholder="Ask the creature anything..."
            />
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const creatures = ${JSON.stringify(CREATURE_PERSONALITIES)};
    let selectedCreature = null;
    let currentCreatureId = null;
    
    // Populate creature grid
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
      // Visual feedback
      document.querySelectorAll('.creature-card').forEach((card, i) => {
        card.style.opacity = i === index ? '1' : '0.5';
      });
    }
    
    // Select first creature by default
    selectCreature(0);
    
    async function spawnCreature() {
      const url = document.getElementById('url').value;
      if (!url) {
        alert('Please enter a URL!');
        return;
      }
      
      if (!selectedCreature) {
        alert('Please select a creature!');
        return;
      }
      
      const responseArea = document.getElementById('responseArea');
      const creatureIntro = document.getElementById('creatureIntro');
      const creatureResponse = document.getElementById('creatureResponse');
      const spawnBtn = document.getElementById('spawnBtn');
      
      responseArea.classList.add('active');
      responseArea.classList.remove('error');
      creatureIntro.innerHTML = \`
        <strong>\${selectedCreature.emoji} \${selectedCreature.name}</strong> is exploring the web...
      \`;
      creatureResponse.innerHTML = '<div class="loading">Creature is analyzing the website</div>';
      spawnBtn.disabled = true;
      
      try {
        const response = await fetch('/api/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url,
            creatureName: selectedCreature.name
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to spawn creature');
        }
        
        currentCreatureId = data.creatureId;
        creatureIntro.innerHTML = \`
          <strong>\${data.creature.emoji} \${data.creature.name}</strong> has arrived!<br>
          <small style="opacity: 0.7;">Specialty: \${data.creature.specialty}</small>
        \`;
        creatureResponse.innerHTML = data.response;
        
      } catch (error) {
        responseArea.classList.add('error');
        creatureResponse.innerHTML = \`Error: \${error.message}\`;
      } finally {
        spawnBtn.disabled = false;
      }
    }
    
    async function sendMessage() {
      const chatInput = document.getElementById('chatInput');
      const message = chatInput.value.trim();
      
      if (!message || !currentCreatureId) return;
      
      const creatureResponse = document.getElementById('creatureResponse');
      creatureResponse.innerHTML = '<div class="loading">Creature is thinking</div>';
      chatInput.value = '';
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatureId: currentCreatureId,
            message: message
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to chat with creature');
        }
        
        creatureResponse.innerHTML = data.response;
        
      } catch (error) {
        creatureResponse.innerHTML = \`Error: \${error.message}\`;
      }
    }
    
    // Allow Enter key to send message
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>`;
}

// Handle API requests
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/spawn' && request.method === 'POST') {
    try {
      const { url: targetUrl, creatureName } = await request.json();
      
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Find or pick random creature
      let personality = creatureName 
        ? CREATURE_PERSONALITIES.find(c => c.name === creatureName)
        : getRandomCreaturePersonality();
      
      if (!personality) {
        personality = getRandomCreaturePersonality();
      }
      
      // Generate creature ID
      const creatureId = generateCreatureId();
      
      // Fetch URL content
      const urlContent = await fetchUrlContent(targetUrl);
      
      // Generate AI response
      const aiResponse = await generateCreatureResponse(
        env.AI,
        personality,
        urlContent,
        null,
        []
      );
      
      // Store creature data
      const creatureData = {
        id: creatureId,
        personality: personality,
        url: targetUrl,
        createdAt: Date.now(),
        conversationHistory: [
          {
            role: 'assistant',
            content: aiResponse
          }
        ]
      };
      
      await storeCreature(env.CREATURE_KV, creatureId, creatureData);
      
      return new Response(JSON.stringify({
        success: true,
        creatureId: creatureId,
        creature: {
          name: personality.name,
          emoji: personality.emoji,
          specialty: personality.specialty
        },
        response: aiResponse
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Spawn error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Failed to spawn creature' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    try {
      const { creatureId, message } = await request.json();
      
      if (!creatureId || !message) {
        return new Response(JSON.stringify({ 
          error: 'Creature ID and message are required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Retrieve creature data
      const creatureData = await getCreature(env.CREATURE_KV, creatureId);
      
      if (!creatureData) {
        return new Response(JSON.stringify({ 
          error: 'Creature not found. It may have wandered away!' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Generate AI response with conversation history
      const aiResponse = await generateCreatureResponse(
        env.AI,
        creatureData.personality,
        `Previous context: exploring ${creatureData.url}`,
        message,
        creatureData.conversationHistory.slice(-6) // Keep last 6 messages for context
      );
      
      // Update conversation history
      creatureData.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );
      
      // Store updated creature data
      await storeCreature(env.CREATURE_KV, creatureId, creatureData);
      
      return new Response(JSON.stringify({
        success: true,
        response: aiResponse
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Chat error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Failed to chat with creature' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Main worker export
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve HTML interface for root path
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(getHtmlInterface(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    
    // 404 for other paths
    return new Response('Not Found', { status: 404 });
  }
};
