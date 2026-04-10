import { Router } from 'express';
import { alertas, upas, municipios } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';

const router = Router();

// GET /api/alertas
router.get('/', authMiddleware, (req, res) => {
  let lista = alertas.filter(a => !a.resolvido);

  if (req.user.perfil === 'gestor_upa') {
    lista = lista.filter(a => a.upa_id === req.user.upa_id);
  } else if (req.user.perfil === 'gestor_municipal') {
    lista = lista.filter(a => a.municipio_id === req.user.municipio_id);
  }

  const resultado = lista.map(alerta => {
    const upa = alerta.upa_id ? upas.find(u => u.id === alerta.upa_id) : null;
    const municipio = alerta.municipio_id ? municipios.find(m => m.id === alerta.municipio_id) : null;
    return {
      ...alerta,
      upa_nome: upa ? upa.nome : null,
      municipio_nome: municipio ? municipio.nome : null,
    };
  });

  res.json(resultado);
});

// PUT /api/alertas/:id/resolver
router.put('/:id/resolver', authMiddleware, (req, res) => {
  const alerta = alertas.find(a => a.id === req.params.id);
  if (!alerta) return res.status(404).json({ erro: 'Alerta não encontrado.' });

  alerta.resolvido = true;
  alerta.resolvido_em = new Date().toISOString();

  res.json(alerta);
});

export default router;
