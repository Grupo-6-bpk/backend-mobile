#!/usr/bin/env node

/**
 * 🔧 Setup Environment - BPKar Chat Module
 * Configura o ambiente necessário para o módulo de chat
 */

import fs from 'fs/promises';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function createEnvFile() {
  const envContent = `# 🗄️ Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/bpkar_chat_db"

# 🔐 JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-bpkar-2025

# 🌐 Server Configuration  
PORT=3000
NODE_ENV=development

# 📊 Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 🔧 Other Configurations
CORS_ORIGIN=*
LOG_LEVEL=debug`;

  try {
    await fs.writeFile('.env', envContent);
    log(colors.green, '✅ Arquivo .env criado com sucesso!');
    return true;
  } catch (error) {
    log(colors.red, `❌ Erro ao criar .env: ${error.message}`);
    return false;
  }
}

async function checkDatabase() {
  log(colors.blue, '\n🔍 Verificando configuração do banco de dados...');
  
  // Aqui você pode adicionar lógica para verificar conexão com MySQL
  log(colors.yellow, '⚠️  Certifique-se de que o MySQL está rodando em localhost:3306');
  log(colors.yellow, '⚠️  E que existe um usuário "root" com senha "password"');
  log(colors.yellow, '⚠️  Ou altere a DATABASE_URL no arquivo .env');
}

async function runPrismaCommands() {
  log(colors.blue, '\n📋 Comandos Prisma que você deve executar:');
  log(colors.cyan, '1. npx prisma generate');
  log(colors.cyan, '2. npx prisma migrate dev --name init_chat_tables');
  log(colors.cyan, '3. npx prisma db seed (opcional)');
}

async function showNextSteps() {
  log(colors.green, '\n🎯 Próximos Passos:');
  log(colors.reset, '1. Configure o MySQL com as credenciais do .env');
  log(colors.reset, '2. Execute: npx prisma generate');
  log(colors.reset, '3. Execute: npx prisma migrate dev --name init_chat_tables');
  log(colors.reset, '4. Execute: npm start');
  log(colors.reset, '5. Teste: node test-auth.js');
  
  log(colors.yellow, '\n🔗 URLs importantes:');
  log(colors.reset, '   • Swagger UI: http://localhost:3000/api-docs');
  log(colors.reset, '   • API Chat: http://localhost:3000/api/chat/groups');
}

async function main() {
  console.log('\n🚀 === SETUP AMBIENTE - MÓDULO CHAT BPKAR ===\n');
  
  const envCreated = await createEnvFile();
  
  if (envCreated) {
    await checkDatabase();
    await runPrismaCommands();
    await showNextSteps();
    
    log(colors.green, '\n✅ Setup concluído! Siga os próximos passos acima.\n');
  } else {
    log(colors.red, '\n❌ Falha no setup. Verifique as permissões de arquivo.\n');
  }
}

main().catch(console.error); 