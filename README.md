# Blog de Notícias — API REST

API REST completa desenvolvida com Node.js, TypeScript, Express, Prisma ORM e SQLite.  
Projeto individual da Composição 2 — back-end de um sistema de blog com autenticação JWT, controle de acesso por papéis e testes automatizados.

> **Disciplina:** WEB II — Conceito 2  
> **Professor:** Octávio Lube  
> **Curso:** Análise e Desenvolvimento de Sistemas — FAESA

---

## Domínio escolhido

**Blog / Portal de Notícias** — usuários publicam notícias categorizadas e outros usuários podem comentar.

---

## Entidades

| Entidade   | Descrição                                                                 |
|------------|---------------------------------------------------------------------------|
| `User`     | Usuário do sistema. Pode ter papel `USER` ou `ADMIN`.                     |
| `Post`     | Notícia criada por um usuário, vinculada a uma categoria. Suporta soft delete. |
| `Category` | Categoria de classificação das notícias. Gerenciada apenas por ADMINs.    |
| `Comment`  | Comentário de um usuário em uma notícia.                                  |

---

## Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/GabrielMS92/Blog-de-Noticias
cd api-prisma-express

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com os valores desejados

# 4. Rodar as migrations e criar o banco
npx prisma migrate dev

# 5. Iniciar o servidor em modo desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3000` por padrão.

---

## Rotas disponíveis

### Autenticação

| Método | Rota             | Acesso       | Descrição                          |
|--------|------------------|--------------|------------------------------------|
| POST   | `/auth/register` | Público      | Cria uma nova conta                |
| POST   | `/auth/login`    | Público      | Autentica e retorna JWT            |
| GET    | `/auth/me`       | Autenticado  | Retorna dados do usuário logado    |
| POST   | `/auth/refresh`  | Público      | Renova o token usando refreshToken |

### Usuários

| Método | Rota          | Acesso          | Descrição                  |
|--------|---------------|-----------------|----------------------------|
| GET    | `/users`      | ADMIN           | Lista todos os usuários    |
| GET    | `/users/:id`  | ADMIN           | Busca um usuário pelo ID   |
| PUT    | `/users/:id`  | Dono ou ADMIN   | Atualiza nome/email        |
| DELETE | `/users/:id`  | ADMIN           | Remove um usuário          |

### Categorias

| Método | Rota               | Acesso  | Descrição                          |
|--------|--------------------|---------|------------------------------------|
| GET    | `/categories`      | Público | Lista todas as categorias          |
| GET    | `/categories/:id`  | Público | Busca categoria com suas notícias  |
| POST   | `/categories`      | ADMIN   | Cria uma nova categoria            |
| PUT    | `/categories/:id`  | ADMIN   | Atualiza uma categoria             |
| DELETE | `/categories/:id`  | ADMIN   | Remove uma categoria               |

### Notícias (Posts)

| Método | Rota         | Acesso          | Descrição                   |
|--------|--------------|-----------------|-----------------------------|
| GET    | `/posts`     | Público         | Lista notícias ativas (paginado) |
| GET    | `/posts/:id` | Público         | Busca uma notícia pelo ID   |
| POST   | `/posts`     | Autenticado     | Cria uma nova notícia       |
| PUT    | `/posts/:id` | Dono ou ADMIN   | Atualiza uma notícia        |
| DELETE | `/posts/:id` | Dono ou ADMIN   | Soft delete da notícia      |

> Suporta paginação e busca: `GET /posts?page=1&limit=10&search=termo`

### Comentários

| Método | Rota                      | Acesso          | Descrição                        |
|--------|---------------------------|-----------------|----------------------------------|
| GET    | `/comments/post/:postId`  | Público         | Lista comentários de uma notícia |
| POST   | `/comments`               | Autenticado     | Cria um comentário               |
| PUT    | `/comments/:id`           | Dono            | Edita um comentário              |
| DELETE | `/comments/:id`           | Dono ou ADMIN   | Remove um comentário             |

---

## Exemplos de requisições

Os exemplos usam `Invoke-WebRequest` (PowerShell). A flag `-UseBasicParsing` é utilizada para evitar avisos de segurança no console. Para as rotas protegidas, usa os valores das variáveis `$Token`, `$TokenAdmin`, `$RefreshToken` e `$RefreshTokenAdmin`.

---

### Passo 0 — Registrar usuário comum

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body '{"name":"Joao Silva","email":"joao@email.com","password":"senha123"}' `
  -UseBasicParsing
```

---

### Passo 1 — Registrar administrador

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body '{"name":"Admin","email":"admin@email.com","password":"senha123","role":"ADMIN"}' `
  -UseBasicParsing
```

---

### Passo 2 — Login do usuário comum (salva Token e RefreshToken)

```powershell
$loginUser = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"joao@email.com","password":"senha123"}' `
  -UseBasicParsing | ConvertFrom-Json

$Token        = $loginUser.token
$RefreshToken = $loginUser.refreshToken
```

---

### Passo 3 — Login do administrador (salva TokenAdmin e RefreshTokenAdmin)

```powershell
$loginAdmin = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@email.com","password":"senha123"}' `
  -UseBasicParsing | ConvertFrom-Json

$TokenAdmin        = $loginAdmin.token
$RefreshTokenAdmin = $loginAdmin.refreshToken
```

---

### 4. Ver perfil autenticado

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/me" `
  -Headers @{Authorization="Bearer $Token"} `
  -UseBasicParsing
```

---

### 5. Renovar token do usuário comum

```powershell
$Body = @{ refreshToken = $RefreshToken } | ConvertTo-Json -Compress
Invoke-WebRequest -Uri "http://localhost:3000/auth/refresh" `
  -Method POST -ContentType "application/json" `
  -Body $Body `
  -UseBasicParsing
