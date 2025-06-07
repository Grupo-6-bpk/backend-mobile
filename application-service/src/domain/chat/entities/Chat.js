export class Chat {
  constructor({ id, isGroup, name, createdAt, updatedAt, adminId, participants = [], messages = [] }) {
    this.id = id;
    this.isGroup = isGroup;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.adminId = adminId;
    this.participants = participants;
    this.messages = messages;
  }

  static createDirectChat(userId, otherUserId) {
    return new Chat({
      isGroup: false,
      adminId: null,
      participants: [
        { userId, blocked: false },
        { userId: otherUserId, blocked: false }
      ]
    });
  }

  static createGroup(name, adminId, participantIds) {
    if (!name || !adminId || !participantIds.length) {
      throw new Error('Nome, admin e participantes são obrigatórios para grupos');
    }

    const participants = participantIds.map(userId => ({ userId, blocked: false }));
    
    return new Chat({
      isGroup: true,
      name,
      adminId,
      participants
    });
  }

  canUserSendMessage(userId) {
    const participant = this.participants.find(p => p.userId === userId);
    return participant && !participant.blocked;
  }

  isUserAdmin(userId) {
    return this.isGroup && this.adminId === userId;
  }

  canUserManageParticipants(userId) {
    return this.isUserAdmin(userId);
  }

  addParticipant(userId) {
    if (!this.isGroup) {
      throw new Error('Só é possível adicionar participantes em grupos');
    }

    const existingParticipant = this.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      throw new Error('Usuário já é participante do chat');
    }

    this.participants.push({ userId, blocked: false });
  }

  removeParticipant(userId) {
    if (!this.isGroup) {
      throw new Error('Só é possível remover participantes de grupos');
    }

    this.participants = this.participants.filter(p => p.userId !== userId);
  }

  blockParticipant(userId) {
    const participant = this.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('Usuário não é participante do chat');
    }

    participant.blocked = true;
  }

  unblockParticipant(userId) {
    const participant = this.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('Usuário não é participante do chat');
    }

    participant.blocked = false;
  }
} 