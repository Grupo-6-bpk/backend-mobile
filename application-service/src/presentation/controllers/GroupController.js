import { PrismaGroupRepository } from "../../infrastructure/db/PrismaGroupRepository.js";

const groupRepository = new PrismaGroupRepository();

export const createGroup = async (req, res, next) => {
  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'Create a new group'
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/GroupCreate" }
  }
  #swagger.responses[201] = { 
    description: 'Group created successfully',
    schema: { $ref: "#/components/schemas/Group" }
  }
  #swagger.responses[400] = { description: 'Bad Request - Invalid data' }
  #swagger.responses[409] = { description: 'Conflict - Duplicate group name or invalid relationships' }
  */
  try {
    const { name, description, driverId, members } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: "O nome do grupo é obrigatório e deve ser uma string não vazia." });
    }
    if (driverId === undefined || driverId === null) {
      return res.status(400).json({ message: "O ID do motorista (driverId) é obrigatório." });
    }
    const parsedDriverId = parseInt(driverId);
    if (isNaN(parsedDriverId) || parsedDriverId <= 0) {
        return res.status(400).json({ message: "O ID do motorista (driverId) deve ser um número inteiro positivo." });
    }
    if (members && !Array.isArray(members)) {
        return res.status(400).json({ message: "Membros (members) deve ser um array de IDs de passageiros." });
    }
    const parsedMembers = members ? members.map(id => parseInt(id)) : [];
    if (members && parsedMembers.some(id => isNaN(id) || id <= 0)) {
        return res.status(400).json({ message: "Todos os IDs em membros (members) devem ser números inteiros positivos." });
    }

    const groupDataForRepo = {
      name: name.trim(),
      description: description ? description.trim() : null,
      driverId: parsedDriverId,
      members: parsedMembers
    };

    const newGroup = await groupRepository.create(groupDataForRepo);
    return res.status(201).json(newGroup);

  } catch (err) {
    console.error("Erro ao criar grupo:", err);
    if (err.code === "P2002") {
        const fields = err.meta?.target?.join(', ') || "campo único";
        return res.status(409).json({ message: `Falha ao criar grupo: Já existe um registro com este ${fields}.` });
    }
    if (err.code === "P2025" || (err.meta && err.meta.cause && typeof err.meta.cause === 'string' && err.meta.cause.includes("Record to connect not found"))) {
        const specificMessage = err.meta?.cause || "Um registro relacionado (como motorista ou passageiro) não foi encontrado ou não é elegível.";
        return res.status(400).json({ message: `Falha ao criar grupo: ${specificMessage}` });
    }
    if (err.message.includes("inválido") || err.message.includes("obrigatório")) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const listGroups = async (req, res, next) => {
  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'List all groups'
  #swagger.responses[200] = {
    description: 'Groups listed successfully',
    schema: {
      type: 'array',
      items: { $ref: "#/components/schemas/Group" }
    }
  }
  */
  try {
    const groups = await groupRepository.findAll();
    return res.status(200).json(groups);
  } catch (err) {
    console.error("Erro ao listar grupos:", err);
    next(err);
  }
};

export const getGroupById = async (req, res, next) => {
  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'Get a group by ID with members'
  #swagger.parameters[0] = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'integer' },
    description: 'Group ID'
  }
  #swagger.responses[200] = { 
    description: 'Group found',
    schema: { $ref: "#/components/schemas/Group" }
  }
  #swagger.responses[400] = { description: 'Invalid group ID' }
  #swagger.responses[404] = { description: 'Group not found' }
  */
  try {
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({ message: "ID do grupo inválido." });
    }

    const group = await groupRepository.findGroupWithMembers(groupId);

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado." });
    }

    return res.status(200).json(group);
  } catch (err) {
    console.error(`Erro ao buscar grupo ${req.params.id}:`, err);
    next(err);
  }
};
export const listUsersByGroup = async (req, res, next) => {
  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'List all users (members) in a group'
  #swagger.parameters[0] = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'integer' },
    description: 'Group ID'
  }
  #swagger.responses[200] = {
    description: 'Group members listed successfully',
    schema: {
      type: 'array',
      items: {
        id: 2,
        userId: 2,
        user: {
          id: 2,
          name: "Maria",
          last_name: "Santos"
        }
      }
    }
  }
  #swagger.responses[400] = { description: 'Invalid group ID' }
  #swagger.responses[404] = { description: 'Group not found' }
  */
  try {
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({ message: "ID do grupo inválido." });
    }

    const group = await groupRepository.findGroupWithMembers(groupId);

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado." });
    }

    const users = group.members || [];

    return res.status(200).json(users);
  } catch (err) {
    console.error(`Erro ao listar usuários do grupo ${req.params.id}:`, err); 
    next(err);
  }
};

