import { useState, useEffect } from 'react';
import { Search, User, Mail, Building2, UserPlus, Loader2, AlertCircle, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from '../../../components/DashboardHeader';
import { usuariosApi } from '../../../services/api';
import { useApp } from '../../../store/AppContext';

interface ManagerListProps {
  onBack: () => void;
  onAdd: () => void;
  userName: string;
  onLogout: () => void;
  type?: 'municipal' | 'upa';
  municipioId?: number | string;
  municipioNome?: string;
}

export default function ManagerList({ onBack, onAdd, userName, onLogout, type = 'upa', municipioId, municipioNome }: ManagerListProps) {
  const { usuario } = useApp();
  const [gestores, setGestores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<any | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const perfil = type === 'municipal' ? 'gestor_municipal' : 'gestor_upa';
  const titulo = municipioNome
    ? `Gestores — ${municipioNome}`
    : type === 'municipal' ? 'Area dos Gestores Municipais' : 'Area dos Gestores de UPA';

  useEffect(() => {
    const params: any = { perfil };
    if (municipioId) params.municipio_id = municipioId;
    usuariosApi.listar(params)
      .then(setGestores)
      .catch(() => setErro('Erro ao carregar gestores.'))
      .finally(() => setIsLoading(false));
  }, [perfil]);

  const handleRemover = async () => {
    if (!confirmando) return;
    setRemovendo(true);
    try {
      await usuariosApi.desativar(confirmando.id);
      setGestores(prev => prev.filter(g => g.id !== confirmando.id));
      setConfirmando(null);
    } catch {
      setErro('Erro ao remover gestor.');
    } finally {
      setRemovendo(false);
    }
  };

  const filtered = gestores.filter(g =>
    g.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Modal de confirmação */}
      <AnimatePresence>
        {confirmando && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !removendo && setConfirmando(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 text-center">Remover Gestor?</h3>
              <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
                <strong className="text-slate-700">{confirmando.nome}</strong> perderá o acesso ao sistema imediatamente.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRemover} disabled={removendo}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {removendo ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  {removendo ? 'Removendo...' : 'Remover'}
                </button>
                <button
                  onClick={() => setConfirmando(null)} disabled={removendo}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DashboardHeader
        userName={userName}
        roleName={type === 'municipal' ? 'Super Admin' : 'Gestor Municipal'}
        subInfo={titulo}
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{titulo}</h2>
          <button
            onClick={onAdd}
            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <UserPlus size={20} />
            <span className="font-bold text-sm">Novo Gestor</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
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
            <span className="font-medium">Carregando gestores...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Nenhum gestor cadastrado</p>
            <p className="text-sm mt-1">Clique em "Novo Gestor" para cadastrar o primeiro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((g, index) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{g.nome}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                        <Mail size={10} />{g.email}
                      </span>
                      {g.municipio && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                          <Building2 size={10} />Município {g.municipio}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${g.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {g.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button
                    onClick={() => setConfirmando(g)}
                    className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Remover gestor"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
