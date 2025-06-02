import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { ChatService } from '../../application/services/ChatService.js';
import { MessageService } from '../../application/services/MessageService.js';
import { UserService } from '../../application/services/UserService.js';

export class SocketHandler {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.chatService = new ChatService();
    this.messageService = new MessageService();
    this.userService = new UserService();
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Token obrigatório'));
        }

        const payload = jwt.verify(token, process.env.JWTSECRET);
        const user = await this.userService.getUserById(payload.id);
        
        socket.data.userId = user.id;
        socket.data.userName = user.name;
        socket.data.userAvatar = user.avatarUrl;
        
        next();
      } catch (error) {
        console.error('Erro na autenticação WebSocket:', error);
        next(new Error('Token inválido'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`Usuário conectado: ${socket.data.userName} (${socket.data.userId})`);
      
      try {
        const chatIds = await this.chatService.getUserChatIds(socket.data.userId);
        for (const chatId of chatIds) {
          await socket.join(`chat.${chatId}`);
        }
      } catch (error) {
        console.error('Erro ao conectar usuário às salas:', error);
      }

      socket.on('send_message', async (data) => {
        try {
          const { chatId, content } = data;
          
          if (!chatId || !content) {
            socket.emit('error', { message: 'chatId e content são obrigatórios' });
            return;
          }

          const message = await this.messageService.sendMessage(
            content,
            socket.data.userId,
            chatId
          );

          this.io.to(`chat.${chatId}`).emit('message_received', {
            chatId: message.chatId,
            messageId: message.id,
            senderId: message.senderId,
            senderName: message.sender.name,
            senderAvatar: message.sender.avatarUrl,
            content: message.content,
            sentAt: message.sentAt
          });

          socket.emit('message_ack', {
            messageId: message.id,
            chatId: message.chatId,
            sentAt: message.sentAt
          });

        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('create_group', async (data) => {
        try {
          const { name, participantIds } = data;
          
          if (!name || !participantIds || !Array.isArray(participantIds)) {
            socket.emit('error', { message: 'name e participantIds são obrigatórios' });
            return;
          }

          const chat = await this.chatService.createGroup(socket.data.userId, name, participantIds);
          
          const allParticipants = [socket.data.userId, ...participantIds];
          for (const participantId of allParticipants) {
            const participantSockets = await this.io.in(`user.${participantId}`).fetchSockets();
            for (const participantSocket of participantSockets) {
              await participantSocket.join(`chat.${chat.id}`);
            }
          }

          this.io.to(`chat.${chat.id}`).emit('group_created', {
            chatId: chat.id,
            name: chat.name,
            adminId: chat.adminId,
            participants: chat.participants.map(p => ({
              userId: p.userId,
              blocked: p.blocked
            }))
          });

        } catch (error) {
          console.error('Erro ao criar grupo:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('join_group', async (data) => {
        try {
          const { chatId } = data;
          
          if (!chatId) {
            socket.emit('error', { message: 'chatId é obrigatório' });
            return;
          }

          const chat = await this.chatService.getChatById(chatId, socket.data.userId);
          await socket.join(`chat.${chatId}`);

          socket.to(`chat.${chatId}`).emit('user_joined', {
            chatId,
            userId: socket.data.userId,
            userName: socket.data.userName
          });

        } catch (error) {
          console.error('Erro ao entrar no grupo:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('leave_group', async (data) => {
        try {
          const { chatId } = data;
          
          if (!chatId) {
            socket.emit('error', { message: 'chatId é obrigatório' });
            return;
          }

          await socket.leave(`chat.${chatId}`);

          socket.to(`chat.${chatId}`).emit('user_left', {
            chatId,
            userId: socket.data.userId,
            userName: socket.data.userName
          });

        } catch (error) {
          console.error('Erro ao sair do grupo:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('block_user', async (data) => {
        try {
          const { chatId, targetUserId } = data;
          
          if (!chatId || !targetUserId) {
            socket.emit('error', { message: 'chatId e targetUserId são obrigatórios' });
            return;
          }

          await this.chatService.blockParticipant(chatId, socket.data.userId, targetUserId);

          this.io.to(`chat.${chatId}`).emit('user_blocked', {
            chatId,
            targetUserId,
            blockedBy: socket.data.userId
          });

        } catch (error) {
          console.error('Erro ao bloquear usuário:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('unblock_user', async (data) => {
        try {
          const { chatId, targetUserId } = data;
          
          if (!chatId || !targetUserId) {
            socket.emit('error', { message: 'chatId e targetUserId são obrigatórios' });
            return;
          }

          await this.chatService.unblockParticipant(chatId, socket.data.userId, targetUserId);

          this.io.to(`chat.${chatId}`).emit('user_unblocked', {
            chatId,
            targetUserId,
            unblockedBy: socket.data.userId
          });

        } catch (error) {
          console.error('Erro ao desbloquear usuário:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('add_user_to_group', async (data) => {
        try {
          const { chatId, userId } = data;
          
          if (!chatId || !userId) {
            socket.emit('error', { message: 'chatId e userId são obrigatórios' });
            return;
          }

          await this.chatService.addParticipant(chatId, socket.data.userId, userId);
          
          const newUserSockets = await this.io.in(`user.${userId}`).fetchSockets();
          for (const newUserSocket of newUserSockets) {
            await newUserSocket.join(`chat.${chatId}`);
          }

          this.io.to(`chat.${chatId}`).emit('user_added', {
            chatId,
            userId,
            addedBy: socket.data.userId
          });

        } catch (error) {
          console.error('Erro ao adicionar usuário:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('remove_user_from_group', async (data) => {
        try {
          const { chatId, userId } = data;
          
          if (!chatId || !userId) {
            socket.emit('error', { message: 'chatId e userId são obrigatórios' });
            return;
          }

          await this.chatService.removeParticipant(chatId, socket.data.userId, userId);

          const removedUserSockets = await this.io.in(`user.${userId}`).fetchSockets();
          for (const removedUserSocket of removedUserSockets) {
            await removedUserSocket.leave(`chat.${chatId}`);
          }

          this.io.to(`chat.${chatId}`).emit('user_removed', {
            chatId,
            userId,
            removedBy: socket.data.userId
          });

        } catch (error) {
          console.error('Erro ao remover usuário:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.data.userName} (${socket.data.userId})`);
      });
    });
  }

  getIO() {
    return this.io;
  }
} 