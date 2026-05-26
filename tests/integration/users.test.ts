import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { hashPassword, signToken } from '../../src/lib/auth.js';

describe('Testes de Integração - Rotas de Usuários', () => {
  let adminToken: string;
  let userToken: string;
  let outroUserToken: string;
  let targetUserId: number;

  beforeAll(async () => {
    // Limpeza na ordem correta devido às chaves estrangeiras
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Cria um ADMIN
    const adminPass = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: { name: 'Admin Supremo', email: 'admin@users.com', password: adminPass, role: 'ADMIN' },
    });
    adminToken = signToken({ id: admin.id, role: admin.role });

    // Cria um Usuário Comum (Alvo)
    const userPass = await hashPassword('user123');
    const user = await prisma.user.create({
      data: { name: 'Usuário Alvo', email: 'alvo@users.com', password: userPass, role: 'USER' },
    });
    userToken = signToken({ id: user.id, role: user.role });
    targetUserId = user.id;

    // Cria um Segundo Usuário Comum (Para testar bloqueio de edição de terceiros)
    const outroUser = await prisma.user.create({
      data: { name: 'Outro Usuário', email: 'outro@users.com', password: userPass, role: 'USER' },
    });
    outroUserToken = signToken({ id: outroUser.id, role: outroUser.role });
  });

  it('Deve permitir que um ADMIN liste todos os usuários (GET /users)', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(3);
  });

  it('Deve bloquear um usuário comum de listar todos os usuários (GET /users)', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Acesso restrito');
  });

  it('Deve permitir que o próprio usuário atualize seus dados (PUT /users/:id)', async () => {
    const response = await request(app)
      .put(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Usuário Alvo Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Usuário Alvo Atualizado');
  });

  it('Deve bloquear um usuário de editar os dados de outro usuário (PUT /users/:id)', async () => {
    const response = await request(app)
      .put(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${outroUserToken}`)
      .send({ name: 'Hacker' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Você não tem permissão');
  });

  it('Deve permitir que um ADMIN busque um usuário por ID (GET /users/:id)', async () => {
    const response = await request(app)
      .get(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('alvo@users.com');
  });

  it('Deve retornar 404 ao buscar um usuário inexistente (GET /users/:id)', async () => {
    const response = await request(app)
      .get('/users/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it('Deve permitir que um ADMIN remova um usuário (DELETE /users/:id)', async () => {
    const response = await request(app)
      .delete(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Alterado para esperar 204, que é a resposta correta da sua API
    expect(response.status).toBe(204);

    // Como o status 204 não tem "body" (corpo), removemos a verificação do JSON de mensagem.

    // Confirma no banco que foi deletado de fato
    const userInDb = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(userInDb).toBeNull();
  });
});