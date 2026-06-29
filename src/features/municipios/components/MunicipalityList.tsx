import { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Users, ChevronRight, Plus, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { municipiosApi } from '../../../services/api';
import MunicipalityEditModal from './MunicipalityEditModal';

interface MunicipalityListProps {
  onBack: () => void;
  onAdd: () => void;
  onSelect?: (municipio: any) => void;
  onAddManager?: (municipioId: number | string, municipioNome: string) => void;
  userName: string;
  onLogout: () => void;
}

export default function MunicipalityList({ onBack, onAdd, onSelect, onAddManager, userName, onLogout }: MunicipalityListProps) {
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editingMunicipio, setEditingMunicipio] = useState<any | null>(null);

  const fetchMunicipios = () => {
    municipiosApi.listar()
      .then(setMunicipios)
      .catch(() => setErro('Erro ao carregar municípios.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMunicipios();
  }, []);

  const filtered = municipios.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.uf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupa por UF para filtro visual
  const porEstado = filtered.reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.uf]) acc[m.uf] = [];
    acc[m.uf].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <DashboardHeader
        userName={userName}
        roleName="Super Admin"
        subInfo="Municípios Parceiros"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Municípios</h2>
          <button
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span className="font-bold text-sm">Novo Município</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou estado..."
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
            <span className="font-medium">Carregando municípios...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <MapPin size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Nenhum município encontrado</p>
            <p className="text-sm mt-1">Cadastre o primeiro município clicando em "Novo Município".</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(porEstado).sort(([a], [b]) => a.localeCompare(b)).map(([uf, lista]: [string, any[]]) => (
              <div key={uf}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  {uf} — {lista.length} município{lista.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-3">
                  {lista.map((city: any, index: number) => (
                    <motion.div
                      key={city.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setEditingMunicipio(city)}
                      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          city.ativo ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {city.nome} — {city.uf}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                              <Building2 size={10} />
                              {city.total_upas} UPAs
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                              <Users size={10} />
                              {city.total_gestores} Gestores
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                              {city.total_medicos} Médicos
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          city.ativo ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {city.ativo ? 'Ativo' : 'Inativo'}
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MunicipalityEditModal
        municipio={editingMunicipio}
        onClose={() => setEditingMunicipio(null)}
        onUpdated={fetchMunicipios}
        onAddManager={onAddManager}
      />
    </div>
  );
}
