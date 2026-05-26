import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken, signRefreshToken, verifyRefreshToken } from '../lib/auth.js';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/authSchema.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               password:
 *                 type: string
 *                 example: senha123
 *               role:
 *                 type: string
 *                 example: USER
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 *       400:
 *         description: Erro de validação ou E-mail já cadastrado.
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { body } = registerSchema.parse(req);
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });

    if (existingUser) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const hashedPassword = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, password: hashedPassword, role: body.role || 'USER' },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message || 'Erro ao registrar usuário.' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário e gera tokens
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login bem-sucedido. Retorna o access token e o refresh token.
 *       401:
 *         description: Credenciais inválidas.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { body } = loginSchema.parse(req);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user || !(await verifyPassword(body.password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = signToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(200).json({ token, refreshToken });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || 'Erro ao fazer login.' });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Gera um novo token de acesso usando o refresh token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Novo token de acesso gerado.
 *       401:
 *         description: Refresh token expirado ou inválido.
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { body } = refreshSchema.parse(req);
    const decoded = verifyRefreshToken(body.refreshToken) as { id: number };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== body.refreshToken) {
      return res.status(403).json({ error: 'Refresh token revogado ou inválido.' });
    }

    const newToken = signToken({ id: user.id, role: user.role });
    res.status(200).json({ token: newToken });
  } catch (error: any) {
    res.status(401).json({ error: 'Refresh token expirado ou inválido.' });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso.
 *       401:
 *         description: Token não fornecido ou inválido.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
  }
});

export default router;