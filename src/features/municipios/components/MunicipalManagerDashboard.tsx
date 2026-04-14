import { useCallback, useEffect, useState } from 'react';
import {
  Hospital, Users, Stethoscope, Activity, ChevronRight,
  LayoutDashboard, Loader2 // Stethoscope used in stats below
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { upasApi, relatoriosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';
import UPAManagementModal from '../../upas/components/UPAManagementModal';

interface MunicipalManagerDashboardProps {
  userName: string;
  cityName: string;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  systemName?: string;
  systemLogo?: string;
}

export default function MunicipalManagerDashboard({
  userName, cityName, onLogout, onNavigate, systemName, systemLogo
}: MunicipalManagerDashboardProps) {
  const { usuario } = useApp();
  const [upas, setUpas] = useState<any[]>([]);
  const [relatorio, setRelatorio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUpaId, setSelectedUpaId] = useState<number | string | null>(null);

  const fetchDados = useCallback(async () => {
    const municipioId = usuario?.municipio_id;
    const promises: Promise<any>[] = [upasApi.listar(municipioId ? { municipio_id: municipioId, interno: 1 } : { interno: 1 })];
    if (municipioId) promises.push(relatoriosApi.municipio(municipioId));

    const [u, r] = await Promise.all(promises);
    setUpas(u);
    if (r) setRelatorio(r);
  }, [usuario?.municipio_id]);

  useEffect(() => {
    fetchDados().finally(() => setIsLoading(false));
  }, [fetchDados]);

  const quickActions = [
    { label: 'Area das UPAs', icon: Hospital, screen: 'list_upa' },
    { label: 'Area dos Gestores UPA', icon: Users, screen: 'list_manager' },
    { label: 'Relatórios', icon: Activity, screen: 'reports' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      <DashboardHeader
        userName={userName}
        roleName="Gestor Municipal"
        subInfo={cityName}
        onLogout={onLogout}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        <section>
          <h2 className="text-2xl font-extrabold text-slate-800">Painel do Gestor Municipal</h2>
          <p className="text-slate-500 text-sm">Gerencie as unidades, gestores e estrutura do município.</p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'UPAs Cadastradas', value: String(upas.length), icon: Hospital, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Unidades Ativas', value: String(upas.filter(u => u.ativa).length), icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Médicos Vinculados', value: String(relatorio?.total_medicos ?? '-'), icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Em Atendimento', value: String(upas.reduce((a, u) => a + (u.em_atendimento || 0), 0)), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-slate-300" />
                ) : (
                  <p className="text-2xl font-black text-slate-800 leading-none">{stat.value}</p>
                )}
                <p className="text-xs font-bold text-slate-500 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(action.screen)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-600 hover:shadow-md transition-all active:scale-[0.98] text-left group select-none"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <action.icon size={24} />
                </div>
                <span className="font-bold text-slate-700 text-sm leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* UPAs List */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Unidades de Saúde</h3>
              <button onClick={() => onNavigate('list_upa')} className="text-blue-600 text-xs font-bold hover:underline">
                Ver todas
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : upas.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm font-medium">
                  Nenhuma UPA cadastrada neste município.
                </div>
              ) : (
                upas.slice(0, 5).map((upa, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedUpaId(upa.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 active:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Hospital size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800">{upa.nome}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {upa.bairro} • {upa.total_medicos} Médicos • {upa.em_atendimento} em atendimento
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md ${upa.ativa ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {upa.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Alerts placeholder */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alertas do Município</h3>
            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-bold">
              Nenhum alerta ativo.
            </div>
          </section>
        </div>
      </main>

      <UPAManagementModal
        upaId={selectedUpaId}
        onClose={() => setSelectedUpaId(null)}
        onUpdated={fetchDados}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around z-40 sm:hidden">
        <button onClick={() => onNavigate('manager')} className="flex flex-col items-center gap-1 text-blue-600">
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => onNavigate('list_upa')} className="flex flex-col items-center gap-1 text-slate-400">
          <Hospital size={24} />
          <span className="text-[10px] font-bold">Unidades</span>
        </button>
        <button onClick={() => onNavigate('list_manager')} className="flex flex-col items-center gap-1 text-slate-400">
          <Users size={24} />
          <span className="text-[10px] font-bold">Gestores</span>
        </button>
        <button onClick={() => onNavigate('reports')} className="flex flex-col items-center gap-1 text-slate-400">
          <Activity size={24} />
          <span className="text-[10px] font-bold">Relatórios</span>
        </button>
      </nav>
    </div>
  );
}
