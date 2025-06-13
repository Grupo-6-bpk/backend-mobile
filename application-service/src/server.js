import { createServer } from 'http';
import app from './app.js';
import { SocketHandler } from './infrastructure/websocket/SocketHandler.js';
import { RabbitMQService } from './infrastructure/messaging/RabbitMQService.js';
import { setSocketIO } from './presentation/controllers/chatController.js';
import prisma from './infrastructure/config/prismaClient.js';

const PORT = process.env.PORT || 4040;

// Criar servidor HTTP
const server = createServer(app);

// Configurar WebSocket
const socketHandler = new SocketHandler(server);

// Configurar referência do Socket.IO no controller
setSocketIO(socketHandler.getIO());

// Configurar RabbitMQ
const rabbitMQ = new RabbitMQService();

// Inicializar servidor
server.listen(PORT, '0.0.0.0', async () => {
  console.log('✅ WebSocket configurado');
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log('✅ Chat module loaded with WebSocket and RabbitMQ support');
  
  try {
    await rabbitMQ.connect();
    console.log('✅ RabbitMQ conectado');
    await rabbitMQ.createQueue('user.queue', 'user.events*');
    console.log('✅ Filas criadas: user.queue');

    await rabbitMQ.channel.assertQueue('monolith.user.queue', { durable: true });
    await rabbitMQ.channel.bindQueue('monolith.user.queue', 'user.validation.events', 'user.validation.events.driver.validation.accepted');
    await rabbitMQ.channel.bindQueue('monolith.user.queue', 'user.validation.events', 'user.validation.events.passenger.validation.accepted');
    await rabbitMQ.channel.bindQueue('monolith.user.queue', 'user.validation.events', 'user.validation.events.driver.validation.rejected');
    await rabbitMQ.channel.bindQueue('monolith.user.queue', 'user.validation.events', 'user.validation.events.passenger.validation.rejected'); 

    console.log('✅ Bindings criados para user.queue');

    await rabbitMQ.channel.consume('monolith.user.queue', async (message) => {
      const content = JSON.parse(message.content.toString());
      const routingKey = message.fields.routingKey;

      console.log(`🔔 Mensagem recebida: ${routingKey}`, content);

      switch (routingKey) {
        case 'user.validation.events.passenger.validation.accepted':
          await prisma.passenger.update({
            where: { userId: content.userId },
            data: { isVerified: true }
          });
          break;
        case 'user.validation.events.passenger.validation.rejected':
          await prisma.passenger.update({
            where: { userId: content.userId },
            data: { isVerified: false }
          });
          break;
        case 'user.validation.events.driver.validation.accepted':
          await prisma.driver.update({
            where: { userId: content.userId },
            data: { isVerified: true }
          });
          break;
        case 'user.validation.events.driver.validation.rejected':
          await prisma.driver.update({
            where: { userId: content.userId },
            data: { isVerified: false }
          });
          break;
        default:
          console.warn(`🔍 Routing key desconhecido: ${routingKey}`);
          rabbitMQ.channel.nack(message);
          return;
      }      


      rabbitMQ.channel.ack(message);
    });

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
