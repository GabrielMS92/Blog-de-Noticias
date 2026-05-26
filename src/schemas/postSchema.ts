import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(5, 'O título precisa ter pelo menos 5 caracteres'),
  content: z.string().min(20, 'O conteúdo da notícia é muito curto'),
  categoryId: z.number({
    message: 'A categoria é obrigatória e deve ser um número',
  }).int(),
});

export const updatePostSchema = z.object({
  title: z.string().min(5, 'O título precisa ter pelo menos 5 caracteres').optional(),
  content: z.string().min(20, 'O conteúdo da notícia é muito curto').optional(),
  published: z.boolean().optional(),
  categoryId: z.number().int().optional(),
});