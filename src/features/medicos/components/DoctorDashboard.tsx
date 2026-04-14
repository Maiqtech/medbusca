import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History as HistoryIcon,
  Info,
  Pause,
  Play,
  RotateCcw,
  Square,
  Stethoscope,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { turnosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface DoctorDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigate?: (screen: string) => void;
  systemName?: string;
  systemLogo?: string;
}

type ShiftStatus = 'not_started' | 'in_service' | 'on_break' | 'ended';

interface HistoryEntry {
  time: string;
  action: string;
  acao: string;
}

interface TurnoRegistro {
  acao: string;
  registrado_em: string;
}

interface TurnoPendenteAnterior {
  id: number;
  status: string;
  iniciado_em: string;
  registros?: TurnoRegistro[];
}

interface TurnoHistoricoAnterior {
  id: number;
  status: string;
  iniciado_em: string;
  encerrado_em: string | null;
  duracao_formatada?: string | null;
  registros?: TurnoRegistro[];
}

function formatTimeValue(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTimeValue(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateValue(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatActionLabel(acao: string) {
  if (acao === 'inicio') return 'Inicio do turno';
  if (acao === 'pausa') return 'Pausa';
  if (acao === 'retorno') return 'Retorno';
  return 'Encerramento';
}

function getActionColorClasses(acao: string) {
  if (acao === 'inicio') return { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
  if (acao === 'pausa') return { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' };
  if (acao === 'retorno') return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
  return { dot: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-100' };
}

function formatTurnoStatusLabel(status: string) {
  if (status === 'em_pausa') return 'Em pausa';
  if (status === 'em_atendimento') return 'Em atendimento';
  if (status === 'encerrado') return 'Encerrado';
  return 'Pendente';
}

function toDateTimeLocalValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function getUltimoRegistro(turno: TurnoPendenteAnterior | null) {
  if (!turno?.registros?.length) return null;
  return turno.registros[turno.registros.length - 1];
}

function getMinimoEncerramentoRetroativo(turno: TurnoPendenteAnterior) {
  const base = getUltimoRegistro(turno)?.registrado_em || turno.iniciado_em;
  return new Date(new Date(base).getTime() + 60_000);
}

function mapHistorico(registros: any[] = []): HistoryEntry[] {
  return registros.map((registro: any) => ({
    time: formatTimeValue(registro.registrado_em),
    acao: registro.acao,
    action: formatActionLabel(registro.acao),
  }));
}

function getPendingTurnoFromError(error: any) {
  return error?.data?.turno_pendente_anterior || null;
}

export default function DoctorDashboard({ userName, onLogout, onNavigate, systemName, systemLogo }: DoctorDashboardProps) {
  const [status, setStatus] = useState<ShiftStatus>('not_started');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [medico, setMedico] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [turnoPendenteAnterior, setTurnoPendenteAnterior] = useState<TurnoPendenteAnterior | null>(null);
  // turnoParaEncerrar: único estado que controla visibilidade do modal
  const [turnoParaEncerrar, setTurnoParaEncerrar] = useState<TurnoPendenteAnterior | null>(null);
  const [encerramentoRetroativo, setEncerramentoRetroativo] = useState('');
  const [erroEncerramentoRetroativo, setErroEncerramentoRetroativo] = useState<string | null>(null);
  const [historicoOutrosDias, setHistoricoOutrosDias] = useState<TurnoHistoricoAnterior[]>([]);
  const [historicoExpandidoId, setHistoricoExpandidoId] = useState<number | null>(null);
  const { logout } = useApp();

  const API_STATUS: Record<string, ShiftStatus> = {
    em_atendimento: 'in_service',
    em_pausa: 'on_break',
    encerrado: 'ended',
    nao_iniciado: 'not_started',
  };

  const abrirModalEncerramento = useCallback((turno: TurnoPendenteAnterior) => {
    setErroEncerramentoRetroativo(null);
    setEncerramentoRetroativo(toDateTimeLocalValue(getMinimoEncerramentoRetroativo(turno)));
    setTurnoParaEncerrar(turno);
  }, []);

  const fecharModalEncerramento = useCallback(() => {
    setTurnoParaEncerrar(null);
    setErroEncerramentoRetroativo(null);
  }, []);

  const syncTurnoState = useCallback((data: any) => {
    setMedico(data.medico);
    setTurnoPendenteAnterior(data.turno_pendente_anterior || null);

    if (data.turno) {
      setStatus(API_STATUS[data.turno.status] || 'not_started');
    } else if (data.turno_pendente_anterior) {
      setStatus('not_started');
    } else {
      setStatus(prev => (prev === 'ended' ? prev : 'not_started'));
    }

    setHistory(mapHistorico(data.historico));
    setHistoricoOutrosDias(data.historico_outros_dias || []);
    setUltimaAtualizacao(new Date());
    return data.turno_pendente_anterior || null;
  }, []);

  const fetchTurno = useCallback(async () => {
    try {
      const data = await turnosApi.meu();
      syncTurnoState(data);
    } catch {
      // Silencioso no polling.
    }
  }, [syncTurnoState]);

  useEffect(() => {
    fetchTurno();
    const pollingTimer = setInterval(fetchTurno, 15_000);
    return () => clearInterval(pollingTimer);
  }, [fetchTurno]);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 60_000);
    return () => clearInterval(clockTimer);
  }, []);

  const addHistory = (acao: string, action: string) => {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [{ time: now, acao, action }, ...prev]);
  };

  const handleStart = async () => {
    if (turnoPendenteAnterior) {
      abrirModalEncerramento(turnoPendenteAnterior);
      return;
    }

    setIsActionLoading(true);
    try {
      await turnosApi.iniciar();
      setStatus('in_service');
      addHistory('inicio', 'Inicio do turno');
    } catch (iniciarError: any) {
      try {
        const dados = await turnosApi.meu();
        const pendente: TurnoPendenteAnterior | null = dados?.turno_pendente_anterior ?? null;
        if (pendente) {
          syncTurnoState(dados);
          abrirModalEncerramento(pendente);
          return;
        }
      } catch {}
      alert(iniciarError.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await turnosApi.pausar();
      setStatus('on_break');
      addHistory('pausa', 'Pausa');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setIsActionLoading(true);
    try {
      await turnosApi.retornar();
      setStatus('in_service');
      addHistory('retorno', 'Retorno');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEnd = async () => {
    setIsActionLoading(true);
    try {
      await turnosApi.encerrar();
      setStatus('ended');
      addHistory('encerramento', 'Encerramento');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEncerrarPendente = async () => {
    if (!turnoParaEncerrar || !encerramentoRetroativo) {
      setErroEncerramentoRetroativo('Informe a data e hora reais do encerramento.');
      return;
    }

    setErroEncerramentoRetroativo(null);
    setIsActionLoading(true);

    try {
      await turnosApi.encerrar({
        turno_id: turnoParaEncerrar.id,
        encerrado_em: encerramentoRetroativo,
      });
      setTurnoPendenteAnterior(null);
      setTurnoParaEncerrar(null);
      setEncerramentoRetroativo('');
      setHistory([]);
      setStatus('not_started');
      await fetchTurno();
    } catch (e: any) {
      setErroEncerramentoRetroativo(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return { label: 'Nao iniciado', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'in_service':
        return { label: 'Em atendimento', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
      case 'on_break':
        return { label: 'Em pausa', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'ended':
        return { label: 'Encerrado', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
    }
  };

  const config = getStatusConfig();
  const ultimoRegistroPendente = getUltimoRegistro(turnoParaEncerrar);
  const minimoEncerramento = turnoParaEncerrar ? toDateTimeLocalValue(getMinimoEncerramentoRetroativo(turnoParaEncerrar)) : '';
  const maximoEncerramento = toDateTimeLocalValue(new Date());
  const historicoResumo = historicoOutrosDias.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <AnimatePresence>
        {turnoParaEncerrar && (
          <motion.div
            key="modal-encerramento"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isActionLoading && fecharModalEncerramento()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-5"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Encerrar turno pendente</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Informe a data e hora reais em que voce finalizou o turno aberto em {formatDateTimeValue(turnoParaEncerrar.iniciado_em)}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fecharModalEncerramento}
                  disabled={isActionLoading}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Resumo da pendencia</p>
                  <p className="mt-2">Status aberto: {formatTurnoStatusLabel(turnoParaEncerrar.status)}</p>
                  <p>Inicio registrado: {formatDateTimeValue(turnoParaEncerrar.iniciado_em)}</p>
                  {ultimoRegistroPendente && (
                    <p>
                      Ultimo registro: {formatActionLabel(ultimoRegistroPendente.acao)} em{' '}
                      {formatDateTimeValue(ultimoRegistroPendente.registrado_em)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Data e hora do encerramento</label>
                  <input
                    type="datetime-local"
                    aria-label="Data e hora do encerramento"
                    value={encerramentoRetroativo}
                    min={minimoEncerramento}
                    max={maximoEncerramento}
                    onChange={event => setEncerramentoRetroativo(event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-slate-400">
                    O horario precisa ser posterior ao ultimo registro do turno e nao pode estar no futuro.
                  </p>
                </div>

                {erroEncerramentoRetroativo && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {erroEncerramentoRetroativo}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleEncerrarPendente}
                  disabled={isActionLoading}
                  className="w-full py-4 bg-red-600 text-white rounded-[1.5rem] font-black text-sm shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:bg-red-400"
                >
                  {isActionLoading ? 'ENCERRANDO...' : 'CONFIRMAR ENCERRAMENTO'}
                </button>
                <button
                  type="button"
                  onClick={fecharModalEncerramento}
                  disabled={isActionLoading}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DashboardHeader
        userName={medico?.nome || userName}
        roleName="Médico"
        subInfo={`CRM: ${medico?.crm || '---'}`}
        onLogout={handleLogout}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        <section className="mt-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meu Turno</h2>
            {ultimaAtualizacao && (
              <p className="text-[10px] text-slate-400 font-bold">
                Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Controle seu atendimento na unidade</p>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 leading-tight">{userName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{medico?.especialidade_nome || "---"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={14} className="text-slate-300" />
                <span className="text-xs font-medium">{medico?.upa_nome || "---"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-blue-600 justify-end">
                <Clock size={16} />
                <span className="text-xl font-black tabular-nums">{currentTime}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Horário Atual</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          layout
          className={`p-8 rounded-[2.5rem] border ${config.border} ${config.bg} shadow-sm text-center space-y-2`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Status Atual</p>
          <motion.h3
            key={status}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl font-black uppercase tracking-tight ${config.color}`}
          >
            {config.label}
          </motion.h3>
        </motion.div>

        {turnoPendenteAnterior && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] shadow-sm space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Turno Pendente</p>
                <h3 className="text-lg font-black text-slate-800">Existe um turno aberto de dia anterior</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Iniciado em {formatDateTimeValue(turnoPendenteAnterior.iniciado_em)}.
                  {ultimoRegistroPendente && (
                    <> Ultimo registro: {formatActionLabel(ultimoRegistroPendente.acao)} as {formatTimeValue(ultimoRegistroPendente.registrado_em)}.</>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => abrirModalEncerramento(turnoPendenteAnterior)}
              className="w-full py-4 bg-amber-500 text-white rounded-[1.75rem] font-black text-sm shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all"
            >
              RESOLVER TURNO PENDENTE
            </button>
          </motion.section>
        )}

        <section className="space-y-3">
          <AnimatePresence mode="wait">
            {status === 'not_started' && !turnoPendenteAnterior && (
              <motion.button
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleStart}
                disabled={isActionLoading}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:bg-blue-400 flex items-center justify-center gap-3"
              >
                <Play size={24} fill="currentColor" />
                {isActionLoading ? 'INICIANDO...' : 'INICIAR TURNO'}
              </motion.button>
            )}

            {status === 'in_service' && (
              <motion.div
                key="in_service_actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 gap-3"
              >
                <button
                  onClick={handlePause}
                  disabled={isActionLoading}
                  className="w-full py-6 bg-amber-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 disabled:bg-amber-400 flex items-center justify-center gap-3"
                >
                  <Pause size={24} fill="currentColor" />
                  {isActionLoading ? 'PAUSANDO...' : 'PAUSAR'}
                </button>
                <button
                  onClick={handleEnd}
                  disabled={isActionLoading}
                  className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-[2rem] font-bold text-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Square size={18} fill="currentColor" />
                  ENCERRAR TURNO
                </button>
              </motion.div>
            )}

            {status === 'on_break' && (
              <motion.div
                key="on_break_actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 gap-3"
              >
                <button
                  onClick={handleReturn}
                  disabled={isActionLoading}
                  className="w-full py-6 bg-green-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95 disabled:bg-green-400 flex items-center justify-center gap-3"
                >
                  <RotateCcw size={24} />
                  {isActionLoading ? 'RETORNANDO...' : 'RETORNAR AO TURNO'}
                </button>
                <button
                  onClick={handleEnd}
                  disabled={isActionLoading}
                  className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-[2rem] font-bold text-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Square size={18} fill="currentColor" />
                  ENCERRAR TURNO
                </button>
              </motion.div>
            )}

            {status === 'ended' && (
              <motion.div
                key="ended_msg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-[2rem] border border-red-100 text-center space-y-2"
              >
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-bold text-slate-800">Turno encerrado hoje as {history[0]?.time}</p>
                <p className="text-xs text-slate-400">Bom descanso, doutor(a)!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HistoryIcon size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Historico do Turno Atual</h3>
          </div>

          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
            {history.length > 0 ? (
              history.map((entry, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  <div
                    className={`w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${getActionColorClasses(entry.acao).dot}`}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">{entry.action}</p>
                    <span className="text-xs font-black text-slate-400 tabular-nums">{entry.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-300 py-4 font-medium italic">
                Nenhuma atividade registrada ainda.
              </p>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-800">Historico de Outros Dias</h3>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Resumo dos 3 dias mais recentes.</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('doctor_history')}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl text-[11px] font-black uppercase tracking-wide hover:bg-blue-100 transition-all"
              >
                Ver historico completo
              </button>
            )}
          </div>

          {historicoResumo.length > 0 ? (
            <div className="space-y-4">
              {historicoResumo.map(turno => {
                const expandido = historicoExpandidoId === turno.id;
                return (
                <div key={turno.id} className="rounded-[2rem] border border-slate-100 bg-slate-50/80 p-4 space-y-4">
                  <button
                    type="button"
                    onClick={() => setHistoricoExpandidoId(expandido ? null : turno.id)}
                    className="w-full flex items-start justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-800">{formatDateValue(turno.iniciado_em)}</p>
                      <p className="text-xs text-slate-500">
                        {formatTimeValue(turno.iniciado_em)}
                        {turno.encerrado_em ? ` ate ${formatTimeValue(turno.encerrado_em)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 border border-slate-100">
                        {formatTurnoStatusLabel(turno.status)}
                      </span>
                      <div className="w-9 h-9 rounded-2xl bg-white border border-slate-100 text-slate-500 flex items-center justify-center">
                        {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3 border border-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Duracao</p>
                      <p className="mt-1 text-sm font-black text-slate-700">{turno.duracao_formatada || '--'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 border border-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Registros</p>
                      <p className="mt-1 text-sm font-black text-slate-700">{turno.registros?.length || 0}</p>
                    </div>
                  </div>

                  {expandido && (
                    <div className="rounded-[1.5rem] bg-white border border-slate-100 p-4 space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Detalhes dos registros
                      </p>
                      {turno.registros?.length ? (
                        <div className="space-y-3 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                          {turno.registros.map((registro, index) => (
                            <div key={`${turno.id}-${index}`} className="relative flex items-center justify-between gap-4 pl-7">
                              <div
                                className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white ${getActionColorClasses(registro.acao).dot}`}
                              />
                              <p
                                className={`text-sm font-bold ${getActionColorClasses(registro.acao).text}`}
                              >
                                {formatActionLabel(registro.acao)}
                              </p>
                              <span className="text-xs font-black text-slate-400 tabular-nums">
                                {formatDateTimeValue(registro.registrado_em)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Nenhum registro detalhado disponivel.</p>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-300 py-4 font-medium italic">
              Nenhum turno encerrado de dias anteriores ainda.
            </p>
          )}
        </section>

        <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
            Sua disponibilidade e refletida para o sistema conforme o status do seu turno.
            As informacoes de presenca impactam a visualizacao publica da unidade.
          </p>
        </div>
      </main>
    </div>
  );
}
