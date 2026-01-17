# CLAUDE.md

## Project Objective

Demo AI agent to assist healthcare workers in Contoso's national vaccination program. A Custom GPT connects to two backend apps to help medical officers schedule village visits, order vaccines, and generate reports, while on-ground workers can check schedules, fetch patient data, and record vaccinations.

## Apps

| Folder | Purpose | Stack |
|--------|---------|-------|
| `simplecal/` | Calendar app for scheduling outreach visits | Next.js (App Router), Tailwind CSS, MongoDB |
| `nhdb-app/` | National Health Database app for patient records and vaccination tracking | Next.js (App Router), Tailwind CSS, MongoDB |
| `vercel-gpt-hello/` | POC for Custom GPT API integration | Vercel Serverless Functions, MongoDB |
| `mcp-hello-server/` | POC for Claude Desktop MCP integration | Node.js, Express, MCP SDK |

## Commands

### simplecal / nhdb-app
```bash
cd simplecal  # or cd nhdb-app
npm install
npm run dev      # Local development on port 3000 (or 3001 for second app)
vercel --prod    # Deploy to production
```

### vercel-gpt-hello
```bash
cd vercel-gpt-hello
npm install
vercel dev       # Local development
vercel --prod    # Deploy to production
```

### mcp-hello-server
```bash
cd mcp-hello-server
npm install
npm start        # Start web UI on port 3001
npm run mcp      # Start MCP server (separate terminal)
```

## Documentation

- `docs/requirements.md` - Detailed requirements, data models, and API specs
- `docs/task-context.md` - Problem context and solution overview
- `docs/custom-gpt-api-call.md` - Guide on Custom GPT API integration
- `docs/connecting-local-mcp.md` - Guide on local MCP server setup

## Environment Variables

- **MONGODB_URI**: MongoDB Atlas connection string (store in `.env.local` for Vercel apps)
