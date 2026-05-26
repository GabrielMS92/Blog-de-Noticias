import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { createPostSchema, updatePostSchema } from '../schemas/postSchema.js';

const router = Router();
/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Cria uma nova notícia
 *     tags: [Notícias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Lançamento do novo framework
 *               content:
 *                 type: string
 *                 example: O novo framework promete revolucionar o mercado com sua alta performance.
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Notícia criada com sucesso.
 *       400:
 *         description: Erro de validação.
 *       401:
 *         description: Não autorizado (Token em falta ou inválido).
 */
// POST /posts - Criar notícia
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const body = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        categoryId: body.categoryId,
        authorId: req.user!.id,
      },
    });

    return res.status(201).json(post);
  } catch (error: any) {
    console.error('ERRO (POST /posts):', error);
    return res.status(400).json({
      error: error?.issues || error?.errors || 'Erro ao criar notícia.',
    });
  }
});
/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Lista as notícias ativas com paginação e busca
 *     tags: [Notícias]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página (Padrão 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Quantidade de itens por página (Padrão 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca no título ou conteúdo
 *     responses:
 *       200:
 *         description: Lista de notícias retornada com sucesso.
 */
// GET /posts - Listar notícias ativas com paginação e busca
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search ? String(req.query.search) : undefined;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (search) {
      whereClause.title = {
        contains: search,
      };
    }

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true },
          },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({
        where: whereClause,
      }),
    ]);

    return res.json({
      data: posts,
      meta: {
        total: totalPosts,
        page,
        limit,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error) {
    console.error('ERRO (GET /posts):', error);
    return res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
});
/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Busca uma notícia específica por ID
 *     tags: [Notícias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico da notícia
 *     responses:
 *       200:
 *         description: Notícia retornada com sucesso.
 *       400:
 *         description: ID inválido.
 *       404:
 *         description: Notícia não encontrada ou excluída.
 */
// GET /posts/:id - Buscar uma notícia específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        category: true,
        comments: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Notícia não encontrada.' });
    }

    return res.json(post);
  } catch (error) {
    console.error('ERRO (GET /posts/:id):', error);
    return res.status(500).json({ error: 'Erro ao buscar a notícia.' });
  }
});
/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Atualiza uma notícia (Apenas o autor ou ADMIN)
 *     tags: [Notícias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notícia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Título atualizado da notícia
 *               content:
 *                 type: string
 *                 example: Conteúdo atualizado com mais detalhes.
 *               published:
 *                 type: boolean
 *                 example: true
 *               categoryId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Notícia atualizada com sucesso.
 *       400:
 *         description: Erro de validação ou ID inválido.
 *       403:
 *         description: Sem permissão para editar.
 *       404:
 *         description: Notícia não encontrada.
 */
// PUT /posts/:id - Atualizar notícia
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const body = updatePostSchema.parse(req.body);

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.deletedAt !== null) {
      return res.status(404).json({ error: 'Notícia não encontrada.' });
    }

    if (post.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Você não tem permissão para editar esta notícia.',
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: body,
    });

    return res.json(updatedPost);
  } catch (error: any) {
    console.error('ERRO (PUT /posts/:id):', error);
    return res.status(400).json({
      error: error?.issues || error?.errors || 'Erro ao atualizar notícia.',
    });
  }
});
/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Realiza o soft delete de uma notícia (Apenas o autor ou ADMIN)
 *     tags: [Notícias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notícia
 *     responses:
 *       204:
 *         description: Notícia excluída com sucesso (Soft Delete).
 *       400:
 *         description: ID inválido.
 *       403:
 *         description: Sem permissão para excluir.
 *       404:
 *         description: Notícia não encontrada.
 */
// DELETE /posts/:id - Soft delete
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.deletedAt !== null) {
      return res.status(404).json({ error: 'Notícia não encontrada.' });
    }

    if (post.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Você não tem permissão para apagar esta notícia.',
      });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('ERRO (DELETE /posts/:id):', error);
    return res.status(500).json({ error: 'Erro ao deletar notícia.' });
  }
});

export default router;