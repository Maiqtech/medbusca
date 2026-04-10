import jwt from 'jsonwebtoken';
import { tokenBlacklist } from '../data/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medbusca_secret_dev_2026';

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ erro: 'Token revogado.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

export function requirePerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ erro: 'Acesso não autorizado para este perfil.' });
    }
    next();
  };
}
