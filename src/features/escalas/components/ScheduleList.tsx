import { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarDays, Clock, User, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { escalasApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface ScheduleListProps {
  onBack: () => void;
  onAdd: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

type TabKey = 'today' | 'week' | 'month';

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

function getScheduleWindow(escala: any) {
  const inicio = buildDateTime(escala.data, escala.hora_inicio);
  const fim = buildDateTime(escala.data, escala.hora_fim);

  if (fim <= inicio) {
    fim.setDate(fim.getDate() + 1);
  }

  return { inicio, fim };
}

function getShiftMeta(escala: any) {
  const hora = Number(String(escala.hora_inicio || '0').split(':')[0]);

  if (hora < 12) {
    return { label: 'Manha', color: 'bg-amber-50 text-amber-600' };
  }

  if (hora < 18) {
    return { label: 'Tarde', color: 'bg-blue-50 text-blue-600' };
  }

  return { label: 'Noite', color: 'bg-slate-900 text-white' };
}

function getStatusMeta(escala: any) {
  const agora = new Date();
  const { inicio, fim } = getScheduleWindow(escala);

  if (agora < inicio) {
    return { label: 'Agendada', color: 'bg-blue-50 text-blue-600' };
  }

  if (agora <= fim) {
    return { label: 'Em andamento', color: 'bg-green-50 text-green-600' };
  }

  return { label: 'Encerrada', color: 'bg-slate-100 text-slate-600' };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTimeRange(escala: any) {
  return `${String(escala.hora_inicio || '').slice(0, 5)} - ${String(escala.hora_fim || '').slice(0, 5)}`;
}

export default function ScheduleList({
  onBack,
  onAdd,
  userName,
  onLogout,
  upaName,
}: ScheduleListProps) {
  const { usuario } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [escalas, setEscalas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setErro(null);

    escalasApi
      .listar()
      .then(setEscalas)
      .catch(error => setErro(error?.message || 'Erro ao carregar escalas.'))
      .finally(() => setIsLoading(false));
  }, [usuario?.upa_id]);

  const escalasFiltradas = useMemo(() => {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimSemana = new Date(inicioHoje);
    fimSemana.setDate(fimSemana.getDate() + 7);

    return escalas.filter(escala => {
      const dataEscala = new Date(`${escala.data}T00:00:00`);

      if (activeTab === 'today') {
        return dataEscala.getTime() === inicioHoje.getTime();
      }

      if (activeTab === 'week') {
        return dataEscala >= inicioHoje && dataEscala < fimSemana;
      }

      return dataEscala.getMonth() === hoje.getMonth() && dataEscala.getFullYear() === hoje.getFullYear();
    });
  }, [activeTab, escalas]);

  const sectionTitle =
    activeTab === 'today' ? 'Plantoes de Hoje' : activeTab === 'week' ? 'Plantoes dos Proximos 7 Dias' : 'Plantoes Deste Mes';

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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Area das Escalas</h2>
            <p className="text-slate-500 text-sm font-medium">Cronograma real de plantoes da unidade</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Nova Escala
          </button>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {([
            { id: 'today', label: 'Hoje' },
            { id: 'week', label: '7 dias' },
            { id: 'month', label: 'Mes' },
          ] as { id: TabKey; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
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
              <CalendarDays size={14} />
              {sectionTitle}
            </h3>
            {!isLoading && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {escalasFiltradas.length} escala{escalasFiltradas.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="font-medium">Carregando escalas...</span>
            </div>
          ) : escalasFiltradas.length === 0 ? (
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm text-center text-slate-400">
              <CalendarDays size={42} className="mx-auto mb-4 opacity-40" />
              <p className="font-bold text-lg text-slate-700">Nenhuma escala encontrada</p>
              <p className="text-sm mt-1">Use o botao "Nova Escala" para montar o proximo plantao.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {escalasFiltradas.map((escala, index) => {
                const turno = getShiftMeta(escala);
                const status = getStatusMeta(escala);

                return (
                  <motion.div
                    key={escala.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${turno.color}`}>
                          <Clock size={18} />
                          <span className="text-[8px] font-black uppercase mt-0.5">{turno.label}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-800">{escala.medico_nome}</h4>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {escala.especialidade_nome} - {formatDate(escala.data)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-800">{formatTimeRange(escala)}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Plantao</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                        <User size={12} />
                        {escala.medico_nome}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                        <Clock size={12} />
                        {formatTimeRange(escala)}
                      </span>
                    </div>
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
