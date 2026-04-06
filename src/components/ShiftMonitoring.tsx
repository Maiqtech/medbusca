import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, Activity, AlertTriangle, Coffee, CheckCircle2, ChevronRight, MoreVertical, Search, Filter, Stethoscope } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface ShiftMonitoringProps {
  onBack: () => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

const MOCK_SHIFTS = [
  { id: '1', name: 'Dr. João Silva', specialty: 'Ortopedia', status: 'Em atendimento', timeStarted: '07:00', duration: '4h 43m', patients: 12, statusColor: 'text-green-600 bg-green-50' },
  { id: '2', name: 'Dra. Maria Souza', specialty: 'Pediatria', status: 'Em pausa', timeStarted: '07:15', duration: '4h 28m', patients: 8, statusColor: 'text-amber-600 bg-amber-50' },
  { id: '3', name: 'Dr. Carlos Lima', specialty: 'Clínico Geral', status: 'Em atendimento', timeStarted: '07:30', duration: '4h 13m', patients: 15, statusColor: 'text-green-600 bg-green-50' },
  { id: '4', name: 'Dra. Ana Paula', specialty: 'Ginecologia', status: 'Aguardando', timeStarted: '08:00', duration: '3h 43m', patients: 5, statusColor: 'text-blue-600 bg-blue-50' },
  { id: '5', name: 'Dr. Roberto Santos', specialty: 'Cardiologia', status: 'Em atendimento', timeStarted: '08:30', duration: '3h 13m', patients: 6, statusColor: 'text-green-600 bg-green-50' },
];

export default function ShiftMonitoring({ 
  onBack, 
  userName,
  onLogout,
  upaName
}: ShiftMonitoringProps) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Monitoramento de Plantão</h2>
            <p className="text-slate-500 text-sm font-medium">Acompanhamento em tempo real da unidade</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horário Atual</p>
              <p className="text-lg font-black text-slate-800">{currentTime}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-800">05</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Médicos Ativos</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-800">22m</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">T. Médio Espera</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-800">01</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alerta Ativo</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} />
              Operação em Tempo Real
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Ao Vivo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {MOCK_SHIFTS.map((shift) => (
              <motion.div 
                key={shift.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <User size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">{shift.name}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${shift.statusColor}`}>
                          {shift.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Stethoscope size={12} />
                          {shift.specialty}
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Início: {shift.timeStarted}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Duração</p>
                    <p className="text-sm font-black text-slate-800">{shift.duration}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Produtividade</p>
                    <p className="text-sm font-black text-green-600">Alta</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">
                    Ver Detalhes do Turno
                  </button>
                  <button className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-amber-50 hover:text-amber-600 transition-all">
                    Solicitar Pausa
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
