Markdown
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

O servidor sobe em http://localhost:3000 por padrão.
Rotas disponíveis
Autenticação
Método
Rota
Acesso
Descrição
POST
/auth/register
Público
Cria uma nova conta
POST
/auth/login
Público
Autentica e retorna JWT
GET
/auth/me
Autenticado
Retorna dados do usuário logado
Usuários
Método
Rota
Acesso
Descrição
GET
/users
ADMIN
Lista todos os usuários
GET
/users/:id
ADMIN
Busca um usuário pelo ID
PUT
/users/:id
Dono ou ADMIN
Atualiza nome/email
DELETE
/users/:id
ADMIN
Remove um usuário
Categorias
Método
Rota
Acesso
Descrição
GET
/categories
Público
Lista todas as categorias
GET
/categories/:id
Público
Busca categoria com suas notícias
POST
/categories
ADMIN
Cria uma nova categoria
PUT
/categories/:id
ADMIN
Atualiza uma categoria
DELETE
/categories/:id
ADMIN
Remove uma categoria
Notícias (Posts)
Método
Rota
Acesso
Descrição
GET
/posts
Público
Lista notícias ativas (paginado)
GET
/posts/:id
Público
Busca uma notícia pelo ID
POST
/posts
Autenticado
Cria uma nova notícia
PUT
/posts/:id
Dono ou ADMIN
Atualiza uma notícia
DELETE
/posts/:id
Dono ou ADMIN
Soft delete da notícia
Suporta paginação e busca: GET /posts?page=1&limit=10&search=termo
Comentários
Método
Rota
Acesso
Descrição
GET
/comments/post/:postId
Público
Lista comentários de uma notícia
POST
/comments
Autenticado
Cria um comentário
PUT
/comments/:id
Dono
Edita um comentário
DELETE
/comments/:id
Dono ou ADMIN
Remove um comentário
Exemplos de requisições
Os exemplos usam Invoke-WebRequest (PowerShell). A flag -UseBasicParsing é utilizada para evitar avisos de segurança no console. Para as rotas protegidas, substitua o valor das variáveis $Token, $TokenAdmin ou $RefreshToken pelos tokens reais retornados no login.
1. Registrar usuário comum
PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/auth/register" -Method POST -ContentType "application/json" -Body '{"name":"Joao Silva","email":"joao@email.com","password":"senha123"}' -UseBasicParsing

2. Registrar administrador
O campo role aceita "ADMIN" diretamente no registro:
PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/auth/register" -Method POST -ContentType "application/json" -Body '{"name":"Admin","email":"admin@email.com","password":"senha123","role":"ADMIN"}' -UseBasicParsing

3. Fazer login
PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"joao@email.com","password":"senha123"}' -UseBasicParsing

A resposta retorna token (válido por 15 min) e refreshToken. Copie esses valores para usar nos passos seguintes.
4. Ver perfil autenticado
PowerShell
$Token = "COLE_SEU_TOKEN_AQUI"
Invoke-WebRequest -Uri "http://localhost:3000/auth/me" -Headers @{Authorization="Bearer $Token"} -UseBasicParsing

5. Criar categoria (requer token de ADMIN)
PowerShell
$TokenAdmin = "COLE_SEU_TOKEN_ADMIN_AQUI"
Invoke-WebRequest -Uri "http://localhost:3000/categories" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $TokenAdmin"} -Body '{"name":"Tecnologia"}' -UseBasicParsing

6. Criar notícia (requer token de usuário autenticado)
Use o id da categoria criada no passo anterior em categoryId:
PowerShell
$Token = "COLE_SEU_TOKEN_AQUI"
Invoke-WebRequest -Uri "http://localhost:3000/posts" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $Token"} -Body '{"title":"Minha primeira noticia","content":"Conteudo completo da noticia aqui.","categoryId":1}' -UseBasicParsing

7. Listar notícias com paginação
PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/posts?page=1&limit=5&search=noticia" -UseBasicParsing

8. Renovar token expirado
PowerShell
$RefreshToken = "COLE_SEU_REFRESH_TOKEN_AQUI"
$Body = @{ refreshToken = $RefreshToken } | ConvertTo-Json -Compress
Invoke-WebRequest -Uri "http://localhost:3000/auth/refresh" -Method POST -ContentType "application/json" -Body $Body -UseBasicParsing

Rodando os testes
Bash
# Rodar todos os testes
npm test

# Rodar com relatório de cobertura
npm run test:coverage

Banco isolado: os testes rodam em prisma/test.db, completamente separado do dev.db de desenvolvimento. O tests/globalSetup.ts aplica as migrations automaticamente antes da suíte iniciar — não é necessário nenhum passo manual.
Estrutura dos testes
Plaintext
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

Cobertura mínima exigida: 70% de linhas e funções
Variáveis de ambiente
Veja o arquivo .env.example na raiz do projeto.
Tecnologias utilizadas
Runtime: Node.js 20+ com TypeScript (ES Modules)
Framework: Express.js
ORM: Prisma com adapter better-sqlite3
Banco de dados: SQLite
Autenticação: JWT (jsonwebtoken) + bcrypt
Validação: Zod
Testes: Vitest + Supertest ; manda um .md pra mim tem como?
