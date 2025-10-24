# 🎬 Two-Minute Demo Script

## Setup (30 seconds)
1. Open the World Wild Web Zoo in your browser
2. Have the MCP Inspector or another MCP client ready

## Demo Flow (90 seconds)

### Part 1: Web Interface (45 seconds)

**Opening Line:**
> "World Wild Web Zoo is a living edge brain. Each AI creature explores the web and can sing, rhyme, or tell stories about what it finds."

**Action 1: Plain Explanation**
1. Select **Binary the Tech Beaver** 🦫
2. Enter URL: `https://github.com`
3. Mode: **Plain**
4. Click "Spawn Creature & Explore"
5. Show: Clear technical explanation + build steps

**Action 2: Creative Mode**
1. Switch to **Melody the Web Songbird** 🎵
2. Same URL or different
3. Mode: **Song**
4. Mood: `playful`
5. Show: Website transformed into lyrics with verses and chorus!

**Action 3: Memory Evolution**
1. Type in memory input: "GitHub powers open source"
2. Click "Evolve Memory"
3. Show: Memory counter increment

### Part 2: MCP Integration (45 seconds)

**Transition:**
> "Now here's the magic - it's also an MCP server, so ANY client can talk to our zoo!"

**Action 4: MCP Client Demo**

Open MCP Inspector or terminal and run:

```bash
# Call explain_url tool via MCP
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "explain_url",
      "arguments": {
        "url": "https://cloudflare.com",
        "mode": "dialogue",
        "mood": "curious"
      }
    },
    "id": 1
  }'
```

Show the response - same quality, different format!

**Action 5: List Tools (if time)**
```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'
```

Show all 4 tools: `fetch_url`, `explain_url`, `memory_add`, `memory_list`

## Closing (15 seconds)

**Final Line:**
> "MCP lets Claude, IDEs, and any client talk to our zoo. Workers makes it instant worldwide. All running on the edge with Workers AI and KV memory!"

**Key Points to Emphasize:**
- ✨ Creative AI outputs (poems, songs, dialogue)
- 🌍 Global edge deployment
- 🔌 Standards-compliant MCP server
- 🧠 Persistent creature memories
- ⚡ Fast responses from Workers AI

## Backup Demos (if needed)

### Different Creature Personalities
- **Verse the Poetry Owl** 🦉 - Haikus and sonnets
- **Glitch the Chaos Fox** 🦊 - Humorous absurdity
- **Story the Tale Turtle** 🐢 - Epic narratives

### MCP Memory Tools
```bash
# Add memory via MCP
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "memory_add",
      "arguments": {
        "creatureId": "creature-123-abc",
        "text": "Learned about edge computing"
      }
    },
    "id": 3
  }'

# List memories via MCP
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "memory_list",
      "arguments": {
        "creatureId": "creature-123-abc"
      }
    },
    "id": 4
  }'
```

## Tips for Success
- Have URLs pre-selected (GitHub, Cloudflare, etc.)
- Test MCP endpoints before demo
- Show contrast between modes (plain vs creative)
- Emphasize the "living edge" aspect
- Keep energy high and fun!
