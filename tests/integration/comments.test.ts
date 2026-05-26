import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { hashPassword, signToken } from '../../src/lib/auth.js';

describe('Testes de Integração - Rotas de Comentários', () => {
  let userToken: string;
  let authorId: number;
  let postId: number;
  let commentId: number;

  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await hashPassword('senha123');
    const user = await prisma.user.create({
      data: {
        name: 'Autor Comentarista',
        email: 'comentarista@faesa.br',
        password: hashedPassword,
        role: 'USER',
      },
    });
    authorId = user.id;

    userToken = signToken({ id: user.id, role: user.role });

    const post = await prisma.post.create({
      data: {
        title: 'Notícia sobre o projeto C2',
        content: 'O prazo de entrega está chegando.',
        authorId: user.id,
      },
    });
    postId = post.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  it('Deve criar um comentário em uma notícia (POST /comments)', async () => {
    const response = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        text: 'Este é um comentário de teste muito legal!',
        postId: postId,
      });

    if (response.status !== 201) console.error('ERRO NO POST COMMENT:', response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.text).toBe('Este é um comentário de teste muito legal!');

    commentId = response.body.id;
  });

  it('Deve listar os comentários de uma notícia (GET /comments/post/:postId)', async () => {
    const response = await request(app)
      .get(`/comments/post/${postId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('Deve permitir que o autor edite seu próprio comentário (PUT /comments/:id)', async () => {
    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Texto do comentário editado!' });

    if (response.status !== 200) console.error('ERRO NO PUT COMMENT:', response.body);

    expect(response.status).toBe(200);
    expect(response.body.text).toBe('Texto do comentário editado!');
  });

  it('Deve permitir que o autor apague seu próprio comentário (DELETE /comments/:id)', async () => {
    const response = await request(app)
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    if (![200, 204].includes(response.status)) console.error('ERRO NO DELETE COMMENT:', response.body);

    expect([200, 204]).toContain(response.status);

    const commentInDb = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(commentInDb).toBeNull();
  });

  it('Não deve permitir que outro usuário edite um comentário que não é seu (PUT /comments/:id → 403)', async () => {
    // Cria um segundo usuário
    const hashedPassword = await hashPassword('outrasenha123');
    const outroUsuario = await prisma.user.create({
      data: {
        name: 'Outro Usuário',
        email: 'outro@faesa.br',
        password: hashedPassword,
        role: 'USER',
      },
    });
    const outroToken = signToken({ id: outroUsuario.id, role: outroUsuario.role });

    // O autor original cria um comentário novo
    const novoComentario = await prisma.comment.create({
      data: {
        text: 'Comentário do autor original.',
        postId: postId,
        authorId: authorId,
      },
    });

    // O segundo usuário tenta editar o comentário do primeiro
    const response = await request(app)
      .put(`/comments/${novoComentario.id}`)
      .set('Authorization', `Bearer ${outroToken}`)
      .send({ text: 'Tentativa de edição indevida.' });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });
});