export const updateGroupMembers = async (req, res, next) => {  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'Add or remove members from a group using passenger IDs (role IDs)'
  #swagger.parameters['id'] = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Group ID',
    type: 'integer'
  }
  #swagger.requestBody = {
    required: true,
    schema: { $ref: "#/components/schemas/GroupMembersUpdate" }
  }
  #swagger.responses[200] = { 
    description: 'Group members updated successfully',
    schema: { $ref: "#/components/schemas/Group" }
  }
  #swagger.responses[400] = { description: 'Invalid data or action' }
  #swagger.responses[404] = { description: 'Group not found or passengers not eligible' }
  */try {
    const groupId = parseInt(req.params.id);
    const { passengerIds, action } = req.body;

    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({ message: "ID do grupo inválido." });
    }
    if (!action || (action !== 'add' && action !== 'remove')) {
      return res.status(400).json({ message: "Ação inválida. Use 'add' ou 'remove'." });
    }
    if (!Array.isArray(passengerIds) || passengerIds.length === 0) {
      return res.status(400).json({ message: "passengerIds deve ser um array não vazio de IDs de passageiros." });
    }
    const parsedPassengerIds = passengerIds.map(id => parseInt(id));
    if (parsedPassengerIds.some(id => isNaN(id) || id <= 0)) {
      return res.status(400).json({ message: "Todos os passengerIds devem ser números inteiros positivos." });
    }

    let updatedGroup;
    if (action === 'add') {
      updatedGroup = await groupRepository.addMembersToGroup(groupId, parsedPassengerIds);
    } else {
      updatedGroup = await groupRepository.removeMembersFromGroup(groupId, parsedPassengerIds);
    }

    if (!updatedGroup && !(err && err.code === 'P2025')) {
         return res.status(404).json({ message: "Grupo não encontrado ou falha na operação." });
    }

    return res.status(200).json(updatedGroup);
  } catch (err) {
    console.error(`Erro ao atualizar membros do grupo ${req.params.groupId}:`, err);
    if (err.code === 'P2025') {
        const cause = err.meta?.cause || "Grupo ou um ou mais usuários especificados não foram encontrados, ou não são elegíveis para a operação.";
        return res.status(404).json({ message: `Falha ao atualizar membros: ${cause}` });
    }
    if (err.message.includes("não encontrado") || err.message.includes("inválido")) {
        return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const deleteGroup = async (req, res, next) => {
  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'Delete a group by ID'
  #swagger.parameters[0] = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'integer' },
    description: 'Group ID'
  }
  #swagger.responses[200] = { 
    description: 'Group deleted successfully',
    schema: {
      message: "Grupo deletado com sucesso."
    }
  }
  #swagger.responses[400] = { description: 'Invalid group ID' }
  #swagger.responses[404] = { description: 'Group not found' }
  */
  try {
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({ message: "ID do grupo inválido." });
    }

    const deletedGroup = await groupRepository.deleteById(groupId);

    if (!deletedGroup) {
      return res.status(404).json({ message: "Grupo não encontrado." });
    }

    return res.status(200).json({ message: "Grupo deletado com sucesso." });
  } catch (err) {
    console.error(`Erro ao deletar grupo ${req.params.id}:`, err);
    next(err);
  }
};

export const getGroupsByUserRole = async (req, res, next) => {
  /*
  #swagger.tags = ["Groups"]
  #swagger.description = 'Get groups by user ID and role (driver or passenger)'
  #swagger.parameters['userId'] = {
    in: 'query',
    description: 'User ID to filter groups',
    required: true,
    type: 'integer'
  }
  #swagger.parameters['role'] = {
    in: 'query',
    description: 'User role (driver or passenger)',
    required: true,
    type: 'string',
    enum: ['driver', 'passenger']
  }
  #swagger.responses[200] = { 
    description: 'Groups retrieved successfully',
    schema: {
      type: 'array',
      items: { $ref: "#/components/schemas/Group" }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request - Invalid parameters' }
  #swagger.responses[500] = { description: 'Internal Server Error' }
  */
  try {
    const { userId, role } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "O parâmetro userId é obrigatório." });
    }
    if (!role) {
      return res.status(400).json({ message: "O parâmetro role é obrigatório." });
    }
    if (!['driver', 'passenger'].includes(role)) {
      return res.status(400).json({ message: "O parâmetro role deve ser 'driver' ou 'passenger'." });
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ message: "O parâmetro userId deve ser um número inteiro positivo." });
    }

    const groups = await groupRepository.findByDriverOrPassengerId(parsedUserId, role);
    return res.status(200).json(groups);

  } catch (err) {
    console.error("Erro em getGroupsByUserRole:", err);
    if (err.message && err.message.includes("Erro no banco de dados")) {
      return res.status(500).json({ message: err.message });
    }
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};