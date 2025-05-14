import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Event Broker Service',
    description: 'Event Broker for handling and distributing events across microservices'
  },
  host: process.env.HOST || 'localhost:4041',
  schemes: ['http', 'https'],
  tags: [
    {
      name: 'Events',
      description: 'Event handling endpoints'
    }
  ]
};

const outputFile = './src/swagger.json';
const endpointsFiles = ['./src/presentation/routes/*.js'];

// Generate swagger documentation
const generate = async () => {
  try {
    const { error, data } = await swaggerAutogen(outputFile, endpointsFiles, doc);
    if (error) {
      console.error('Error generating Swagger documentation:', error);
      return;
    }
    console.log('Swagger documentation generated successfully');
  } catch (err) {
    console.error('Error generating Swagger documentation:', err);
  }
};

generate();
