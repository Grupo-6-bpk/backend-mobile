import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

/**
 * Script de teste para WebSocket do BPKar Chat
 * Execute com: node src/infrastructure/websocket/test/websocket-test.js
 */

// Configurações
const SERVER_URL = 'ws://localhost:4040';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simular dois usuários
const users = [
  { id: 1, name: 'João', email: 'joao@test.com' },
  { id: 2, name: 'Maria', email: 'maria@test.com' }
];

// Gerar tokens JWT para teste
const tokens = users.map(user => 
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
);

let user1Socket, user2Socket;
let testGroupId = 1; // Assumindo que existe um grupo com ID 1

async function runTests() {
  console.log('🧪 Iniciando testes do WebSocket...\n');

  try {
    // Teste 1: Conectar usuários
    await testConnection();
    
    // Teste 2: Entrar em grupo
    await testJoinGroup();
    
    // Teste 3: Enviar mensagens
    await testSendMessage();
    
    // Teste 4: Indicadores de digitação
    await testTypingIndicators();
    
    // Teste 5: Status de presença
    await testPresenceStatus();
    
    // Teste 6: Edição e exclusão de mensagens
    await testMessageActions();
    
    // Teste 7: Desconexão
    await testDisconnection();

    console.log('\n✅ Todos os testes concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    // Cleanup
    if (user1Socket) user1Socket.disconnect();
    if (user2Socket) user2Socket.disconnect();
    process.exit(0);
  }
}

function testConnection() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testando conexão...');
    
    let connectedCount = 0;
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout na conexão'));
    }, 10000);

    // Conectar usuário 1
    user1Socket = io(SERVER_URL, {
      auth: { token: tokens[0] },
      transports: ['websocket']
    });

    user1Socket.on('connect', () => {
      console.log(`✅ Usuário 1 (${users[0].name}) conectado`);
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeoutId);
        resolve();
      }
    });

    user1Socket.on('connected', (data) => {
      console.log(`📩 Usuário 1 recebeu confirmação:`, data.message);
    });

    user1Socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão usuário 1:', error.message);
      clearTimeout(timeoutId);
      reject(error);
    });

    // Conectar usuário 2
    user2Socket = io(SERVER_URL, {
      auth: { token: tokens[1] },
      transports: ['websocket']
    });

    user2Socket.on('connect', () => {
      console.log(`✅ Usuário 2 (${users[1].name}) conectado`);
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeoutId);
        resolve();
      }
    });

    user2Socket.on('connected', (data) => {
      console.log(`📩 Usuário 2 recebeu confirmação:`, data.message);
    });

    user2Socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão usuário 2:', error.message);
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

function testJoinGroup() {
  return new Promise((resolve, reject) => {
    console.log('\n🚪 Testando entrada em grupo...');
    
    let joinedCount = 0;
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout ao entrar no grupo'));
    }, 5000);

    const handleJoinSuccess = (socketName) => {
      return (response) => {
        if (response.success) {
          console.log(`✅ ${socketName} entrou no grupo com sucesso`);
          joinedCount++;
          if (joinedCount === 2) {
            clearTimeout(timeoutId);
            resolve();
          }
        } else {
          clearTimeout(timeoutId);
          reject(new Error(`Erro ao entrar no grupo: ${response.error}`));
        }
      };
    };

    // Usuário 1 entra no grupo
    user1Socket.emit('join_group', { groupId: testGroupId }, handleJoinSuccess('Usuário 1'));
    
    // Usuário 2 entra no grupo
    user2Socket.emit('join_group', { groupId: testGroupId }, handleJoinSuccess('Usuário 2'));

    // Listener para notificação de entrada
    user1Socket.on('user_joined_group', (data) => {
      console.log(`📩 Usuário 1 notificado: ${data.userName} entrou no grupo`);
    });

    user2Socket.on('user_joined_group', (data) => {
      console.log(`📩 Usuário 2 notificado: ${data.userName} entrou no grupo`);
    });
  });
}

function testSendMessage() {
  return new Promise((resolve, reject) => {
    console.log('\n💬 Testando envio de mensagens...');
    
    let messagesReceived = 0;
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout ao enviar mensagens'));
    }, 10000);

    // Usuário 2 escuta mensagens
    user2Socket.on('new_message', (data) => {
      console.log(`📩 Usuário 2 recebeu mensagem: "${data.content}" de ${data.senderName}`);
      messagesReceived++;
      
      if (messagesReceived === 2) {
        clearTimeout(timeoutId);
        resolve();
      }
    });

    // Usuário 1 escuta mensagens
    user1Socket.on('new_message', (data) => {
      console.log(`📩 Usuário 1 recebeu mensagem: "${data.content}" de ${data.senderName}`);
      messagesReceived++;
      
      if (messagesReceived === 2) {
        clearTimeout(timeoutId);
        resolve();
      }
    });

    // Enviar mensagem do usuário 1
    setTimeout(() => {
      user1Socket.emit('send_message', {
        groupId: testGroupId,
        content: 'Olá! Esta é uma mensagem de teste do João.',
        type: 'text',
        tempId: 'test-msg-1'
      }, (response) => {
        if (response.success) {
          console.log('✅ Usuário 1 enviou mensagem com sucesso');
        } else {
          console.error('❌ Erro ao enviar mensagem usuário 1:', response.error);
        }
      });
    }, 500);

    // Enviar mensagem do usuário 2
    setTimeout(() => {
      user2Socket.emit('send_message', {
        groupId: testGroupId,
        content: 'Oi João! Recebi sua mensagem. Esta é uma resposta da Maria.',
        type: 'text',
        tempId: 'test-msg-2'
      }, (response) => {
        if (response.success) {
          console.log('✅ Usuário 2 enviou mensagem com sucesso');
        } else {
          console.error('❌ Erro ao enviar mensagem usuário 2:', response.error);
        }
      });
    }, 1500);
  });
}

