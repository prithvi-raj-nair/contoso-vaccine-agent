## Project Objective

Demo AI agent to assist healthcare workers in Contoso's national vaccination program. A Custom GPT connects to two backend apps to help medical officers schedule village visits, order vaccines, and generate reports, while on-ground workers can check schedules, fetch patient data, and record vaccinations.

## Apps

| Folder | Purpose | Stack | Status |
|--------|---------|-------|--------|
| `simplecal/` | Calendar app for scheduling outreach visits | Next.js 14, Tailwind CSS, MongoDB | Implemented |
| `nhdb-app/` | National Health Database app for patient records and vaccination tracking | Next.js 16, Tailwind CSS, MongoDB | Implemented |
| `vercel-gpt-hello/` | POC for Custom GPT API integration | Vercel Serverless Functions, MongoDB | POC |
| `mcp-hello-server/` | POC for Claude Desktop MCP integration | Node.js, Express, MCP SDK | POC |

## Commands

### simplecal
```bash
cd simplecal
npm install
npm run dev      # Local development on port 3001
vercel --prod    # Deploy to production
```

### nhdb-app
```bash
cd nhdb-app
npm install
npm run dev      # Local development on port 3002
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

## Environment Variables

- **MONGODB_URI**: MongoDB Atlas connection string (store in `.env.local` for Vercel apps)

## UI Development with Playwright MCP

When making UI changes or doing front-end development, use Playwright MCP to verify your work:

1. **Navigate to the page**: Use `mcp__playwright__browser_navigate` to open the relevant URL (e.g., `http://localhost:3001` for simplecal or `http://localhost:3002` for nhdb-app)
2. **Capture the page state**: Use `mcp__playwright__browser_snapshot` to get an accessibility snapshot of the current page - this is preferred over screenshots for understanding page structure
3. **Take screenshots**: Use `mcp__playwright__browser_take_screenshot` to capture visual state for analyzing layout, styling, and visual regressions
4. **Interact with elements**: Use `mcp__playwright__browser_click`, `mcp__playwright__browser_type`, and other interaction tools to test functionality
5. **Verify changes**: After making code changes, refresh the page and take new snapshots/screenshots to confirm the UI updates are correct

### Workflow Example
```
1. Start dev server: npm run dev
2. Navigate: browser_navigate to localhost:3000
3. Snapshot: browser_snapshot to understand current state
4. Make code changes
5. Refresh and re-snapshot to verify changes
6. Screenshot for visual confirmation if needed
```

Always verify UI changes visually before considering front-end work complete.
