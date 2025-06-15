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
      url: 'http://localhost:4042',
      description: 'Development server'
    }
  ],  components: {
    schemas: {
      DriverValidation: {
        id: 1,
        cnh: "12345678901",
        cnh_front: "https://example.com/cnh_front.jpg",
        cnh_back: "https://example.com/cnh_back.jpg",
        bpk_link: "https://example.com/bpk_document.pdf",
        user_id: 123,
        is_validated: false,
        createdAt: "2025-06-13T10:00:00Z",
        updatedAt: "2025-06-13T10:00:00Z"
      },
      PassengerValidation: {
        id: 1,
        rg_front: "https://example.com/rg_front.jpg",
        rg_back: "https://example.com/rg_back.jpg",
        bpk_link: "https://example.com/bpk_document.pdf",
        user_id: 456,
        is_validated: false,
        createdAt: "2025-06-13T10:00:00Z",
        updatedAt: "2025-06-13T10:00:00Z"
      },
      ValidationResponse: {
        message: "Driver validation accepted successfully"
      },
      ValidationListResponse: {
        data: [
          {
            id: 1,
            cnh: "12345678901",
            cnh_front: "https://example.com/cnh_front.jpg",
            cnh_back: "https://example.com/cnh_back.jpg",
            bpk_link: "https://example.com/bpk_document.pdf",
            user_id: 123,
            is_validated: false,
            createdAt: "2025-06-13T10:00:00Z",
            updatedAt: "2025-06-13T10:00:00Z"
          }
        ],
        meta: {
          totalData: 15,
          totalPages: 2,
          currentPage: 1,
          pageSize: 10
        }
      },
      ErrorResponse: {
        message: "Validation not found"
      }
    }
  },  tags: [
    {
      name: 'Driver Validations',
      description: 'Driver document validation endpoints'
    },
    {
      name: 'Passenger Validations',
      description: 'Passenger document validation endpoints'
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
