import http from 'node:http';
import app from './app.js';
import SocketServer from './infrastructure/websocket/SocketServer.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; 

const server = http.createServer(app);

// Initialize WebSocket Server
const socketServer = new SocketServer(server);

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
  console.log(`🚀 WebSocket server available at ws://${HOST}:${PORT}/socket.io/`);
  console.log(`📊 Connected users: ${socketServer.getConnectedUsersCount()}`);
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down servers...');
  
  // Shutdown WebSocket server
  await socketServer.shutdown();
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Servers shutdown complete');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM received, shutting down servers...');
  
  await socketServer.shutdown();
  
  server.close(() => {
    console.log('✅ Servers shutdown complete');
    process.exit(0);
  });
});
