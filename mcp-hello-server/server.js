import express from 'express';
import https from 'https';
import fs from 'fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
const PORT = 3000;

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(new URL('./key.pem', import.meta.url)),
  cert: fs.readFileSync(new URL('./cert.pem', import.meta.url)),
};

// Store connected UI clients for broadcasting messages
const uiClients = new Set();

// Store active MCP transports
const mcpTransports = {};

// Create MCP server instance
const mcpServer = new McpServer({
  name: 'hello-server',
  version: '1.0.0',
});

// Register the "print_hello" tool
mcpServer.tool('print_hello', 'Prints a hello message on the web app UI', {}, async () => {
  const message = `Hello! 👋 (${new Date().toLocaleTimeString()})`;

  // Broadcast to all connected UI clients
  for (const client of uiClients) {
    client.write(`data: ${JSON.stringify({ message })}\n\n`);
  }

  return {
    content: [{ type: 'text', text: `Message "${message}" was displayed on the UI` }],
  };
});

// Serve the UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Hello Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    #messages {
      background: white;
      border-radius: 8px;
      padding: 20px;
      min-height: 200px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .message {
      padding: 10px;
      margin: 5px 0;
      background: #e3f2fd;
      border-radius: 4px;
      animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .status {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .connected { color: #4caf50; }
  </style>
</head>
<body>
  <h1>MCP Hello Server</h1>
  <p class="status">Status: <span id="status">Connecting...</span></p>
  <p>MCP endpoint: <code>https://localhost:${PORT}/mcp</code></p>
  <h2>Messages</h2>
  <div id="messages">
    <p style="color: #999;">Waiting for messages from Claude...</p>
  </div>

  <script>
    const messagesDiv = document.getElementById('messages');
    const statusSpan = document.getElementById('status');
    let firstMessage = true;

    const evtSource = new EventSource('/ui-events');

    evtSource.onopen = () => {
      statusSpan.textContent = 'Connected';
      statusSpan.className = 'connected';
    };

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (firstMessage) {
        messagesDiv.innerHTML = '';
        firstMessage = false;
      }
      const msgDiv = document.createElement('div');
      msgDiv.className = 'message';
      msgDiv.textContent = data.message;
      messagesDiv.appendChild(msgDiv);
    };

    evtSource.onerror = () => {
      statusSpan.textContent = 'Disconnected - Reconnecting...';
      statusSpan.className = '';
    };
  </script>
</body>
</html>
  `);
});

// SSE endpoint for UI updates
app.get('/ui-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  uiClients.add(res);

  req.on('close', () => {
    uiClients.delete(res);
  });
});

// MCP SSE endpoint
app.get('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp/messages', res);
  mcpTransports[transport.sessionId] = transport;

  res.on('close', () => {
    delete mcpTransports[transport.sessionId];
  });

  await mcpServer.connect(transport);
});

// MCP message endpoint
app.post('/mcp/messages', express.json(), async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = mcpTransports[sessionId];

  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await transport.handlePostMessage(req, res);
});

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server running at https://localhost:${PORT}`);
  console.log(`MCP endpoint: https://localhost:${PORT}/mcp`);
  console.log(`\nTo configure Claude Desktop, add to your config:`);
  console.log(`{
  "mcpServers": {
    "hello-server": {
      "url": "https://localhost:${PORT}/mcp"
    }
  }
}`);
});
