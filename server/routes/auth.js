import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { users, tokenBlacklist } from '../data/store.js';
import { generateTokens, verifyToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  const user = users.find(u => u.email === email && u.ativo);
  if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
    return res.status(401).json({ erro: 'Credenciais inválidas. Verifique seu email e senha.' });
  }

  const payload = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    municipio_id: user.municipio_id,
    upa_id: user.upa_id,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  res.json({
    accessToken,
    refreshToken,
    usuario: payload,
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ erro: 'Refresh token não fornecido.' });

  if (tokenBlacklist.has(refreshToken)) {
    return res.status(401).json({ erro: 'Refresh token revogado.' });
  }

  try {
    const decoded = verifyToken(refreshToken);
    if (decoded.type !== 'refresh') return res.status(401).json({ erro: 'Token inválido.' });

    const { type, iat, exp, ...payload } = decoded;
    const tokens = generateTokens(payload);
    tokenBlacklist.add(refreshToken);

    res.json(tokens);
  } catch {
    res.status(401).json({ erro: 'Refresh token inválido ou expirado.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  tokenBlacklist.add(req.token);
  res.json({ mensagem: 'Logout realizado com sucesso.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const { senha_hash, ...safe } = user;
  res.json(safe);
});

export default router;
