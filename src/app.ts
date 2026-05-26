import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';

const app = express();

// Middleware para descodificar JSON
app.use(express.json());

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Blog de Notícias',
      version: '1.0.0',
      description: 'Documentação da API REST construída para a avaliação da C2.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Aplica o botão de "Authorize" globalmente no Swagger
    security: [{ bearerAuth: [] }],
  },
  // O Swagger vai procurar a documentação nos comentários destes ficheiros
  apis: ['./src/routes/*.ts'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Rota extra exigida pelo edital para exibir a documentação
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Acoplamento das rotas da API
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);

export { app };