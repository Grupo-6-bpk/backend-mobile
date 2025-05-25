import prisma from "../../infrastructure/config/prismaClient.js";

export const login = async (req, res, next) => {
  /*
  #swagger.tags = ["Authentication"]
  #swagger.description = 'Login user with email and password'
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Login' },
        example: {
          email: "email@example.com",
          password: "password"
        }
      }
    }
  }
  #swagger.responses[200] = { 
    description: 'Login successful',
    content: {
      'application/json': {
        example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  }
  #swagger.responses[401] = { 
    description: 'Unauthorized - Invalid credentials'
  }
  #swagger.responses[500] = { 
    description: 'Internal server error',
    schema: { $ref: '#/components/schemas/InternalServerError' }
  }
  */
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
        password: req.body.password,
      },
    });

    if (!user) {
      return res.unauthorized();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Login error:", error);
    return res.internalServerError();
  }
}

export const getUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.description = 'Get user with their roles (driver/passenger)'
  #swagger.responses[200] = { 
    description: 'User found',
    schema: {
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
      driver: {
        id: 1,
        cnhVerified: false,
        active: true
      },
      passenger: {
        id: 1,
        active: true
      }
    }
  }
  #swagger.responses[404] = { description: 'User not found' }
  */

  try {
    const userId = Number(req.params.id) || 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,
        passenger: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const data = res.hateos_item({
      ...user,
      isDriver: !!user.driver,
      isPassenger: !!user.passenger
    });

    res.ok(data);
  } catch (err) {
    next(err);
  }
}

export const listUsers = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.description = 'List users with their roles (driver/passenger)'
  #swagger.responses[200] = {
    description: 'Users listed successfully',
    schema: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      items: [
        {
          id: 1,
          name: "John",
          email: "john.doe@example.com",
          isDriver: true,
          isPassenger: true,
          driver: { id: 1, cnhVerified: false, active: true },
          passenger: { id: 1, active: true }
        }
      ]
    }
  }
  */

  try {
    const page = parseInt(req.query._page) || 1;
    const size = parseInt(req.query._size) || 10;

    const offset = (page - 1) * size;

    const users = await prisma.user.findMany({
      skip: offset,
      take: size,
      orderBy: {
        ...req.order,
      },
      include: {
        driver: true,
        passenger: true,
      }
    });

    const totalData = await prisma.user.count();
    const totalPages = Math.ceil(totalData / size);

    const usersWithRoles = users.map(user => ({
      ...user,
      isDriver: !!user.driver,
      isPassenger: !!user.passenger
    }));

    const data = res.hateos_list("users", usersWithRoles, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.description = 'Create a new user with optional driver and/or passenger roles'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/User" }
  }
  #swagger.responses[201] = { 
    description: 'User created successfully',
    schema: { 
      id: 1,
      isDriver: true,
      isPassenger: true
    } 
  }
  #swagger.responses[400] = {
    description: "Bad Request"
  }
  */
  try {
    const { id, createAt, updatedAt, isDriver, isPassenger, ...userData } = req.body;

    if (userData.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email já está em uso por outro usuário" 
        });
      }
    }
    const result = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          ...userData,
          verified: userData.verified || false
        }
      });      
      if (isDriver) {
        await prisma.driver.create({
          data: {
            userId: newUser.id,
            active: true,
            cnhVerified: false
          }
        });
      }
      if (isPassenger) {
        await prisma.passenger.create({
          data: {
            userId: newUser.id,
            active: true
          }
        });
      }

      return newUser;
    });

    res.created({ 
      id: result.id, 
      isDriver: !!isDriver, 
      isPassenger: !!isPassenger 
    });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    next(err);
  }
}

export const editUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.description = 'Update user information with PATCH'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/User" }
  }
  #swagger.responses[200]
  #swagger.responses[404] = {
    description: "User not found"
  }
  */

  try {
    const userExists = await prisma.user.findUnique({
      where: { id: Number(req.params.id) || 0 }
    });

    if (!userExists) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });

    const data = res.hateos_item(user);
    res.ok(data);
  } catch (err) {
    next(err);
  }
}

export const deleteUser = async (req, res, next) => {
  /*
  #swagger.tags = ['Users']
  #swagger.description = 'Delete a user by ID'
  #swagger.responses[204] = { description: 'User deleted successfully' }
  #swagger.responses[404] = { description: 'User not found' }
  */
  
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: Number(req.params.id) || 0 }
    });

    if (!userExists) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await prisma.user.delete({
      where: { id: Number(req.params.id) }
    });

    res.no_content();
  } catch (err) {
    next(err);
  }
}

export const updateUserRoles = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.description = 'Update user roles (driver/passenger) with PATCH'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/UserRoles" }
  }
  #swagger.responses[200] = { 
    description: 'User roles updated successfully',
    schema: {
      id: 1,
      name: "Djonathan",
      last_name: "Corithiano",
      email: "email@example.com",
      isDriver: true,
      isPassenger: true
    }
  }
  #swagger.responses[404] = { description: 'User not found' }
  */

  try {
    const { isDriver, isPassenger } = req.body;
    const userId = Number(req.params.id) || 0;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,
        passenger: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await prisma.$transaction(async (prisma) => {
      if (isDriver !== undefined) {
        if (isDriver && !user.driver) {
          await prisma.driver.create({
            data: {
              userId: user.id,
              active: true,
              cnhVerified: false
            }
          });
        } else if (!isDriver && user.driver) {
          await prisma.driver.delete({
            where: { userId: user.id }
          });
        }
      }
      if (isPassenger !== undefined) {
        if (isPassenger && !user.passenger) {
          await prisma.passenger.create({
            data: {
              userId: user.id,
              active: true
            }
          });
        } else if (!isPassenger && user.passenger) {
          await prisma.passenger.delete({
            where: { userId: user.id }
          });
        }
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,
        passenger: true
      }
    });

    const data = res.hateos_item({
      ...updatedUser,
      isDriver: !!updatedUser.driver,
      isPassenger: !!updatedUser.passenger
    });

    res.ok(data);
  } catch (err) {
    console.error("Erro ao atualizar funções do usuário:", err);
    next(err);
  }
}

