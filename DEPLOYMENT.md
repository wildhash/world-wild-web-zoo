# Deployment Checklist

Before deploying World Wild Web Zoo to production, ensure you've completed these steps:

## Prerequisites

- [ ] Cloudflare account created
- [ ] Wrangler CLI installed (`npm install -g wrangler` or use `npx wrangler`)
- [ ] Logged into Cloudflare via Wrangler (`wrangler login`)

## Setup Steps

### 1. Create KV Namespaces

```bash
# Create production namespace
wrangler kv:namespace create "CREATURE_KV"

# Note the ID from output, will look like:
# { binding = "CREATURE_KV", id = "abc123..." }

# Create preview namespace for local development
wrangler kv:namespace create "CREATURE_KV" --preview

# Note the preview_id from output
```

### 2. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CREATURE_KV"
id = "your_actual_production_id_here"
preview_id = "your_actual_preview_id_here"
```

### 3. Enable Workers AI

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Overview**
3. Click on **Workers AI** in the sidebar
4. Enable Workers AI (free tier: 10,000 requests/day)

### 4. Test Locally

```bash
npm run dev
```

Visit http://localhost:8787 and test:
- [ ] Page loads correctly
- [ ] All 5 creatures are visible
- [ ] Can enter a URL
- [ ] Can spawn a creature (note: may fail without proper KV/AI setup)
- [ ] Chat functionality works

### 5. Deploy to Production

```bash
npm run deploy
```

Your worker will be deployed to:
`https://world-wild-web-zoo.<your-subdomain>.workers.dev`

### 6. Configure Custom Domain (Optional)

1. Go to Cloudflare Dashboard
2. Navigate to your deployed Worker
3. Click **Triggers** tab
4. Add a custom domain or route

## Post-Deployment Testing

Test these scenarios on your live site:

- [ ] **Simple Website**: Try `https://example.com`
- [ ] **GitHub Repository**: Try `https://github.com/cloudflare/workers-sdk`
- [ ] **News Site**: Try `https://www.bbc.com`
- [ ] **Each Creature**: Test all 5 creature personalities
- [ ] **Chat Functionality**: Ask follow-up questions
- [ ] **Multiple Sessions**: Spawn multiple creatures and verify they're stored separately

## Monitoring

Monitor your Worker's performance:

1. Check usage in Cloudflare Dashboard
2. View logs: `wrangler tail`
3. Monitor KV storage usage
4. Track Workers AI requests (free tier limit: 10k/day)

## Troubleshooting

### "AI binding not found"
- Ensure Workers AI is enabled in your Cloudflare account
- Check that `[ai]` section is in wrangler.toml

### "KV namespace not found"
- Verify namespace IDs are correctly updated in wrangler.toml
- Ensure namespaces were created successfully

### "Failed to fetch URL"
- Some sites block automated requests
- Try a different URL or ensure the site is publicly accessible
- Check Cloudflare's fetch limits

### Slow responses
- First request may be slow (cold start)
- AI generation typically takes 2-5 seconds
- Some websites are slow to fetch

## Cost Considerations

### Free Tier Limits
- **Workers**: 100,000 requests/day
- **Workers AI**: 10,000 requests/day  
- **KV**: 100,000 reads/day, 1,000 writes/day
- **KV Storage**: 1 GB

### Typical Usage
- Each creature spawn = 1 Worker request + 1 AI request + 1 KV write
- Each chat message = 1 Worker request + 1 AI request + 1 KV read + 1 KV write
- Each page load = 1 Worker request

For a small-to-medium traffic site, the free tier is more than sufficient!

## Maintenance

### Update Creatures
Edit `src/index.js` → `CREATURE_PERSONALITIES` array, then redeploy.

### Monitor Storage
Creatures expire after 24 hours automatically (TTL in KV).

### Update Dependencies
```bash
npm update
npm audit fix
```

## Security Notes

✅ **Security Measures in Place:**
- HTML sanitization for URL content extraction
- Input validation for URLs
- No credential storage
- Automatic data expiration (24h TTL)
- CodeQL security scan passed

⚠️ **Important:**
- Never commit secrets to the repository
- Use environment variables for sensitive data
- Keep dependencies updated
- Monitor for unusual usage patterns

## Success Criteria

Your deployment is successful when:
- ✅ Site loads without errors
- ✅ All creatures are displayed
- ✅ URL analysis works
- ✅ AI responses are generated
- ✅ Chat functionality operates
- ✅ No console errors
- ✅ Responses are creative and on-brand

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Issues](https://github.com/wildhash/world-wild-web-zoo/issues)

---

**Ready to launch?** Follow this checklist step by step, and your zoo will be live in minutes! 🎪✨
