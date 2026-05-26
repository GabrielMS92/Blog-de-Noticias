import { z } from 'zod';

export const createCommentSchema = z.object({
  text: z.string().min(1, { message: 'O comentário não pode estar vazio' }),
  postId: z.number({ message: 'O ID da notícia é obrigatório' }).int(),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1, { message: 'O comentário não pode estar vazio' }),
});