```

---

### 6. Renovar token do administrador

```powershell
$Body = @{ refreshToken = $RefreshTokenAdmin } | ConvertTo-Json -Compress
Invoke-WebRequest -Uri "http://localhost:3000/auth/refresh" `
  -Method POST -ContentType "application/json" `
  -Body $Body `
  -UseBasicParsing
```

---

### 7. Listar todos os usuários (ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/users" `
  -Headers @{Authorization="Bearer $TokenAdmin"} `
  -UseBasicParsing
```

---

### 8. Buscar usuário por ID (ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/users/1" `
  -Headers @{Authorization="Bearer $TokenAdmin"} `
  -UseBasicParsing
```

---

### 9. Atualizar próprio usuário (dono ou ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/users/1" `
  -Method PUT -ContentType "application/json" `
  -Headers @{Authorization="Bearer $Token"} `
  -Body '{"name":"Joao Atualizado","email":"joao.novo@email.com"}' `
  -UseBasicParsing
```

---

### 10. Deletar usuário (ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/users/2" `
  -Method DELETE `
  -Headers @{Authorization="Bearer $TokenAdmin"} `
  -UseBasicParsing
```

---

### 11. Listar todas as categorias (público)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/categories" `
  -UseBasicParsing
```

---

### 12. Buscar categoria por ID (público)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/categories/1" `
  -UseBasicParsing
```

---

### 13. Criar categoria (ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/categories" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $TokenAdmin"} `
  -Body '{"name":"Tecnologia"}' `
  -UseBasicParsing
```

---

### 14. Atualizar categoria (ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/categories/1" `
  -Method PUT -ContentType "application/json" `
  -Headers @{Authorization="Bearer $TokenAdmin"} `
  -Body '{"name":"Tecnologia e Inovacao"}' `
  -UseBasicParsing
```

---

### 15. Deletar categoria (ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/categories/1" `
  -Method DELETE `
  -Headers @{Authorization="Bearer $TokenAdmin"} `
  -UseBasicParsing
```

---

### 16. Listar notícias com paginação (público)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/posts?page=1&limit=10" `
  -UseBasicParsing
```

---

### 17. Listar notícias com busca por termo (público)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/posts?page=1&limit=5&search=noticia" `
  -UseBasicParsing
```

---

### 18. Buscar notícia por ID (público)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/posts/1" `
  -UseBasicParsing
```

---

### 19. Criar notícia (autenticado)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/posts" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $Token"} `
  -Body '{"title":"Minha primeira noticia","content":"Conteudo completo da noticia aqui.","categoryId":1}' `
  -UseBasicParsing
```

---

### 20. Atualizar notícia (dono ou ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/posts/1" `
  -Method PUT -ContentType "application/json" `
  -Headers @{Authorization="Bearer $Token"} `
  -Body '{"title":"Titulo atualizado","content":"Conteudo atualizado com mais detalhes.","categoryId":1}' `
  -UseBasicParsing
```

---

### 21. Deletar notícia — soft delete (dono ou ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/posts/1" `
  -Method DELETE `
  -Headers @{Authorization="Bearer $Token"} `
  -UseBasicParsing
```

---

### 22. Listar comentários de uma notícia (público)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/comments/post/1" `
  -UseBasicParsing
```

---

### 23. Criar comentário (autenticado)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/comments" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $Token"} `
  -Body '{"text":"Excelente artigo! Muito informativo.","postId":1}' `
  -UseBasicParsing
```

---

### 24. Atualizar comentário (apenas o autor)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/comments/1" `
  -Method PUT -ContentType "application/json" `
  -Headers @{Authorization="Bearer $Token"} `
  -Body '{"text":"Comentario atualizado com mais contexto."}' `
  -UseBasicParsing
```

---

### 25. Deletar comentário (autor ou ADMIN)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/comments/1" `
  -Method DELETE `
  -Headers @{Authorization="Bearer $Token"} `
  -UseBasicParsing
```

---

## Rodando os testes

```bash
# Rodar todos os testes
npm test

# Rodar com relatório de cobertura
npm run test:coverage
```

> **Banco isolado:** os testes rodam em `prisma/test.db`, completamente separado do `dev.db` de desenvolvimento. O `tests/globalSetup.ts` aplica as migrations automaticamente antes da suíte iniciar — não é necessário nenhum passo manual.

### Estrutura dos testes

```
tests/
├── globalSetup.ts          # Aplica migrations no test.db (roda 1 vez)
├── setup.ts                # Desconecta o Prisma após cada arquivo
├── unit/
│   ├── auth.test.ts        # Hash, JWT (5 testes)
│   └── schemas.test.ts     # Schemas Zod válidos e inválidos (28 testes)
└── integration/
    ├── auth.test.ts        # Register, login, refresh, /me
    ├── categories.test.ts  # CRUD + controle de acesso ADMIN
    ├── posts.test.ts       # CRUD + soft delete + paginação
    ├── users.test.ts       # Listagem ADMIN + ownership
    └── comments.test.ts    # CRUD + ownership
```

> Cobertura mínima exigida: **70% de linhas e funções**

---

## Variáveis de ambiente

Veja o arquivo `.env.example` na raiz do projeto.

---

## Tecnologias utilizadas

| Categoria       | Tecnologia                              |
|-----------------|-----------------------------------------|
| Runtime         | Node.js 20+ com TypeScript (ES Modules) |
| Framework       | Express.js                              |
| ORM             | Prisma com adapter `better-sqlite3`     |
| Banco de dados  | SQLite                                  |
| Autenticação    | JWT (`jsonwebtoken`) + `bcrypt`         |
| Validação       | Zod                                     |
| Testes          | Vitest + Supertest                      |
