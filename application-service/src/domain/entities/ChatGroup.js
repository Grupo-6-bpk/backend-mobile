/**
 * ChatGroup Domain Entity
 * Representa um grupo de chat no domínio
 */
export default class ChatGroup {
  constructor({
    id,
    name,
    description,
    type = 'group', // 'group' ou 'direct'
    imageUrl,
    createdById,
    createdAt,
    updatedAt,
    isActive = true,
    maxMembers = 100
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.imageUrl = imageUrl;
    this.createdById = createdById;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;
    this.isActive = isActive;
    this.maxMembers = maxMembers;
    this.members = [];
    this.messages = [];
  }

  /**
   * Valida se o grupo é válido
   */
  isValid() {
    if (!this.name || this.name.length < 2) {
      throw new Error('Nome do grupo deve ter pelo menos 2 caracteres');
    }
    
    if (this.type === 'direct' && this.maxMembers !== 2) {
      throw new Error('Chat direto deve ter exatamente 2 membros');
    }
    
    return true;
  }

  /**
   * Verifica se o grupo é um chat direto
   */
  isDirectChat() {
    return this.type === 'direct';
  }

  /**
   * Atualiza informações do grupo
   */
  updateInfo(name, description, imageUrl) {
    if (name) this.name = name;
    if (description !== undefined) this.description = description;
    if (imageUrl !== undefined) this.imageUrl = imageUrl;
    this.updatedAt = new Date();
    
    this.isValid();
    return this;
  }

  /**
   * Desativa o grupo
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Ativa o grupo
   */
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Retorna representação JSON limpa
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      imageUrl: this.imageUrl,
      createdById: this.createdById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
      maxMembers: this.maxMembers
    };
  }
} 