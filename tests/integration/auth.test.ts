import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

describe('Testes de Integração - Rotas de Autenticação', () => {
  const testUser = {
    name: 'Visitante de Teste',
    email: 'visitante.teste@email.com',
    password: 'senha_super_segura_123',
    role: 'USER'
  };

  let validRefreshToken = ''; // Variável para guardar o refresh token entre os testes

  // Limpa o banco antes de começar para garantir um ambiente limpo
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  // Limpa o banco no final para não deixar "lixo" no SQLite
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  it('Deve registrar um novo usuário com sucesso (POST /auth/register)', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(testUser.email);
    expect(response.body).not.toHaveProperty('password'); // Garante que a senha não vazou na resposta
  });

  it('Não deve permitir o registro de um e-mail já existente', async () => {
    // Tenta registrar o mesmo usuário de novo
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('E-mail já cadastrado.');
  });

  // ALTERADO: Agora espera e guarda o refreshToken
  it('Deve fazer login com sucesso e retornar token e refreshToken (POST /auth/login)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken'); // Verifica se o refresh veio
    expect(typeof response.body.token).toBe('string');
    
    validRefreshToken = response.body.refreshToken; // Salva para usar no teste de refresh
  });

  it('Deve bloquear login com senha incorreta', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'senha_totalmente_errada'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('Deve rejeitar registro com senha curta (menos de 6 caracteres)', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Usuário Inválido',
        email: 'invalido@teste.com',
        password: '123', // Menor que o mínimo exigido pelo Zod (6 chars)
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // NOVO TESTE: Garantindo que o refresh token funciona
  it('Deve renovar o token de acesso (POST /auth/refresh)', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: validRefreshToken });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });
});