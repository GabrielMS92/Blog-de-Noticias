import { Request, Response, NextFunction } from 'express';

// Esta função recebe o papel (ex: 'ADMIN') e retorna o middleware propriamente dito
export function authorize(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica se o usuário existe na requisição (o authenticate deve rodar antes!)
    if (!req.user) {
      return res.status(401).json({ error: "Acesso negado. Usuário não autenticado." });
    }

    // Verifica se a role do usuário logado é igual a role exigida
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: `Acesso restrito. É necessário ter perfil de ${requiredRole}.` });
    }

    // Se tudo estiver certo, passa para o próximo passo (a rota final)
    next();
  };
}