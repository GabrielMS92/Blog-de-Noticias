import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { createCommentSchema, updateCommentSchema } from '../schemas/commentSchema.js';

const router = Router();
/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Cria um comentário numa notícia
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - postId
 *             properties:
 *               text:
 *                 type: string
 *                 example: Excelente artigo! Muito informativo.
 *               postId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Comentário criado com sucesso.
 *       400:
 *         description: Erro de validação.
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Notícia não encontrada.
 */
// POST /comments - Criar comentário em uma notícia
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const body = createCommentSchema.parse(req.body);

    const post = await prisma.post.findFirst({
      where: {
        id: body.postId,
        deletedAt: null,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Notícia não encontrada.' });
    }

    const comment = await prisma.comment.create({
      data: {
        text: body.text,
        postId: body.postId,
        authorId: req.user!.id,
      },
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    return res.status(201).json(comment);
  } catch (error: any) {
    console.error('ERRO FATAL (POST COMMENT):', error);
    return res.status(400).json({
      error: error?.issues || error?.errors || 'Erro ao criar comentário.',
    });
  }
});
/**
 * @swagger
 * /comments/post/{postId}:
 *   get:
 *     summary: Lista os comentários de uma notícia
 *     tags: [Comentários]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico da notícia
 *     responses:
 *       200:
 *         description: Lista de comentários retornada com sucesso.
 *       400:
 *         description: ID da notícia inválido.
 *       404:
 *         description: Notícia não encontrada.
 */
// GET /comments/post/:postId - Listar comentários de uma notícia
router.get('/post/:postId', async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: 'ID da notícia inválido.' });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(comments);
  } catch (error) {
    console.error('ERRO (GET /comments/post/:postId):', error);
    return res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});
/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Atualiza um comentário (Apenas o autor)
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do comentário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Atualizando o meu comentário anterior para adicionar mais contexto.
 *     responses:
 *       200:
 *         description: Comentário atualizado.
 *       400:
 *         description: Erro de validação ou ID inválido.
 *       403:
 *         description: Sem permissão para editar (apenas o autor pode).
 *       404:
 *         description: Comentário não encontrado.
 */
// PUT /comments/:id - Atualizar comentário
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const commentId = Number(req.params.id);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ error: 'ID do comentário inválido.' });
    }

    const body = updateCommentSchema.parse(req.body);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    if (comment.authorId !== req.user!.id) {
      return res.status(403).json({
        error: 'Você só pode editar seus próprios comentários.',
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { text: body.text },
    });

    return res.json(updatedComment);
  } catch (error: any) {
    console.error('ERRO FATAL (PUT COMMENT):', error);
    return res.status(400).json({
      error: error?.issues || error?.errors || 'Erro ao atualizar comentário.',
    });
  }
});
/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Remove um comentário (Apenas o autor ou ADMIN)
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do comentário
 *     responses:
 *       204:
 *         description: Comentário excluído com sucesso.
 *       400:
 *         description: ID inválido.
 *       403:
 *         description: Sem permissão para excluir.
 *       404:
 *         description: Comentário não encontrado.
 */
// DELETE /comments/:id - Apagar comentário
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const commentId = Number(req.params.id);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ error: 'ID do comentário inválido.' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    if (comment.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Você não tem permissão para apagar este comentário.',
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error('ERRO FATAL (DELETE COMMENT):', error);
    return res.status(500).json({ error: 'Erro ao deletar comentário.' });
  }
});

export default router;