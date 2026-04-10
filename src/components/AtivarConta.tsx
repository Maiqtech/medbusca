import { useState, useEffect, FormEvent } from 'react';
import { Search, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface AtivarContaProps {
  token: string;
  onSuccess: () => void;
}

export default function AtivarConta({ token, onSuccess }: AtivarContaProps) {
  const [info, setInfo] = useState<{ nome: string; email: string } | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificando, setIsVerificando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/ativar/${token}/`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) setErro(data.erro);
        else setInfo(data);
      })
      .catch(() => setErro('Erro ao verificar o link. Tente novamente.'))
      .finally(() => setIsVerificando(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/ativar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setSucesso(true);
      setTimeout(() => onSuccess(), 2500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar senha.');
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
        {isVerificando ? (
          <div className="p-10 flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="font-medium text-sm">Verificando seu link...</p>
          </div>
        ) : erro && !info ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Link inválido</h2>
            <p className="text-slate-500 text-sm">{erro}</p>
          </div>
        ) : sucesso ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800">Conta ativada!</h2>
            <p className="text-slate-500 text-sm">Redirecionando para o login...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Crie sua senha</h2>
              <p className="text-slate-500 text-sm mt-1">
                Olá, <strong>{info?.nome}</strong>! Defina sua senha para acessar o MedBusca.
              </p>
              <p className="text-xs text-slate-400 mt-1">{info?.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
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
                  <><CheckCircle2 size={20} /><span>Ativar minha conta</span></>
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
