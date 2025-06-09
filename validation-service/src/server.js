import http from 'node:http';
import app from './app.js';
import { RabbitMQService } from './infrastructure/messaging/RabbitMQService.js';
import prisma from './infrastructure/config/prismaClient.js';

const PORT = process.env.PORT || 4040;
const HOST = '0.0.0.0'; 

const server = http.createServer(app);

const rabbitMQ  = new RabbitMQService();

server.listen(PORT, HOST, async () => {
  console.log(`Server running at http://${HOST}:${PORT}`);

  try {
    await rabbitMQ.connect();
    console.log('RabbitMQ conectado com sucesso');

    await rabbitMQ.channel.assertExchange('user.events', 'topic', { durable: true });
    await rabbitMQ.channel.assertQueue('user.queue', { durable: true });

    await rabbitMQ.channel.bindQueue('user.queue', 'user.events', 'user.events.driver.create');
    await rabbitMQ.channel.bindQueue('user.queue', 'user.events', 'user.events.passenger.create');

    await rabbitMQ.channel.consume('user.queue', async (message) => {
      const content = JSON.parse(message.content.toString());
      const routingKey = message.fields.routingKey;

      console.log(`Mensagem recebida [${routingKey}]:`, content);

      try {
        if (routingKey === 'user.events.driver.create') {
          await prisma.driverValidation.create({
            data: {
              cnh: content.cnh,
              cnh_back: content.cnh_back,
              cnh_front: content.cnh_front,
              bpk_link: content.bpk_link,
              user_id: content.userId,
            }
          });
        } else if (routingKey === 'user.events.passenger.create') {
          await prisma.passengerValidation.create({
            data: {
              user_id: content.userId,
              bpk_link: content.bpk_link,
              rg_back: content.rg_back,
              rg_front: content.rg_front,
            }
          });
        }

        rabbitMQ.channel.ack(message);
      } catch (err) {
        console.error('Erro ao processar mensagem:', err);
        rabbitMQ.channel.nack(message, false, false);
      }
    });

  } catch (error) {
    console.error('Erro ao conectar RabbitMQ:', error);
  }
});


const gracefulShutdown = async (signal) => {
  console.log(`📤 ${signal} received, shutting down gracefully`)
  try {
    await rabbitMQ.disconnect();
    console.log('✅ RabbitMQ desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar RabbitMQ:', error);
  }

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

