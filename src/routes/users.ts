import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários (Apenas ADMIN)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários.
 *       403:
 *         description: Acesso restrito a administradores.
 */
router.get('/', authenticate, authorize('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Retorna um usuário específico (Apenas ADMIN)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do usuário.
 *       404:
 *         description: Usuário não encontrado.
 */
router.get('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza dados do usuário (Apenas o próprio usuário ou ADMIN)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Novo Nome
 *               email:
 *                 type: string
 *                 example: novoemail@teste.com
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
 *       403:
 *         description: Sem permissão para editar.
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const targetId = Number(req.params.id);

    if (req.user!.id !== targetId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Você não tem permissão para editar este usuário.' });
    }

    const data = updateUserSchema.partial().parse(req.body);

    const user = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error?.issues || 'Erro ao atualizar usuário.' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove um usuário (Apenas ADMIN)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuário removido com sucesso.
 *       404:
 *         description: Usuário não encontrado.
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const targetId = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await prisma.user.delete({ where: { id: targetId } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
});

export default router;