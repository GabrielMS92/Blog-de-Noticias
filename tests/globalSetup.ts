import { execSync } from 'child_process';

/**
 * Roda UMA VEZ antes de toda a suíte de testes.
 * Aplica as migrations pendentes no banco de testes isolado (test.db).
 * O 'migrate deploy' é idempotente — seguro de chamar mesmo se já estiver atualizado.
 */
export default function globalSetup() {
  console.log('\n🗄️  Aplicando migrations no banco de testes (test.db)...');

  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: 'file:./prisma/test.db',
    },
    stdio: 'inherit',
  });

  console.log('✅ Banco de testes pronto.\n');
}
