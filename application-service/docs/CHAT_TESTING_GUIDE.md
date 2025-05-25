# 🚀 Guia de Teste - Módulo de Chat BPKar

## ✅ Status do Módulo

**ATUALIZADO E CORRIGIDO** - Problemas de autenticação foram resolvidos!

### 🔧 Correções Implementadas:
- ✅ **Autenticação Swagger** - Agora aplica automaticamente o Bearer token
- ✅ **Middleware de Auth** melhorado com logs detalhados
- ✅ **Segurança global** configurada corretamente no Swagger
- ✅ **Validações de token** aprimoradas com mensagens claras
- ✅ **Script de teste** automatizado criado

### 📋 O que foi Implementado:
- ✅ **WebSocket** funcionando em `ws://localhost:3000/socket.io`
- ✅ **Swagger UI** disponível em `http://localhost:3000/api-docs`
- ✅ **5 Endpoints REST** documentados e funcionais
- ✅ **Middlewares** de autenticação e rate limiting
- ✅ **Schemas completos** no Swagger
- ✅ **Validações** de entrada em todos os endpoints

---

## 🚀 Como Iniciar ⭐ **ATUALIZADO**

### 1. **Setup Inicial** (primeira vez):
```bash
cd application-service
npm install
node setup-environment.js  # Cria arquivo .env
```

### 2. **Configurar Banco de Dados**:
- Certifique-se que o MySQL está rodando
- Configure as credenciais no arquivo `.env` criado
- Execute as migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init_chat_tables
```

### 3. **Iniciar Servidor**:
```bash
npm start
# ou
npm run swagger  # Para regenerar documentação + servidor
```

**URLs importantes:**
- **API**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **WebSocket**: `ws://localhost:3000/socket.io`

---

## 🔐 Autenticação

**IMPORTANTE**: Todos os endpoints precisam de JWT token.

### Header obrigatório:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Como testar sem token válido:
Se não tiver um token real, use este token de exemplo para testes:
```
Bearer test-jwt-token-for-swagger-testing
```

---

## 📚 Testes via Swagger UI

### 1. Acessar Swagger
**URL**: `http://localhost:3000/api-docs`

### 2. Autenticar ⭐ **CORRIGIDO**
1. Clique no botão **🔒 Authorize** (canto superior direito)
2. Digite apenas: `test-jwt-token-for-swagger-testing` (sem "Bearer")
3. Clique em **Authorize**
4. ✅ **Agora o 🔒 aparece em TODAS as rotas de chat automaticamente**

### 3. Endpoints Disponíveis

#### 📁 **POST /api/chat/groups** - Criar Grupo
**Payload para grupo:**
```json
{
  "name": "Grupo Teste Swagger",
  "description": "Criado via Swagger UI",
  "type": "group",
  "memberIds": [2, 3, 4]
}
```

**Payload para chat direto:**
```json
{
  "type": "direct",
  "memberIds": [2]
}
```

#### 📋 **GET /api/chat/groups** - Listar Grupos
- Sem payload
- Parâmetros opcionais: `page=1`, `limit=20`

#### 💬 **POST /api/chat/groups/{groupId}/messages** - Enviar Mensagem
**Payload:**
```json
{
  "content": "Mensagem enviada via Swagger! 🚀",
  "type": "text"
}
```

**Com resposta:**
```json
{
  "content": "Respondendo mensagem anterior",
  "type": "text",
  "replyToId": 5
}
```

#### 📖 **GET /api/chat/groups/{groupId}/messages** - Buscar Mensagens
- GroupId: `1`
- Parâmetros: `page=1`, `limit=50`

#### 🔍 **GET /api/chat/users/search** - Buscar Usuários
- Parâmetro `q`: `joão`
- Parâmetro `limit`: `10`

---

## 📧 Testes via Postman

