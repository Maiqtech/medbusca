import { useState, useEffect } from 'react';
import { Plus, Search, User, ChevronRight, Stethoscope, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { medicosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface DoctorListProps {
  onBack: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  userName: string;
  onLogout: () => void;
  upaName: string;
}

const statusColor = (status: string) => {
  if (status === 'em_atendimento') return 'bg-green-100 text-green-600';
  if (status === 'em_pausa') return 'bg-amber-100 text-amber-600';
  return 'bg-slate-100 text-slate-500';
};
const statusLabel = (status: string) => {
  if (status === 'em_atendimento') return 'Em atendimento';
  if (status === 'em_pausa') return 'Em pausa';
  return 'Offline';
};

export default function DoctorList({ onBack, onAdd, onSelect, userName, onLogout, upaName }: DoctorListProps) {
  const { usuario } = useApp();
  const [medicos, setMedicos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    medicosApi.listar(usuario?.upa_id ? { upa_id: usuario.upa_id } : {})
      .then(setMedicos)
      .catch(() => setErro('Erro ao carregar médicos.'))
      .finally(() => setIsLoading(false));
  }, [usuario]);

  const filtered = medicos.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.especialidade_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.crm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Gestor de UPA"
        subInfo={upaName}
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Médicos da Unidade</h2>
          <button
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span className="font-bold text-sm">Novo Médico</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CRM ou especialidade..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {erro && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />{erro}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="font-medium">Carregando médicos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Nenhum médico encontrado</p>
            <p className="text-sm mt-1">Cadastre o primeiro médico clicando em "Novo Médico".</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(String(doc.id))}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.nome}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                        <Stethoscope size={10} />{doc.especialidade_nome}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        CRM {doc.crm}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(doc.status_turno)}`}>
                    {statusLabel(doc.status_turno)}
                  </span>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
