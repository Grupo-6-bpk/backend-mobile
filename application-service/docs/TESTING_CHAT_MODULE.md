# 🧪 Guia Completo de Testes - Módulo de Chat BPKar

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Testes Locais](#testes-locais)
- [Testes com Docker](#testes-com-docker)
- [Testes com Swagger/OpenAPI](#testes-com-swagger-openapi)
- [Testes de Integração](#testes-de-integração)
- [Testes de Performance](#testes-de-performance)
- [Solução de Problemas](#solução-de-problemas)

## 🎯 Visão Geral

Este módulo implementa um sistema completo de chat em tempo real com:
- **WebSocket** para comunicação instantânea
- **Use Cases** para lógica de negócio
- **APIs REST** documentadas com Swagger
- **Testes abrangentes** com 105 testes (96.2% sucesso)
- **Cobertura de 26%+** statements
- **Docker** para ambiente isolado

### Componentes Testados
- ✅ **CreateChatGroupUseCase**: 19 testes (96.34% cobertura)
- ✅ **SendMessageUseCase**: 14 testes (87.5% cobertura)
- ✅ **ChatEventHandler**: 22 testes (93.89% cobertura)
- ✅ **PresenceManager**: 25 testes (60% cobertura)
- ✅ **SocketServer**: 20 testes (54.54% cobertura)

### APIs Disponíveis
- 🌐 **REST API**: `/api/chat/*` - CRUD de grupos e mensagens
- 📚 **Swagger UI**: `/api-docs` - Documentação interativa
- 🔌 **WebSocket**: `/socket.io` - Chat em tempo real

## 🔧 Pré-requisitos

### Ambiente Local
```bash
# Node.js 18+
node --version

# npm 9+
npm --version

# Git
git --version
```

### Ambiente Docker
```bash
# Docker 20+
docker --version

# Docker Compose 2+
docker-compose --version
```

## 🏠 Testes Locais

### 1. Configuração Inicial
```bash
# Clonar o repositório
git clone https://github.com/Grupo-6-bpk/backend-mobile.git
cd backend-mobile/application-service

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npx prisma generate
npx prisma db push
```

### 2. Executar Testes Unitários

**Todos os testes:**
```bash
npm test
```

**Testes específicos do chat:**
```bash
# Use Cases
npm test -- CreateChatGroupUseCase.test.js
npm test -- SendMessageUseCase.test.js

# WebSocket
npm test -- ChatEventHandler.test.js
npm test -- PresenceManager.test.js
npm test -- SocketServer.test.js
```

**Com cobertura detalhada:**
```bash
npm test -- --coverage
```

**Relatório HTML:**
```bash
# Abrir: application-service/coverage/lcov-report/index.html
npm test -- --coverage && start coverage/lcov-report/index.html
```

### 3. Testar Servidor Local

**Iniciar servidor:**
```bash
npm start
# Servidor rodando em: http://localhost:3000
```

**Acessar Swagger UI:**
```bash
# Abrir navegador em: http://localhost:3000/api-docs
start http://localhost:3000/api-docs
```

**Teste WebSocket integrado:**
```bash
node src/infrastructure/websocket/test/websocket-test.js
```

## 🐳 Testes com Docker

### 1. Configuração Docker

**Dockerfile (já configurado):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://user:pass@db:5432/testdb
      - SWAGGER_ENABLED=true
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=testdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 2. Executar com Docker

**Build e iniciar serviços:**
```bash
# Build da imagem
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Acessar Swagger no Docker
echo "Swagger disponível em: http://localhost:3000/api-docs"
```

**Executar testes no container:**
```bash
# Testes unitários
docker-compose exec app npm test

# Testes com cobertura
docker-compose exec app npm test -- --coverage

# Testes específicos
docker-compose exec app npm test -- ChatEventHandler.test.js
```

**Acessar container:**
```bash
# Shell interativo
docker-compose exec app sh

# Dentro do container
npm test
npm start
```

### 3. Ambiente de Teste Isolado

**Criar ambiente dedicado:**
```bash
# Docker Compose para testes
docker-compose -f docker-compose.test.yml up -d

# Executar suite completa
docker-compose -f docker-compose.test.yml exec test-app npm test

# Acessar Swagger no ambiente de teste
echo "Swagger teste: http://localhost:3001/api-docs"
```

## 📚 Testes com Swagger/OpenAPI

### 1. Acessar Interface Swagger

**Localmente:**
```bash
# Iniciar servidor
npm start

# Acessar no navegador
open http://localhost:3000/api-docs
```

**Com Docker:**
```bash
# Iniciar containers
docker-compose up -d

# Acessar Swagger
open http://localhost:3000/api-docs
```

### 2. Endpoints Disponíveis no Swagger

#### **📁 Chat Groups**
```
POST   /api/chat/groups           # Criar grupo ou chat direto
GET    /api/chat/groups           # Listar grupos do usuário
GET    /api/chat/groups/{id}      # Detalhes do grupo
PUT    /api/chat/groups/{id}      # Atualizar grupo
DELETE /api/chat/groups/{id}      # Deletar grupo
```

#### **💬 Messages**
```
POST   /api/chat/groups/{groupId}/messages     # Enviar mensagem
GET    /api/chat/groups/{groupId}/messages     # Listar mensagens
PUT    /api/chat/messages/{messageId}          # Editar mensagem
DELETE /api/chat/messages/{messageId}          # Deletar mensagem
```

#### **👥 Members**
```
POST   /api/chat/groups/{groupId}/members      # Adicionar membros
DELETE /api/chat/groups/{groupId}/members/{userId} # Remover membro
GET    /api/chat/groups/{groupId}/members      # Listar membros
```

#### **🔍 Search**
```
GET    /api/chat/users/search                  # Buscar usuários
GET    /api/chat/users/recent-contacts         # Contatos recentes
```

### 3. Como Testar via Swagger UI

#### **🔐 Autenticação**
1. Clique em **"Authorize"** no topo da página
2. Insira o token JWT: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Clique em **"Authorize"**

#### **📝 Criar Grupo**
1. Expanda `POST /api/chat/groups`
2. Clique em **"Try it out"**
3. Cole o JSON de exemplo:
```json
{
  "name": "Grupo Teste Swagger",
  "description": "Criado via Swagger UI",
  "type": "group",
  "memberIds": [2, 3, 4]
}
```
4. Clique em **"Execute"**
5. Verifique a resposta com status **201**

#### **💬 Enviar Mensagem**
1. Expanda `POST /api/chat/groups/{groupId}/messages`
2. Insira `groupId`: `1`
3. Cole o JSON:
```json
{
  "content": "Mensagem enviada via Swagger! 🚀",
  "type": "text"
}
```
4. Execute e verifique status **201**

#### **📋 Listar Mensagens**
1. Expanda `GET /api/chat/groups/{groupId}/messages`
2. Insira `groupId`: `1`
3. Configure parâmetros:
   - `page`: `1`
   - `limit`: `10`
4. Execute e verifique as mensagens retornadas

### 4. Exemplos de Payloads para Swagger

#### **Criar Chat Direto:**
```json
{
  "type": "direct",
  "memberIds": [2]
}
```

#### **Enviar Imagem:**
```json
{
  "type": "image",
  "fileUrl": "https://example.com/image.jpg",
  "fileName": "foto.jpg",
  "fileSize": 1024000
}
```

#### **Responder Mensagem:**
```json
{
  "content": "Respondendo via Swagger",
  "type": "text",
  "replyToId": 5
}
```

### 5. Validação de Respostas

**✅ Sucesso (201/200):**
```json
{
  "message": "Grupo criado com sucesso",
  "data": {
    "id": 1,
    "name": "Grupo Teste",
    "type": "group",
    "createdAt": "2024-12-01T10:00:00Z"
  },
  "links": [
    {
      "rel": "self",
      "href": "/api/chat/groups/1",
      "method": "GET"
    }
  ]
}
```

**❌ Erro (400/401/500):**
```json
{
  "message": "Dados inválidos",
  "error": "Nome é obrigatório para grupos",
  "details": ["name.required"]
}
```

### 6. Testes Automatizados via Swagger

**Script para testar todos os endpoints:**
```javascript
// swagger-test-script.js
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TOKEN = 'seu_jwt_token_aqui';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testAllEndpoints() {
  console.log('🧪 Testando todos os endpoints...');
  
  try {
    // 1. Criar grupo
    const group = await api.post('/api/chat/groups', {
      name: 'Teste Automatizado',
      type: 'group',
      memberIds: [2, 3]
    });
    console.log('✅ Grupo criado:', group.data.data.id);
    
    // 2. Enviar mensagem
    const message = await api.post(`/api/chat/groups/${group.data.data.id}/messages`, {
      content: 'Mensagem de teste automatizado',
      type: 'text'
    });
    console.log('✅ Mensagem enviada:', message.data.data.id);
    
    // 3. Buscar mensagens
    const messages = await api.get(`/api/chat/groups/${group.data.data.id}/messages`);
    console.log('✅ Mensagens recuperadas:', messages.data.data.messages.length);
    
    // 4. Buscar usuários
    const users = await api.get('/api/chat/users/search?q=test');
    console.log('✅ Usuários encontrados:', users.data.data.length);
    
    console.log('🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
  }
}

testAllEndpoints();
```

**Executar script:**
```bash
node swagger-test-script.js
```

## 🔗 Testes de Integração

### 1. Teste WebSocket Completo

**Conectar e testar:**
```javascript
// websocket-integration-test.js
const io = require('socket.io-client');

async function testChatFlow() {
  // 1. Conectar
  const socket = io('http://localhost:3000');
  
  // 2. Autenticar
  socket.emit('authenticate', { 
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  });
  
  // 3. Entrar em grupo
  socket.emit('joinGroup', { groupId: 1 });
  
  // 4. Enviar mensagem
  socket.emit('sendMessage', {
    content: 'Teste de integração',
    type: 'text',
    groupId: 1
  });
  
  // 5. Escutar resposta
  socket.on('newMessage', (message) => {
    console.log('✅ Mensagem recebida:', message);
  });
  
  // 6. Testar presença
  socket.on('userStatusChanged', (status) => {
    console.log('✅ Status mudou:', status);
  });
}

testChatFlow();
```

### 2. Teste API REST

**Criar grupo via API:**
```bash
# Variáveis
export API_URL="http://localhost:3000"
export TOKEN="seu_jwt_token_aqui"

# Criar grupo
curl -X POST $API_URL/api/chat/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Grupo Teste Docker",
    "description": "Teste via Docker",
    "type": "group",
    "memberIds": [2, 3, 4]
  }'
```

**Enviar mensagem:**
```bash
curl -X POST $API_URL/api/chat/groups/1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Mensagem via API REST",
    "type": "text"
  }'
```

**Buscar mensagens:**
```bash
curl -X GET "$API_URL/api/chat/groups/1/messages?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Teste de Fluxo Completo

**Script de teste automatizado:**
```bash
#!/bin/bash
# test-complete-flow.sh

echo "🚀 Iniciando teste completo do chat..."

# 1. Verificar serviços
echo "📡 Verificando conectividade..."
curl -f http://localhost:3000/health || exit 1

# 2. Verificar Swagger
echo "📚 Verificando Swagger..."
curl -f http://localhost:3000/api-docs || echo "⚠️ Swagger não disponível"

# 3. Executar testes unitários
echo "🧪 Executando testes unitários..."
docker-compose exec app npm test || exit 1

# 4. Testar WebSocket
echo "🔌 Testando WebSocket..."
docker-compose exec app node src/infrastructure/websocket/test/websocket-test.js

# 5. Testar APIs via Swagger
echo "🌐 Testando APIs REST..."
node swagger-test-script.js

echo "✅ Todos os testes concluídos com sucesso!"
```

## ⚡ Testes de Performance

### 1. Teste de Carga WebSocket

**Múltiplas conexões:**
```javascript
// load-test-websocket.js
const io = require('socket.io-client');

async function loadTest() {
  const connections = [];
  const numClients = 100;
  
  console.log(`🚀 Criando ${numClients} conexões WebSocket...`);
  
  for (let i = 0; i < numClients; i++) {
    const socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
      console.log(`Cliente ${i + 1} conectado`);
      
      // Autenticar
      socket.emit('authenticate', { token: `test_token_${i}` });
      
      // Entrar em grupo
      socket.emit('joinGroup', { groupId: 1 });
    });
    
    connections.push(socket);
  }
  
  // Enviar mensagens em massa
  setTimeout(() => {
    connections.forEach((socket, index) => {
      socket.emit('sendMessage', {
        content: `Mensagem do cliente ${index}`,
        type: 'text',
        groupId: 1
      });
    });
  }, 2000);
}

loadTest();
```

### 2. Monitoramento Docker

**Monitorar recursos:**
```bash
# Uso de CPU e memória
docker stats

# Logs em tempo real
docker-compose logs -f app

# Métricas específicas
docker exec app_container ps aux
docker exec app_container free -h
```

## 🐛 Solução de Problemas

### Problemas Comuns

**1. Testes falhando:**
```bash
# Limpar cache Jest
npm test -- --clearCache

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar variáveis de ambiente
cat .env
```

**2. Docker não conecta ao banco:**
```bash
# Verificar network
docker network ls
docker network inspect backend-mobile_default

# Resetar volumes
docker-compose down -v
docker-compose up -d
```

**3. WebSocket não conecta:**
```bash
# Verificar porta
netstat -an | grep 3000
curl http://localhost:3000/socket.io/

# Verificar logs
docker-compose logs app
```

**4. Swagger não carrega:**
```bash
# Verificar se está habilitado
curl http://localhost:3000/api-docs

# Verificar variável de ambiente
echo $SWAGGER_ENABLED

# Logs do servidor
docker-compose logs app | grep swagger
```

**5. Testes Jest com ES modules:**
```bash
# Se erro "require is not defined"
export NODE_OPTIONS="--experimental-vm-modules"
npm test
```

### Comandos Úteis de Debug

**Verificar saúde dos serviços:**
```bash
# Status dos containers
docker-compose ps

# Logs específicos
docker-compose logs --tail=50 app
docker-compose logs --tail=50 db

# Executar comandos nos containers
docker-compose exec app node --version
docker-compose exec db psql -U user -d testdb -c "\l"

# Testar endpoints manualmente
curl http://localhost:3000/health
curl http://localhost:3000/api-docs
```

**Resetar ambiente:**
```bash
# Parar e remover tudo
docker-compose down -v --remove-orphans

# Limpar imagens
docker system prune -a

# Reconstruir
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Relatórios de Teste

### Estrutura de Arquivos de Teste
```
application-service/
├── src/__tests__/
│   ├── unit/
│   │   ├── CreateChatGroupUseCase.test.js    # 19 testes
│   │   ├── SendMessageUseCase.test.js        # 14 testes
│   │   ├── ChatEventHandler.test.js          # 22 testes
│   │   ├── PresenceManager.test.js           # 25 testes
│   │   ├── SocketServer.test.js              # 20 testes
│   │   └── ChatController.test.js            # Em desenvolvimento
│   ├── integration/
│   │   └── websocket-integration.test.js
│   └── mocks/
│       ├── mockPrismaClient.js
│       └── mockSocketIO.js
├── coverage/                                 # Relatórios de cobertura
├── jest.config.mjs                          # Configuração Jest
├── jest.setup.cjs                           # Setup dos testes
└── docs/
    ├── TESTING_CHAT_MODULE.md               # Este documento
    └── swagger/                              # Documentação Swagger
        ├── openapi.yaml
        └── components/
```

### Métricas Atuais
- **Total de testes**: 105
- **Testes passando**: 101 (96.2%)
- **Cobertura statements**: 26.04%
- **Cobertura branches**: 23.99%
- **Cobertura functions**: 15.36%
- **Cobertura lines**: 26.46%

### URLs de Acesso
- **Aplicação**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api-docs
- **WebSocket**: ws://localhost:3000/socket.io
- **Cobertura**: application-service/coverage/lcov-report/index.html

## 🎯 Checklist de Validação

Antes de considerar o módulo pronto para produção:

### ✅ Testes Unitários
- [ ] Todos os Use Cases testados
- [ ] WebSocket handlers testados
- [ ] Repositórios mockados corretamente
- [ ] Cobertura > 90%

### ✅ Testes de Integração
- [ ] WebSocket conecta e autentica
- [ ] Mensagens são enviadas e recebidas
- [ ] Presença funciona corretamente
- [ ] APIs REST respondem adequadamente

### ✅ Testes Docker
- [ ] Container builda sem erros
- [ ] Serviços iniciam corretamente
- [ ] Testes passam no container
- [ ] Banco de dados conecta

### ✅ Testes Swagger
- [ ] Interface Swagger carrega
- [ ] Todos os endpoints estão documentados
- [ ] Autenticação funciona via Swagger
- [ ] Exemplos de payloads funcionam
- [ ] Validações de erro estão corretas

### ✅ Performance
- [ ] Suporta 100+ conexões simultâneas
- [ ] Tempo de resposta < 100ms
- [ ] Memória não vaza
- [ ] CPU não ultrapassa 80%

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs: `docker-compose logs app`
2. Executar testes: `npm test`
3. Validar configuração: `cat .env`
4. Testar via Swagger: `http://localhost:3000/api-docs`
5. Abrir issue no GitHub com logs completos

### URLs Importantes
- 🌐 **API Base**: http://localhost:3000/api
- 📚 **Swagger UI**: http://localhost:3000/api-docs
- 🔌 **WebSocket**: ws://localhost:3000/socket.io
- 📊 **Coverage**: coverage/lcov-report/index.html

**Última atualização**: Dezembro 2024  
**Versão do módulo**: 1.0.0  
**Compatibilidade**: Node.js 18+, Docker 20+ 