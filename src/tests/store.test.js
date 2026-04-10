import { describe, it, expect, beforeEach } from 'vitest';

// Testa as funções do store diretamente
describe('Store - addEntity', () => {
  it('adiciona entidade com id e criado_em', async () => {
    const { addEntity } = await import('../../server/data/store.js');
    const arr = [];
    const result = addEntity(arr, { nome: 'Teste', uf: 'BA' });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('criado_em');
    expect(result.nome).toBe('Teste');
    expect(result.uf).toBe('BA');
    expect(arr).toHaveLength(1);
  });
});

describe('Store - dados iniciais', () => {
  it('possui municípios iniciais', async () => {
    const { municipios } = await import('../../server/data/store.js');
    expect(municipios.length).toBeGreaterThan(0);
    expect(municipios[0]).toHaveProperty('nome');
    expect(municipios[0]).toHaveProperty('uf');
  });

  it('possui usuários com todos os perfis', async () => {
    const { users } = await import('../../server/data/store.js');
    const perfis = users.map(u => u.perfil);
    expect(perfis).toContain('super_admin');
    expect(perfis).toContain('gestor_municipal');
    expect(perfis).toContain('gestor_upa');
    expect(perfis).toContain('medico');
  });

  it('possui UPAs vinculadas a municípios', async () => {
    const { upas, municipios } = await import('../../server/data/store.js');
    const municipioIds = municipios.map(m => m.id);
    upas.forEach(upa => {
      expect(municipioIds).toContain(upa.municipio_id);
    });
  });

  it('possui médicos vinculados a UPAs', async () => {
    const { medicos, upas } = await import('../../server/data/store.js');
    const upaIds = upas.map(u => u.id);
    medicos.forEach(med => {
      expect(upaIds).toContain(med.upa_id);
    });
  });
});
