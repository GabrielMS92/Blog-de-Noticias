import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth.js';

// Truque do TypeScript: Ensinamos ao Express que a requisição agora pode carregar um "user"
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Pega o token do cabeçalho da requisição (padrão: "Bearer <token>")
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' }); // Requisito do projeto: status code 401 [cite: 121]
  }

  const token = authHeader.split(' ')[1];

  try {
    // Decodifica o token e joga os dados (id e role) para dentro do req.user
    const decoded = verifyToken(token) as { id: number; role: string };
    req.user = decoded;
    
    next(); // Passa a bola para a rota principal
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}