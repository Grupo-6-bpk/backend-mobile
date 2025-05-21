import swaggerAutogen from 'swagger-autogen';

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
      Document: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123',
        type: 'driver_license',
        documentId: 'AB123456',
        status: 'pending',
        fileUrl: 'https://storage.example.com/documents/abc123.pdf',
        rejectionReason: null,
        createdAt: '2025-05-18T12:00:00Z',
        updatedAt: '2025-05-18T12:00:00Z',
        validatedAt: null,
        validatedBy: null
      },
      DocumentCreate: {
        userId: '123',
        type: 'driver_license',
        documentId: 'AB123456',
        fileUrl: 'https://storage.example.com/documents/abc123.pdf'
      },
      DocumentUpdate: {
        status: 'approved',
        rejectionReason: null,
        validatedAt: '2025-05-18T12:00:00Z',
        validatedBy: '456'
      },
      ValidationRequest: {
        documentId: '550e8400-e29b-41d4-a716-446655440000',
        validatorId: '456'
      },
      ValidationResult: {
        valid: true,
        message: 'Document successfully validated',
        documentId: '550e8400-e29b-41d4-a716-446655440000',
        validatedBy: '456',
        validatedAt: '2025-05-18T12:00:00Z'
      },
      ServiceHealth: {
        status: 'UP',
        service: 'validation-service',
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

const outputFile = './src/swagger.json';
const endpointsFiles = ['./src/presentation/routes/*.js'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log('Swagger documentation generated successfully');
  })
  .catch(error => {
    console.error('Error generating Swagger documentation:', error);
  });
