import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../src/lib/auth.js';

describe('Testes Unitários - Autenticação e Segurança', () => {
  
  // Teste 1
  it('Deve criptografar uma senha corretamente', async () => {
    const plainPassword = 'minha_senha_secreta';
    const hashedPassword = await hashPassword(plainPassword);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(plainPassword); // O hash não pode ser igual à senha plana
    expect(hashedPassword.length).toBeGreaterThan(20); // Hashes do bcrypt costumam ter 60 caracteres
  });

  // Teste 2
  it('Deve validar corretamente uma senha que bate com o hash', async () => {
    const plainPassword = 'senha_segura_123';
    const hashedPassword = await hashPassword(plainPassword);
    
    const isValid = await verifyPassword(plainPassword, hashedPassword);
    expect(isValid).toBe(true);
  });

  // Teste 3
  it('Deve recusar uma senha incorreta em relação ao hash', async () => {
    const plainPassword = 'senha_correta';
    const wrongPassword = 'senha_errada';
    const hashedPassword = await hashPassword(plainPassword);
    
    const isValid = await verifyPassword(wrongPassword, hashedPassword);
    expect(isValid).toBe(false);
  });

  // Teste 4
  it('Deve gerar um token JWT válido', () => {
    const payload = { id: 1, role: 'ADMIN' };
    const token = signToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // Todo JWT tem 3 partes separadas por ponto
  });

  // Teste 5
  it('Deve decodificar um token JWT corretamente', () => {
    const payload = { id: 99, role: 'USER' };
    const token = signToken(payload);
    
    const decoded = verifyToken(token) as { id: number; role: string };

    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
    expect(decoded).toHaveProperty('iat'); // Data de emissão automática
    expect(decoded).toHaveProperty('exp'); // Data de expiração automática
  });

});