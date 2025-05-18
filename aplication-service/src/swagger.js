import swaggerAutogen from 'swagger-autogen';
import { writeFile } from 'fs/promises';

const doc = {
  info: {
    title: 'API Service',
    description: 'API for User, Group, and Ride management'
  },
  host: process.env.HOST || 'localhost:4040',
  schemes: ['http', 'https'],
  tags: [
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Groups',
      description: 'Group management endpoints'
    },
    {
      name: 'Rides',
      description: 'Ride management endpoints'
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
