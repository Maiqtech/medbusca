import { Router } from 'express';
import { municipios, upas, users, addEntity } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';

const router = Router();

// GET /api/municipios — público (para o portal do cidadão)
router.get('/', (req, res) => {
  const lista = municipios
    .filter(m => m.ativo)
    .map(m => ({
      ...m,
      total_upas: upas.filter(u => u.municipio_id === m.id && u.ativa).length,
    }));
  res.json(lista);
});

// GET /api/municipios/:id
router.get('/:id', authMiddleware, (req, res) => {
  const municipio = municipios.find(m => m.id === req.params.id);
  if (!municipio) return res.status(404).json({ erro: 'Município não encontrado.' });

  const totalUpas = upas.filter(u => u.municipio_id === municipio.id).length;
  const totalGestores = users.filter(u => u.municipio_id === municipio.id && u.perfil === 'gestor_upa').length;
  const totalMedicos = users.filter(u => u.municipio_id === municipio.id && u.perfil === 'medico').length;
  const unidadesAtivas = upas.filter(u => u.municipio_id === municipio.id && u.ativa).length;

  res.json({ ...municipio, totalUpas, totalGestores, totalMedicos, unidadesAtivas });
});

// POST /api/municipios — super_admin
router.post('/', authMiddleware, requirePerfil('super_admin'), (req, res) => {
  const { nome, uf, logo_url } = req.body;
  if (!nome || !uf) return res.status(400).json({ erro: 'Nome e UF são obrigatórios.' });

  const novo = addEntity(municipios, { nome, uf, logo_url: logo_url || '', ativo: true });
  res.status(201).json(novo);
});

// PUT /api/municipios/:id — super_admin
router.put('/:id', authMiddleware, requirePerfil('super_admin'), (req, res) => {
  const idx = municipios.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Município não encontrado.' });

  municipios[idx] = { ...municipios[idx], ...req.body };
  res.json(municipios[idx]);
});

// DELETE /api/municipios/:id — super_admin
router.delete('/:id', authMiddleware, requirePerfil('super_admin'), (req, res) => {
  const idx = municipios.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Município não encontrado.' });

  municipios[idx].ativo = false;
  res.json({ mensagem: 'Município desativado com sucesso.' });
});

export default router;