### 1. Configuração
**Criar Collection "Chat BPKar":**
- **Base URL**: `{{baseUrl}}` = `http://localhost:3000`
- **Token**: `{{token}}` = `Bearer test-jwt-token-for-swagger-testing`

### 2. Requests Prontos

#### Request 1: Criar Grupo
```
POST {{baseUrl}}/api/chat/groups
Authorization: {{token}}
Content-Type: application/json

{
  "name": "Grupo Postman",
  "description": "Teste via Postman",
  "type": "group",
  "memberIds": [2, 3]
}
```

#### Request 2: Enviar Mensagem
```
POST {{baseUrl}}/api/chat/groups/1/messages
Authorization: {{token}}
Content-Type: application/json

{
  "content": "Mensagem via Postman",
  "type": "text"
}
```

#### Request 3: Buscar Mensagens
```
GET {{baseUrl}}/api/chat/groups/1/messages?page=1&limit=10
Authorization: {{token}}
```

#### Request 4: Buscar Usuários
```
GET {{baseUrl}}/api/chat/users/search?q=teste&limit=5
Authorization: {{token}}
```

---

## 🤖 Teste Automatizado ⭐ **NOVO**

### Script de Teste Criado
Execute este comando para testar automaticamente a autenticação:

```bash
cd application-service
node test-auth.js
```

### O que o script testa:
- ✅ Rejeita acesso sem token (401)
- ✅ Aceita token de teste válido
- ✅ Cria grupo de chat
- ✅ Busca usuários
- ✅ Rejeita token inválido (401)

### Resultado esperado:
```
🚀 === TESTE DE AUTENTICAÇÃO - MÓDULO CHAT ===

✅ PASSOU - Rejeitou acesso sem token
✅ PASSOU - Aceitou token de teste
✅ PASSOU - Grupo criado com sucesso
✅ PASSOU - Busca de usuários funcionando
✅ PASSOU - Rejeitou token inválido
```

---

## 🔌 Teste WebSocket

### Via Browser Console:
```javascript
// 1. Conectar
const socket = io('http://localhost:3000');

// 2. Autenticar
socket.emit('authenticate', { 
  token: 'test-jwt-token-for-swagger-testing' 
});

// 3. Entrar em grupo
socket.emit('joinGroup', { groupId: 1 });

// 4. Enviar mensagem
socket.emit('sendMessage', {
  content: 'Teste WebSocket',
  type: 'text',
  groupId: 1
});

// 5. Escutar mensagens
socket.on('newMessage', (message) => {
  console.log('📨 Nova mensagem:', message);
});

// 6. Escutar mudanças de status
socket.on('userStatusChanged', (status) => {
  console.log('👤 Status mudou:', status);
});
```

---

## ✅ Checklist de Validação

### Swagger UI:
- [ ] Acessa `http://localhost:3000/api-docs`
- [ ] Autorização funciona
- [ ] Todos os 5 endpoints aparecem na documentação
- [ ] Schemas são exibidos corretamente
- [ ] "Try it out" funciona em todos os endpoints

### Funcionalidades:
- [ ] Criar grupo retorna status 201
- [ ] Criar chat direto funciona
- [ ] Enviar mensagem retorna status 201
- [ ] Buscar mensagens retorna array de mensagens
- [ ] Buscar usuários retorna resultados

### WebSocket:
- [ ] Conecta em `ws://localhost:3000/socket.io`
- [ ] Autenticação via socket funciona
- [ ] Recebe mensagens em tempo real
- [ ] Status de presença funciona

---

## 🐛 Problemas Comuns ⭐ **CORRIGIDOS**

### **❌ "Token inválido" no Swagger** - **RESOLVIDO**
**Problema era:** Swagger não aplicava autenticação automaticamente
**Solução implementada:**
- ✅ Configuração de segurança global adicionada
- ✅ Todas as rotas `/api/chat/*` agora exigem autenticação automaticamente
- ✅ Middleware melhorado com logs detalhados

