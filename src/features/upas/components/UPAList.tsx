import { useCallback, useEffect, useState } from 'react';
import { Search, Building2, Users, ChevronRight, Plus, Loader2, AlertCircle, Stethoscope } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { upasApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';
import UPAManagementModal from './UPAManagementModal';

interface UPAListProps {
  onBack: () => void;
  onAdd: () => void;
  onSelect: (id: string) => void;
  userName: string;
  onLogout: () => void;
}

export default function UPAList({ onBack, onAdd, onSelect, userName, onLogout }: UPAListProps) {
  const { usuario } = useApp();
  const [upas, setUpas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selectedUpaId, setSelectedUpaId] = useState<number | string | null>(null);

  const fetchUpas = useCallback(() => {
    const params =
      usuario?.perfil === 'gestor_municipal'
        ? usuario?.municipio_id
          ? { municipio_id: usuario.municipio_id, interno: 1 }
          : { interno: 1 }
        : usuario?.municipio_id
          ? { municipio_id: usuario.municipio_id }
          : {};

    return upasApi
      .listar(params as any)
      .then(setUpas)
      .catch(() => setErro('Erro ao carregar UPAs.'))
      .finally(() => setIsLoading(false));
  }, [usuario?.municipio_id, usuario?.perfil]);

  useEffect(() => {
    fetchUpas();
  }, [fetchUpas]);

  const filtered = upas.filter(
    u =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.bairro || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Gestor Municipal"
        subInfo="Area das UPAs"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Area das UPAs</h2>
          <button
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span className="font-bold text-sm">Nova UPA</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou bairro..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {erro && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            {erro}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="font-medium">Carregando UPAs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Nenhuma UPA encontrada</p>
            <p className="text-sm mt-1">Cadastre a primeira UPA clicando em "Nova UPA".</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((upa, index) => (
              <motion.div
                key={upa.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  usuario?.perfil === 'gestor_municipal' ? setSelectedUpaId(String(upa.id)) : onSelect(String(upa.id))
                }
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      upa.ativa ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{upa.nome}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {upa.bairro && (
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{upa.bairro}</span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                        <Users size={10} />
                        {upa.total_medicos} Medicos
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                        <Stethoscope size={10} />
                        {upa.em_atendimento} em atendimento
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      upa.ativa ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {upa.ativa ? 'Ativa' : 'Inativa'}
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <UPAManagementModal upaId={selectedUpaId} onClose={() => setSelectedUpaId(null)} onUpdated={fetchUpas} />
    </div>
  );
}
