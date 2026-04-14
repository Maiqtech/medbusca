import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, setTokens, clearTokens, getAccessToken } from '../../shared/services/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'super_admin' | 'gestor_municipal' | 'gestor_upa' | 'medico';
  municipio_id: string | null;
  municipio_nome: string | null;
  upa_id: string | null;
  upa_nome: string | null;
}

interface SystemConfig {
  name: string;
  logo: string;
  municipality: string;
}

interface AppContextType {
  usuario: Usuario | null;
  systemConfig: SystemConfig;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  setSystemConfig: (config: Partial<SystemConfig>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemConfig, setSystemConfigState] = useState<SystemConfig>({
    name: 'MedBusca',
    logo: '',
    municipality: 'Salvador',
  });

  // Restaura sessão ao carregar
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      auth.me()
        .then(u => setUsuario(u))
        .catch(() => clearTokens())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, senha: string) => {
    const { access, refresh, usuario: u } = await auth.login(email, senha);
    setTokens(access, refresh);
    setUsuario(u);
  };

  const logout = async () => {
    try { await auth.logout(); } catch {}
    clearTokens();
    setUsuario(null);
    setSystemConfigState({ name: 'MedBusca', logo: '', municipality: 'Salvador' });
  };

  const setSystemConfig = (config: Partial<SystemConfig>) => {
    setSystemConfigState(prev => ({ ...prev, ...config }));
  };

  return (
    <AppContext.Provider value={{
      usuario,
      systemConfig,
      isAuthenticated: !!usuario,
      isLoading,
      login,
      logout,
      setSystemConfig,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
