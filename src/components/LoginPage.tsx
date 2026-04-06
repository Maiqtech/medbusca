import { useState, FormEvent } from 'react';
import { Search, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (role: string) => void;
  systemName?: string;
  systemLogo?: string;
}

export default function LoginPage({ onBack, onLoginSuccess, systemName = "MedBusca", systemLogo }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (email === 'medico@teste.com') {
      onLoginSuccess('doctor');
    } else if (email === 'gestor@teste.com') {
      onLoginSuccess('manager');
    } else if (email === 'upa@teste.com') {
      onLoginSuccess('upa_manager_dashboard');
    } else if (email === 'superadmin@teste.com') {
      onLoginSuccess('admin');
    } else {
      setError('Credenciais inválidas. Verifique seu email e senha.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-sm overflow-hidden">
            {systemLogo ? (
              <img src={systemLogo} alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Search className="text-white w-5 h-5" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-900">
            {systemName}
          </h1>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
                  Acesse sua conta
                </h2>
                <p className="text-slate-500 text-sm">
                  Use suas credenciais institucionais para entrar no sistema interno.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                    Email Institucional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@saude.gov.br"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium border border-red-100"
                    >
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                Acesso restrito a servidores autorizados
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center">
        <p className="text-slate-400 text-xs font-medium">
          Secretaria Municipal de Saúde • Salvador-BA
        </p>
      </footer>
    </div>
  );
}
