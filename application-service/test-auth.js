#!/usr/bin/env node

/**
 * 🧪 Script de Teste - Autenticação Chat BPKar
 * Testa se a autenticação está funcionando corretamente
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'test-jwt-token-for-swagger-testing';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', body = null, useAuth = true) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (useAuth) {
      headers['Authorization'] = `Bearer ${TEST_TOKEN}`;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('\n🚀 === TESTE DE AUTENTICAÇÃO - MÓDULO CHAT ===\n');

  // Teste 1: Endpoint sem token
  log(colors.blue, '📋 Teste 1: Acesso sem token (deve falhar)');
  const test1 = await testEndpoint('/api/chat/groups', 'GET', null, false);
  if (test1.status === 401) {
    log(colors.green, '✅ PASSOU - Rejeitou acesso sem token');
  } else {
    log(colors.red, `❌ FALHOU - Status: ${test1.status}, deveria ser 401`);
  }

  // Teste 2: Endpoint com token válido
  log(colors.blue, '\n📋 Teste 2: Acesso com token de teste (deve passar)');
  const test2 = await testEndpoint('/api/chat/groups', 'GET', null, true);
  if (test2.success) {
    log(colors.green, '✅ PASSOU - Aceitou token de teste');
  } else {
    log(colors.red, `❌ FALHOU - Status: ${test2.status}, Erro: ${JSON.stringify(test2.data)}`);
  }

  // Teste 3: Criar grupo com token
  log(colors.blue, '\n📋 Teste 3: Criar grupo de chat');
  const groupData = {
    name: 'Grupo Teste Automatizado',
    description: 'Criado pelo script de teste',
    type: 'group',
    memberIds: [2, 3]
  };
  const test3 = await testEndpoint('/api/chat/groups', 'POST', groupData, true);
  if (test3.success) {
    log(colors.green, '✅ PASSOU - Grupo criado com sucesso');
    console.log(`   🆔 Group ID: ${test3.data.data?.id}`);
  } else {
    log(colors.red, `❌ FALHOU - Status: ${test3.status}, Erro: ${JSON.stringify(test3.data)}`);
  }

  // Teste 4: Buscar usuários
  log(colors.blue, '\n📋 Teste 4: Buscar usuários');
  const test4 = await testEndpoint('/api/chat/users/search?q=teste&limit=5', 'GET', null, true);
  if (test4.success) {
    log(colors.green, '✅ PASSOU - Busca de usuários funcionando');
  } else {
    log(colors.red, `❌ FALHOU - Status: ${test4.status}, Erro: ${JSON.stringify(test4.data)}`);
  }

  // Teste 5: Token inválido
  log(colors.blue, '\n📋 Teste 5: Token inválido (deve falhar)');
  const invalidResponse = await fetch(`${BASE_URL}/api/chat/groups`, {
    headers: {
      'Authorization': 'Bearer token-invalido-123'
    }
  });
  const test5Data = await invalidResponse.json();
  if (invalidResponse.status === 401) {
    log(colors.green, '✅ PASSOU - Rejeitou token inválido');
  } else {
    log(colors.red, `❌ FALHOU - Status: ${invalidResponse.status}, deveria ser 401`);
  }

  // Resumo
  log(colors.yellow, '\n📊 === RESUMO DOS TESTES ===');
  log(colors.yellow, '🔗 URLs de teste:');
  log(colors.reset, `   • Swagger UI: ${BASE_URL}/api-docs`);
  log(colors.reset, `   • Chat Groups: ${BASE_URL}/api/chat/groups`);
  log(colors.reset, `   • WebSocket: ws://localhost:3000/socket.io`);
  
  log(colors.yellow, '\n🔐 Token para testes manuais:');
  log(colors.reset, `   Bearer ${TEST_TOKEN}`);

  console.log('\n✅ Testes concluídos! Verifique os resultados acima.\n');
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api-docs`);
    if (response.ok) {
      log(colors.green, '✅ Servidor está rodando!');
      return true;
    }
  } catch (error) {
    log(colors.red, '❌ Servidor não está rodando. Execute: npm start');
    log(colors.yellow, '💡 Ou execute: node src/server.js');
    return false;
  }
}

// Executar testes
checkServer().then(serverRunning => {
  if (serverRunning) {
    runTests();
  }
}); 