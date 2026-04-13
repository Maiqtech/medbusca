import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import UPAManagerDashboard from '../components/UPAManagerDashboard';

vi.mock('../services/api', () => ({
  medicosApi: { listar: vi.fn().mockResolvedValue([]) },
  alertasApi: { listar: vi.fn().mockResolvedValue([]) },
  turnosApi: { listar: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../store/AppContext', () => ({
  useApp: () => ({ usuario: { upa_id: 42 } }),
}));

const defaultProps = {
  userName: 'Gestor Teste',
  upaName: 'UPA 24h Teste',
  onLogout: vi.fn(),
  onNavigate: vi.fn(),
};

describe('UPAManagerDashboard — polling 15s', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Test 1: setInterval criado com 15000ms ao montar o componente', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    render(<UPAManagerDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    const pollingCall = setIntervalSpy.mock.calls.find(call => call[1] === 15000);
    expect(pollingCall).toBeDefined();
  });

  it('Test 2: clearInterval chamado ao desmontar', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = render(<UPAManagerDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('Test 3: isLoading false após o primeiro fetch; polls seguintes não ativam loading spinner', async () => {
    render(<UPAManagerDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    // After first fetch, loading text should be gone
    expect(screen.queryByText('Carregando...')).toBeNull();

    // Advance 15s — polling fires but no loading spinner should appear
    await act(async () => {
      vi.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    expect(screen.queryByText('Carregando...')).toBeNull();
  });

  it('Test 4: indicador de última atualização visível após o mount (contém "Atualizado às")', async () => {
    render(<UPAManagerDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Atualizado às/)).toBeInTheDocument();
  });

  it('Test 5: polling re-busca com upa_id correto do usuario.upa_id', async () => {
    const { medicosApi, turnosApi } = await import('../services/api');
    render(<UPAManagerDashboard {...defaultProps} />);

    await act(async () => {
      await Promise.resolve();
    });

    // Advance 15s to trigger second fetch
    await act(async () => {
      vi.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    // medicosApi.listar should have been called with upa_id: 42
    expect(medicosApi.listar).toHaveBeenCalledWith({ upa_id: 42 });
    expect(turnosApi.listar).toHaveBeenCalledWith({ upa_id: 42 });
  });
});
