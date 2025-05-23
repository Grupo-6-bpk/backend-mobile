import PrismaMessageRepository from '../db/PrismaMessageRepository.js';

/**
 * Chat Event Handler for WebSocket
 * Handles all chat-related real-time events
 */
export default class ChatEventHandler {
  constructor(sendMessageUseCase, groupMemberRepository, chatGroupRepository) {
    this.sendMessageUseCase = sendMessageUseCase;
    this.groupMemberRepository = groupMemberRepository;
    this.chatGroupRepository = chatGroupRepository;
    this.messageRepository = new PrismaMessageRepository();
  }

  /**
   * Handle send message event
   */
  async handleSendMessage(socket, data, callback, io) {
    try {
      const userId = socket.userId;
      const userName = socket.user.name;

      // Validate required fields
      if (!data.groupId) {
        throw new Error('ID do grupo é obrigatório');
      }

      if (!data.content && data.type === 'text') {
        throw new Error('Conteúdo da mensagem é obrigatório');
      }

      // Prepare message data
      const messageData = {
        content: data.content?.trim(),
        type: data.type || 'text',
        senderId: userId,
        groupId: data.groupId,
        replyToId: data.replyToId,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize
      };

      // Send message using use case
      const message = await this.sendMessageUseCase.execute(messageData);

      // Prepare real-time message data
      const realtimeMessage = {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: userId,
        senderName: userName,
        groupId: message.groupId,
        replyToId: message.replyToId,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        status: 'sent',
        createdAt: message.createdAt,
        timestamp: Date.now(),
        isEdited: false,
        isDeleted: false
      };

      // Emit to all group members except sender
      io.to(`group_${data.groupId}`).except(socket.id).emit('new_message', realtimeMessage);

      // Emit message confirmation to sender
      socket.emit('message_sent', {
        tempId: data.tempId, // For Flutter to match with local message
        message: realtimeMessage,
        success: true
      });

      // Send callback response
      if (callback) {
        callback({
          success: true,
          message: realtimeMessage,
          tempId: data.tempId
        });
      }

      // Update group's last activity
      await this.updateGroupLastActivity(data.groupId);

      console.log(`📨 Message sent: User ${userId} -> Group ${data.groupId}`);

    } catch (error) {
      console.error('Send message error:', error);
      
      // Emit error to sender
      socket.emit('message_error', {
        tempId: data.tempId,
        error: error.message,
        timestamp: Date.now()
      });

      if (callback) {
        callback({
          success: false,
          error: error.message,
          tempId: data.tempId
        });
      }
    }
  }

