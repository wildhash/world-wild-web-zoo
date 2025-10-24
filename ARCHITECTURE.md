# Architecture Overview

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  (Colorful HTML with creature selection and URL input)          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 1. User selects creature & enters URL
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKER                              │
│                     (src/worker.ts)                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Endpoint: POST /api/spawn                              │    │
│  │  - Validates URL input                                  │    │
│  │  - Selects creature personality                         │    │
│  │  - Generates unique creature ID                         │    │
│  └─────────────┬──────────────────────────────────────────┘    │
│                │                                                 │
│                │ 2. Fetch URL content                           │
│                ▼                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  fetchUrlContent()                                      │    │
│  │  - Makes HTTP request to target URL                     │    │
│  │  - Strips HTML tags                                     │    │
│  │  - Extracts text content (first 3000 chars)             │    │
│  └─────────────┬──────────────────────────────────────────┘    │
│                │                                                 │
│                │ 3. Send to AI                                  │
│                ▼                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  generateCreatureResponse()                             │    │
│  │  - Builds prompt with creature personality              │    │
│  │  - Includes URL content as context                      │    │
│  │  - Calls Workers AI (Llama 3.1 8B)                      │    │
│  └─────────────┬──────────────────────────────────────────┘    │
│                │                                                 │
└────────────────┼─────────────────────────────────────────────────┘
                 │
                 │ 4. Store result
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKERS KV STORAGE                            │
│                                                                   │
│  Key: creature-{timestamp}-{random}                             │
│  Value: {                                                        │
│    id: "creature-...",                                          │
│    personality: {...},                                          │
│    url: "https://...",                                          │
│    conversationHistory: [...]                                   │
│  }                                                               │
│  TTL: 24 hours                                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 5. Return response
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACK TO USER INTERFACE                         │
│  - Display creature's response                                   │
│  - Enable chat functionality                                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 6. User asks follow-up question
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Endpoint: POST /api/chat                            │
│  - Retrieve creature from KV                                     │
│  - Include conversation history                                  │
│  - Generate new AI response                                      │
│  - Update conversation in KV                                     │
│  - Return response                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Creature Personalities

Each creature has:
- **Name**: Unique identifier and character name
- **Emoji**: Visual representation
- **Specialty**: Type of interpretation (musical, poetic, etc.)
- **Description**: User-facing explanation
- **System Prompt**: Instructions for the AI model

### 2. Workers AI Integration

Uses Cloudflare's Workers AI with:
- **Model**: `@cf/meta/llama-3.1-8b-instruct`
- **Max Tokens**: 1024
- **Temperature**: 0.8 (for creativity)
- **Context**: URL content + creature personality + conversation history

### 3. Workers KV Storage

Stores:
- Creature ID (unique per spawn)
- Selected personality
- Original URL
- Full conversation history
- Timestamp

Benefits:
- Persistence across requests
- 24-hour TTL (creatures "rest")
- Fast global access

### 4. HTML Interface

Features:
- Creature selection grid
- URL input form
- Response display area
- Interactive chat box
- Gradient styling
- Responsive design

## Data Flow Examples

### Example 1: First Time Spawn

```
User Input:
  Creature: "Melody the Web Songbird"
  URL: "https://github.com"

↓ Process URL
  Fetch content → Extract text from GitHub homepage

↓ Generate Response
  AI Prompt: "You are Melody, a cheerful songbird..."
  Context: "[GitHub homepage text...]"
  
↓ Store & Return
  KV: creature-1698765432-abc123 → {personality: Melody, ...}
  Response: "🎵 Oh GitHub, where code commits flow..."
```

### Example 2: Follow-up Chat

```
User Input:
  Creature ID: "creature-1698765432-abc123"
  Message: "Can you make it shorter?"

↓ Retrieve Context
  KV: Get creature data with history

↓ Generate Response
  AI Prompt: [System prompt] + [Previous conversation] + "Can you make it shorter?"
  
↓ Update & Return
  KV: Update conversation history
  Response: "🎵 GitHub sings, a coder's delight! 🎶"
```

## Security Considerations

1. **URL Validation**: Checks for valid URL format
2. **Content Limits**: Only first 3000 chars to prevent abuse
3. **Rate Limiting**: Cloudflare's built-in protection
4. **No Credentials**: Never stores or logs user credentials
5. **TTL**: Automatic data expiration after 24 hours
6. **CORS**: Proper origin handling

## MCP Server Integration

The zoo implements a **Model Context Protocol (MCP) server** using `mcp-lite`:

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    MCP CLIENT                                │
│  (MCP Inspector, Claude Desktop, Claude Code, etc.)         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ JSON-RPC 2.0 over HTTP
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP SERVER (src/mcp.ts)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  McpServer + StreamableHttpTransport                  │  │
│  │  - Tool definitions with Zod schemas                  │  │
│  │  - Request validation and routing                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tools Available:                                      │  │
│  │  • fetch_url      - Fetch and extract content         │  │
│  │  • explain_url    - AI creature explains website      │  │
│  │  • memory_add     - Add creature memory               │  │
│  │  • memory_list    - List creature memories            │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ Uses shared modules
                    │
        ┌──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼
   fetchPage   agent.ts   types.ts   CREATURE_KV
     (URL)      (AI)     (schemas)    (storage)
```

### MCP Endpoint
- **Route**: `POST /mcp`
- **Protocol**: JSON-RPC 2.0
- **Transport**: HTTP with streaming support
- **Library**: mcp-lite v0.9.0

### Tool Schemas
All tools use Zod for runtime validation and JSON Schema generation:
```typescript
z.object({
  url: z.string().url(),
  mode: z.enum(['plain', 'poem', 'song', 'dialogue']).optional(),
  mood: z.string().optional()
})
```

### Integration Flow
1. Client sends JSON-RPC request to `/mcp`
2. `StreamableHttpTransport` handles HTTP/streaming
3. `McpServer` routes to appropriate tool handler
4. Tool executes (fetch, AI, KV operations)
5. Response formatted per MCP specification
6. Structured content returned with metadata

### Hackathon Compliance
This implementation follows the [World Wild Web AI + MCP Hack Night](https://github.com/Nlea/World-Wild-Web-AI-And-MCP-Hack-Night) requirements:
- ✅ Uses `mcp-lite` (web SDK for MCP servers)
- ✅ Deployed on Cloudflare Workers
- ✅ Standards-compliant MCP protocol
- ✅ Full tool suite with validation

## Performance

- **Cold Start**: ~100-300ms (Cloudflare Workers)
- **AI Generation**: ~2-5 seconds (depends on response length)
- **URL Fetch**: ~500-2000ms (depends on target site)
- **KV Access**: ~50-100ms (read/write)
- **Total**: ~3-8 seconds per spawn

## Scalability

The architecture scales horizontally:
- Workers run on Cloudflare's global network
- No single point of failure
- Auto-scaling based on demand
- 10,000 free AI requests/day
- Unlimited KV storage (with read/write limits)

## Future Enhancements

Possible additions:
1. More creature personalities
2. Voice output (text-to-speech)
3. Visual generation (creature artwork)
4. Multi-page website analysis
5. Comparison mode (multiple creatures at once)
6. User accounts and creature collections
7. Social sharing of creature encounters
8. Creature evolution based on interactions
