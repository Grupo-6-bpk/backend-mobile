import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status';

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário está autenticado e adiciona req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log(`🔐 Auth middleware - Path: ${req.path}, Method: ${req.method}`);
    console.log(`🔐 Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.log('❌ Authorization header missing');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token de acesso requerido',
        error: 'Authorization header missing',
        hint: 'Adicione o header: Authorization: Bearer <token>'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid token format');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Formato de token inválido',
        error: 'Token must be Bearer format',
        hint: 'Use: Bearer <token>'
      });
    }

    const token = authHeader.substring(7).trim(); // Remove 'Bearer ' e espaços extras

    if (!token) {
      console.log('❌ Token is empty');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token não fornecido',
        error: 'Token missing',
        hint: 'Token não pode estar vazio'
      });
    }

    console.log(`🔐 Token extracted: ${token.substring(0, 20)}...`);

    // Token de exemplo para testes - REMOVER EM PRODUÇÃO
    if (token === 'test-jwt-token-for-swagger-testing') {
      console.log('✅ Using test token for development');
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

    // Configurar JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET || 'your-default-secret-key-change-in-production';
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not found in environment variables, using default');
    }

    console.log(`🔐 Using JWT secret: ${jwtSecret.substring(0, 10)}...`);

    // Verificar o token JWT real
    const decoded = jwt.verify(token, jwtSecret);
    
    console.log('✅ Token decoded successfully:', {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000)
    });
    
    // Adicionar dados do usuário à requisição
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.firstName,
      last_name: decoded.last_name || decoded.lastName,
      isDriver: decoded.isDriver || false,
      isPassenger: decoded.isPassenger || false
    };

    console.log('✅ User added to request:', req.user);
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token inválido',
        error: 'Invalid token',
        hint: 'Verifique se o token está correto'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token expirado',
        error: 'Token expired',
        hint: 'Faça login novamente para obter um novo token'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token ainda não é válido',
        error: 'Token not active',
        hint: 'Token ainda não pode ser usado'
      });
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Erro de autenticação',
      error: error.message,
      hint: 'Verifique se o token está correto e não expirou'
    });
  }
};

export default authMiddleware; 