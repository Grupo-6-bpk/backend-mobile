import prisma from "../../infrastructure/config/prismaClient.js";


export const login = async (req, res, next) => {
  /*
  #swagger.tags = ["Login"]
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

export const showUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.responses[200]
  #swagger.responses[404] = {
    description: "User not found"
  }
  */

  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: Number(req.params.id) || 0
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const data = res.hateos_item(user);
    res.ok(data);
  } catch (err) {
    next(err);
  }
}

export const listUsers = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.responses[200]
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
    });

    const totalData = await prisma.user.count();
    const totalPages = Math.ceil(totalData / size);

    const data = res.hateos_list("users", users, totalPages);
    res.ok(data);
  } catch (err) {
    next(err);
  }
}

export const createUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/User" }
  }
  #swagger.responses[201]
  #swagger.responses[400] = {
    description: "Bad Request"
  }
  */

  try {
    const { id, createAt, updatedAt, ...userData } = req.body;

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

    await prisma.user.create({
      data: {
        ...userData,
        verified: userData.verified || false
      }
    });

    res.created();
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    next(err);
  }
}

export const editUser = async (req, res, next) => {
  /*
  #swagger.tags = ["Users"]
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
