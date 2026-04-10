import { Router } from 'express';
import { escalas, medicos, especialidades, addEntity } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';

const router = Router();

// GET /api/escalas
router.get('/', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin', 'medico'), (req, res) => {
  const { upa_id, medico_id, data } = req.query;

  let lista = escalas;

  if (req.user.perfil === 'gestor_upa') {
    const medicosUpa = medicos.filter(m => m.upa_id === req.user.upa_id).map(m => m.id);
    lista = lista.filter(e => medicosUpa.includes(e.medico_id));
  } else if (req.user.perfil === 'medico') {
    const med = medicos.find(m => m.usuario_id === req.user.id);
    if (med) lista = lista.filter(e => e.medico_id === med.id);
    else lista = [];
  }

  if (upa_id) {
    const medicosUpa = medicos.filter(m => m.upa_id === upa_id).map(m => m.id);
    lista = lista.filter(e => medicosUpa.includes(e.medico_id));
  }
  if (medico_id) lista = lista.filter(e => e.medico_id === medico_id);
  if (data) lista = lista.filter(e => e.data === data);

  const resultado = lista.map(esc => {
    const med = medicos.find(m => m.id === esc.medico_id);
    const esp = med ? especialidades.find(e => e.id === med.especialidade_id) : null;
    return {
      ...esc,
      medico_nome: med ? med.nome : null,
      especialidade_nome: esp ? esp.nome : null,
    };
  });

  res.json(resultado);
});

// POST /api/escalas
router.post('/', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const { medico_id, data, hora_inicio, hora_fim } = req.body;
  if (!medico_id || !data || !hora_inicio || !hora_fim) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  const med = medicos.find(m => m.id === medico_id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const nova = addEntity(escalas, {
    medico_id,
    upa_id: med.upa_id,
    data,
    hora_inicio,
    hora_fim,
  });

  const esp = especialidades.find(e => e.id === med.especialidade_id);
  res.status(201).json({
    ...nova,
    medico_nome: med.nome,
    especialidade_nome: esp ? esp.nome : null,
  });
});

// DELETE /api/escalas/:id
router.delete('/:id', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const idx = escalas.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Escala não encontrada.' });

  escalas.splice(idx, 1);
  res.json({ mensagem: 'Escala removida com sucesso.' });
});

export default router;
