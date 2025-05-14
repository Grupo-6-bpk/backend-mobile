import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Document Validation Service',
    description: 'Service for validating user documents'
  },
  host: process.env.HOST || 'localhost:4043',
  schemes: ['http', 'https'],
  tags: [
    {
      name: 'DocumentValidation',
      description: 'Document validation endpoints'
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
