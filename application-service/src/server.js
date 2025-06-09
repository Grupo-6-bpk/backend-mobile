import { createServer } from 'http';
import app from './app.js';
import { SocketHandler } from './infrastructure/websocket/SocketHandler.js';
import { RabbitMQService } from './infrastructure/messaging/RabbitMQService.js';
import { setSocketIO } from './presentation/controllers/chatController.js';

const PORT = process.env.PORT || 4040;

// Criar servidor HTTP
const server = createServer(app);

// Configurar WebSocket
const socketHandler = new SocketHandler(server);

// Configurar referência do Socket.IO no controller
setSocketIO(socketHandler.getIO());

// Configurar RabbitMQ
const rabbitMQ = new RabbitMQService("user.events");

// Inicializar servidor
server.listen(PORT, '0.0.0.0', async () => {
  console.log('✅ WebSocket configurado');
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log('✅ Chat module loaded with WebSocket and RabbitMQ support');
  
  try {
    await rabbitMQ.connect();
    console.log('✅ RabbitMQ conectado');
    await rabbitMQ.createQueue('user.queue', 'user.events*');
  } catch (error) {
    console.error('❌ Erro ao conectar RabbitMQ:', error);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`📤 ${signal} received, shutting down gracefully`);
  
  try {
    await rabbitMQ.disconnect();
    console.log('RabbitMQ desconectado');
  } catch (error) {
    console.error('Erro ao desconectar RabbitMQ:', error);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
