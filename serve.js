import http from 'http';
import net from 'net';

const TARGET_PORT = 5173;
const PROXY_PORT = 3000;

const proxy = http.createServer((req, res) => {
  const headers = { ...req.headers };
  headers.host = `127.0.0.1:${TARGET_PORT}`;

  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="2"><title>LanceBuddy</title></head><body style="background:#09090b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center;"><h2>Starting LanceBuddy...</h2><p style="color:#a1a1aa;">Connecting to Vite dev server. Auto-refreshing in 2s...</p></div></body></html>`);
  });

  req.pipe(proxyReq, { end: true });
});

// Proxy WebSocket upgrade for Vite HMR
proxy.on('upgrade', (req, clientSocket, head) => {
  const serverSocket = net.connect(TARGET_PORT, '127.0.0.1', () => {
    let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (const [key, value] of Object.entries(req.headers)) {
      rawHeaders += `${key}: ${value}\r\n`;
    }
    rawHeaders += '\r\n';

    serverSocket.write(rawHeaders);
    if (head && head.length > 0) serverSocket.write(head);

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', () => {
    try { clientSocket.destroy(); } catch {}
  });
  clientSocket.on('error', () => {
    try { serverSocket.destroy(); } catch {}
  });
});

proxy.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[Bridge] Port ${PROXY_PORT} proxy active -> forwarding to http://localhost:${TARGET_PORT}/`);
});

proxy.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Bridge] Port ${PROXY_PORT} is in use, skipping bridge.`);
  } else {
    console.error('[Bridge] Proxy error:', err.message);
  }
});
