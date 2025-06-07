import { Router } from 'express';
import {
  getChats,
  getChatMessages,
  sendMessage,
  createChat,
  deleteChat,
  inviteUser,
  removeUser,
  blockUser,
  unblockUser
} from '../../../../presentation/controllers/chatController.js';

const chatRouter = Router();

// GET /api/chats - Lista conversas do usuário
chatRouter.get('/', getChats);

// GET /api/chats/:chatId/messages - Histórico de mensagens
chatRouter.get('/:chatId/messages', getChatMessages);

// POST /api/chats/:chatId/messages - Enviar mensagem
chatRouter.post('/:chatId/messages', sendMessage);

// POST /api/chats - Criar novo chat (direto ou grupo)
chatRouter.post('/', createChat);

// DELETE /api/chats/:chatId - Excluir chat (apenas grupos, apenas admin)
chatRouter.delete('/:chatId', deleteChat);

// POST /api/chats/:chatId/invite - Adicionar membro ao grupo
chatRouter.post('/:chatId/invite', inviteUser);

// POST /api/chats/:chatId/remove - Remover membro do grupo
chatRouter.post('/:chatId/remove', removeUser);

// POST /api/chats/:chatId/block - Bloquear usuário no chat
chatRouter.post('/:chatId/block', blockUser);

// POST /api/chats/:chatId/unblock - Desbloquear usuário no chat
chatRouter.post('/:chatId/unblock', unblockUser);

export default chatRouter; 