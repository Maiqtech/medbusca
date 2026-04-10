import { Router } from 'express';
import { medicos, turnos, registrosTurno, escalas, especialidades, upas } from '../data/store.js';
import { authMiddleware, requirePerfil } from '../middleware/auth.js';

const router = Router();

// GET /api/relatorios/upa/:upa_id?mes=YYYY-MM
router.get('/upa/:upa_id', authMiddleware, requirePerfil('gestor_upa', 'gestor_municipal', 'super_admin'), (req, res) => {
  const { upa_id } = req.params;
  const { mes } = req.query; // formato: YYYY-MM

  const upa = upas.find(u => u.id === upa_id);
  if (!upa) return res.status(404).json({ erro: 'UPA não encontrada.' });

  const medicosUpa = medicos.filter(m => m.upa_id === upa_id);
  const idsmedicos = medicosUpa.map(m => m.id);

  let turnosFiltrados = turnos.filter(t => idsmedicos.includes(t.medico_id));
  if (mes) {
    turnosFiltrados = turnosFiltrados.filter(t => t.iniciado_em && t.iniciado_em.startsWith(mes));
  }

  const totalHoras = turnosFiltrados.reduce((acc, t) => {
    if (!t.iniciado_em || !t.encerrado_em) return acc;
    const diff = (new Date(t.encerrado_em) - new Date(t.iniciado_em)) / 3600000;
    return acc + diff;
  }, 0);

  const medicosAtivos = medicosUpa.filter(med => {
    return turnosFiltrados.some(t => t.medico_id === med.id);
  }).length;

  const turnosEncerrados = turnosFiltrados.filter(t => t.status === 'encerrado').length;
  const totalTurnos = turnosFiltrados.length;
  const taxaDisponibilidade = totalTurnos > 0
    ? Math.round((turnosEncerrados / totalTurnos) * 100)
    : 0;

  // Detalhamento por médico
  const detalhamento = medicosUpa.map(med => {
    const turnosMed = turnosFiltrados.filter(t => t.medico_id === med.id);
    const horasTotais = turnosMed.reduce((acc, t) => {
      if (!t.iniciado_em || !t.encerrado_em) return acc;
      return acc + (new Date(t.encerrado_em) - new Date(t.iniciado_em)) / 3600000;
    }, 0);
    const esp = especialidades.find(e => e.id === med.especialidade_id);
    const turnoAtual = turnos.find(t => t.medico_id === med.id && t.status !== 'encerrado');

    return {
      id: med.id,
      nome: med.nome,
      especialidade: esp ? esp.nome : null,
      total_horas: `${Math.round(horasTotais)}h`,
      assiduidade: `${turnosMed.length > 0 ? Math.min(98, 80 + turnosMed.length * 3) : 0}%`,
      status: turnoAtual ? 'Online' : 'Offline',
    };
  });

  // Dados semanais para o gráfico (4 semanas)
  const semanais = [1, 2, 3, 4].map(semana => {
    const horas = turnosFiltrados.reduce((acc, t) => {
      if (!t.iniciado_em) return acc;
      const diaMes = new Date(t.iniciado_em).getDate();
      const semanaDoTurno = Math.ceil(diaMes / 7);
      if (semanaDoTurno !== semana) return acc;
      if (!t.encerrado_em) return acc;
      return acc + (new Date(t.encerrado_em) - new Date(t.iniciado_em)) / 3600000;
    }, 0);
    return { semana, horas: Math.round(horas) };
  });

  res.json({
    upa: { id: upa.id, nome: upa.nome, bairro: upa.bairro },
    mes: mes || 'todos',
    medicos_ativos: medicosAtivos,
    total_horas: `${Math.round(totalHoras)}h`,
    taxa_disponibilidade: `${taxaDisponibilidade}%`,
    detalhamento,
    semanais,
  });
});

// GET /api/relatorios/municipio/:municipio_id
router.get('/municipio/:municipio_id', authMiddleware, requirePerfil('gestor_municipal', 'super_admin'), (req, res) => {
  const { municipio_id } = req.params;

  const upasDoMunicipio = upas.filter(u => u.municipio_id === municipio_id);
  const medicosDoMunicipio = medicos.filter(m =>
    upasDoMunicipio.some(u => u.id === m.upa_id)
  );

  const turnosAtivos = turnos.filter(t =>
    medicosDoMunicipio.some(m => m.id === t.medico_id) && t.status === 'em_atendimento'
  );

  res.json({
    total_upas: upasDoMunicipio.length,
    upas_ativas: upasDoMunicipio.filter(u => u.ativa).length,
    total_medicos: medicosDoMunicipio.length,
    medicos_em_atendimento: turnosAtivos.length,
    upas: upasDoMunicipio.map(upa => {
      const medicosUpa = medicosDoMunicipio.filter(m => m.upa_id === upa.id);
      const ativos = turnos.filter(t =>
        medicosUpa.some(m => m.id === t.medico_id) && t.status === 'em_atendimento'
      ).length;
      return {
        id: upa.id,
        nome: upa.nome,
        bairro: upa.bairro,
        ativa: upa.ativa,
        total_medicos: medicosUpa.length,
        em_atendimento: ativos,
      };
    }),
  });
});

export default router;
