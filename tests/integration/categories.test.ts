import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

describe('Testes de Integração - Rotas de Categorias (Controle de Acesso)', () => {
  let userToken: string;
  let adminToken: string;
  let categoryId: number;

  beforeAll(async () => {
    // 1. Limpa o banco
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // 2. Cria e loga um usuário COMUM
    await request(app).post('/auth/register').send({
      name: 'Usuário Comum', email: 'comum@teste.com', password: '123456', role: 'USER'
    });
    const resUser = await request(app).post('/auth/login').send({
      email: 'comum@teste.com', password: '123456'
    });
    userToken = resUser.body.token;

    // 3. Cria e loga um ADMIN
    await request(app).post('/auth/register').send({
      name: 'Administrador', email: 'admin@teste.com', password: '123456', role: 'ADMIN'
    });
    const resAdmin = await request(app).post('/auth/login').send({
      email: 'admin@teste.com', password: '123456'
    });
    adminToken = resAdmin.body.token;
  });
  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  it('Deve listar categorias publicamente sem token (GET /categories)', async () => {
    const response = await request(app).get('/categories');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('Deve bloquear a criação de categoria sem enviar token (POST /categories)', async () => {
    const response = await request(app)
      .post('/categories')
      .send({ name: 'Tecnologia' });
    
    expect(response.status).toBe(401);
  });

  it('Deve bloquear a criação de categoria por um usuário comum (POST /categories)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${userToken}`) // Injeta o token do usuário comum
      .send({ name: 'Concursos' });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Acesso restrito');
  });

  it('Deve permitir a criação de categoria por um ADMIN (POST /categories)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`) // Injeta o token do admin
      .send({ name: 'Cibersegurança' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Cibersegurança');
    
    categoryId = response.body.id; // Guarda o ID para o próximo teste
  });

  it('Deve permitir que um ADMIN apague a categoria (DELETE /categories/:id)', async () => {
    const response = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (response.status !== 204 && response.status !== 200) {
      console.error("ERRO NO DELETE CATEGORY:", response.body || response.status);
    }
    
    expect([200, 204]).toContain(response.status);
  });
  
  it('Deve listar todas as categorias publicamente (GET /categories)', async () => {
      const response = await request(app).get('/categories');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  
  it('Deve buscar uma categoria específica (GET /categories/:id)', async () => {
    // Cria uma categoria rápida para testar
    const tempCat = await prisma.category.create({ data: { name: 'Categoria Busca' } });
    
    const response = await request(app).get(`/categories/${tempCat.id}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Categoria Busca');
    expect(response.body).toHaveProperty('posts'); // Requisito do edital
  });

});