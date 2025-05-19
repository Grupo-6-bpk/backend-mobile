import swaggerAutogen from "swagger-autogen";

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

const endpointsFiles = ["./infrastructure/http/routes/routes.js"];
const outputFile = "./infrastructure/config/swagger.json";

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  .then(async () => {
    await import("./server.js");
  });