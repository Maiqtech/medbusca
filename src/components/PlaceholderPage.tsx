import { ArrowLeft, Activity, Bell, LogOut } from 'lucide-react';
import DashboardHeader from './DashboardHeader';

interface PlaceholderPageProps {
  title: string;
  onBack: () => void;
  userName?: string;
  roleName?: string;
  onLogout?: () => void;
}

export default function PlaceholderPage({ title, onBack, userName = "Usuário", roleName = "MedBusca", onLogout = () => {} }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      <DashboardHeader 
        userName={userName}
        roleName={roleName}
        onLogout={onLogout}
        onBack={onBack}
      />

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
          <p className="text-slate-500 mb-8">
            Esta tela será implementada no próximo passo do protótipo.
          </p>
          <button 
            onClick={onBack}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        </div>
      </main>
    </div>
  );
}
