import { Router } from 'express';
import { turnos, registrosTurno, medicos, especialidades, addEntity } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function getMedicoDoUsuario(userId) {
  return medicos.find(m => m.usuario_id === userId);
}

function addRegistro(turno_id, acao) {
  const registro = {
    id: uuidv4(),
    turno_id,
    acao,
    registrado_em: new Date().toISOString(),
  };
  registrosTurno.push(registro);
  return registro;
}

// GET /api/turnos — gestor vê todos da sua UPA, médico vê o seu
router.get('/', authMiddleware, (req, res) => {
  const { upa_id } = req.query;

  let lista = turnos;

  if (req.user.perfil === 'medico') {
    const med = getMedicoDoUsuario(req.user.id);
    if (!med) return res.json([]);
    lista = lista.filter(t => t.medico_id === med.id);
  } else if (req.user.perfil === 'gestor_upa') {
    const medicosUpa = medicos.filter(m => m.upa_id === req.user.upa_id).map(m => m.id);
    lista = lista.filter(t => medicosUpa.includes(t.medico_id));
  } else if (upa_id) {
    const medicosUpa = medicos.filter(m => m.upa_id === upa_id).map(m => m.id);
    lista = lista.filter(t => medicosUpa.includes(t.medico_id));
  }

  const resultado = lista.map(turno => {
    const med = medicos.find(m => m.id === turno.medico_id);
    const esp = med ? especialidades.find(e => e.id === med.especialidade_id) : null;
    const historico = registrosTurno.filter(r => r.turno_id === turno.id);
    return {
      ...turno,
      medico_nome: med ? med.nome : null,
      especialidade_nome: esp ? esp.nome : null,
      historico,
    };
  });

  res.json(resultado);
});

// GET /api/turnos/meu — turno atual do médico logado
router.get('/meu', authMiddleware, requirePerfil('medico'), (req, res) => {
  const med = getMedicoDoUsuario(req.user.id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const turnoAtual = turnos.find(t => t.medico_id === med.id && t.status !== 'encerrado');
  const historico = turnoAtual ? registrosTurno.filter(r => r.turno_id === turnoAtual.id) : [];
  const esp = especialidades.find(e => e.id === med.especialidade_id);

  res.json({
    medico: { ...med, especialidade_nome: esp ? esp.nome : null },
    turno: turnoAtual || null,
    historico,
  });
});

// POST /api/turnos/iniciar
router.post('/iniciar', authMiddleware, requirePerfil('medico'), (req, res) => {
  const med = getMedicoDoUsuario(req.user.id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const turnoExistente = turnos.find(t => t.medico_id === med.id && t.status !== 'encerrado');
  if (turnoExistente) return res.status(400).json({ erro: 'Já existe um turno em andamento.' });

  const novoTurno = {
    id: uuidv4(),
    medico_id: med.id,
    escala_id: req.body.escala_id || null,
    status: 'em_atendimento',
    iniciado_em: new Date().toISOString(),
    encerrado_em: null,
  };
  turnos.push(novoTurno);
  addRegistro(novoTurno.id, 'inicio');

  res.status(201).json(novoTurno);
});

// POST /api/turnos/pausar
router.post('/pausar', authMiddleware, requirePerfil('medico'), (req, res) => {
  const med = getMedicoDoUsuario(req.user.id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const turno = turnos.find(t => t.medico_id === med.id && t.status === 'em_atendimento');
  if (!turno) return res.status(400).json({ erro: 'Nenhum turno ativo para pausar.' });

  turno.status = 'em_pausa';
  addRegistro(turno.id, 'pausa');

  res.json(turno);
});

// POST /api/turnos/retornar
router.post('/retornar', authMiddleware, requirePerfil('medico'), (req, res) => {
  const med = getMedicoDoUsuario(req.user.id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const turno = turnos.find(t => t.medico_id === med.id && t.status === 'em_pausa');
  if (!turno) return res.status(400).json({ erro: 'Nenhum turno em pausa para retornar.' });

  turno.status = 'em_atendimento';
  addRegistro(turno.id, 'retorno');

  res.json(turno);
});

// POST /api/turnos/encerrar
router.post('/encerrar', authMiddleware, requirePerfil('medico'), (req, res) => {
  const med = getMedicoDoUsuario(req.user.id);
  if (!med) return res.status(404).json({ erro: 'Médico não encontrado.' });

  const turno = turnos.find(t => t.medico_id === med.id && ['em_atendimento', 'em_pausa'].includes(t.status));
  if (!turno) return res.status(400).json({ erro: 'Nenhum turno ativo para encerrar.' });

  turno.status = 'encerrado';
  turno.encerrado_em = new Date().toISOString();
  addRegistro(turno.id, 'encerramento');

  res.json(turno);
});

export default router;
