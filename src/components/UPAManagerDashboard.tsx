import { useState, useEffect, useCallback } from 'react';
import {
  Users, Stethoscope, Calendar, Clock, AlertTriangle, Plus, ChevronRight,
  User, Activity, Coffee, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';
import { medicosApi, alertasApi, turnosApi } from '../services/api';
import { useApp } from '../store/AppContext';

interface UPAManagerDashboardProps {
  userName: string;
  upaName: string;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  systemName?: string;
  systemLogo?: string;
}

export default function UPAManagerDashboard({ userName, upaName, onLogout, onNavigate, systemName, systemLogo }: UPAManagerDashboardProps) {
  const { usuario } = useApp();
  const [medicos, setMedicos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const fetchDados = useCallback(async () => {
    const upaId = usuario?.upa_id;
    try {
      const [m, a, t] = await Promise.all([
        medicosApi.listar(upaId ? { upa_id: upaId } : {}),
        alertasApi.listar(),
        turnosApi.listar(upaId ? { upa_id: upaId } : {}),
      ]);
      setMedicos(m);
      setAlertas(a);
      setTurnos(t);
      setUltimaAtualizacao(new Date());
    } catch {} // silencioso — não limpar dados em falha de polling
  }, [usuario?.upa_id]);

  useEffect(() => {
    fetchDados().finally(() => setIsLoading(false)); // setIsLoading(false) apenas no primeiro fetch
    const intervalo = setInterval(fetchDados, 15_000);
    return () => clearInterval(intervalo);
  }, [fetchDados]);

  const emAtendimento = medicos.filter(m => m.status_turno === 'em_atendimento').length;
  const emPausa = medicos.filter(m => m.status_turno === 'em_pausa').length;
  const encerrados = turnos.filter(t => t.status === 'encerrado').length;

  const statusColor = (status: string) => {
    if (status === 'em_atendimento') return 'text-green-600 bg-green-50';
    if (status === 'em_pausa') return 'text-amber-600 bg-amber-50';
    return 'text-slate-400 bg-slate-50';
  };
  const statusLabel = (status: string) => {
    if (status === 'em_atendimento') return 'Em atendimento';
    if (status === 'em_pausa') return 'Em pausa';
    return 'Offline';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DashboardHeader
        userName={userName}
        roleName="Gestor de UPA"
        subInfo={upaName}
        onLogout={onLogout}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="p-4 max-w-5xl mx-auto space-y-6">
        <section className="mt-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel da UPA</h2>
            {ultimaAtualizacao && (
              <p className="text-[10px] text-slate-400 font-bold">
                Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Gerencie médicos, escalas e funcionamento da unidade</p>
        </section>

        {/* Indicators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, bg: 'bg-blue-50', color: 'text-blue-600', value: medicos.length, label: 'Médicos' },
            { icon: Stethoscope, bg: 'bg-green-50', color: 'text-green-600', value: emAtendimento, label: 'Em atendimento' },
            { icon: Coffee, bg: 'bg-amber-50', color: 'text-amber-600', value: emPausa, label: 'Em pausa' },
            { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600', value: encerrados, label: 'Encerrados hoje' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-3`}>
                <item.icon size={20} />
              </div>
              <p className="text-2xl font-black text-slate-800">{isLoading ? '—' : item.value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
            </motion.div>
          ))}
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => onNavigate('register_doctor')} className="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><Plus size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-sm">Cadastrar Médico</p>
                <p className="text-[10px] opacity-70">Adicionar novo profissional</p>
              </div>
            </button>

            <button onClick={() => onNavigate('list_doctors')} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all active:scale-95">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0"><Users size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800">Ver Médicos</p>
                <p className="text-[10px] text-slate-400">Listagem da equipe</p>
              </div>
            </button>

            <button onClick={() => onNavigate('register_schedule')} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all active:scale-95">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0"><Calendar size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800">Cadastrar Escala</p>
                <p className="text-[10px] text-slate-400">Planejar plantões</p>
              </div>
            </button>

            <button onClick={() => onNavigate('list_schedules')} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all active:scale-95">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0"><Clock size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-sm text-slate-800">Ver Escalas</p>
                <p className="text-[10px] text-slate-400">Consultar cronograma</p>
              </div>
            </button>

            <button onClick={() => onNavigate('monitor_shifts')} className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-3xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Activity size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-sm">Acompanhar Turnos</p>
                <p className="text-[10px] opacity-70">Operação em tempo real</p>
              </div>
            </button>
          </div>
        </section>

        {/* Alerts */}
        {alertas.length > 0 && (
          <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-800">Alertas e Observações</h3>
            </div>
            <div className="space-y-3">
              {alertas.slice(0, 4).map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-3 rounded-2xl flex items-start gap-3 border ${
                    alerta.tipo === 'critico' ? 'bg-red-50 border-red-100 text-red-700' :
                    alerta.tipo === 'aviso' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    alerta.tipo === 'critico' ? 'bg-red-500' : alerta.tipo === 'aviso' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-xs font-bold leading-tight">{alerta.mensagem}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Doctors Summary */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Médicos na Unidade</h3>
            <button onClick={() => onNavigate('list_doctors')} className="text-blue-600 text-xs font-bold hover:underline">
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {isLoading ? (
              <p className="text-sm text-slate-400 text-center py-4">Carregando...</p>
            ) : medicos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum médico cadastrado nesta UPA.</p>
            ) : (
              medicos.slice(0, 5).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onNavigate('list_doctors')}
                  className="w-full flex items-center justify-between py-4 hover:bg-slate-50 rounded-2xl transition-colors px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-slate-800">{doc.nome}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.especialidade_nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${statusColor(doc.status_turno)}`}>
                      {statusLabel(doc.status_turno)}
                    </span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 flex justify-around items-center z-30 sm:hidden">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Activity size={20} />
          <span className="text-[9px] font-bold uppercase">Painel</span>
        </button>
        <button onClick={() => onNavigate('list_doctors')} className="flex flex-col items-center gap-1 text-slate-400">
          <Users size={20} />
          <span className="text-[9px] font-bold uppercase">Equipe</span>
        </button>
        <button onClick={() => onNavigate('list_schedules')} className="flex flex-col items-center gap-1 text-slate-400">
          <Calendar size={20} />
          <span className="text-[9px] font-bold uppercase">Escalas</span>
        </button>
        <button onClick={() => onNavigate('monitor_shifts')} className="flex flex-col items-center gap-1 text-slate-400">
          <Clock size={20} />
          <span className="text-[9px] font-bold uppercase">Turnos</span>
        </button>
      </nav>
    </div>
  );
}
