import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    sequence: {
      shuffle: false,
    },
    // Garante que as migrações rodam UMA vez antes de qualquer teste
    globalSetup: ['./tests/globalSetup.ts'],
    // Roda antes de cada arquivo de teste (desconexão do Prisma)
    setupFiles: ['./tests/setup.ts'],
    // Banco e segredos exclusivos para o ambiente de testes
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'jwt_secret_exclusivo_para_testes',
      JWT_REFRESH_SECRET: 'jwt_refresh_secret_exclusivo_para_testes',
    },
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/prisma.config.ts'],
    },
  },
});