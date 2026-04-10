import { Router } from 'express';
import { users, addEntity } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/usuarios — listar por perfil e municipio
router.get('/', authMiddleware, requirePerfil('gestor_municipal', 'super_admin'), (req, res) => {
  const { perfil, municipio_id, upa_id } = req.query;

  let lista = users.filter(u => u.ativo);

  if (req.user.perfil === 'gestor_municipal') {
    lista = lista.filter(u => u.municipio_id === req.user.municipio_id);
  }

  if (perfil) lista = lista.filter(u => u.perfil === perfil);
  if (municipio_id) lista = lista.filter(u => u.municipio_id === municipio_id);
  if (upa_id) lista = lista.filter(u => u.upa_id === upa_id);

  res.json(lista.map(({ senha_hash, ...u }) => u));
});

// POST /api/usuarios — criar gestor municipal ou gestor UPA
router.post('/', authMiddleware, requirePerfil('gestor_municipal', 'super_admin'), (req, res) => {
  const { nome, email, perfil, municipio_id, upa_id } = req.body;

  if (!nome || !email || !perfil) {
    return res.status(400).json({ erro: 'Nome, email e perfil são obrigatórios.' });
  }

  const existente = users.find(u => u.email === email);
  if (existente) return res.status(400).json({ erro: 'E-mail já cadastrado.' });

  const novo = {
    id: uuidv4(),
    nome,
    email,
    senha_hash: bcrypt.hashSync('123456', 10),
    perfil,
    ativo: true,
    municipio_id: municipio_id || null,
    upa_id: upa_id || null,
    criado_em: new Date().toISOString(),
  };
  users.push(novo);

  const { senha_hash, ...safe } = novo;
  res.status(201).json(safe);
});

// PUT /api/usuarios/:id/desativar
router.put('/:id/desativar', authMiddleware, requirePerfil('gestor_municipal', 'super_admin'), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  user.ativo = false;
  res.json({ mensagem: 'Usuário desativado.' });
});

export default router;
