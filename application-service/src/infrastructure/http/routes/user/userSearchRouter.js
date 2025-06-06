import { Router } from 'express';
import { searchUsers } from '../../../../presentation/controllers/UserController.js';

const userSearchRouter = Router();

// GET /api/users/search?phone=<telefone> - Buscar usuários por telefone
userSearchRouter.get('/search', searchUsers);

export default userSearchRouter; 