function testTypingIndicators() {
  return new Promise((resolve) => {
    console.log('\n⌨️ Testando indicadores de digitação...');
    
    // Usuário 2 escuta indicadores de digitação
    user2Socket.on('user_typing', (data) => {
      console.log(`📩 Usuário 2 notificado: ${data.userName} está digitando...`);
    });

    user2Socket.on('user_stopped_typing', (data) => {
      console.log(`📩 Usuário 2 notificado: ${data.userName} parou de digitar`);
    });

    // Usuário 1 simula digitação
    setTimeout(() => {
      console.log('⌨️ Usuário 1 começou a digitar...');
      user1Socket.emit('typing_start', { groupId: testGroupId });
    }, 500);

    setTimeout(() => {
      console.log('⌨️ Usuário 1 parou de digitar');
      user1Socket.emit('typing_stop', { groupId: testGroupId });
      resolve();
    }, 2000);
  });
}

function testPresenceStatus() {
  return new Promise((resolve) => {
    console.log('\n👥 Testando status de presença...');
    
    // Usuário 2 escuta mudanças de status
    user2Socket.on('contact_status_changed', (data) => {
      console.log(`📩 Usuário 2 notificado: Usuário ${data.userId} mudou status para ${data.status}`);
    });

    // Usuário 1 muda status
    setTimeout(() => {
      console.log('📊 Usuário 1 mudando status para "away"...');
      user1Socket.emit('update_status', { status: 'away' });
    }, 500);

    setTimeout(() => {
      console.log('📊 Usuário 1 mudando status para "online"...');
      user1Socket.emit('update_status', { status: 'online' });
      resolve();
    }, 1500);
  });
}

function testMessageActions() {
  return new Promise((resolve) => {
    console.log('\n✏️ Testando ações de mensagem (editar/deletar)...');
    
    let lastMessageId;

    // Capturar ID da próxima mensagem enviada
    user2Socket.on('new_message', (data) => {
      lastMessageId = data.id;
      console.log(`📩 Mensagem capturada para teste: ID ${lastMessageId}`);
    });

    // Enviar mensagem de teste
    setTimeout(() => {
      user1Socket.emit('send_message', {
        groupId: testGroupId,
        content: 'Esta mensagem será editada e depois deletada',
        type: 'text',
        tempId: 'test-msg-actions'
      });
    }, 500);

    // Aguardar mensagem ser enviada e depois editar
    setTimeout(() => {
      if (lastMessageId) {
        console.log('✏️ Editando mensagem...');
        user1Socket.emit('edit_message', {
          messageId: lastMessageId,
          content: 'Mensagem editada com sucesso!'
        }, (response) => {
          if (response.success) {
            console.log('✅ Mensagem editada com sucesso');
          } else {
            console.error('❌ Erro ao editar mensagem:', response.error);
          }
        });
      }
    }, 2000);

    // Aguardar edição e depois deletar
    setTimeout(() => {
      if (lastMessageId) {
        console.log('🗑️ Deletando mensagem...');
        user1Socket.emit('delete_message', {
          messageId: lastMessageId
        }, (response) => {
          if (response.success) {
            console.log('✅ Mensagem deletada com sucesso');
          } else {
            console.error('❌ Erro ao deletar mensagem:', response.error);
          }
        });
      }
    }, 4000);

    // Listener para mensagem editada
    user2Socket.on('message_edited', (data) => {
      console.log(`📩 Usuário 2 notificado: Mensagem ${data.id} foi editada`);
    });

    // Listener para mensagem deletada
    user2Socket.on('message_deleted', (data) => {
      console.log(`📩 Usuário 2 notificado: Mensagem ${data.id} foi deletada`);
    });

    setTimeout(resolve, 6000);
  });
}

function testDisconnection() {
  return new Promise((resolve) => {
    console.log('\n🔌 Testando desconexão...');
    
    // Usuário 2 escuta desconexões
    user2Socket.on('user_left_group', (data) => {
      console.log(`📩 Usuário 2 notificado: ${data.userName} saiu do grupo`);
    });

    setTimeout(() => {
      console.log('🚪 Usuário 1 saindo do grupo...');
      user1Socket.emit('leave_group', { groupId: testGroupId }, (response) => {
        if (response.success) {
          console.log('✅ Usuário 1 saiu do grupo com sucesso');
        }
      });
    }, 500);

    setTimeout(() => {
      console.log('🔌 Desconectando usuário 1...');
      user1Socket.disconnect();
      resolve();
    }, 1500);
  });
}

// Função de delay para aguardar entre testes
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar testes
runTests(); 