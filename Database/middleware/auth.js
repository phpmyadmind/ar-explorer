const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '476499bb-af5b-4dfd-a8b4-92c032c51e64';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('🔐 Auth middleware - Request to:', req.path);
  console.log('🔐 Auth header present:', !!authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ No token provided or token is malformed');
    return res.status(401).json({ error: 'No token provided or token is malformed' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Token extracted (length):', token ? token.length : 0);

  try {
    // Verificar el token sin necesidad de usuario/contraseña
    // El token debe ser generado en el frontend con el mismo JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully:', decoded);
    req.user = decoded; // Add user payload to request (puede ser cualquier payload)
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Failed to authenticate token' });
  }
};

module.exports = authMiddleware;
