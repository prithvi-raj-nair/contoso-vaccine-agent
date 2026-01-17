# Connecting Local MCP Servers to Claude Desktop

## Key Insight

Claude Desktop does **not** connect to localhost MCP servers via HTTP/HTTPS URLs. Instead, it launches MCP servers as **subprocesses** using stdio transport.

## Configuration

In `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server.js"]
    }
  }
}
```

## Architecture Pattern for Apps with UI

Since the MCP server runs as a Claude Desktop subprocess (stdio), it cannot directly serve a web UI. Use two separate processes:

```
┌─────────────────┐         ┌─────────────────┐
│  Claude Desktop │         │    Browser      │
└────────┬────────┘         └────────┬────────┘
         │ stdio                     │ HTTP
         ▼                           ▼
┌─────────────────┐  HTTP   ┌─────────────────┐
│   MCP Server    │────────▶│    Web UI       │
│ (mcp-server.js) │  POST   │  (web-ui.js)    │
└─────────────────┘         └─────────────────┘
```

- **MCP Server**: Uses `StdioServerTransport`, called by Claude Desktop
- **Web UI**: Separate Express server, receives updates from MCP server via internal HTTP calls
