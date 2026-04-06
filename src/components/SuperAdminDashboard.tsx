import { 
  Search, 
  LogOut, 
  MapPin, 
  Users, 
  Hospital, 
  Stethoscope, 
  PlusCircle, 
  ChevronRight,
  AlertTriangle,
  LayoutDashboard,
  Settings,
  Activity,
  Bell
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface SuperAdminDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  systemName?: string;
  systemLogo?: string;
}

export default function SuperAdminDashboard({ userName, onLogout, onNavigate, systemName, systemLogo }: SuperAdminDashboardProps) {
  const stats = [
    { label: 'Municípios', value: '5', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Gestores', value: '8', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'UPAs', value: '23', icon: Hospital, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Médicos', value: '145', icon: Stethoscope, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const quickActions = [
    { label: 'Cadastrar Município', icon: PlusCircle, screen: 'register_municipality' },
    { label: 'Cadastrar Gestor', icon: Users, screen: 'register_municipal_manager' },
    { label: 'Ver Municípios', icon: MapPin, screen: 'list_municipalities' },
  ];

  const municipalities = [
    { name: 'Salvador', upas: 12, managers: 3, status: 'Ativo' },
    { name: 'Feira de Santana', upas: 4, managers: 1, status: 'Ativo' },
    { name: 'Vitória da Conquista', upas: 3, managers: 2, status: 'Ativo' },
  ];

  const alerts = [
    { message: 'Camaçari sem gestor municipal cadastrado', type: 'warning' },
    { message: 'Lauro de Freitas com baixa cobertura de unidades', type: 'info' },
    { message: 'Novo município aguardando configuração', type: 'alert' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      {/* App Header */}
      <DashboardHeader 
        userName={userName}
        roleName="Super Admin"
        subInfo="Administrador Global"
        onLogout={onLogout}
        systemName={systemName}
        systemLogo={systemLogo}
      />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        {/* Welcome Section */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-800">Painel Administrativo</h2>
          <p className="text-slate-500 text-sm">Gerencie municípios, gestores e a estrutura da plataforma.</p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 leading-none">{stat.value}</p>
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
                <span className="font-bold text-slate-700 text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Municipalities List */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Municípios Ativos</h3>
              <button 
                onClick={() => onNavigate('list_municipalities')}
                className="text-blue-600 text-xs font-bold hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {municipalities.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(`municipality_${city.name.toLowerCase().replace(' ', '_')}`)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 active:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <MapPin size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{city.name}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {city.upas} UPAs • {city.managers} Gestores
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-md">
                      {city.status}
                    </span>
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Alerts Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alertas do Sistema</h3>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border flex gap-3 ${
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                    alert.type === 'alert' ? 'bg-red-50 border-red-100 text-red-800' :
                    'bg-blue-50 border-blue-100 text-blue-800'
                  }`}
                >
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Nav (PWA Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around z-40 sm:hidden">
        <button 
          onClick={() => onNavigate('admin')}
          className="flex flex-col items-center gap-1 text-blue-600"
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button 
          onClick={() => onNavigate('list_municipalities')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <MapPin size={24} />
          <span className="text-[10px] font-bold">Cidades</span>
        </button>
        <button 
          onClick={() => onNavigate('register_municipal_manager')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Users size={24} />
          <span className="text-[10px] font-bold">Gestores</span>
        </button>
        <button 
          onClick={() => onNavigate('settings')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
