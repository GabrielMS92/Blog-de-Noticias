import { afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

/**
 * Roda após cada arquivo de teste.
 * Fecha a conexão com o banco para evitar "open handles" no Vitest.
 */
afterAll(async () => {
  await prisma.$disconnect();
});
