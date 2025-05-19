import swaggerAutogen from "swagger-autogen";
import fs from 'fs/promises';
import path from 'path';

const doc = {
  info: {
    version: "1.0.0",
    title: "BPkar Application API",
    description: "API Documentation for Aplication Service"
  },
  servers: [
    {
      url: "http://localhost:4040",
      description: "Development server"
    }
  ],
  
  ignore: [
    "/login/*", 
    "{{*",  
    "*}}}",
    "/login/{{*", 
    "/api/users/{{*" 
  ],

  components: {
    schemas: {
      InternalServerError: {
        code: 500,
        message: "Internal Server Error"
      },
      User: {
        id: 1,
        name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        password: "hashed_password",
        cpf: "123.456.789-00",
        phone: "(11) 98765-4321",
        street: "Main Avenue",
        number: 123,
        city: "São Paulo",
        zipcode: "01000-000",
        createAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        verified: true
      },
      VehicleCreate: {
        model: "Civic",
        brand: "Honda",
        year: 2023,
        phone: "(11) 98765-4321",
        street: "Main Avenue",
        number: 123,
        renavam: "12345678901",        
        plate: "ABC1234",
        fuelConsumption: 12.5,
        driverId: 1
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        
      }
    }
  }
};

const endpointsFiles = ["./src/infrastructure/http/routes/routes.js"];
const outputFile = "./src/infrastructure/config/swagger.json";

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

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  .then(async () => {
    await cleanupSwaggerFile(outputFile);
    console.log('Swagger generation and cleanup complete');
    await import("./server.js");
  });