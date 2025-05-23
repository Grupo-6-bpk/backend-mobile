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
      url: "http://localhost:3000",
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
        isDriver: true,
        isPassenger: true,
        verified: true,
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
      // ======= CHAT SCHEMAS =======
      ChatGroup: {
        id: 1,
        name: "Grupo Teste",
        description: "Descrição do grupo",
        type: "group",
        imageUrl: "https://example.com/group.jpg",
        createdById: 1,
        createdAt: "2024-12-01T10:00:00Z",
        updatedAt: "2024-12-01T10:00:00Z",
        isActive: true,
        maxMembers: 100,
        memberCount: 3,
        lastMessage: {
          id: 10,
          content: "Última mensagem do grupo",
          senderId: 2,
          createdAt: "2024-12-01T11:30:00Z"
        }
      },
      Message: {
        id: 1,
        content: "Olá pessoal!",
        type: "text",
        senderId: 1,
        groupId: 1,
        replyToId: null,
        status: "sent",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        createdAt: "2024-12-01T10:00:00Z",
        updatedAt: null,
        editedAt: null,
        deletedAt: null,
        isDeleted: false,
        sender: {
          id: 1,
          name: "João",
          last_name: "Silva"
        }
      },
      UserSearchResult: {
        id: 2,
        name: "Maria",
        last_name: "Santos",
        email: "maria@example.com",
        phone: "(11) 98765-4321",
        verified: true,
        isMember: false
      },
      ContactResult: {
        id: 3,
        name: "Pedro",
        last_name: "Oliveira",
        email: "pedro@example.com",
        lastChatAt: "2024-12-01T09:00:00Z",
        groupId: 5,
        groupType: "direct"
      },
      Pagination: {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrevious: false
      },
      HATEOASLink: {
        rel: "self",
        href: "/api/chat/groups/1",
        method: "GET"
      },
      // ======= ERROR RESPONSES =======
      BadRequestError: {
        message: "Dados inválidos",
        error: "Nome é obrigatório para grupos",
        details: ["name.required"]
      },
      UnauthorizedError: {
        message: "Token inválido ou expirado",
        error: "Unauthorized"
      },
      ForbiddenError: {
        message: "Você não tem permissão para acessar este grupo",
        error: "Forbidden"
      }
    },
    responses: {
      BadRequestError: {
        description: "Requisição inválida",
        content: {
          "application/json": {
            schema: {
              "$ref": "#/components/schemas/BadRequestError"
            }
          }
        }
      },
      UnauthorizedError: {
        description: "Não autorizado",
        content: {
          "application/json": {
            schema: {
              "$ref": "#/components/schemas/UnauthorizedError"
            }
          }
        }
      },
      ForbiddenError: {
        description: "Acesso negado",
        content: {
          "application/json": {
            schema: {
              "$ref": "#/components/schemas/ForbiddenError"
            }
          }
        }
      },
      InternalServerError: {
        description: "Erro interno do servidor",
        content: {
          "application/json": {
            schema: {
              "$ref": "#/components/schemas/InternalServerError"
            }
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
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