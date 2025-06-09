import amqp from 'amqplib';

export class RabbitMQService {
  constructor(exchangeName = 'default.exchange') {
    this.connection = null;
    this.channel = null;
    this.exchangeName = exchangeName; 
  }

  async connect() {
    try {
      const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitMQUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });

      console.log(`RabbitMQ conectado com sucesso no exchange: ${this.exchangeName}`);
      return true;
    } catch (error) {
      console.error('Erro ao conectar com RabbitMQ:', error);
      return false;
    }
  }

  async publishMessage(messageData, routingKey) {
    try {
      if (!this.channel) {
        await this.connect();
      }

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

      console.log(`Mensagem publicada no exchange "${this.exchangeName}" com routingKey "${routingKey}"`);
      return true;
    } catch (error) {
      console.error('Erro ao publicar mensagem no RabbitMQ:', error);
      return false;
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

      console.log(`Consumo iniciado na fila "${queueName}"`);
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