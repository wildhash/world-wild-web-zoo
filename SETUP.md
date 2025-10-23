# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create KV Namespaces

Run these commands and note the IDs:
```bash
# Production namespace
wrangler kv:namespace create "CREATURE_KV"

# Preview namespace (for local development)
wrangler kv:namespace create "CREATURE_KV" --preview
```

### 3. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml` with the IDs from step 2:

```toml
[[kv_namespaces]]
binding = "CREATURE_KV"
id = "your_production_id_here"
preview_id = "your_preview_id_here"
```

### 4. Enable Workers AI

1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages
3. Enable Workers AI (it's free for the first 10,000 requests/day)

### 5. Run Locally

```bash
npm run dev
```

Visit http://localhost:8787

### 6. Deploy

```bash
npm run deploy
```

## Troubleshooting

### "AI binding not found"
Make sure Workers AI is enabled in your Cloudflare dashboard.

### "KV namespace not found"
Double-check that you've updated the IDs in `wrangler.toml` with your actual KV namespace IDs.

### "Failed to fetch URL"
Some websites block automated requests. Try a different URL or ensure the site is publicly accessible.

## Testing Different Creatures

Try these URLs to see different creature personalities in action:

- https://github.com - Tech Beaver loves code repositories
- https://poetry.org - Poetry Owl will have a field day
- https://www.britannica.com - Story Turtle loves encyclopedic content
- https://soundcloud.com - Melody Songbird is perfect for music sites
- https://reddit.com - Glitch Fox finds the chaos hilarious

Enjoy your zoo! 🎪✨
