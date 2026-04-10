import { Router } from 'express';
import { medicos, users, upas, especialidades, turnos, addEntity } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/medicos — gestor_upa, gestor_municipal, super_admin
router.get('/', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const { upa_id } = req.query;

  let lista = medicos;

  // Gestor de UPA só vê médicos da sua UPA
  if (req.user.perfil === 'gestor_upa') {
    lista = lista.filter(m => m.upa_id === req.user.upa_id);
  } else if (upa_id) {
    lista = lista.filter(m => m.upa_id === upa_id);
  }

  const resultado = lista.map(med => {
    const esp = especialidades.find(e => e.id === med.especialidade_id);
    const turnoAtual = turnos.find(t => t.medico_id === med.id && t.status !== 'encerrado');

    return {
      ...med,
      especialidade_nome: esp ? esp.nome : null,
      status_turno: turnoAtual ? turnoAtual.status : 'offline',
      turno_iniciado_em: turnoAtual ? turnoAtual.iniciado_em : null,
    };
  });

  res.json(resultado);
});

// GET /api/medicos/:id
router.get('/:id', authMiddleware, (req, res) => {
  const med = medicos.find(m => m.id === req.params.id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const esp = especialidades.find(e => e.id === med.especialidade_id);
  const turnoAtual = turnos.find(t => t.medico_id === med.id && t.status !== 'encerrado');

  res.json({
    ...med,
    especialidade_nome: esp ? esp.nome : null,
    status_turno: turnoAtual ? turnoAtual.status : 'offline',
  });
});

// POST /api/medicos — gestor_upa
router.post('/', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const { nome, crm, especialidade_id, email } = req.body;
  if (!nome || !crm || !especialidade_id) {
    return res.status(400).json({ erro: 'Nome, CRM e especialidade são obrigatórios.' });
  }

  const upa_id = req.user.perfil === 'gestor_upa' ? req.user.upa_id : req.body.upa_id;
  if (!upa_id) return res.status(400).json({ erro: 'UPA é obrigatória.' });

  // Cria usuário se e-mail fornecido
  let usuario_id = null;
  if (email) {
    const existente = users.find(u => u.email === email);
    if (existente) return res.status(400).json({ erro: 'E-mail já cadastrado.' });

    const novoUsuario = {
      id: uuidv4(),
      nome,
      email,
      senha_hash: bcrypt.hashSync('123456', 10),
      perfil: 'medico',
      ativo: true,
      municipio_id: null,
      upa_id,
      criado_em: new Date().toISOString(),
    };
    users.push(novoUsuario);
    usuario_id = novoUsuario.id;
  }

  const novoMedico = addEntity(medicos, { nome, crm, especialidade_id, upa_id, usuario_id });
  const esp = especialidades.find(e => e.id === especialidade_id);

  res.status(201).json({ ...novoMedico, especialidade_nome: esp ? esp.nome : null });
});

// PUT /api/medicos/:id
router.put('/:id', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const idx = medicos.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Médico não encontrado.' });

  medicos[idx] = { ...medicos[idx], ...req.body };
  res.json(medicos[idx]);
});

// DELETE /api/medicos/:id
router.delete('/:id', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const idx = medicos.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Médico não encontrado.' });

  medicos.splice(idx, 1);
  res.json({ mensagem: 'Médico removido com sucesso.' });
});

export default router;
