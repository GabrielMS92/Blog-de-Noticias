import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: "O nome deve ter no mínimo 2 caracteres" }),
    email: z.string().email({ message: "Formato de e-mail inválido" }),
    password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Formato de e-mail inválido" }),
    password: z.string().min(1, { message: "A senha é obrigatória" }),
  }),

});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: "O Refresh Token é obrigatório" }),
  }),
});