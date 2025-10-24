# 🌐 World Wild Web Zoo ✨

An AI-powered zoo living on Cloudflare Workers — each creature reads the web, explains it, and sings its story!

![World Wild Web Zoo](https://github.com/user-attachments/assets/95bb8309-900c-4514-9be1-08a7681a3165)

> **Try it live!** Once deployed, just pick a creature, enter any URL, and watch the magic happen! 🪄

## 🎪 What is this?

The World Wild Web Zoo is a magical place where AI creatures roam the internet! Each creature has its own unique personality and can visit any website you give them. They'll read the site, understand it, and tell you all about it in their own creative way:

- 🎵 **Melody the Web Songbird** - Transforms websites into melodious songs and rhythmic verses
- 🦉 **Verse the Poetry Owl** - Crafts beautiful haikus and poems about the digital realm
- 🦊 **Glitch the Chaos Fox** - Finds humor and absurdity in every corner of the internet
- 🦫 **Binary the Tech Beaver** - Builds detailed technical explanations with engineering precision
- 🐢 **Story the Tale Turtle** - Weaves epic narratives about websites and their journeys

## ✨ Features

- **AI-Powered Analysis**: Creatures use Cloudflare Workers AI to understand and explain websites
- **Creative Interpretations**: Each creature offers unique perspectives - technical, poetic, musical, or chaotic!
- **Multiple Expression Modes**: Plain, Poem, Song, or Dialogue - let creatures tell their story in different ways
- **Interactive Chat**: Talk to the creatures and ask them questions about the websites they've explored
- **Persistent Memory**: Creature encounters are stored in Workers KV for 24 hours
- **Beautiful UI**: A colorful, fun interface that makes exploring the web magical
- **🔌 MCP Server**: Standards-compliant Model Context Protocol server for programmatic access

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or later
- A Cloudflare account (free tier works!)
- Wrangler CLI (installed via npm)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/wildhash/world-wild-web-zoo.git
cd world-wild-web-zoo
```

2. Install dependencies:
```bash
npm install
```

3. Set up Cloudflare Workers KV:
```bash
# Create a KV namespace for production
wrangler kv:namespace create "CREATURE_KV"

# Create a KV namespace for preview/development
wrangler kv:namespace create "CREATURE_KV" --preview
```

4. Update `wrangler.toml` with your KV namespace IDs (from the output above)

5. Enable Workers AI in your Cloudflare account (it's free for the first 10,000 requests per day!)

### Development

Run the development server:
```bash
npm run dev
```

Visit `http://localhost:8787` to see your zoo!

Run tests:
```bash
npm test
```

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

Your zoo will be live at `https://world-wild-web-zoo.<your-subdomain>.workers.dev`!

## 🎮 How to Use

### Web Interface

1. **Choose a Creature**: Pick one of the five unique creatures from the zoo
2. **Enter a URL**: Give the creature any website URL to explore
3. **Select Mode**: Choose how the creature should express itself (Plain, Poem, Song, Dialogue)
4. **Set Mood** (optional): Give the creature a mood like "wizard", "playful", or "mystical"
5. **Spawn & Explore**: Click the button and watch the creature analyze the website
6. **Add Memories**: Use the memory input to give the creature new experiences

### 🔌 MCP (Model Context Protocol) Integration

The zoo is now a **standards-compliant MCP server**! Connect programmatically using any MCP client:

#### Available Tools

- **`fetch_url`** - Fetches and extracts content from any URL
- **`explain_url`** - AI creature explains a website with optional mode and mood
- **`memory_add`** - Add a memory to a creature's memory bank
- **`memory_list`** - Retrieve all memories for a creature

#### Connecting with MCP Clients

**MCP Inspector** (Local Testing)
```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector http://localhost:8787/mcp
```

**Claude Desktop** (Add to `claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "world-wild-web-zoo": {
      "url": "https://your-worker.workers.dev/mcp"
    }
  }
}
```

**Claude Code / VS Code**
Add the MCP server endpoint in your IDE's MCP settings.

#### Example MCP Request

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "explain_url",
      "arguments": {
        "url": "https://github.com",
        "mode": "song",
        "mood": "playful"
      }
    },
    "id": 1
  }'
```

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript with a colorful, gradient-heavy UI
- **Backend**: Cloudflare Workers with TypeScript and itty-router
- **AI**: Workers AI using Meta's Llama 3.1 8B Instruct
- **Storage**: Workers KV for creature state and conversation history
- **MCP Server**: mcp-lite for standards-compliant Model Context Protocol support
- **Validation**: Zod for schema validation and type safety

## 🎨 Customization

Want to add your own creature? Edit `src/agent.ts` and add a new personality to the `CREATURE_PERSONALITIES` array:

```typescript
{
  name: 'Your Creature Name',
  emoji: '🦄',
  specialty: 'your-specialty',
  description: 'What makes your creature special',
  systemPrompt: 'Instructions for how the AI should behave'
}
```

## 🐛 Known Limitations

- Creatures can only read publicly accessible websites
- JavaScript-heavy sites might not be fully understood (we extract HTML text)
- Conversation history is limited to the last 6 messages for context
- Creatures expire after 24 hours (they need their rest!)

## 📝 License

MIT - Feel free to create your own zoo!

## 🎓 What We Learned

Building an MCP server on Cloudflare Workers taught us:

- **mcp-lite on Workers**: Successfully deployed a standards-compliant MCP server on Cloudflare's edge
- **KV as Memory**: Workers KV provides perfect 24-hour creature memories across the globe
- **Prompt Engineering**: Different modes (poem, song, dialogue) require careful prompt crafting
- **Edge Fetch Caveats**: Not all websites are accessible from Workers; some block or limit edge requests
- **Type Safety**: TypeScript + Zod schemas ensure robust tool definitions and validation
- **Modular Design**: Separating concerns (agent, fetch, MCP) makes the codebase maintainable

## 🙏 Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by [Workers AI](https://developers.cloudflare.com/workers-ai/)
- MCP integration via [mcp-lite](https://github.com/fiberplane/mcp-lite)
- Inspired by the weird and wonderful corners of the internet
- Part of the [World Wild Web AI + MCP Hack Night](https://github.com/Nlea/World-Wild-Web-AI-And-MCP-Hack-Night)

## 🌟 Contributing

Found a bug? Want to add a new creature? PRs welcome! This is a creative project meant to be fun and experimental.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding new creatures and features.

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment checklist
- **[EXAMPLES.md](EXAMPLES.md)** - Example creature outputs and use cases
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and technical details
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## 🔗 Quick Links

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Report Issues](https://github.com/wildhash/world-wild-web-zoo/issues)

---

Made with ✨ and a lot of imagination

**Status**: ✅ Production Ready | 🔒 Security Verified | 🎨 Fully Documented
