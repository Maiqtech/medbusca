import { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Stethoscope,
  Building2,
  Info,
  History as HistoryIcon,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface DoctorDashboardProps {
  userName: string;
  onLogout: () => void;
  systemName?: string;
  systemLogo?: string;
}

type ShiftStatus = 'not_started' | 'in_service' | 'on_break' | 'ended';

interface HistoryEntry {
  time: string;
  action: string;
}

export default function DoctorDashboard({ userName, onLogout, systemName, systemLogo }: DoctorDashboardProps) {
  const [status, setStatus] = useState<ShiftStatus>('not_started');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const addHistory = (action: string) => {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [{ time: now, action }, ...prev]);
  };

  const handleStart = () => {
    setStatus('in_service');
    addHistory('Início do turno');
  };

  const handlePause = () => {
    setStatus('on_break');
    addHistory('Pausa');
  };

  const handleReturn = () => {
    setStatus('in_service');
    addHistory('Retorno');
  };

  const handleEnd = () => {
    setStatus('ended');
    addHistory('Encerramento');
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return { label: 'Não iniciado', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'in_service':
        return { label: 'Em atendimento', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
      case 'on_break':
        return { label: 'Em pausa', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'ended':
        return { label: 'Encerrado', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader 
        userName={userName}
        roleName="Médico"
        subInfo="CRM: 12345-BA"
        onLogout={onLogout}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Title Section */}
        <section className="mt-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meu Turno</h2>
          <p className="text-slate-500 text-sm font-medium">Controle seu atendimento na unidade</p>
        </section>

        {/* Identification Card */}
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ortopedia</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={14} className="text-slate-300" />
                <span className="text-xs font-medium">UPA 24h Hélio Machado</span>
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

        {/* Status Card */}
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

        {/* Actions Block */}
        <section className="space-y-3">
          <AnimatePresence mode="wait">
            {status === 'not_started' && (
              <motion.button
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleStart}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Play size={24} fill="currentColor" />
                INICIAR TURNO
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
                  className="w-full py-6 bg-amber-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Pause size={24} fill="currentColor" />
                  PAUSAR
                </button>
                <button
                  onClick={handleEnd}
                  className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-[2rem] font-bold text-sm hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                  className="w-full py-6 bg-green-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RotateCcw size={24} />
                  RETORNAR AO TURNO
                </button>
                <button
                  onClick={handleEnd}
                  className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-[2rem] font-bold text-sm hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                <p className="font-bold text-slate-800">Turno encerrado hoje às {history[0]?.time}</p>
                <p className="text-xs text-slate-400">Bom descanso, doutor(a)!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* History Block */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HistoryIcon size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Histórico do Dia</h3>
          </div>
          
          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
            {history.length > 0 ? (
              history.map((entry, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${
                    entry.action.includes('Início') ? 'bg-blue-500' :
                    entry.action.includes('Pausa') ? 'bg-amber-500' :
                    entry.action.includes('Retorno') ? 'bg-green-500' :
                    'bg-red-500'
                  }`} />
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

        {/* Informative Note */}
        <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
            Sua disponibilidade é refletida para o sistema conforme o status do seu turno. 
            As informações de presença impactam a visualização pública da unidade.
          </p>
        </div>
      </main>
    </div>
  );
}
