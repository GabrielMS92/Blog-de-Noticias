import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { hashPassword, signToken } from '../../src/lib/auth.js';

describe('Testes de Integração - Rotas de Notícias (Posts)', () => {
  let userToken: string;
  let categoryId: number;
  let postId: number;

  beforeAll(async () => {
    // Limpeza na ordem correta
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Cria usuário direto no banco (sem depender de HTTP)
    const hashedPassword = await hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        name: 'Jornalista',
        email: 'jornalista@teste.com',
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Gera token manualmente, igual ao comments.test.ts
    userToken = signToken({ id: user.id, role: user.role });

    // Cria categoria direto no banco
    const category = await prisma.category.create({
      data: { name: 'Tecnologia' },
    });
    categoryId = category.id;
  });

  it('Deve criar uma nova notícia (POST /posts)', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Nova API Lançada',
        content: 'O conteúdo desta notícia é longo o suficiente para passar na validação do Zod.',
        categoryId: categoryId,
      });

    if (response.status !== 201) console.error('ERRO (POST /posts):', response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    postId = response.body.id;
  });

  it('Deve listar as notícias publicamente (GET /posts)', async () => {
    const response = await request(app).get('/posts');

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('Deve permitir que o dono atualize a notícia (PUT /posts/:id)', async () => {
    const response = await request(app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Título Atualizado da Notícia',
        content: 'O conteúdo desta notícia é longo o suficiente para passar na validação do Zod.',
        categoryId: categoryId,
      });

    if (response.status !== 200) console.error('ERRO NO PUT /posts:', response.body);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Título Atualizado da Notícia');
  });

  it('Deve buscar uma notícia específica por ID (GET /posts/:id)', async () => {
    const response = await request(app).get(`/posts/${postId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(postId);
  });

  it('Deve retornar 404 ao buscar uma notícia inexistente (GET /posts/:id)', async () => {
    const response = await request(app).get('/posts/99999');
    
    expect(response.status).toBe(404);
  });

  it('Deve realizar o Soft Delete da notícia (DELETE /posts/:id)', async () => {
    const response = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`);

    if (![200, 204].includes(response.status)) console.error('ERRO NO DELETE /posts:', response.body);

    expect([200, 204]).toContain(response.status);

    const deletedPost = await prisma.post.findUnique({ where: { id: postId } });
    expect(deletedPost?.deletedAt).not.toBeNull();
  });
});