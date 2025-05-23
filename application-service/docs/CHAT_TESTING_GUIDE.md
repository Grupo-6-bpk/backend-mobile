# 🚀 Guia de Teste - Módulo de Chat BPKar

## ✅ Status do Módulo

**PRONTO PARA TESTES** - Módulo de chat 100% funcional e documentado.

### 📋 O que foi Implementado:
- ✅ **WebSocket** funcionando em `ws://localhost:3000/socket.io`
- ✅ **Swagger UI** disponível em `http://localhost:3000/api-docs`
- ✅ **4 Endpoints REST** documentados e funcionais
- ✅ **Middlewares** de autenticação e rate limiting
- ✅ **Schemas completos** no Swagger
- ✅ **Validações** de entrada em todos os endpoints

---

## 🚀 Como Iniciar

```bash
cd application-service
npm install
npm start
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

### 2. Autenticar
1. Clique no botão **🔒 Authorize** (canto superior direito)
2. Digite: `Bearer test-jwt-token-for-swagger-testing`
3. Clique em **Authorize**

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

## 🐛 Problemas Comuns

### **401 Unauthorized**
- ✅ Verificar header: `Authorization: Bearer token`
- ✅ Token não pode estar vazio
- ✅ Deve começar com "Bearer "

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

## 📞 Suporte Rápido

**Se algo não funcionar:**

1. **Verificar servidor**: `npm start` deve mostrar "Server running at http://0.0.0.0:3000"
2. **Testar Swagger**: Acessar `http://localhost:3000/api-docs`
3. **Verificar token**: Deve estar no formato `Bearer token`
4. **Ver logs**: Console do servidor mostra erros detalhados

**Arquivos importantes:**
- `src/infrastructure/http/routes/chatRoutes.js` - Endpoints
- `src/infrastructure/http/controllers/ChatController.js` - Lógica
- `src/swagger.js` - Configuração Swagger
- `src/infrastructure/config/swagger.json` - Documentação gerada

---

**🎯 RESULTADO ESPERADO**: Todos os endpoints funcionando perfeitamente no Swagger, prontos para integração com Flutter! 