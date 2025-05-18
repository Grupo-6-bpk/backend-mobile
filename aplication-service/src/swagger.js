import swaggerAutogen from "swagger-autogen";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      UserCreate: {
        name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        cpf: "123.456.789-00",
        phone: "(11) 98765-4321",
        street: "Main Avenue",
        number: 123,
        city: "São Paulo",
        zipcode: "01000-000"
      },
      UserResponse: {
        id: 1,
        name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
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
      Driver: {
        id: 1,
        cnhVerified: true,
        userId: 1
      },
      DriverCreate: {
        userId: 1
      },
      Passenger: {
        id: 1,
        active: true,
        userId: 1
      },
      PassengerCreate: {
        userId: 1
      },
      RideGroup: {
        id: 1,
        name: "Work Carpool",
        description: "Daily rides to work",
        driverId: 1,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z"
      },
      RideGroupCreate: {
        name: "Work Carpool",
        description: "Daily rides to work",
        driverId: 1
      },
      RideGroupMember: {
        id: 1,
        joinDate: 20250518,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        groupId: 1,
        passengerId: 1
      },
      RideGroupMemberCreate: {
        groupId: 1,
        passengerId: 1
      },
      ScheduledRide: {
        id: 1,
        scheduledDate: "2025-05-20T08:30:00Z",
        estimatedCost: 25.50,
        availableSeats: 3,
        totalSeats: 4,
        startLocation: "Downtown",
        endLocation: "University Campus",
        distance: 15.3,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        groupId: 1,
        driverId: 1
      },
      ScheduledRideCreate: {
        scheduledDate: "2025-05-20T08:30:00Z",
        estimatedCost: 25.50,
        availableSeats: 3,
        totalSeats: 4,
        startLocation: "Downtown",
        endLocation: "University Campus",
        distance: 15.3,
        groupId: 1,
        driverId: 1
      },
      Ride: {
        id: 1,
        startLocation: "Downtown",
        endLocation: "University Campus",
        distance: 15.3,
        departureTime: "2025-05-18T08:30:00Z",
        totalCost: 25.50,
        fuelPrice: 5.79,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        driverId: 1
      },
      RideCreate: {
        startLocation: "Downtown",
        endLocation: "University Campus",
        distance: 15.3,
        departureTime: "2025-05-18T08:30:00Z",
        totalCost: 25.50,
        fuelPrice: 5.79,
        driverId: 1
      },
      RideRequest: {
        id: 1,
        startLocation: "Home",
        endLocation: "University Campus",
        status: "pending",
        passengerShare: 12.75,
        createdAt: "2025-05-18T12:00:00Z",
        updatedAt: "2025-05-18T12:00:00Z",
        rideId: 1,
        passengerId: 1
      },
      RideRequestCreate: {
        startLocation: "Home",
        endLocation: "University Campus",
        rideId: 1,
        passengerId: 1
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
        driverId: 1
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
    }
  },
    securitySchemes:{
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      bearerFormat: "JWT"
    }
  }
};

const endpointsFiles = ["./infraestructure/routes/routes.js"];
const outputFile = "./infrastructure/config/swagger.json";

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  .then(async () => {
    await import("./server.js");
  });