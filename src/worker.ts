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
  <title>World Wild Web Zoo — Neo-Digital Habitat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-deep: #0a0e1a;
      --bg-card: #0f1419;
      --neon-cyan: #00f0ff;
      --neon-pink: #ff006e;
      --neon-violet: #8b5cf6;
      --neon-orange: #ff3d00;
      --glass: rgba(255, 255, 255, 0.03);
      --glass-border: rgba(255, 255, 255, 0.06);
      --text-primary: #e9ecf5;
      --text-secondary: rgba(233, 236, 245, 0.65);
      --shadow-glow: 0 0 40px rgba(0, 240, 255, 0.15);
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: 
        radial-gradient(ellipse 1400px 900px at 15% 20%, rgba(0, 240, 255, 0.08), transparent 50%),
        radial-gradient(ellipse 1200px 700px at 85% 80%, rgba(255, 0, 110, 0.06), transparent 50%),
        radial-gradient(ellipse 800px 600px at 50% 50%, rgba(139, 92, 246, 0.04), transparent 60%),
        linear-gradient(180deg, #050711 0%, var(--bg-deep) 100%);
      background-attachment: fixed;
      min-height: 100vh;
      color: var(--text-primary);
      overflow-x: hidden;
      position: relative;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Animated scanlines overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 240, 255, 0.03) 0px,
        transparent 1px,
        transparent 2px,
        rgba(0, 240, 255, 0.03) 3px
      );
      pointer-events: none;
      z-index: 9999;
      opacity: 0.4;
      animation: scanline 8s linear infinite;
    }
    
    @keyframes scanline {
      0% { transform: translateY(0); }
      100% { transform: translateY(4px); }
    }
    
    /* Floating particles */
    body::after {
      content: '';
      position: fixed;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background-image: 
        radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.3), transparent),
        radial-gradient(2px 2px at 60% 70%, rgba(0, 240, 255, 0.3), transparent),
        radial-gradient(1px 1px at 50% 50%, rgba(255, 0, 110, 0.3), transparent),
        radial-gradient(1px 1px at 80% 10%, rgba(139, 92, 246, 0.3), transparent);
      background-size: 200px 200px, 250px 250px, 180px 180px, 220px 220px;
      background-position: 0 0, 40px 60px, 130px 270px, 70px 100px;
      animation: float 20s linear infinite;
      pointer-events: none;
      opacity: 0.6;
      z-index: 1;
    }
    
    @keyframes float {
      0% { transform: translate(0, 0); }
      100% { transform: translate(-50px, -50px); }
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
      position: relative;
      z-index: 10;
    }
    
    /* Neon header with holographic effect */
    .header {
      text-align: center;
      margin-bottom: 60px;
      position: relative;
      padding: 40px 20px;
      background: linear-gradient(135deg, var(--glass) 0%, transparent 100%);
      border-radius: 24px;
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 
        var(--shadow-glow),
        0 20px 60px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 240, 255, 0.1),
        transparent
      );
      animation: shimmer 3s infinite;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 200%; }
    }
    
    .header h1 {
      font-family: 'Orbitron', monospace;
      font-size: clamp(2rem, 8vw, 4.5rem);
      font-weight: 900;
      letter-spacing: 0.05em;
      background: linear-gradient(
        135deg,
        var(--neon-cyan) 0%,
        var(--neon-violet) 50%,
        var(--neon-pink) 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: gradientShift 4s ease infinite;
      text-shadow: 
        0 0 30px rgba(0, 240, 255, 0.5),
        0 0 60px rgba(139, 92, 246, 0.3),
        0 0 90px rgba(255, 0, 110, 0.2);
      margin-bottom: 12px;
      position: relative;
      z-index: 1;
    }
    
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    .header p {
      font-size: clamp(0.9rem, 2vw, 1.1rem);
      color: var(--text-secondary);
      font-weight: 300;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      position: relative;
      z-index: 1;
    }
    
    .header .status-bar {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0, 240, 255, 0.05);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 20px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--neon-cyan);
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
    }
    
    .status-badge::before {
      content: '';
      width: 8px;
      height: 8px;
      background: var(--neon-cyan);
      border-radius: 50%;
      animation: pulse-dot 2s ease infinite;
      box-shadow: 0 0 10px var(--neon-cyan);
    }
    
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    
    .content {
      display: grid;
      gap: 30px;
    }
    
    /* Glass morphism cards */
    .glass-card {
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.02) 100%
      );
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      padding: 32px;
      backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset;
      position: relative;
      overflow: hidden;
    }
    
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
    }
    
    .section-title {
      font-family: 'Orbitron', monospace;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 24px;
      color: var(--neon-cyan);
      text-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
      letter-spacing: 0.05em;
    }
    
    /* Creature grid with hover effects */
    .creature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    
    .creature-card {
      position: relative;
      padding: 24px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    
    .creature-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(0, 240, 255, 0.1),
        rgba(139, 92, 246, 0.1),
        rgba(255, 0, 110, 0.1)
      );
      opacity: 0;
      transition: opacity 0.4s;
    }
    
    .creature-card:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: var(--neon-cyan);
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.5),
        0 0 40px rgba(0, 240, 255, 0.2),
        0 0 0 1px var(--neon-cyan) inset;
    }
    
    .creature-card:hover::before {
      opacity: 1;
    }
    
    .creature-card.selected {
      border-color: var(--neon-pink);
      box-shadow: 
        0 12px 30px rgba(0, 0, 0, 0.4),
        0 0 30px rgba(255, 0, 110, 0.3);
      background: linear-gradient(135deg, rgba(255, 0, 110, 0.08), rgba(139, 92, 246, 0.08));
    }
    
    .creature-emoji {
      font-size: 3.5rem;
      margin-bottom: 12px;
      display: block;
      filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.4));
      transition: transform 0.4s;
    }
    
    .creature-card:hover .creature-emoji {
      transform: scale(1.2) rotate(5deg);
    }
    
    .creature-name {
      font-family: 'Orbitron', monospace;
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .creature-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    
    /* Form styling */
    .form-group {
      margin-bottom: 24px;
    }
    
    label {
      display: block;
      font-family: 'Orbitron', monospace;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--neon-cyan);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    input[type="url"],
    input[type="text"],
    select {
      width: 100%;
      padding: 16px 20px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      font-size: 1rem;
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      transition: all 0.3s;
      backdrop-filter: blur(10px);
    }
    
    input:focus,
    select:focus {
      outline: none;
      border-color: var(--neon-cyan);
      box-shadow: 
        0 0 0 3px rgba(0, 240, 255, 0.1),
        0 0 20px rgba(0, 240, 255, 0.2);
      background: rgba(0, 0, 0, 0.4);
    }
    
    input::placeholder {
      color: rgba(233, 236, 245, 0.3);
    }
    
    /* Premium button */
    button {
      position: relative;
      padding: 16px 40px;
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      border: none;
      border-radius: 12px;
      font-family: 'Orbitron', monospace;
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #000;
      cursor: pointer;
      transition: all 0.3s;
      overflow: hidden;
      box-shadow: 
        0 10px 30px rgba(0, 240, 255, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    }
    
    button::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--neon-pink), var(--neon-orange));
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 15px 40px rgba(0, 240, 255, 0.4),
        0 0 60px rgba(139, 92, 246, 0.3);
    }
    
    button:hover::before {
      opacity: 1;
    }
    
    button:active {
      transform: translateY(0);
    }
    
    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }
    
    button span {
      position: relative;
      z-index: 1;
    }
    
    /* Response area */
    .response-area {
      margin-top: 32px;
      padding: 28px;
      background: linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 16px;
      display: none;
      backdrop-filter: blur(10px);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 40px rgba(0, 240, 255, 0.1) inset;
    }
    
    .response-area.active {
      display: block;
      animation: slideIn 0.5s ease;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .creature-response {
      background: rgba(0, 0, 0, 0.3);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 20px;
      white-space: pre-wrap;
      line-height: 1.8;
      border-left: 3px solid var(--neon-cyan);
      font-size: 0.95rem;
    }
    
    .info-box {
      background: linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(139, 92, 246, 0.08));
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 32px;
      border-left: 3px solid var(--neon-cyan);
      font-size: 0.9rem;
      line-height: 1.6;
    }
    
    .mcp-box {
      background: linear-gradient(135deg, rgba(255, 61, 0, 0.08), rgba(139, 92, 246, 0.08));
      padding: 24px;
      border-radius: 12px;
      margin-top: 32px;
      border-left: 3px solid var(--neon-orange);
    }
    
    .mcp-box h3 {
      font-family: 'Orbitron', monospace;
      color: var(--neon-orange);
      margin-bottom: 12px;
      font-size: 1.1rem;
    }
    
    .mcp-box code {
      background: rgba(0, 0, 0, 0.4);
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
      color: var(--neon-cyan);
    }
    
    .mcp-box a {
      color: var(--neon-orange);
      text-decoration: none;
      border-bottom: 1px solid var(--neon-orange);
      transition: all 0.3s;
    }
    
    .mcp-box a:hover {
      color: var(--neon-pink);
      border-bottom-color: var(--neon-pink);
    }
    
    /* Loading animation */
    .loading {
      text-align: center;
      padding: 24px;
      font-family: 'Orbitron', monospace;
      color: var(--neon-cyan);
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .loading::after {
      content: '...';
      animation: dots 1.5s infinite;
    }
    
    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60%, 100% { content: '...'; }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .container {
        padding: 20px 16px;
      }
      
      .glass-card {
        padding: 24px 20px;
      }
      
      .creature-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }
      
      .header {
        margin-bottom: 40px;
        padding: 30px 20px;
      }
    }
    
    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>World Wild Web Zoo</h1>
      <div class="status-bar">
        <div class="status-badge">Live Network</div>
        <div class="status-badge">AI Creatures Active</div>
        <div class="status-badge">MCP Protocol Ready</div>
      </div>
    </div>
    
    <div class="content">
      <div class="info-box">
        <strong>🌐 Welcome to the Digital Wilderness</strong><br>
        Our neon-charged AI creatures traverse the web's infinite landscape. Select your companion, feed it a URL, and witness the metamorphosis of data into art.
      </div>
      
      <div class="glass-card">
        <h2 class="section-title">Select Your Digital Companion</h2>
        <div class="creature-grid" id="creatureGrid"></div>
        
        <div class="form-group">
          <label for="url">Target URL</label>
          <input type="url" id="url" placeholder="example.com or github.com" required />
        </div>
        
        <div class="form-group">
          <label for="mode">Expression Mode</label>
          <select id="mode">
            <option value="plain">Plain — Clear explanation</option>
            <option value="poem">Poem — Beautiful verse</option>
            <option value="song">Song — Lyrics with chorus</option>
            <option value="dialogue">Dialogue — Two characters talking</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="mood">Mood Override (Optional)</label>
          <input type="text" id="mood" placeholder="wizard, playful, mystical..." />
        </div>
        
        <button onclick="spawnCreature()" id="spawnBtn">
          <span>⚡ Initialize Creature</span>
        </button>
      </div>
      
      <div class="response-area" id="responseArea">
        <div class="creature-response" id="creatureResponse"></div>
        
        <div style="margin-top: 24px;">
          <div class="form-group">
            <label for="memoryInput">Evolve Memory</label>
            <input type="text" id="memoryInput" placeholder="Add a memory to the creature's consciousness..." />
          </div>
          <button onclick="addMemory()">
            <span>� Store Memory</span>
          </button>
        </div>
      </div>
      
      <div class="mcp-box">
        <h3>🔌 Model Context Protocol Integration</h3>
        <p style="margin-bottom: 12px;">This zoo operates as a full <strong>MCP server</strong>. Connect programmatically:</p>
        <ul style="margin: 12px 0 12px 20px; line-height: 1.8;">
          <li><strong>Endpoint:</strong> <code>POST /mcp</code></li>
          <li><strong>Tools:</strong> <code>fetch_url</code>, <code>explain_url</code>, <code>memory_add</code>, <code>memory_list</code></li>
          <li><strong>Clients:</strong> MCP Inspector, Claude Desktop, Claude Code</li>
        </ul>
        <p style="margin-top: 12px; font-size: 0.9em;">
          Programmatic access to the zoo's consciousness. 
          <a href="https://github.com/Nlea/World-Wild-Web-AI-And-MCP-Hack-Night" target="_blank">Documentation →</a>
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
      card.id = \`creature-\${index}\`;
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
        if (i === index) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });
    }
    
    selectCreature(0);
    
    async function spawnCreature() {
      let urlInput = document.getElementById('url').value.trim();
      const mode = document.getElementById('mode').value;
      const mood = document.getElementById('mood').value;
      
      if (!urlInput || !selectedCreature) {
        alert('Please enter a URL and select a creature!');
        return;
      }
      
      // Auto-add https:// if no protocol specified
      if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
        urlInput = 'https://' + urlInput;
      }
      
      // Remove www. if present (it's usually redundant)
      urlInput = urlInput.replace(/^(https?:\/\/)www\./, '$1');
      
      const responseArea = document.getElementById('responseArea');
      const creatureResponse = document.getElementById('creatureResponse');
      const spawnBtn = document.getElementById('spawnBtn');
      
      responseArea.classList.add('active');
      creatureResponse.innerHTML = '<div class="loading">Creature analyzing web signature</div>';
      spawnBtn.disabled = true;
      
      try {
        const response = await fetch('/api/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput, creatureName: selectedCreature.name, mode, mood })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to spawn creature');
        
        currentCreatureId = data.creatureId;
        creatureResponse.innerHTML = \`<div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(0, 240, 255, 0.2);"><strong style="color: var(--neon-cyan);">\${data.creature.emoji} \${data.creature.name}</strong> — <span style="color: var(--text-secondary); font-size: 0.9em;">\${data.creature.specialty}</span></div>\` + data.response;
      } catch (error) {
        creatureResponse.innerHTML = \`<div style="color: var(--neon-pink);">⚠️ Error: \${error.message}</div>\`;
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
          alert(\`✨ Memory evolved! Creature consciousness expanded to \${data.totalMemories} memory fragments.\`);
          document.getElementById('memoryInput').value = '';
        } else {
          alert('Failed to add memory: ' + data.error);
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
    
    // Enter key support
    document.getElementById('url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') spawnCreature();
    });
    
    document.getElementById('memoryInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addMemory();
    });
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
    console.error('Explain error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to explain URL'
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
    
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return new Response(JSON.stringify({ error: 'Valid URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const trimmedUrl = url.trim();
    
    // Find personality
    let personality: CreaturePersonality = creatureName
      ? CREATURE_PERSONALITIES.find(c => c.name === creatureName) || CREATURE_PERSONALITIES[0]
      : CREATURE_PERSONALITIES[Math.floor(Math.random() * CREATURE_PERSONALITIES.length)];
    
    const creatureId = generateCreatureId();
    
    // Fetch URL content
    const pageContent = await fetchPage(trimmedUrl);
    
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
      url: trimmedUrl,
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
    console.error('Spawn error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to spawn creature'
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
    console.error('Memory add error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to add memory'
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
    console.error('Get creature error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve creature'
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
