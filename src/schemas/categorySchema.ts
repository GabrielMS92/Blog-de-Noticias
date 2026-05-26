import { z } from 'zod';

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(3, { message: "O nome da categoria deve ter no mínimo 3 caracteres" }),
  }),
});