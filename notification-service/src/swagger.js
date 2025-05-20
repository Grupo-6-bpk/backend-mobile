import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Notification Service',
    description: 'Service for handling and sending notifications'
  },
  servers: [
    {
      url: 'http://localhost:4041',
      description: 'Development server'
    }
  ],
  components: {
    schemas: {
      Notification: {
        id: 1,
        userId: 123,
        title: 'Welcome to Rideshare',
        message: 'Thank you for registering with our service!',
        type: 'email',
        status: 'pending',
        sentAt: null,
        createdAt: '2025-05-18T12:00:00Z',
        updatedAt: '2025-05-18T12:00:00Z',
        metadata: {
          template: 'welcome',
          variables: {
            username: 'John'
          }
        }
      },
      NotificationCreate: {
        userId: 123,
        title: 'Welcome to Rideshare',
        message: 'Thank you for registering with our service!',
        type: 'email',
        metadata: {
          template: 'welcome',
          variables: {
            username: 'John'
          }
        }
      },
      NotificationTemplate: {
        id: 1,
        name: 'welcome',
        type: 'email',
        subject: 'Welcome to Rideshare App',
        content: 'Hello {{username}}, thank you for joining our community!',
        variables: {
          username: 'string'
        },
        createdAt: '2025-05-18T12:00:00Z',
        updatedAt: '2025-05-18T12:00:00Z'
      },
      NotificationTemplateCreate: {
        name: 'welcome',
        type: 'email',
        subject: 'Welcome to Rideshare App',
        content: 'Hello {{username}}, thank you for joining our community!',
        variables: {
          username: 'string'
        }
      },
      UserNotificationPreference: {
        id: 1,
        userId: 123,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        createdAt: '2025-05-18T12:00:00Z',
        updatedAt: '2025-05-18T12:00:00Z'
      },
      UserNotificationPreferenceCreate: {
        userId: 123,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false
      },
      ServiceHealth: {
        status: 'UP',
        service: 'notification-service',
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
      name: 'Notifications',
      description: 'Notification management endpoints'
    },
    {
      name: 'Templates',
      description: 'Notification template management endpoints'
    },
    {
      name: 'Preferences',
      description: 'User notification preferences management endpoints'
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
  .then(async () => {
    console.log('Swagger documentation generated successfully');
    await import('./server.js')
  })
  .catch(error => {
    console.error('Error generating Swagger documentation:', error);
  });
