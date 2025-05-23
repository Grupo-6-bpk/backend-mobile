/**
 * GroupMember Domain Entity
 * Representa um membro de grupo no domínio
 */
export default class GroupMember {
  constructor({
    id,
    userId,
    groupId,
    role = 'member', // 'admin', 'moderator', 'member'
    joinedAt,
    addedById,
    isActive = true,
    lastSeenAt,
    notifications = true,
    leftAt
  }) {
    this.id = id;
    this.userId = userId;
    this.groupId = groupId;
    this.role = role;
    this.joinedAt = joinedAt || new Date();
    this.addedById = addedById;
    this.isActive = isActive;
    this.lastSeenAt = lastSeenAt;
    this.notifications = notifications;
    this.leftAt = leftAt;
  }

  /**
   * Valida se o membro é válido
   */
  isValid() {
    if (!this.userId) {
      throw new Error('Membro deve ter um usuário');
    }
    
    if (!this.groupId) {
      throw new Error('Membro deve pertencer a um grupo');
    }
    
    const validRoles = ['admin', 'moderator', 'member'];
    if (!validRoles.includes(this.role)) {
      throw new Error('Role deve ser admin, moderator ou member');
    }
    
    return true;
  }

  /**
   * Verifica se é administrador
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Verifica se é moderador
   */
  isModerator() {
    return this.role === 'moderator';
  }

  /**
   * Verifica se tem permissões administrativas
   */
  hasAdminPermissions() {
    return this.role === 'admin' || this.role === 'moderator';
  }

  /**
   * Promove o membro
   */
  promote(newRole, promotedById) {
    const hierarchy = ['member', 'moderator', 'admin'];
    const currentIndex = hierarchy.indexOf(this.role);
    const newIndex = hierarchy.indexOf(newRole);
    
    if (newIndex <= currentIndex) {
      throw new Error('Não é possível promover para um cargo inferior ou igual');
    }
    
    this.role = newRole;
    this.addedById = promotedById;
    
    return this;
  }

  /**
   * Rebaixa o membro
   */
  demote(newRole, demotedById) {
    const hierarchy = ['member', 'moderator', 'admin'];
    const currentIndex = hierarchy.indexOf(this.role);
    const newIndex = hierarchy.indexOf(newRole);
    
    if (newIndex >= currentIndex) {
      throw new Error('Não é possível rebaixar para um cargo superior ou igual');
    }
    
    this.role = newRole;
    this.addedById = demotedById;
    
    return this;
  }

  /**
   * Atualiza último acesso
   */
  updateLastSeen() {
    this.lastSeenAt = new Date();
    return this;
  }

  /**
   * Ativa/desativa notificações
   */
  toggleNotifications() {
    this.notifications = !this.notifications;
    return this;
  }

  /**
   * Remove membro do grupo (soft delete)
   */
  leave() {
    this.isActive = false;
    this.leftAt = new Date();
    return this;
  }

  /**
   * Reativa membro no grupo
   */
  rejoin() {
    this.isActive = true;
    this.leftAt = null;
    this.joinedAt = new Date();
    return this;
  }

  /**
   * Verifica se pode gerenciar outros membros
   */
  canManageMembers() {
    return this.hasAdminPermissions();
  }

  /**
   * Verifica se pode deletar mensagens
   */
  canDeleteMessages() {
    return this.hasAdminPermissions();
  }

  /**
   * Verifica se pode editar informações do grupo
   */
  canEditGroup() {
    return this.isAdmin();
  }

  /**
   * Retorna representação JSON limpa
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      groupId: this.groupId,
      role: this.role,
      joinedAt: this.joinedAt,
      addedById: this.addedById,
      isActive: this.isActive,
      lastSeenAt: this.lastSeenAt,
      notifications: this.notifications,
      leftAt: this.leftAt,
      permissions: {
        canManageMembers: this.canManageMembers(),
        canDeleteMessages: this.canDeleteMessages(),
        canEditGroup: this.canEditGroup()
      }
    };
  }
} 