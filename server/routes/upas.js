import { Router } from 'express';
import { upas, medicos, turnos, especialidades, escalas, addEntity } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';

const router = Router();

// GET /api/upas — público, com filtro por municipio e especialidade
router.get('/', (req, res) => {
  const { municipio_id, especialidade_id, uf, cidade } = req.query;

  let lista = upas.filter(u => u.ativa);

  if (municipio_id) lista = lista.filter(u => u.municipio_id === municipio_id);

  const resultado = lista.map(upa => {
    const medicosUpa = medicos.filter(m => m.upa_id === upa.id);
    const turnosAtivos = turnos.filter(t =>
      medicosUpa.some(m => m.id === t.medico_id) && t.status === 'em_atendimento'
    );

    let statusEspecialidade = null;
    if (especialidade_id) {
      const temEspecialidade = upa.especialidades.includes(especialidade_id);
      if (!temEspecialidade) return null;

      const medicoComEsp = medicosUpa.find(m => m.especialidade_id === especialidade_id);
      if (!medicoComEsp) return null;

      const turnoAtivo = turnos.find(t =>
        t.medico_id === medicoComEsp.id && t.status === 'em_atendimento'
      );

      // Busca próxima escala prevista
      const agora = new Date();
      const proximaEscala = escalas
        .filter(e => e.medico_id === medicoComEsp.id && new Date(e.data + 'T' + e.hora_inicio) > agora)
        .sort((a, b) => new Date(a.data + 'T' + a.hora_inicio) - new Date(b.data + 'T' + b.hora_inicio))[0];

      statusEspecialidade = {
        disponivel: !!turnoAtivo,
        proximo_turno: proximaEscala
          ? `${proximaEscala.data === agora.toISOString().split('T')[0] ? 'hoje' : 'amanhã'} às ${proximaEscala.hora_inicio}`
          : null,
      };
    }

    const especialidadesNomes = upa.especialidades.map(eid => {
      const esp = especialidades.find(e => e.id === eid);
      return esp ? esp.nome : eid;
    });

    return {
      ...upa,
      especialidades_nomes: especialidadesNomes,
      medicos_ativos: turnosAtivos.length,
      total_medicos: medicosUpa.length,
      status_especialidade: statusEspecialidade,
    };
  }).filter(Boolean);

  res.json(resultado);
});

// GET /api/upas/:id
router.get('/:id', authMiddleware, (req, res) => {
  const upa = upas.find(u => u.id === req.params.id);
  if (!upa) return res.status(404).json({ erro: 'UPA não encontrada.' });

  const medicosUpa = medicos.filter(m => m.upa_id === upa.id);
  const turnosAtivos = turnos.filter(t =>
    medicosUpa.some(m => m.id === t.medico_id) && t.status === 'em_atendimento'
  );
  const emPausa = turnos.filter(t =>
    medicosUpa.some(m => m.id === t.medico_id) && t.status === 'em_pausa'
  );
  const encerrados = turnos.filter(t =>
    medicosUpa.some(m => m.id === t.medico_id) && t.status === 'encerrado'
  );

  res.json({
    ...upa,
    total_medicos: medicosUpa.length,
    em_atendimento: turnosAtivos.length,
    em_pausa: emPausa.length,
    encerrados: encerrados.length,
  });
});

// POST /api/upas — gestor_municipal
router.post('/', authMiddleware, requirePerfil('gestor_municipal', 'super_admin'), (req, res) => {
  const { nome, endereco, bairro, municipio_id, especialidades: esps } = req.body;
  if (!nome || !municipio_id) return res.status(400).json({ erro: 'Nome e município são obrigatórios.' });

  const nova = addEntity(upas, {
    nome,
    endereco: endereco || '',
    bairro: bairro || '',
    municipio_id,
    gestor_id: null,
    ativa: true,
    especialidades: esps || [],
  });
  res.status(201).json(nova);
});

// PUT /api/upas/:id
router.put('/:id', authMiddleware, requirePerfil('gestor_municipal', 'super_admin', 'gestor_upa'), (req, res) => {
  const idx = upas.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'UPA não encontrada.' });

  upas[idx] = { ...upas[idx], ...req.body };
  res.json(upas[idx]);
});

export default router;
