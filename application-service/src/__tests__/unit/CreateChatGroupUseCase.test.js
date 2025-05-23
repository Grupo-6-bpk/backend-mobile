import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import CreateChatGroupUseCase from '../../application/chat/CreateChatGroupUseCase.js';

describe('CreateChatGroupUseCase', () => {
  let createChatGroupUseCase;
  let mockChatGroupRepository;
  let mockGroupMemberRepository;
  let mockUserRepository;

  beforeEach(() => {
    mockChatGroupRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findDirectChat: jest.fn(),
      update: jest.fn()
    };

    mockGroupMemberRepository = {
      create: jest.fn(),
      createMultiple: jest.fn(),
      findByUserAndGroup: jest.fn(),
      findByGroupId: jest.fn(),
      findAdminsByGroupId: jest.fn(),
      deleteByUserAndGroup: jest.fn(),
      countByGroupId: jest.fn(),
      isMember: jest.fn()
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByIds: jest.fn()
    };

    createChatGroupUseCase = new CreateChatGroupUseCase(
      mockChatGroupRepository,
      mockGroupMemberRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    const validGroupData = {
      name: 'Test Group',
      description: 'Test Description',
      type: 'group',
      createdById: 1
    };

    test('deve criar grupo com sucesso', async () => {
      // Arrange
      const creator = { id: 1, name: 'Creator', email: 'creator@test.com' };
      const member = { id: 2, name: 'Member', email: 'member@test.com' };
      const createdGroup = { id: 1, ...validGroupData };
      const members = [
        { userId: 1, groupId: 1, role: 'admin' },
        { userId: 2, groupId: 1, role: 'member' }
      ];
      const completeGroup = { 
        ...createdGroup, 
        members, 
        memberCount: 2, 
        isCreator: true, 
        userRole: 'admin' 
      };

      mockUserRepository.findById.mockResolvedValue(creator);
      mockUserRepository.findByIds.mockResolvedValue([member]);
      mockChatGroupRepository.create.mockResolvedValue(createdGroup);
      mockGroupMemberRepository.create.mockResolvedValue({ userId: 1, groupId: 1, role: 'admin' });
      mockChatGroupRepository.findById.mockResolvedValue(createdGroup);
      mockGroupMemberRepository.findByGroupId.mockResolvedValue(members);

      // Act
      const result = await createChatGroupUseCase.execute(validGroupData, [2]);

      // Assert
      expect(result).toEqual(completeGroup);
      expect(mockChatGroupRepository.create).toHaveBeenCalledWith({
        name: validGroupData.name,
        description: validGroupData.description,
        type: 'group',
        imageUrl: undefined,
        createdById: 1,
        maxMembers: 100
      });
      expect(mockGroupMemberRepository.create).toHaveBeenCalledTimes(2);
    });

    test('deve criar chat direto com sucesso', async () => {
      // Arrange
      const groupData = {
        name: 'Chat Direto',
        type: 'direct',
        createdById: 1
      };
      const memberIds = [2];

      const creator = { id: 1, name: 'João', email: 'joao@test.com' };
      const otherUser = { id: 2, name: 'Maria', email: 'maria@test.com' };
      const createdGroup = { id: 1, name: 'João & Maria', type: 'direct', createdById: 1 };
      const completeGroup = { ...createdGroup, isActive: true };

      mockUserRepository.findById.mockResolvedValueOnce(creator); // Para o criador
      mockChatGroupRepository.findDirectChat.mockResolvedValue(null); // Não existe chat direto
      mockUserRepository.findById.mockResolvedValueOnce(otherUser); // Para o outro usuário
      mockUserRepository.findByIds.mockResolvedValue([otherUser]); // Mock corrigido para retornar array
      mockChatGroupRepository.create.mockResolvedValue(createdGroup);
      mockGroupMemberRepository.create.mockResolvedValue(true);
      mockChatGroupRepository.findById.mockResolvedValue(completeGroup);
      mockGroupMemberRepository.findByGroupId.mockResolvedValue([
        { userId: 1, user: creator, role: 'admin' },
        { userId: 2, user: otherUser, role: 'member' }
      ]);

      // Act
      const result = await createChatGroupUseCase.execute(groupData, memberIds);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        name: 'João & Maria',
        type: 'direct',
        memberCount: 2,
        isCreator: true,
        userRole: 'admin'
      }));
    });

    test('deve retornar chat direto existente', async () => {
      // Arrange
      const directChatData = { type: 'direct', createdById: 1 };
      const creator = { id: 1, name: 'Creator' };
      const existingChat = { id: 1, name: 'Existing Chat', type: 'direct' };

      mockUserRepository.findById.mockResolvedValue(creator);
      mockChatGroupRepository.findDirectChat.mockResolvedValue(existingChat);

      // Act
      const result = await createChatGroupUseCase.execute(directChatData, [2]);

      // Assert
      expect(result).toEqual(existingChat);
      expect(mockChatGroupRepository.create).not.toHaveBeenCalled();
    });

    test('deve rejeitar grupo sem nome', async () => {
      // Arrange
      const invalidData = { ...validGroupData, name: '' };

      // Act & Assert
      await expect(createChatGroupUseCase.execute(invalidData, []))
        .rejects.toThrow('Nome é obrigatório para grupos e deve ter pelo menos 2 caracteres');
    });

    test('deve rejeitar nome muito curto para grupo', async () => {
      // Arrange
      const invalidData = { ...validGroupData, name: 'A' };

      // Act & Assert
      await expect(createChatGroupUseCase.execute(invalidData, []))
        .rejects.toThrow('Nome é obrigatório para grupos e deve ter pelo menos 2 caracteres');
    });

    test('deve rejeitar chat direto sem exatamente 1 membro', async () => {
      // Arrange
      const invalidData = { type: 'direct', createdById: 1 };

      // Act & Assert
      await expect(createChatGroupUseCase.execute(invalidData, []))
        .rejects.toThrow('Chat direto deve ter exatamente 1 outro membro');

      await expect(createChatGroupUseCase.execute(invalidData, [2, 3]))
        .rejects.toThrow('Chat direto deve ter exatamente 1 outro membro');
    });

    test('deve rejeitar grupo com muitos membros', async () => {
      // Arrange
      const memberIds = Array.from({ length: 100 }, (_, i) => i + 2); // 100 membros

      // Act & Assert
      await expect(createChatGroupUseCase.execute(validGroupData, memberIds))
        .rejects.toThrow('Máximo 99 membros por grupo');
    });

    test('deve rejeitar se criador não existe', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(createChatGroupUseCase.execute(validGroupData, []))
        .rejects.toThrow('Usuário criador não encontrado');
    });

    test('deve rejeitar se outro usuário do chat direto não existe', async () => {
      // Arrange
      const directChatData = { type: 'direct', createdById: 1 };
      const creator = { id: 1, name: 'Creator' };

      mockUserRepository.findById.mockResolvedValueOnce(creator);
      mockUserRepository.findById.mockResolvedValueOnce(null);
      mockChatGroupRepository.findDirectChat.mockResolvedValue(null);

      // Act & Assert
      await expect(createChatGroupUseCase.execute(directChatData, [2]))
        .rejects.toThrow('Usuário destinatário não encontrado');
    });

    test('deve rejeitar se nem todos os membros existem', async () => {
      // Arrange
      const creator = { id: 1, name: 'Creator' };
      const members = [{ id: 2, name: 'Member' }]; // Apenas 1 de 2 membros

      mockUserRepository.findById.mockResolvedValue(creator);
      mockUserRepository.findByIds.mockResolvedValue(members);

      // Act & Assert
      await expect(createChatGroupUseCase.execute(validGroupData, [2, 3]))
        .rejects.toThrow('Um ou mais usuários não foram encontrados');
    });
  });

  describe('addMembers', () => {
    test('deve adicionar membros com sucesso', async () => {
      // Arrange
      const group = { id: 1, maxMembers: 100 };
      const requesterMembership = { userId: 1, groupId: 1, role: 'admin' };
      const users = [{ id: 2, name: 'New Member' }];
      const addedMembers = [{ userId: 2, groupId: 1, role: 'member' }];

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(requesterMembership);
      mockUserRepository.findByIds.mockResolvedValue(users);
      mockGroupMemberRepository.isMember.mockResolvedValue(false);
      mockGroupMemberRepository.countByGroupId.mockResolvedValue(5);
      mockGroupMemberRepository.createMultiple.mockResolvedValue(addedMembers);

      // Act
      const result = await createChatGroupUseCase.addMembers(1, 1, [2]);

      // Assert
      expect(result).toEqual(addedMembers);
      expect(mockGroupMemberRepository.createMultiple).toHaveBeenCalledWith([{
        userId: 2,
        groupId: 1,
        role: 'member',
        addedById: 1
      }]);
    });

    test('deve rejeitar se grupo não encontrado', async () => {
      // Arrange
      mockChatGroupRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(createChatGroupUseCase.addMembers(1, 1, [2]))
        .rejects.toThrow('Grupo não encontrado');
    });

    test('deve rejeitar se solicitante não tem permissão', async () => {
      // Arrange
      const group = { id: 1 };
      const memberMembership = { userId: 1, groupId: 1, role: 'member' };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(memberMembership);

      // Act & Assert
      await expect(createChatGroupUseCase.addMembers(1, 1, [2]))
        .rejects.toThrow('Sem permissão para adicionar membros');
    });

    test('deve rejeitar se usuário já é membro', async () => {
      // Arrange
      const group = { id: 1 };
      const adminMembership = { userId: 1, groupId: 1, role: 'admin' };
      const users = [{ id: 2 }];

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(adminMembership);
      mockUserRepository.findByIds.mockResolvedValue(users);
      mockGroupMemberRepository.isMember.mockResolvedValue(true);

      // Act & Assert
      await expect(createChatGroupUseCase.addMembers(1, 1, [2]))
        .rejects.toThrow('Todos os usuários já são membros do grupo');
    });

    test('deve rejeitar se exceder limite de membros', async () => {
      // Arrange
      const group = { id: 1, maxMembers: 10 };
      const adminMembership = { userId: 1, groupId: 1, role: 'admin' };
      const users = [{ id: 2 }, { id: 3 }];

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup.mockResolvedValue(adminMembership);
      mockUserRepository.findByIds.mockResolvedValue(users);
      mockGroupMemberRepository.isMember.mockResolvedValue(false);
      mockGroupMemberRepository.countByGroupId.mockResolvedValue(9); // Já tem 9 membros

      // Act & Assert
      await expect(createChatGroupUseCase.addMembers(1, 1, [2, 3]))
        .rejects.toThrow('Limite de membros excedido. Máximo: 10');
    });
  });

  describe('removeMember', () => {
    test('deve remover membro com sucesso', async () => {
      // Arrange
      const group = { id: 1, type: 'group' };
      const adminMembership = { userId: 1, groupId: 1, role: 'admin' };
      const memberToRemove = { userId: 2, groupId: 1, role: 'member' };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup
        .mockResolvedValueOnce(adminMembership)
        .mockResolvedValueOnce(memberToRemove);
      mockGroupMemberRepository.deleteByUserAndGroup.mockResolvedValue(true);

      // Act
      const result = await createChatGroupUseCase.removeMember(1, 1, 2);

      // Assert
      expect(result).toBe(true);
      expect(mockGroupMemberRepository.deleteByUserAndGroup).toHaveBeenCalledWith(2, 1);
    });

    test('deve permitir usuário sair voluntariamente', async () => {
      // Arrange
      const group = { id: 1, type: 'group' };
      const memberMembership = { userId: 2, groupId: 1, role: 'member' };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup
        .mockResolvedValueOnce(memberMembership)
        .mockResolvedValueOnce(memberMembership);
      mockGroupMemberRepository.deleteByUserAndGroup.mockResolvedValue(true);

      // Act
      const result = await createChatGroupUseCase.removeMember(1, 2, 2); // Usuário removendo a si mesmo

      // Assert
      expect(result).toBe(true);
    });

    test('deve rejeitar remoção em chat direto', async () => {
      // Arrange
      const directChat = { id: 1, type: 'direct' };

      mockChatGroupRepository.findById.mockResolvedValue(directChat);

      // Act & Assert
      await expect(createChatGroupUseCase.removeMember(1, 1, 2))
        .rejects.toThrow('Não é possível remover membros de chats diretos');
    });

    test('deve rejeitar remoção do último admin', async () => {
      // Arrange
      const group = { id: 1, type: 'group' };
      const adminMembership = { userId: 1, groupId: 1, role: 'admin' };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup
        .mockResolvedValueOnce(adminMembership)
        .mockResolvedValueOnce(adminMembership);
      mockGroupMemberRepository.findAdminsByGroupId.mockResolvedValue([adminMembership]);

      // Act & Assert
      await expect(createChatGroupUseCase.removeMember(1, 1, 1))
        .rejects.toThrow('Não é possível remover o último administrador do grupo');
    });

    test('deve rejeitar se member não tem permissão para remover admin', async () => {
      // Arrange
      const group = { id: 1, type: 'group' };
      const memberMembership = { userId: 2, groupId: 1, role: 'member' };
      const adminToRemove = { userId: 1, groupId: 1, role: 'admin' };

      mockChatGroupRepository.findById.mockResolvedValue(group);
      mockGroupMemberRepository.findByUserAndGroup
        .mockResolvedValueOnce(memberMembership)
        .mockResolvedValueOnce(adminToRemove);

      // Act & Assert
      await expect(createChatGroupUseCase.removeMember(1, 2, 1))
        .rejects.toThrow('Sem permissão para remover este membro');
    });
  });
}); 