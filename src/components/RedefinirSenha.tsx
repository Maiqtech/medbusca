import { useState, FormEvent } from 'react';
import { Search, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { passwordApi } from '../services/api';

interface RedefinirSenhaProps {
  resetToken: string;
  onSuccess: () => void;
}

export default function RedefinirSenha({ resetToken, onSuccess }: RedefinirSenhaProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await passwordApi.redefinirSenha(resetToken, novaSenha);
      setSucesso(true);
      setTimeout(() => onSuccess(), 2500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow">
          <Search className="text-white w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-blue-900">MedBusca</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden"
      >
        {sucesso ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Senha redefinida!</h2>
            <p className="text-slate-500 text-sm">Redirecionando para o login...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Nova senha</h2>
              <p className="text-slate-500 text-sm mt-1">
                Defina sua nova senha de acesso ao MedBusca.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Confirmar senha</label>
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 focus:bg-white"
                  disabled={isLoading}
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 size={20} className="animate-spin" /><span>Salvando...</span></>
                ) : (
                  <span>Redefinir senha</span>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>

      <p className="mt-6 text-xs text-slate-400 font-medium">
        MedBusca • Plataforma Pública de Saúde
      </p>
    </div>
  );
}
