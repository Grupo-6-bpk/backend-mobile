import rateLimit from 'express-rate-limit';
import HTTP_STATUS from 'http-status';

/**
 * Rate limiting para endpoints de chat
 * Limita requisições por IP/usuário para evitar spam
 */
const rateLimitMiddleware = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requisições por minuto por IP
  message: {
    message: 'Muitas requisições. Tente novamente em alguns segundos.',
    error: 'Rate limit exceeded',
    retryAfter: '60 seconds'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Função personalizada para chave de rate limit
  keyGenerator: (req) => {
    // Se o usuário estiver autenticado, usar o ID do usuário
    if (req.user && req.user.id) {
      return `user-${req.user.id}`;
    }
    // Caso contrário, usar o IP
    return req.ip;
  },
  
  // Diferentes limites para diferentes endpoints
  skip: (req) => {
    // Não aplicar rate limit para endpoints de leitura menos críticos
    if (req.method === 'GET' && req.path.includes('/groups') && !req.path.includes('/messages')) {
      return true;
    }
    return false;
  },
  
  // Handler personalizado para quando o limite é excedido
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      message: 'Muitas requisições. Aguarde antes de tentar novamente.',
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(rateLimitMiddleware.windowMs / 1000),
      links: [
        {
          rel: 'documentation',
          href: '/api-docs',
          method: 'GET'
        }
      ]
    });
  }
});

/**
 * Rate limiting mais restritivo para envio de mensagens
 */
export const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 mensagens por minuto
  message: {
    message: 'Você está enviando mensagens muito rapidamente. Aguarde um momento.',
    error: 'Message rate limit exceeded'
  },
  keyGenerator: (req) => {
    return req.user ? `msg-${req.user.id}` : `msg-${req.ip}`;
  },
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      message: 'Você está enviando mensagens muito rapidamente. Aguarde um momento.',
      error: 'Message rate limit exceeded',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiting para busca de usuários
 */
export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 buscas por minuto
  message: {
    message: 'Muitas buscas realizadas. Aguarde antes de buscar novamente.',
    error: 'Search rate limit exceeded'
  },
  keyGenerator: (req) => {
    return req.user ? `search-${req.user.id}` : `search-${req.ip}`;
  }
});

export default rateLimitMiddleware; 