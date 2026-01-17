#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const mcpServer = new McpServer({
  name: 'hello-server',
  version: '1.0.0',
});

// Register the "print_hello" tool
mcpServer.tool('print_hello', 'Prints a hello message on the web app UI', {}, async () => {
  const message = `Hello! 👋 (${new Date().toLocaleTimeString()})`;

  // Send message to the web UI server
  try {
    await fetch('http://localhost:3001/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    // Web UI might not be running, that's ok
  }

  return {
    content: [{ type: 'text', text: `Message "${message}" was displayed on the UI` }],
  };
});

// Connect using stdio transport
const transport = new StdioServerTransport();
await mcpServer.connect(transport);
