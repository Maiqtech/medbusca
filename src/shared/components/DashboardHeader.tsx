import React from 'react';
import { Activity, Bell, LogOut, ArrowLeft } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  roleName: string;
  subInfo?: string;
  onLogout: () => void;
  onBack?: () => void;
  systemName?: string;
  systemLogo?: string;
}

export default function DashboardHeader({ 
  userName, 
  roleName, 
  subInfo, 
  onLogout, 
  onBack,
  systemName = "MedBusca",
  systemLogo
}: DashboardHeaderProps) {
  return (
    <header className="bg-blue-600 text-white p-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-blue-700 rounded-xl transition-colors mr-1"
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <div className="bg-white p-1.5 rounded-lg shadow-sm overflow-hidden flex items-center justify-center min-w-[36px] min-h-[36px]">
              {systemLogo ? (
                <img src={systemLogo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <Activity size={24} className="text-blue-600" />
              )}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">{systemName}</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">{roleName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-blue-700 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-blue-600"></span>
          </button>
          
          <div className="flex items-center gap-2 pl-2 border-l border-blue-500">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none">{userName}</p>
              {subInfo && <p className="text-[10px] opacity-70">{subInfo}</p>}
            </div>
            <button 
              onClick={onLogout} 
              className="p-2 hover:bg-blue-700 rounded-xl transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
