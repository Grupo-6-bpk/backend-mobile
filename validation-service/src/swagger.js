import swaggerAutogen from 'swagger-autogen';
import fs from 'fs/promises';
import path from 'path';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Document Validation Service',
    description: 'Service for validating user documents'
  },
  servers: [
    {
      url: 'http://localhost:4043',
      description: 'Development server'
    }
  ],
  components: {
    schemas: {
    }
  },
  tags: [
    {
      name: 'Documents',
      description: 'Document management endpoints'
    },
    {
      name: 'Validation',
      description: 'Document validation endpoints'
    },
    {
      name: 'Health',
      description: 'Service health check endpoints'
    }
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
};

async function cleanupSwaggerFile(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    console.log('Cleaning swagger file at:', fullPath);
    const data = await fs.readFile(fullPath, 'utf8');
    const swaggerData = JSON.parse(data);
    const pathsToRemove = [];

    for (const path in swaggerData.paths) {
      if (path.includes('{{') ||
        path.includes('}}') ||
        path.includes('catch(err)') ||
        path.includes('next(err)') ||
        path.includes('res.no_content()') ||
        (path !== '/login/' && path.startsWith('/login/'))) {
        pathsToRemove.push(path);
      }
    }

    for (const path of pathsToRemove) {
      delete swaggerData.paths[path];
    }
    await fs.writeFile(fullPath, JSON.stringify(swaggerData, null, 2), 'utf8');
    console.log('Swagger file cleaned successfully!');
  } catch (err) {
    console.error('Error cleaning swagger file:', err);
  }
}

const outputFile = './infrastructure/config/swagger.json';
const endpointsFiles = ['./infrastructure/http/routes/routes.js',];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc)
  .then(async () => {
    // await cleanupSwaggerFile(outputFile);
    console.log('Swagger documentation generated successfully');
    await import('./server.js');
  })
  .catch(error => {
    console.error('Error generating Swagger documentation:', error);
  });
