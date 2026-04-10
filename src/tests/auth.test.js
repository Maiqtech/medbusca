import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Autenticação - validação de senha', () => {
  it('senha correta deve passar', () => {
    const hash = bcrypt.hashSync('123456', 10);
    expect(bcrypt.compareSync('123456', hash)).toBe(true);
  });

  it('senha incorreta deve falhar', () => {
    const hash = bcrypt.hashSync('123456', 10);
    expect(bcrypt.compareSync('senha_errada', hash)).toBe(false);
  });
});

describe('JWT Middleware', () => {
  it('gera e verifica tokens corretamente', async () => {
    const { generateTokens, verifyToken } = await import('../../server/middleware/auth.js');

    const payload = { id: 'u1', nome: 'Teste', perfil: 'medico' };
    const { accessToken, refreshToken } = generateTokens(payload);

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const decoded = verifyToken(accessToken);
    expect(decoded.id).toBe('u1');
    expect(decoded.perfil).toBe('medico');
  });

  it('refresh token tem type=refresh', async () => {
    const { generateTokens, verifyToken } = await import('../../server/middleware/auth.js');

    const { refreshToken } = generateTokens({ id: 'u1', perfil: 'medico' });
    const decoded = verifyToken(refreshToken);
    expect(decoded.type).toBe('refresh');
  });

  it('token inválido lança erro', async () => {
    const { verifyToken } = await import('../../server/middleware/auth.js');
    expect(() => verifyToken('token.invalido.aqui')).toThrow();
  });
});
