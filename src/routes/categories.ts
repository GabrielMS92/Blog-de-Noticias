import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { categorySchema } from '../schemas/categorySchema.js';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lista todas as categorias com contagem de notícias
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar categorias." });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Busca uma categoria específica e suas notícias
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico da categoria
 *     responses:
 *       200:
 *         description: Categoria retornada com sucesso.
 *       404:
 *         description: Categoria não encontrada.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(req.params.id) },
      include: { posts: true }
    });

    if (!category) {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar a categoria." });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Cria uma nova categoria (Apenas ADMIN)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Concursos e Tecnologia
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso.
 *       400:
 *         description: Erro de validação ou categoria já existente.
 *       403:
 *         description: Acesso restrito.
 */
router.post('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { body } = categorySchema.parse(req);
    const existingCategory = await prisma.category.findUnique({
      where: { name: body.name }
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Já existe uma categoria com este nome." });
    }

    const category = await prisma.category.create({
      data: { name: body.name }
    });

    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.errors || "Erro ao criar categoria." });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Atualiza o nome de uma categoria (Apenas ADMIN)
 *     tags: [Categorias]
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Infraestrutura de Redes
 *     responses:
 *       200:
 *         description: Categoria atualizada.
 *       404:
 *         description: Categoria não encontrada.
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { body } = categorySchema.parse(req);

    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: { name: body.name }
    });

    res.json(category);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }
    res.status(400).json({ error: error.errors || "Erro ao atualizar categoria." });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Exclui uma categoria (Apenas ADMIN)
 *     tags: [Categorias]
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
 *         description: Categoria excluída com sucesso.
 *       404:
 *         description: Categoria não encontrada.
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({
      where: { id: Number(req.params.id) }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }
    res.status(500).json({ error: "Erro ao excluir categoria." });
  }
});

export default router;