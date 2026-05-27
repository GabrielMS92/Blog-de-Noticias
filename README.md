# Blog-de-Noticias
Criado em razão da matéria WEB II, Conceito 2, do professor Octávio Lube no curso de ADS da Faesa. 

# API REST — Blog de Notícias

API REST completa desenvolvida com Node.js, TypeScript, Express, Prisma ORM e SQLite. Projeto individual da Composição 2 — back-end de um sistema de blog com autenticação JWT, controle de acesso por papéis e testes automatizados.

---

## Domínio escolhido

**Blog / Portal de Notícias** — usuários publicam notícias categorizadas e outros usuários podem comentar.

## Entidades

| Entidade | Descrição |
|---|---|
| `User` | Usuário do sistema. Pode ter papel `USER` ou `ADMIN`. |
| `Post` | Notícia criada por um usuário, vinculada a uma categoria. Suporta soft delete. |
| `Category` | Categoria de classificação das notícias. Gerenciada apenas por ADMINs. |
| `Comment` | Comentário de um usuário em uma notícia. |

---

## Instalação

```bash
# 1. Clonar o repositório
git clone <[url-do-repositório](https://github.com/GabrielMS92/Blog-de-Noticias)>
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

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Cria uma nova conta |
| POST | `/auth/login` | Público | Autentica e retorna JWT |
| GET | `/auth/me` | Autenticado | Retorna dados do usuário logado |

### Usuários

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/users` | ADMIN | Lista todos os usuários |
| GET | `/users/:id` | ADMIN | Busca um usuário pelo ID |
| PUT | `/users/:id` | Dono ou ADMIN | Atualiza nome/email |
| DELETE | `/users/:id` | ADMIN | Remove um usuário |

### Categorias

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/categories` | Público | Lista todas as categorias |
| GET | `/categories/:id` | Público | Busca categoria com suas notícias |
| POST | `/categories` | ADMIN | Cria uma nova categoria |
| PUT | `/categories/:id` | ADMIN | Atualiza uma categoria |
| DELETE | `/categories/:id` | ADMIN | Remove uma categoria |

### Notícias (Posts)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/posts` | Público | Lista notícias ativas (paginado) |
| GET | `/posts/:id` | Público | Busca uma notícia pelo ID |
| POST | `/posts` | Autenticado | Cria uma nova notícia |
| PUT | `/posts/:id` | Dono ou ADMIN | Atualiza uma notícia |
| DELETE | `/posts/:id` | Dono ou ADMIN | Soft delete da notícia |

> Suporta paginação e busca: `GET /posts?page=1&limit=10&search=termo`

### Comentários

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/comments/post/:postId` | Público | Lista comentários de uma notícia |
| POST | `/comments` | Autenticado | Cria um comentário |
| PUT | `/comments/:id` | Dono | Edita um comentário |
| DELETE | `/comments/:id` | Dono ou ADMIN | Remove um comentário |

---

## Exemplos de requisições

### Registrar usuário
```powershell
curl.exe -X POST http://localhost:3000/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\": \"João Silva\", \"email\": \"joao@email.com\", \"password\": \"senha123\"}'
```

### Fazer login
```powershell
curl.exe -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"joao@email.com\", \"password\": \"senha123\"}'
```

### Ver perfil autenticado
```powershell
curl.exe http://localhost:3000/auth/me `
  -H "Authorization: Bearer <seu_token>"
```

### Criar notícia
```powershell
curl.exe -X POST http://localhost:3000/posts `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <seu_token>" `
  -d '{\"title\": \"Minha primeira notícia\", \"content\": \"Conteúdo completo da notícia aqui.\", \"categoryId\": 1}'
```

### Listar notícias com paginação
```powershell
curl.exe "http://localhost:3000/posts?page=1&limit=5&search=api"
```

### Criar categoria (ADMIN)
```powershell
curl.exe -X POST http://localhost:3000/categories `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token_admin>" `
  -d '{\"name\": \"Tecnologia\"}'
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
├── globalSetup.ts        # Aplica migrations no test.db (roda 1 vez)
├── setup.ts              # Desconecta o Prisma após cada arquivo
├── unit/
│   ├── auth.test.ts      # Hash, JWT (5 testes)
│   └── schemas.test.ts   # Schemas Zod válidos e inválidos (28 testes)
└── integration/
    ├── auth.test.ts      # Register, login, refresh, /me
    ├── categories.test.ts # CRUD + controle de acesso ADMIN
    ├── posts.test.ts     # CRUD + soft delete + paginação
    ├── users.test.ts     # Listagem ADMIN + ownership
    └── comments.test.ts  # CRUD + ownership
```

### Cobertura mínima exigida: 70% de linhas e funções

---

## Variáveis de ambiente

Veja o arquivo `.env.example` na raiz do projeto.

---

## Tecnologias utilizadas

- **Runtime:** Node.js 20+ com TypeScript (ES Modules)
- **Framework:** Express.js
- **ORM:** Prisma com adapter `better-sqlite3`
- **Banco de dados:** SQLite
- **Autenticação:** JWT (`jsonwebtoken`) + `bcrypt`
- **Validação:** Zod
- **Testes:** Vitest + Supertest
