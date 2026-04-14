import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  Stethoscope,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { turnosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface ShiftMonitoringProps {
  onBack: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

interface TurnoRegistro {
  id: number | string;
  acao: string;
  registrado_em: string;
}

interface TurnoItem {
  id: number | string;
  medico: number | string;
  medico_nome: string;
  especialidade_nome: string;
  status: string;
  iniciado_em: string;
  encerrado_em?: string | null;
  registros?: TurnoRegistro[];
}

function parseDateTime(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameLocalDay(dateA: Date | null, dateB: Date) {
  if (!dateA) return false;
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function formatTimeValue(value?: string | null) {
  const date = parseDateTime(value);
  if (!date) return '--:--';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDateTimeValue(value?: string | null) {
  const date = parseDateTime(value);
  if (!date) return '--';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatActionLabel(action: string) {
  if (action === 'inicio') return 'Inicio';
  if (action === 'pausa') return 'Pausa';
  if (action === 'retorno') return 'Retorno';
  if (action === 'encerramento') return 'Encerramento';
  return action;
}

function getActionColorClasses(action: string) {
  if (action === 'inicio') return { dot: 'bg-emerald-500', text: 'text-emerald-700' };
  if (action === 'pausa') return { dot: 'bg-amber-500', text: 'text-amber-700' };
  if (action === 'retorno') return { dot: 'bg-sky-500', text: 'text-sky-700' };
  if (action === 'encerramento') return { dot: 'bg-slate-500', text: 'text-slate-700' };
  return { dot: 'bg-slate-300', text: 'text-slate-600' };
}

function getStatusMeta(status: string) {
  if (status === 'em_atendimento') {
    return { label: 'Em atendimento', color: 'text-green-600 bg-green-50' };
  }

  if (status === 'em_pausa') {
    return { label: 'Em pausa', color: 'text-amber-600 bg-amber-50' };
  }

  return { label: 'Encerrado', color: 'text-slate-600 bg-slate-100' };
}

function getDurationLabel(turno: TurnoItem, now: Date) {
  const inicio = parseDateTime(turno.iniciado_em);
  const fim = parseDateTime(turno.encerrado_em) || now;

  if (!inicio || fim <= inicio) return '0m';

  const totalMinutes = Math.max(0, Math.floor((fim.getTime() - inicio.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function getLastRegistro(turno: TurnoItem) {
  if (!turno.registros?.length) return null;
  return turno.registros[turno.registros.length - 1];
}

export default function ShiftMonitoring({ onBack, userName, onLogout, upaName }: ShiftMonitoringProps) {
  const { usuario } = useApp();
  const [agora, setAgora] = useState(() => new Date());
  const [turnos, setTurnos] = useState<TurnoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandedTurnoId, setExpandedTurnoId] = useState<number | string | null>(null);

  const carregarTurnos = useCallback(async () => {
    const upaId = usuario?.upa_id;
    try {
      const response = await turnosApi.listar(upaId ? { upa_id: upaId } : {});
      setTurnos(response);
      setErro(null);
    } catch (error: any) {
      setErro(error?.message || 'Erro ao carregar os turnos da unidade.');
    }
  }, [usuario?.upa_id]);

  useEffect(() => {
    carregarTurnos().finally(() => setIsLoading(false));
    const polling = setInterval(() => {
      carregarTurnos();
    }, 15000);

    return () => clearInterval(polling);
  }, [carregarTurnos]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const turnosMonitorados = useMemo(() => {
    const filtered = turnos.filter(turno => {
      const inicio = parseDateTime(turno.iniciado_em);
      const encerramento = parseDateTime(turno.encerrado_em);

      return turno.status !== 'encerrado' || isSameLocalDay(inicio, agora) || isSameLocalDay(encerramento, agora);
    });

    const priority: Record<string, number> = {
      em_atendimento: 0,
      em_pausa: 1,
      encerrado: 2,
    };

    return filtered.sort((a, b) => {
      const statusOrder = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
      if (statusOrder !== 0) return statusOrder;
      return (parseDateTime(b.iniciado_em)?.getTime() || 0) - (parseDateTime(a.iniciado_em)?.getTime() || 0);
    });
  }, [agora, turnos]);

  const encerradosHoje = turnos.filter(
    turno => turno.status === 'encerrado' && isSameLocalDay(parseDateTime(turno.encerrado_em), agora)
  ).length;

  const resumo = [
    {
      label: 'Em atendimento',
      value: turnosMonitorados.filter(turno => turno.status === 'em_atendimento').length,
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Em pausa',
      value: turnosMonitorados.filter(turno => turno.status === 'em_pausa').length,
      icon: Coffee,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Encerrados hoje',
      value: encerradosHoje,
      icon: CheckCircle2,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Monitorados hoje',
      value: turnosMonitorados.length,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  const horaAtual = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(agora);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DashboardHeader
        userName={userName}
        roleName="Gestor de UPA"
        subInfo={upaName}
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-4 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Acompanhar Turnos</h2>
            <p className="text-slate-500 text-sm font-medium">Monitoramento real dos turnos registrados na unidade</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horario atual</p>
              <p className="text-lg font-black text-slate-800">{horaAtual}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resumo.map(card => (
            <div key={card.label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-3`}>
                <card.icon size={20} />
              </div>
              <p className="text-2xl font-black text-slate-800">{isLoading ? '-' : card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>

        {erro && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            {erro}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} />
              Operacao em tempo real
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Dados reais</span>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-center text-slate-400">
              <p className="font-medium">Carregando turnos...</p>
            </div>
          ) : turnosMonitorados.length === 0 ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-center text-slate-400">
              <Activity size={42} className="mx-auto mb-4 opacity-40" />
              <p className="font-bold text-lg text-slate-700">Nenhum turno para acompanhar agora</p>
              <p className="text-sm mt-1">Os turnos ativos e os encerrados hoje vao aparecer aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {turnosMonitorados.map(turno => {
                const status = getStatusMeta(turno.status);
                const ultimoRegistro = getLastRegistro(turno);
                const isExpanded = expandedTurnoId === turno.id;

                return (
                  <motion.div
                    key={turno.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                          <User size={28} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-800">{turno.medico_nome}</h3>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <Stethoscope size={12} />
                              {turno.especialidade_nome}
                            </div>
                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Inicio: {formatTimeValue(turno.iniciado_em)}
                            </div>
                            {turno.encerrado_em && (
                              <>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Encerrado: {formatTimeValue(turno.encerrado_em)}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedTurnoId(current => (current === turno.id ? null : turno.id))}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                        aria-label={isExpanded ? 'Ocultar registros do turno' : 'Mostrar registros do turno'}
                      >
                        <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-50">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Duracao</p>
                        <p className="text-sm font-black text-slate-800">{getDurationLabel(turno, agora)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Registros</p>
                        <p className="text-sm font-black text-slate-800">{turno.registros?.length || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Ultimo evento</p>
                        <p className="text-sm font-black text-slate-800">
                          {ultimoRegistro ? formatActionLabel(ultimoRegistro.acao) : 'Sem dados'}
                        </p>
                      </div>
                    </div>

                    {ultimoRegistro && (
                      <p className="mt-4 text-xs text-slate-500 font-medium">
                        Ultimo registro: {formatActionLabel(ultimoRegistro.acao)} em{' '}
                        {formatDateTimeValue(ultimoRegistro.registrado_em)}.
                      </p>
                    )}

                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-slate-100">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                          Detalhes dos registros
                        </h4>
                        {turno.registros?.length ? (
                          <div className="space-y-4">
                            {turno.registros.map((registro, index) => {
                              const color = getActionColorClasses(registro.acao);

                              return (
                                <div key={registro.id || `${turno.id}-${index}`} className="relative pl-8">
                                  <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white ${color.dot}`} />
                                  <p className={`text-sm font-bold ${color.text}`}>{formatActionLabel(registro.acao)}</p>
                                  <p className="text-xs text-slate-400">{formatDateTimeValue(registro.registrado_em)}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Nenhum registro detalhado disponivel.</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
