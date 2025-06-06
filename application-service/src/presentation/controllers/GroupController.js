import { PrismaGroupRepository } from "../../infrastructure/db/PrismaGroupRepository.js";

const groupRepository = new PrismaGroupRepository();

export const createGroup = async (req, res, next) => {
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
  try {
    const groups = await groupRepository.findAll();
    return res.status(200).json(groups);
  } catch (err) {
    console.error("Erro ao listar grupos:", err);
    next(err);
  }
};

export const getGroupById = async (req, res, next) => {
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

export const updateGroupMembers = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { userIds, action } = req.body;

    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({ message: "ID do grupo inválido." });
    }
    if (!action || (action !== 'add' && action !== 'remove')) {
      return res.status(400).json({ message: "Ação inválida. Use 'add' ou 'remove'." });
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds deve ser um array não vazio de IDs de usuários." });
    }
    const parsedUserIds = userIds.map(id => parseInt(id));
    if (parsedUserIds.some(id => isNaN(id) || id <= 0)) {
      return res.status(400).json({ message: "Todos os userIds devem ser números inteiros positivos." });
    }

    let updatedGroup;
    if (action === 'add') {
      updatedGroup = await groupRepository.addMembersToGroup(groupId, parsedUserIds);
    } else {
      updatedGroup = await groupRepository.removeMembersFromGroup(groupId, parsedUserIds);
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
}