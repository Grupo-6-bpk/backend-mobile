import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Event Broker Service',
    description: 'Event Broker for handling and distributing events across microservices'
  },
  servers: [
    {
      url: 'http://localhost:4041',
      description: 'Development server'
    }
  ],
  components: {
    schemas: {
      Event: {
        id: 1,
        type: 'user.created',
        payload: {
          userId: 123,
          email: 'user@example.com'
        },
        status: 'pending',
        createdAt: '2025-05-18T12:00:00Z',
        processedAt: null,
        retryCount: 0,
        sourceService: 'api-service',
        targetService: 'notification-service'
      },
      EventCreate: {
        type: 'user.created',
        payload: {
          userId: 123,
          email: 'user@example.com'
        },
        sourceService: 'api-service',
        targetService: 'notification-service'
      },
      Subscription: {
        id: 1,
        eventType: 'user.created',
        serviceName: 'notification-service',
        active: true,
        createdAt: '2025-05-18T12:00:00Z',
        updatedAt: '2025-05-18T12:00:00Z'
      },
      SubscriptionCreate: {
        eventType: 'user.created',
        serviceName: 'notification-service',
        active: true
      },
      ServiceHealth: {
        status: 'UP',
        service: 'event-broker',
        timestamp: '2025-05-18T12:00:00Z'
      },
      ErrorResponse: {
        code: 500,
        message: 'Internal Server Error'
      }
    }
  },
  tags: [
    {
      name: 'Events',
      description: 'Event publishing and retrieval endpoints'
    },
    {
      name: 'Subscriptions',
      description: 'Endpoints to manage service subscriptions to event types'
    },
    {
      name: 'Health',
      description: 'Service health check endpoints'
    }
  ],
  securityDefinitions: {
    apiKey: {
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key'
    }
  }
};

const outputFile = './src/swagger.json';
const endpointsFiles = ['./src/presentation/routes/*.js'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log('Swagger documentation generated successfully');
  })
  .catch(error => {
    console.error('Error generating Swagger documentation:', error);
  });
