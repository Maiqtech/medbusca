const BASE_URL = 'http://localhost:8000/api';

// ─── Token management ─────────────────────────────────────────────────────────
export function getAccessToken() {
  return localStorage.getItem('medbusca_access_token');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('medbusca_access_token', accessToken);
  localStorage.setItem('medbusca_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('medbusca_access_token');
  localStorage.removeItem('medbusca_refresh_token');
}

// ─── Token refresh singleton (evita race condition com rotate_refresh_tokens) ──
let pendingRefresh: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    const refreshToken = localStorage.getItem('medbusca_refresh_token');
    if (!refreshToken) throw new Error('sem_refresh');

    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      window.location.reload();
      throw new Error('refresh_falhou');
    }

    const { access, refresh: newRefresh } = await res.json();
    setTokens(access, newRefresh);
    return access;
  })().finally(() => { pendingRefresh = null; });

  return pendingRefresh;
}

// ─── Base fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    try {
      const newAccess = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newAccess}`;
      const retryRes = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      if (!retryRes.ok) {
        const data = await retryRes.json().catch(() => ({}));
        throw new Error(data.erro || 'Erro na requisição.');
      }
      return retryRes.json();
    } catch {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const msg = typeof data === 'object'
      ? Object.values(data).flat().join(' ') || 'Erro na requisição.'
      : 'Erro na requisição.';
    throw new Error(msg);
  }

  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, senha: string) =>
    apiFetch<{ access: string; refresh: string; usuario: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password: senha }),
    }),

  logout: () => {
    const refresh = localStorage.getItem('medbusca_refresh_token');
    return apiFetch('/auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) });
  },

  me: () =>
    apiFetch<any>('/auth/me/'),
};

// ─── Municípios ───────────────────────────────────────────────────────────────
export const municipiosApi = {
  listar: () => apiFetch<any[]>('/municipios/'),
  buscar: (id: number | string) => apiFetch<any>(`/municipios/${id}/`),
  criar: (data: any) => apiFetch<any>('/municipios/', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number | string, data: any) => apiFetch<any>(`/municipios/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  desativar: (id: number | string) => apiFetch<any>(`/municipios/${id}/`, { method: 'DELETE' }),
};

// ─── Especialidades ───────────────────────────────────────────────────────────
export const especialidadesApi = {
  listar: () => apiFetch<any[]>('/especialidades/'),
};

// ─── UPAs ─────────────────────────────────────────────────────────────────────
export const upasApi = {
  listar: (params?: { municipio_id?: number | string; especialidade_id?: number | string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<any[]>(`/upas/${query}`);
  },
  buscar: (id: number | string) => apiFetch<any>(`/upas/${id}/`),
  criar: (data: any) => apiFetch<any>('/upas/', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number | string, data: any) => apiFetch<any>(`/upas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Médicos ──────────────────────────────────────────────────────────────────
export const medicosApi = {
  listar: (params?: { upa_id?: number | string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<any[]>(`/medicos/${query}`);
  },
  buscar: (id: number | string) => apiFetch<any>(`/medicos/${id}/`),
  criar: (data: any) => apiFetch<any>('/medicos/', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number | string, data: any) => apiFetch<any>(`/medicos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  remover: (id: number | string) => apiFetch<any>(`/medicos/${id}/`, { method: 'DELETE' }),
};

// ─── Escalas ──────────────────────────────────────────────────────────────────
export const escalasApi = {
  listar: (params?: { upa_id?: number | string; medico_id?: number | string; data?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<any[]>(`/escalas/${query}`);
  },
  criar: (data: any) => apiFetch<any>('/escalas/', { method: 'POST', body: JSON.stringify(data) }),
  remover: (id: number | string) => apiFetch<any>(`/escalas/${id}/`, { method: 'DELETE' }),
};

// ─── Turnos ───────────────────────────────────────────────────────────────────
export const turnosApi = {
  listar: (params?: { upa_id?: number | string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<any[]>(`/turnos/${query}`);
  },
  meu: () => apiFetch<any>('/turnos/meu/'),
  iniciar: () => apiFetch<any>('/turnos/iniciar/', { method: 'POST', body: JSON.stringify({}) }),
  pausar: () => apiFetch<any>('/turnos/pausar/', { method: 'POST', body: JSON.stringify({}) }),
  retornar: () => apiFetch<any>('/turnos/retornar/', { method: 'POST', body: JSON.stringify({}) }),
  encerrar: () => apiFetch<any>('/turnos/encerrar/', { method: 'POST', body: JSON.stringify({}) }),
};

// ─── Alertas ──────────────────────────────────────────────────────────────────
export const alertasApi = {
  listar: () => apiFetch<any[]>('/alertas/'),
  resolver: (id: number | string) => apiFetch<any>(`/alertas/${id}/resolver/`, { method: 'PUT' }),
};

// ─── Relatórios ───────────────────────────────────────────────────────────────
export const relatoriosApi = {
  upa: (upa_id: number | string, mes?: string) => {
    const query = mes ? `?mes=${mes}` : '';
    return apiFetch<any>(`/relatorios/upa/${upa_id}/${query}`);
  },
  municipio: (municipio_id: number | string) =>
    apiFetch<any>(`/relatorios/municipio/${municipio_id}/`),
};

// ─── Usuários ─────────────────────────────────────────────────────────────────
export const usuariosApi = {
  listar: (params?: { perfil?: string; municipio_id?: number | string; upa_id?: number | string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<any[]>(`/usuarios/${query}`);
  },
  criar: (data: any) => apiFetch<any>('/usuarios/', { method: 'POST', body: JSON.stringify(data) }),
  desativar: (id: number | string) => apiFetch<any>(`/usuarios/${id}/desativar/`, { method: 'PUT' }),
};
