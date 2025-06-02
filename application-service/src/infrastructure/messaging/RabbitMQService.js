import amqp from 'amqplib';

export class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = 'chat.messages';
  }

  async connect() {
    try {
      const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitMQUrl);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });

      console.log('RabbitMQ conectado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao conectar com RabbitMQ:', error);
      return false;
    }
  }

  async publishMessage(messageData) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const routingKey = `chat.${messageData.chatId}`;
      const messageBuffer = Buffer.from(JSON.stringify(messageData));

      await this.channel.publish(
        this.exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now()
        }
      );

      return true;
    } catch (error) {
      console.error('Erro ao publicar mensagem no RabbitMQ:', error);
      return false;
    }
  }

  async createQueue(queueName, routingKey) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const queue = await this.channel.assertQueue(queueName, {
        durable: true
      });

      await this.channel.bindQueue(queue.queue, this.exchangeName, routingKey);
      return queue;
    } catch (error) {
      console.error('Erro ao criar fila no RabbitMQ:', error);
      throw error;
    }
  }

  async consumeMessages(queueName, callback) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      await this.channel.consume(queueName, (message) => {
        if (message) {
          try {
            const messageData = JSON.parse(message.content.toString());
            callback(messageData);
            this.channel.ack(message);
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            this.channel.nack(message, false, false);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao consumir mensagens:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('RabbitMQ desconectado');
    } catch (error) {
      console.error('Erro ao desconectar RabbitMQ:', error);
    }
  }
} 