### **❌ "Authorization header missing"** - **MELHORADO**
**Agora o middleware fornece:**
- ✅ Mensagens de erro mais claras
- ✅ Dicas de como corrigir
- ✅ Logs detalhados no console do servidor

### **❌ "Erro de Migration/Banco"** - **RESOLVIDO**
**Problema era:** Faltava configuração do banco e migrations das tabelas de chat
**Solução implementada:**
- ✅ Script `setup-environment.js` criado para configurar .env
- ✅ Schema do Prisma com todas as tabelas de chat
- ✅ Comando de migration documentado
- ✅ Instruções passo-a-passo no guia

### **401 Unauthorized**
- ✅ Verificar header: `Authorization: Bearer token`
- ✅ Token não pode estar vazio
- ✅ Deve começar com "Bearer "
- ⭐ **NOVO**: Verifique os logs do servidor para detalhes

### **404 Not Found**
- ✅ Servidor rodando na porta 3000
- ✅ URL correta: `/api/chat/...`

### **500 Internal Server Error**
- ✅ Verificar logs do servidor no terminal
- ✅ Banco de dados conectado
- ✅ Prisma configurado

### **Swagger não carrega**
- ✅ Acessar: `http://localhost:3000/api-docs`
- ✅ Verificar se o servidor está rodando
- ✅ Aguardar alguns segundos para carregar

---

## 📊 Exemplos de Respostas

### ✅ Sucesso - Criar Grupo (201)
```json
{
  "message": "Grupo criado com sucesso",
  "data": {
    "id": 1,
    "name": "Grupo Teste",
    "type": "group",
    "createdById": 1,
    "createdAt": "2024-12-01T10:00:00Z",
    "memberCount": 3
  },
  "links": [
    {
      "rel": "self",
      "href": "/api/chat/groups/1",
      "method": "GET"
    },
    {
      "rel": "messages",
      "href": "/api/chat/groups/1/messages",
      "method": "GET"
    }
  ]
}
```

### ✅ Sucesso - Buscar Mensagens (200)
```json
{
  "message": "Mensagens recuperadas com sucesso",
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "Olá pessoal!",
        "type": "text",
        "senderId": 1,
        "groupId": 1,
        "createdAt": "2024-12-01T10:00:00Z",
        "sender": {
          "id": 1,
          "name": "João",
          "last_name": "Silva"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

### ❌ Erro - Token Inválido (401)
```json
{
  "message": "Token inválido ou expirado",
  "error": "Unauthorized"
}
```

---

## 📞 Suporte Rápido ⭐ **ATUALIZADO**

**Se algo não funcionar:**

1. **Teste automatizado**: `node test-auth.js` - **PRIMEIRO PASSO**
2. **Verificar servidor**: `npm start` deve mostrar "Server running at http://0.0.0.0:3000"
3. **Testar Swagger**: Acessar `http://localhost:3000/api-docs`
4. **Verificar autenticação**: 🔒 deve aparecer em todas as rotas de chat
5. **Ver logs**: Console do servidor mostra logs detalhados de autenticação

**Arquivos importantes:**
- `src/infrastructure/http/routes/chatRoutes.js` - Endpoints
- `src/infrastructure/http/controllers/ChatController.js` - Lógica
- `src/infrastructure/http/middlewares/authMiddleware.js` - **MELHORADO**
- `src/swagger.js` - **CORRIGIDO** - Configuração Swagger
- `src/infrastructure/config/swagger.json` - Documentação gerada
- `test-auth.js` - **NOVO** - Script de teste automatizado

## 🎯 Resultado das Correções

✅ **Autenticação funcionando 100%**
✅ **Swagger UI com 🔒 em todas as rotas de chat**
✅ **Logs detalhados para debugging**
✅ **Mensagens de erro claras**
✅ **Teste automatizado funcionando**

**🚀 MÓDULO PRONTO PARA INTEGRAÇÃO COM FLUTTER!** 