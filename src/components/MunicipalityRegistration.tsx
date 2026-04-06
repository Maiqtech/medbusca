import React, { useState, FormEvent, useRef } from 'react';
import { 
  Search, 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Save,
  X,
  Activity,
  Bell,
  LogOut,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardHeader from './DashboardHeader';

interface MunicipalityRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
  userName: string;
  onLogout: () => void;
}

export default function MunicipalityRegistration({ onBack, onSuccess, userName, onLogout }: MunicipalityRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    uf: '',
    status: 'active',
    observation: '',
    expectedUpas: '',
    responsible: '',
    systemName: '',
    systemLogo: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, systemLogo: reader.result as string }));
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.uf) {
      setError('Nome do município e Estado são obrigatórios.');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSuccess(true);

    // Wait a bit before navigating back or to success screen
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-10">
      {/* App Header */}
      <DashboardHeader 
        userName={userName}
        roleName="Super Admin"
        subInfo="Novo Município"
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">
        {/* Title Section */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-800">Cadastrar Município</h2>
          <p className="text-slate-500 text-sm">Adicione um novo município para iniciar sua estrutura administrativa.</p>
        </section>

        {/* Form Card */}
        <section className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Nome do Município *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Salvador"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                    disabled={isLoading || isSuccess}
                  />
                </div>
              </div>

              {/* UF */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Estado (UF) *
                </label>
                <select
                  value={formData.uf}
                  onChange={e => setFormData({ ...formData, uf: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium appearance-none"
                  disabled={isLoading || isSuccess}
                >
                  <option value="">Selecione...</option>
                  {states.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Status Inicial
                </label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      formData.status === 'active' 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                    disabled={isLoading || isSuccess}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      formData.status === 'inactive' 
                      ? 'bg-white text-red-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                    disabled={isLoading || isSuccess}
                  >
                    Inativo
                  </button>
                </div>
              </div>

              {/* Expected UPAs */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Qtd. UPAs Prevista
                </label>
                <input
                  type="number"
                  value={formData.expectedUpas}
                  onChange={e => setFormData({ ...formData, expectedUpas: e.target.value })}
                  placeholder="Ex: 12"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                  disabled={isLoading || isSuccess}
                />
              </div>

              {/* Responsible */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Responsável Inicial
                </label>
                <input
                  type="text"
                  value={formData.responsible}
                  onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                  disabled={isLoading || isSuccess}
                />
              </div>

              {/* System Customization Section */}
              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Personalização do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                      Nome Personalizado do Sistema
                    </label>
                    <input
                      type="text"
                      value={formData.systemName}
                      onChange={e => setFormData({ ...formData, systemName: e.target.value })}
                      placeholder="Ex: MedBusca Salvador"
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                      disabled={isLoading || isSuccess}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                      Logo do Sistema (PNG/SVG)
                    </label>
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                          formData.systemLogo 
                          ? 'border-emerald-200 bg-emerald-50/30' 
                          : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        {formData.systemLogo ? (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-white border border-emerald-100 flex items-center justify-center overflow-hidden">
                              <img src={formData.systemLogo} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-emerald-800 truncate">Imagem selecionada</p>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, systemLogo: '' }));
                                }}
                                className="text-xs font-medium text-emerald-600 hover:text-red-500 transition-colors"
                              >
                                Remover imagem
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                              <Upload size={20} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-slate-700">Clique para enviar</p>
                              <p className="text-xs font-medium text-slate-400">PNG ou SVG até 2MB</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observation */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Observações (Opcional)
                </label>
                <textarea
                  value={formData.observation}
                  onChange={e => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Informações adicionais sobre o município..."
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white font-medium resize-none"
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            {/* Feedback Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm font-bold"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center gap-3 p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 mb-2">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-xl font-black">Sucesso!</h4>
                  <p className="font-bold">Município cadastrado com sucesso.</p>
                  <p className="text-xs opacity-70">Redirecionando para o painel...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            {!isSuccess && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Salvar Município</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                >
                  <X size={20} />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </form>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="py-6 px-6 text-center">
        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          MedBusca • Gestão Administrativa Municipal
        </p>
      </footer>
    </div>
  );
}
