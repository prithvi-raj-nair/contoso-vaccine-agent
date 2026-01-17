import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

// Store connected UI clients for broadcasting messages
const uiClients = new Set();

// Receive messages from MCP server
app.post('/message', (req, res) => {
  const { message } = req.body;

  // Broadcast to all connected UI clients
  for (const client of uiClients) {
    client.write(`data: ${JSON.stringify({ message })}\n\n`);
  }

  res.json({ ok: true });
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

app.listen(PORT, () => {
  console.log(`Web UI running at http://localhost:${PORT}`);
});
