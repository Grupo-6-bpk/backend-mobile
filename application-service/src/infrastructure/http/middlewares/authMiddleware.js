import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status';

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário está autenticado e adiciona req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token de acesso requerido',
        error: 'Authorization header missing'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Formato de token inválido',
        error: 'Token must be Bearer format'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token não fornecido',
        error: 'Token missing'
      });
    }

    // Token de exemplo para testes - REMOVER EM PRODUÇÃO
    if (token === 'test-jwt-token-for-swagger-testing') {
      req.user = {
        id: 1,
        email: 'test@example.com',
        name: 'Usuario',
        last_name: 'Teste',
        isDriver: true,
        isPassenger: true
      };
      return next();
    }

    // Verificar o token JWT real
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Adicionar dados do usuário à requisição
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name,
      isDriver: decoded.isDriver,
      isPassenger: decoded.isPassenger
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token inválido',
        error: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token expirado',
        error: 'Token expired'
      });
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Erro de autenticação',
      error: error.message
    });
  }
};

export default authMiddleware; 