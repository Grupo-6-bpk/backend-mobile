import http from 'node:http';
import app from './app.js';

const PORT = process.env.PORT || 4040;
const HOST = '0.0.0.0'; 

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
