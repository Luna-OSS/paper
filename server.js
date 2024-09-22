const os = require('os');
const express = require('express');
const schedule = require('node-schedule');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3101;
const expirationHours = process.env.EXPIRATION_HOURS || 24;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));
const papers = {};

function removePaper(id) {
  delete papers[id];
}

app.post('/api/papers', (req, res) => {
  const { content } = req.body;
  const id = uuidv4();
  const createdAt = Date.now();
  
  papers[id] = { content, createdAt };
  
  setTimeout(() => removePaper(id), expirationHours * 60 * 60 * 1000);
  
  res.json({ id, createdAt });
});

app.get('/api/papers', (req, res) => {
  const papersList = Object.entries(papers)
    .map(([id, paper]) => ({
      id,
      content: paper.content,
      createdAt: paper.createdAt
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  
  res.json(papersList);
});

app.get('/paper/:id', (req, res) => {
  const paper = papers[req.params.id];
  if (paper) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paper View</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f5f5f5;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 15px;
          }
          .controls {
            margin-top: 20px;
          }
          button {
            background-color: #007AFF;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          }
          button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <script>
          function copyContent() {
            const content = document.getElementById('paperContent').textContent;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(content)
                .then(() => alert('Content copied to clipboard!'))
                .catch(err => {
                  console.error('Failed to copy: ', err);
                  fallbackCopyTextToClipboard(content);
                });
            } else {
              fallbackCopyTextToClipboard(content);
            }
          }

          function fallbackCopyTextToClipboard(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
              const successful = document.execCommand('copy');
              const msg = successful ? 'successful' : 'unsuccessful';
              console.log('Fallback: Copying text command was ' + msg);
              alert('Content copied to clipboard!');
            } catch (err) {
              console.error('Fallback: Oops, unable to copy', err);
              alert('Failed to copy content. Please try selecting and copying manually.');
            }

            document.body.removeChild(textArea);
          }
        </script
        <h1>Paper Content</h1>
        <pre id="paperContent">${paper.content}</pre>
        <div class="controls">
          <button onclick="copyContent()">Copy</button>
          <button onclick="window.location.href = '/'">Home</button>
        </div>
        <script>
          function copyContent() {
            const content = document.getElementById('paperContent').textContent;
            navigator.clipboard.writeText(content)
              .then(() => alert('Content copied to clipboard!'))
              .catch(err => console.error('Error copying content: ', err));
          }
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } else {
    res.status(404).send('Paper not found');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
          const alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
              return alias.address;
          }
      }
  }
  return '0.0.0.0';
}

let currentIP = getLocalIPAddress();

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://${currentIP}:${port}`);
});

// Schedule server restart every 24 hours
schedule.scheduleJob('0 0 * * *', () => {
  console.log('Restarting server...');
  server.close(() => {
      currentIP = getLocalIPAddress();
      server.listen(port, () => {
          console.log(`Server restarted. New IP: ${currentIP}`);
      });
  });
});
