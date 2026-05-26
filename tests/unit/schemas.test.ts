import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, refreshSchema } from '../../src/schemas/authSchema.js';
import { createPostSchema, updatePostSchema } from '../../src/schemas/postSchema.js';
import { categorySchema } from '../../src/schemas/categorySchema.js';
import { createCommentSchema, updateCommentSchema } from '../../src/schemas/commentSchema.js';

// ─────────────────────────────────────────────
// authSchema
// ─────────────────────────────────────────────
describe('Schema de Autenticação — registerSchema', () => {
  const validBody = {
    body: { name: 'João Silva', email: 'joao@email.com', password: 'senha123' },
  };

  it('Deve aceitar um registro válido sem role (role é opcional)', () => {
    const result = registerSchema.safeParse(validBody);
    expect(result.success).toBe(true);
  });

  it('Deve aceitar um registro válido com role ADMIN', () => {
    const result = registerSchema.safeParse({
      body: { ...validBody.body, role: 'ADMIN' },
    });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar nome com menos de 2 caracteres', () => {
    const result = registerSchema.safeParse({
      body: { ...validBody.body, name: 'A' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O nome deve ter no mínimo 2 caracteres');
  });

  it('Deve rejeitar e-mail com formato inválido', () => {
    const result = registerSchema.safeParse({
      body: { ...validBody.body, email: 'nao-e-um-email' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Formato de e-mail inválido');
  });

  it('Deve rejeitar senha com menos de 6 caracteres', () => {
    const result = registerSchema.safeParse({
      body: { ...validBody.body, password: '123' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('A senha deve ter no mínimo 6 caracteres');
  });

  it('Deve rejeitar role com valor fora do enum USER/ADMIN', () => {
    const result = registerSchema.safeParse({
      body: { ...validBody.body, role: 'SUPERUSER' },
    });
    expect(result.success).toBe(false);
  });
});

describe('Schema de Autenticação — loginSchema', () => {
  it('Deve aceitar credenciais válidas', () => {
    const result = loginSchema.safeParse({
      body: { email: 'joao@email.com', password: 'senha123' },
    });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar e-mail com formato inválido', () => {
    const result = loginSchema.safeParse({
      body: { email: 'invalido', password: 'senha123' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Formato de e-mail inválido');
  });

  it('Deve rejeitar senha vazia', () => {
    const result = loginSchema.safeParse({
      body: { email: 'joao@email.com', password: '' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('A senha é obrigatória');
  });
});

describe('Schema de Autenticação — refreshSchema', () => {
  it('Deve aceitar um refreshToken válido', () => {
    const result = refreshSchema.safeParse({ body: { refreshToken: 'token.qualquer.aqui' } });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar refreshToken vazio', () => {
    const result = refreshSchema.safeParse({ body: { refreshToken: '' } });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O Refresh Token é obrigatório');
  });
});

// ─────────────────────────────────────────────
// postSchema
// ─────────────────────────────────────────────
describe('Schema de Notícias — createPostSchema', () => {
  const validPost = {
    title: 'Título válido da notícia',
    content: 'Conteúdo longo o suficiente para passar na validação.',
    categoryId: 1,
  };

  it('Deve aceitar uma notícia válida', () => {
    const result = createPostSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar título com menos de 5 caracteres', () => {
    const result = createPostSchema.safeParse({ ...validPost, title: 'Abc' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O título precisa ter pelo menos 5 caracteres');
  });

  it('Deve rejeitar conteúdo com menos de 20 caracteres', () => {
    const result = createPostSchema.safeParse({ ...validPost, content: 'Curto demais.' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O conteúdo da notícia é muito curto');
  });

  it('Deve rejeitar categoryId ausente', () => {
    const { categoryId, ...semCategoria } = validPost;
    const result = createPostSchema.safeParse(semCategoria);
    expect(result.success).toBe(false);
  });

  it('Deve rejeitar categoryId decimal (deve ser inteiro)', () => {
    const result = createPostSchema.safeParse({ ...validPost, categoryId: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('Schema de Notícias — updatePostSchema', () => {
  it('Deve aceitar atualização parcial somente com título', () => {
    const result = updatePostSchema.safeParse({ title: 'Título novo e válido' });
    expect(result.success).toBe(true);
  });

  it('Deve aceitar atualização do campo published', () => {
    const result = updatePostSchema.safeParse({ published: true });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar título curto mesmo em atualização parcial', () => {
    const result = updatePostSchema.safeParse({ title: 'Abc' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O título precisa ter pelo menos 5 caracteres');
  });
});

// ─────────────────────────────────────────────
// categorySchema
// ─────────────────────────────────────────────
describe('Schema de Categorias — categorySchema', () => {
  it('Deve aceitar uma categoria com nome válido', () => {
    const result = categorySchema.safeParse({ body: { name: 'Tecnologia' } });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar nome com menos de 3 caracteres', () => {
    const result = categorySchema.safeParse({ body: { name: 'TI' } });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'O nome da categoria deve ter no mínimo 3 caracteres'
    );
  });

  it('Deve rejeitar nome ausente', () => {
    const result = categorySchema.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// commentSchema
// ─────────────────────────────────────────────
describe('Schema de Comentários — createCommentSchema', () => {
  it('Deve aceitar um comentário válido', () => {
    const result = createCommentSchema.safeParse({ text: 'Ótima notícia!', postId: 1 });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar texto vazio', () => {
    const result = createCommentSchema.safeParse({ text: '', postId: 1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O comentário não pode estar vazio');
  });

  it('Deve rejeitar postId ausente', () => {
    const result = createCommentSchema.safeParse({ text: 'Comentário válido' });
    expect(result.success).toBe(false);
  });

  it('Deve rejeitar postId decimal (deve ser inteiro)', () => {
    const result = createCommentSchema.safeParse({ text: 'Comentário válido', postId: 2.7 });
    expect(result.success).toBe(false);
  });
});

describe('Schema de Comentários — updateCommentSchema', () => {
  it('Deve aceitar texto válido para edição', () => {
    const result = updateCommentSchema.safeParse({ text: 'Comentário editado.' });
    expect(result.success).toBe(true);
  });

  it('Deve rejeitar texto vazio na edição', () => {
    const result = updateCommentSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('O comentário não pode estar vazio');
  });
});
