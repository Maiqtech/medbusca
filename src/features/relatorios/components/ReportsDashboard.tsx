import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Clock, Download, Calendar, UserCheck, Timer, History, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { relatoriosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface ReportsDashboardProps {
  onBack: () => void;
  userName: string;
  onLogout: () => void;
}

export default function ReportsDashboard({ onBack, userName, onLogout }: ReportsDashboardProps) {
  const { usuario } = useApp();
  const [dados, setDados] = useState<any>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDados = useCallback(async () => {
    const upaId = usuario?.upa_id;
    if (!upaId) return;
    try {
      const result = await relatoriosApi.upa(upaId, mesSelecionado || undefined);
      setDados(result);
    } catch {}
  }, [usuario?.upa_id, mesSelecionado]);

  useEffect(() => {
    fetchDados().finally(() => setIsLoading(false));
  }, [fetchDados]);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Gestor de UPA"
        subInfo="Relatórios de Unidade"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Date Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <Calendar size={20} className="text-slate-600" />
          <label className="text-sm font-bold text-slate-600">Filtrar por mês:</label>
          <input
            type="month"
            value={mesSelecionado}
            onChange={e => setMesSelecionado(e.target.value)}
            className="px-3 py-1 border border-slate-200 rounded-lg text-sm"
          />
          {mesSelecionado && (
            <button
              onClick={() => setMesSelecionado('')}
              className="text-blue-600 text-xs font-bold hover:underline ml-auto"
            >Limpar</button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
            <span className="ml-2 text-sm text-slate-500">Carregando...</span>
          </div>
        )}

        {/* Big Stats - Focus on Doctors and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <p className="text-3xl font-bold text-slate-800">{dados?.medicos_ativos ?? '-'}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Médicos Ativos no Mês</p>
            <div className="mt-4 flex items-center gap-1 text-green-500 text-xs font-bold">
              <UserCheck size={14} />
              Baseado em turnos registrados
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Timer size={24} />
            </div>
            <p className="text-3xl font-bold text-slate-800">{dados?.total_horas ?? '-'}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Total Horas em Plantão</p>
            <div className="mt-4 flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <TrendingUp size={14} />
              Baseado em turnos registrados
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <p className="text-3xl font-bold text-slate-800">{dados?.taxa_disponibilidade ?? '-'}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Taxa de Disponibilidade</p>
            <div className="mt-4 flex items-center gap-1 text-slate-500 text-xs font-bold">
              <History size={14} />
              Baseado em turnos registrados
            </div>
          </div>
        </div>

        {/* Availability Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Horas de Trabalho por Dia (Total Equipe)</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span>Horas Reais</span>
                </div>
              </div>
              <button className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                <Download size={16} />
                <span className="font-bold text-[10px] uppercase">Exportar</span>
              </button>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[60, 75, 80, 65, 90, 85, 40, 55, 70, 85, 95, 75].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.05, duration: 0.8 }}
                className="flex-1 bg-blue-100 rounded-t-lg hover:bg-blue-500 transition-colors cursor-pointer relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {Math.floor(height * 1.2)}h totais
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Semana 1</span>
            <span>Semana 2</span>
            <span>Semana 3</span>
            <span>Semana 4</span>
          </div>
        </div>

        {/* Doctor Performance List */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Detalhamento por Profissional</h3>
          <div className="space-y-4">
            {!isLoading && (!dados?.detalhamento || dados.detalhamento.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-4">Nenhum médico no período selecionado.</p>
            )}
            {(dados?.detalhamento ?? []).map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{doc.nome}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.especialidade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{doc.total_horas}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Mês</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">{doc.assiduidade}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assiduidade</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    doc.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {doc.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