  /**
   * Handle join group event
   */
  async handleJoinGroup(socket, data, callback) {
    try {
      const userId = socket.userId;
      const groupId = data.groupId;

      if (!groupId) {
        throw new Error('ID do grupo é obrigatório');
      }

      // Verify user is member of group
      const isMember = await this.groupMemberRepository.isMember(userId, groupId);
      if (!isMember) {
        throw new Error('Usuário não é membro deste grupo');
      }

      // Join socket to group room
      await socket.join(`group_${groupId}`);

      // Get group details
      const group = await this.chatGroupRepository.findById(groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      // Update last seen
      await this.groupMemberRepository.updateLastSeen(userId, groupId);

      // Notify group members (except joiner) that user joined
      socket.to(`group_${groupId}`).emit('user_joined_group', {
        userId: userId,
        userName: socket.user.name,
        groupId: groupId,
        timestamp: Date.now()
      });

      // Send success response
      if (callback) {
        callback({
          success: true,
          group: {
            id: group.id,
            name: group.name,
            type: group.type,
            memberCount: group._count?.members || 0
          },
          message: 'Entrou no grupo com sucesso'
        });
      }

      console.log(`🚪 User ${userId} joined group ${groupId}`);

    } catch (error) {
      console.error('Join group error:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Handle leave group event
   */
  async handleLeaveGroup(socket, data, callback) {
    try {
      const userId = socket.userId;
      const groupId = data.groupId;

      if (!groupId) {
        throw new Error('ID do grupo é obrigatório');
      }

      // Leave socket from group room
      await socket.leave(`group_${groupId}`);

      // Notify group members that user left
      socket.to(`group_${groupId}`).emit('user_left_group', {
        userId: userId,
        userName: socket.user.name,
        groupId: groupId,
        timestamp: Date.now()
      });

      // Send success response
      if (callback) {
        callback({
          success: true,
          message: 'Saiu do grupo com sucesso'
        });
      }

      console.log(`🚪 User ${userId} left group ${groupId}`);

    } catch (error) {
      console.error('Leave group error:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Handle edit message event
   */
  async handleEditMessage(socket, data, callback, io) {
    try {
      const userId = socket.userId;

      if (!data.messageId || !data.content) {
        throw new Error('ID da mensagem e conteúdo são obrigatórios');
      }

      // Get original message
      const originalMessage = await this.messageRepository.findById(data.messageId);
      if (!originalMessage) {
        throw new Error('Mensagem não encontrada');
      }

      // Check if user can edit (owner only)
      if (originalMessage.senderId !== userId) {
        throw new Error('Apenas o autor pode editar a mensagem');
      }

      // Check if message can be edited (text only, not deleted)
      if (originalMessage.type !== 'text' || originalMessage.isDeleted) {
        throw new Error('Apenas mensagens de texto não deletadas podem ser editadas');
      }

      // Update message
      const updatedMessage = await this.messageRepository.update(data.messageId, {
        content: data.content.trim(),
        editedAt: new Date()
      });

      // Prepare real-time update
      const messageUpdate = {
        id: updatedMessage.id,
        content: updatedMessage.content,
        editedAt: updatedMessage.editedAt,
        isEdited: true,
        timestamp: Date.now()
      };

      // Emit to all group members
      io.to(`group_${originalMessage.groupId}`).emit('message_edited', messageUpdate);

      // Send callback response
      if (callback) {
        callback({
          success: true,
          message: messageUpdate
        });
      }

      console.log(`✏️ Message edited: ${data.messageId} by user ${userId}`);

    } catch (error) {
      console.error('Edit message error:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Handle delete message event
   */
  async handleDeleteMessage(socket, data, callback, io) {
    try {
      const userId = socket.userId;

      if (!data.messageId) {
        throw new Error('ID da mensagem é obrigatório');
      }

      // Get original message
      const originalMessage = await this.messageRepository.findById(data.messageId);
      if (!originalMessage) {
        throw new Error('Mensagem não encontrada');
      }

      // Check permissions (owner or group admin)
      const membership = await this.groupMemberRepository.findByUserAndGroup(userId, originalMessage.groupId);
      const canDelete = originalMessage.senderId === userId || 
                       ['admin', 'moderator'].includes(membership?.role);

      if (!canDelete) {
        throw new Error('Sem permissão para deletar esta mensagem');
      }

      // Delete message (soft delete)
      await this.messageRepository.delete(data.messageId);

      // Prepare real-time update
      const messageUpdate = {
        id: data.messageId,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        timestamp: Date.now()
      };

      // Emit to all group members
      io.to(`group_${originalMessage.groupId}`).emit('message_deleted', messageUpdate);

      // Send callback response
      if (callback) {
        callback({
          success: true,
          message: 'Mensagem deletada com sucesso'
        });
      }

      console.log(`🗑️ Message deleted: ${data.messageId} by user ${userId}`);

    } catch (error) {
      console.error('Delete message error:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Update group's last activity timestamp
   */
  async updateGroupLastActivity(groupId) {
    try {
      await this.chatGroupRepository.update(groupId, {
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating group last activity:', error);
    }
  }

  /**
   * Handle file upload for messages
   */
  async handleFileUpload(socket, data, callback) {
    try {
      const userId = socket.userId;

      // Validate file data
      if (!data.file || !data.fileName || !data.groupId) {
        throw new Error('Dados do arquivo incompletos');
      }

      // Check file size limits
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (data.fileSize > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 100MB');
      }

      // Check if user is member of group
      const isMember = await this.groupMemberRepository.isMember(userId, data.groupId);
      if (!isMember) {
        throw new Error('Usuário não é membro deste grupo');
      }

      // Basic file upload implementation
      // In production, use AWS S3, Cloudinary, or similar service
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'chat');
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }

      // Generate unique filename
      const fileExtension = path.extname(data.fileName);
      const uniqueFileName = `${Date.now()}_${userId}_${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Decode base64 file data and save
      if (data.file.startsWith('data:')) {
        // Remove data URL prefix
        const base64Data = data.file.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(filePath, buffer);
      } else {
        // Assume it's already base64 encoded
        const buffer = Buffer.from(data.file, 'base64');
        await fs.writeFile(filePath, buffer);
      }

      // Generate accessible URL
      const fileUrl = `/uploads/chat/${uniqueFileName}`;

      // Send success response
      if (callback) {
        callback({
          success: true,
          fileUrl: fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          message: 'Arquivo enviado com sucesso'
        });
      }

      console.log(`📎 File uploaded: ${data.fileName} by user ${userId} -> ${fileUrl}`);

    } catch (error) {
      console.error('File upload error:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
} 