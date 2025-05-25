import CreateGroupUseCase from "../../application/group/CreateGroupCase.js";
import { PrismaGroupRepository } from "../../infrastructure/db/PrismaGroupRepository.js";

const groupRepository = new PrismaGroupRepository();
const createGroupUseCase = new CreateGroupUseCase(groupRepository);

export const createGroup = async (req, res, next) => {
  try {
    const groupData = req.body;

    const group = await createGroupUseCase.execute(groupData);

    // Ajuste aqui para seu padrão HATEOAS, ou use diretamente o group
    return res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

export const listGroups = async (req, res, next) => {
  try {
    const groups = await groupRepository.findAll();
    return res.status(200).json(groups);
  } catch (err) {
    next(err);
  }
};

export const showGroup = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const group = await groupRepository.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado." });
    }

    return res.status(200).json(group);
  } catch (err) {
    next(err);
  }
};
