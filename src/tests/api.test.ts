import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccessToken, setTokens, clearTokens } from '../services/api';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Token management', () => {
  beforeEach(() => localStorage.clear());

  it('retorna null quando não há token', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('armazena e recupera tokens corretamente', () => {
    setTokens('access123', 'refresh456');
    expect(getAccessToken()).toBe('access123');
    expect(localStorage.getItem('medbusca_refresh_token')).toBe('refresh456');
  });

  it('limpa tokens corretamente', () => {
    setTokens('access123', 'refresh456');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('medbusca_refresh_token')).toBeNull();
  });
});
