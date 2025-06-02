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
  ],  components: {
    schemas: {
      InternalServerError: {
        code: 500,
        message: "Internal Server Error"
      }, User: {
        name: "Djanathan",
        last_name: "Corinthiano",
        email: "email@example.com",
        password: "password",
        cpf: "123.456.789-00",
        phone: "(11) 98765-4321",
        street: "Av. Maripa",
        number: 123,
        city: "São Paulo",
        zipcode: "01000-000",
        createAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        isDriver: true,
        isPassenger: true,
        verified: true,
        // Driver specific fields (required when isDriver is true)
        cnh: "1234567890",
        cnh_front: "https://example.com/cnh_front.jpg",
        cnh_back: "https://example.com/cnh_back.jpg",
        bpk_link: "https://example.com/bpk_link",
      },
      Login: {
        email: "email@example.com",
        password: "password",
      },
      UserRoles: {
        isDriver: true,
        isPassenger: true
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
      },
      Vehicle: {
        id: 1,
        model: "Civic",
        brand: "Honda",
        year: 2023,
        phone: "(11) 98765-4321",
        street: "Main Avenue",
        number: 123,
        renavam: "12345678901",        
        plate: "ABC1234",
        fuelConsumption: 12.5,
        createAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        driverId: 1,
        driver: {
          id: 1,
          name: "John Doe",
          userId: 1
        }
      },
      VehicleVerification: {
        vehicleStatus: "VERIFIED",
        vehicleData: {
          modelo: "Civic",
          marca: "Honda",
          ano: 2023,
          placa: "ABC1234",
          renavam: "12345678901",
          chassi: "9BW2D11J0Y4019551",
          combustivel: "Gasolina/Etanol",
          cor: "Prata",
          potencia: "106cv"
        },
        cnhStatus: "VERIFIED",
        cnhData: {
          numero: "01234567890",
          categoria: "B",
          validade: "2030-12-31",
          situacao: "REGULAR",
          restricoes: []
        }
      },
      Vehicle: {
        model: "Civic",
        brand: "Honda",
        year: 2023,
        phone: "(11) 98765-4321",
        street: "Main Avenue",
        number: 123,
        renavam: "12345678901",
        plate: "ABC1234",
        fuelConsumption: 12.5,
        createAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        driverId: 1,
        driver: {
          id: 1,
          name: "John Doe",
          userId: 1
        }
      },
      VehicleVerification: {
        vehicleStatus: "VERIFIED",
        vehicleData: {
          modelo: "Civic",
          marca: "Honda",
          ano: 2023,
          placa: "ABC1234",
          renavam: "12345678901",
          chassi: "9BW2D11J0Y4019551",
          combustivel: "Gasolina/Etanol",
          cor: "Prata",
          potencia: "106cv"
        },
        cnhStatus: "VERIFIED", 
      },
      RideRequestCreate: {
        startLocation: "Origin Location",
        endLocation: "Destination Location",
        rideId: 1,
        passengerId: 1
      },       RideRequestUpdate: {
        startLocation: "Origin Location",
        endLocation: "Destination Location",
        status: "APPROVED",
        rideId: 1,
        passengerId: 1
      },
      RideRequestStatusUpdate: {
        status: "APPROVED"
      },
      RideRequest: {
        id: 1,
        startLocation: "Origin Location",
        endLocation: "Destination Location",
        status: "PENDING",
        passengerShare: 25.50,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        rideId: 1,
        passengerId: 1,        ride: {
          id: 1,
          startLocation: "Start Location",
          endLocation: "End Location",
          distance: 15.5,
          departureTime: "2025-05-18T12:00:00Z",
          totalCost: 50.00,
          fuelPrice: 5.50,
          pricePerMember: 12.50,
          totalSeats: 4,
          availableSeats: 2,
          vehicleId: 1,
          vehicle: {
            id: 1,
            model: "Civic",
            brand: "Honda",
            plate: "ABC1234"
          }
        },passenger: {
          id: 1,
          active: true,
          userId: 1
        }
      },      RideCreate: {
        startLocation: "Start Location",
        endLocation: "End Location",
        distance: 15.5,
        departureTime: "2025-05-18T12:00:00Z",
        fuelPrice: 5.50,
        totalSeats: 4,
        driverId: 1,
        vehicleId: 1
      },      Ride: {
        id: 1,
        startLocation: "Start Location",
        endLocation: "End Location",
        distance: 15.5,
        departureTime: "2025-05-18T12:00:00Z",
        totalCost: 50.00,
        fuelPrice: 5.50,
        pricePerMember: 12.50,
        totalSeats: 4,
        availableSeats: 2,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        driverId: 1,
        vehicleId: 1,
        driver: {
          id: 1,
          cnh: "1234567890",
          cnhVerified: true,
          userId: 1,
          user: {
            id: 1,
            name: "Driver Name"
          }
        },
        vehicle: {
          id: 1,
          model: "Civic",
          brand: "Honda",
          plate: "ABC1234"
        },
        rideRequests: [
          {
            id: 1,
            status: "PENDING",
            passengerShare: 12.50
          }
        ]
      },
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
