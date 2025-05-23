import { Router } from 'express';
import ChatController from '../controllers/ChatController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rateLimitMiddleware from '../middleware/rateLimitMiddleware.js';

const router = Router();
const chatController = new ChatController();

// Apply authentication middleware to all chat routes
router.use(authMiddleware);

// Apply rate limiting to chat routes
router.use(rateLimitMiddleware);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat system endpoints
 */

/**
 * @swagger
 * /api/chat/groups:
 *   get:
 *     summary: Get user's chat groups
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of groups per page
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatGroup'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     summary:
 *                       type: object
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HATEOASLink'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new chat group or direct chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Group name (required for groups)
 *               description:
 *                 type: string
 *                 description: Group description
 *               type:
 *                 type: string
 *                 enum: [group, direct]
 *                 default: group
 *               imageUrl:
 *                 type: string
 *                 format: url
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of user IDs to add as members
 *             required:
 *               - type
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChatGroup'
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HATEOASLink'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/groups', chatController.getUserGroups.bind(chatController));
router.post('/groups', chatController.createGroup.bind(chatController));

/**
 * @swagger
 * /api/chat/groups/{groupId}/messages:
 *   get:
 *     summary: Get messages from a chat group
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     groupInfo:
 *                       type: object
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HATEOASLink'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Send a message to a chat group
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content (required for text messages)
 *               type:
 *                 type: string
 *                 enum: [text, image, file, audio, video]
 *                 default: text
 *               replyToId:
 *                 type: integer
 *                 description: ID of message being replied to
 *               fileUrl:
 *                 type: string
 *                 format: url
 *                 description: URL of uploaded file (for media messages)
 *               fileName:
 *                 type: string
 *                 description: Name of uploaded file
 *               fileSize:
 *                 type: integer
 *                 description: Size of uploaded file in bytes
 *             required:
 *               - type
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HATEOASLink'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/groups/:groupId/messages', chatController.getGroupMessages.bind(chatController));
router.post('/groups/:groupId/messages', chatController.sendMessage.bind(chatController));

/**
 * @swagger
 * /api/chat/users/search:
 *   get:
 *     summary: Search users for chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (name, last name, or email)
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Optional group ID to check membership status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Users found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserSearchResult'
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HATEOASLink'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users/search', chatController.searchUsers.bind(chatController));

/**
 * @swagger
 * /api/chat/users/contacts:
 *   get:
 *     summary: Get recent contacts (users with direct chats)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of contacts
 *     responses:
 *       200:
 *         description: Recent contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContactResult'
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HATEOASLink'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users/contacts', chatController.getRecentContacts.bind(chatController));

export default router; 