# Backend Mobile - BPkar

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Latest-blue.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Sobre o Projeto

O **BPkar Backend** é um sistema de microsserviços para gerenciamento de caronas, desenvolvido para conectar motoristas e passageiros de forma eficiente e segura. O sistema oferece funcionalidades completas de autenticação, gerenciamento de usuários, validação de documentos, notificações em tempo real e comunicação entre usuários.

## 🚀 Tecnologias

### Core Technologies
- **Node.js 18+** - Runtime JavaScript para servidor
- **Express.js** - Framework web minimalista e flexível
- **TypeScript** - JavaScript com tipagem estática
- **Prisma** - ORM moderno para Node.js e TypeScript

### Banco de Dados & Messaging
- **PostgreSQL 15+** - Banco de dados relacional
- **RabbitMQ** - Message broker para comunicação assíncrona
- **Redis** - Cache em memória para sessões e dados temporários

### DevOps & Deployment
- **Docker & Docker Compose** - Containerização
- **Socket.IO** - Comunicação em tempo real via WebSocket

## 🏗️ Arquitetura do Sistema

O projeto segue uma arquitetura de microsserviços com separação clara de responsabilidades:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Application     │    │ Validation      │    │ Notification    │
│ Service         │    │ Service         │    │ Service         │
│ (Port: 4040)    │    │ (Port: 4042)    │    │ (Port: 4044)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │                Infrastructure                        │
         │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
         │  │ PostgreSQL  │  │  RabbitMQ   │  │    Redis    │  │
         │  │             │  │             │  │             │  │
         │  └─────────────┘  └─────────────┘  └─────────────┘  │
         └─────────────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
backend-mobile-2/
├── 📦 application-service/         # Serviço principal da aplicação
│   ├── 📂 prisma/                 # Configuração do Prisma ORM
│   │   ├── schema.prisma          # Schema do banco de dados
│   │   └── migrations/            # Migrações do banco
│   ├── 📂 src/
│   │   ├── 📂 application/        # Casos de uso (Use Cases)
│   │   ├── 📂 domain/             # Entidades e regras de negócio
│   │   ├── 📂 infrastructure/     # Implementações e configurações
│   │   ├── 📂 presentation/       # Controllers e rotas da API
│   │   ├── app.js                 # Configuração do Express
│   │   ├── server.js              # Ponto de entrada da aplicação
│   │   └── swagger.js             # Documentação da API
│   └── 📄 package.json
├── 📦 validation-service/          # Serviço de validação de documentos
│   ├── 📂 src/
│   │   ├── 📂 controllers/        # Controllers da API
│   │   ├── 📂 services/           # Lógica de validação
│   │   ├── 📂 models/             # Modelos de dados
│   │   └── 📂 routes/             # Definição das rotas
│   └── 📄 package.json
├── 📦 notification-service/        # Serviço de notificações
│   ├── 📂 src/
│   │   ├── 📂 controllers/        # Controllers da API
│   │   ├── 📂 services/           # Lógica de notificações
│   │   ├── 📂 models/             # Modelos de dados
│   │   └── 📂 routes/             # Definição das rotas
│   └── 📄 package.json
├── 🐳 docker-compose.yml          # Orquestração dos serviços
├── 🐳 docker-compose.override.yml # Configurações de desenvolvimento
├── 📄 .env.example               # Exemplo de variáveis de ambiente
└── 📖 README.md
```

## ⚡ Quick Start

### Pré-requisitos

Certifique-se de ter instalado:

- **Docker** (v20.10+) - [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+) - [Instalar Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - [Instalar Git](https://git-scm.com/downloads)

### 🔧 Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/backend-mobile-2.git
   cd backend-mobile-2
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

3. **Inicie os serviços:**
   ```bash
   # Desenvolvimento (com hot reload)
   docker-compose up --build

   # Produção (detached mode)
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Aguarde a inicialização completa** (pode levar alguns minutos na primeira execução)

### 🌐 Endpoints dos Serviços

| Serviço | URL | Documentação |
|---------|-----|--------------|
| **Application Service** | http://localhost:4040 | [Swagger](http://localhost:4040/swagger) |
| **Validation Service** | http://localhost:4042 | [Swagger](http://localhost:4042/swagger) |
| **Notification Service** | http://localhost:4044 | [Swagger](http://localhost:4044/swagger) |

### 🔍 Health Checks

Verifique se os serviços estão funcionando:

```bash
# Application Service
curl http://localhost:4040/health

# Validation Service  
curl http://localhost:4042/health

# Notification Service
curl http://localhost:4044/health
```

## 🛠️ Comandos Úteis

### Docker Commands
```bash
# Ver logs de todos os serviços
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs application-service

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados do banco)
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache
```

### Prisma Commands
```bash
# Executar migrações
docker-compose exec application-service npm run prisma:migrate

# Abrir Prisma Studio
docker-compose exec application-service npm run prisma:studio

# Reset do banco de dados (⚠️ apaga todos os dados)
docker-compose exec application-service npm run prisma:reset
```

## 📊 Monitoramento e Logs

### Prisma Studio
Interface gráfica para visualizar e editar dados do banco:
```bash
npm run prisma:studio
```
Acesse: http://localhost:5555

### Logs Estruturados
Os serviços utilizam logs estruturados em JSON para facilitar o monitoramento:
```bash
# Visualizar logs em tempo real
docker-compose logs -f --tail=100
```

## 🔧 Desenvolvimento

### Estrutura de Desenvolvimento
```bash
# Instalar dependências localmente (opcional)
npm install

# Executar testes
npm test

# Executar linter
npm run lint

# Executar formatação de código
npm run format
```

### Hot Reload
O ambiente de desenvolvimento inclui hot reload automático. Salve qualquer arquivo e as mudanças serão refletidas automaticamente.

## 🐛 Solução de Problemas

### Problemas Comuns

<details>
<summary><strong>❌ Erro de Conexão com PostgreSQL</strong></summary>

**Sintomas:** `ECONNREFUSED` ou `Connection refused`

**Soluções:**
1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker-compose ps
   ```
2. Verifique as variáveis de ambiente no `.env`
3. Reinicie os containers:
   ```bash
   docker-compose restart
   ```
</details>

<details>
<summary><strong>❌ Erro nas Migrações do Prisma</strong></summary>

**Sintomas:** Erro durante `prisma migrate`

**Soluções:**
1. Reset do banco (⚠️ apaga dados):
   ```bash
   docker-compose exec application-service npx prisma migrate reset
   ```
2. Executar migrações manualmente:
   ```bash
   docker-compose exec application-service npx prisma migrate deploy
   ```
</details>

<details>
<summary><strong>❌ Porta já está em uso</strong></summary>

**Sintomas:** `Port 4040 is already in use`

**Soluções:**
1. Pare outros serviços na porta:
   ```bash
   sudo lsof -ti:4040 | xargs kill -9
   ```
2. Ou altere as portas no `docker-compose.yml`
</details>

<details>
<summary><strong>❌ Containers não inicializam</strong></summary>

**Sintomas:** Containers ficam em estado de `restarting`

**Soluções:**
1. Verifique os logs:
   ```bash
   docker-compose logs [service-name]
   ```
2. Verifique recursos do Docker (RAM/CPU)
3. Limpe containers e volumes:
   ```bash
   docker-compose down -v
   docker system prune -f
   ```
</details>

## 🔒 Segurança

### Variáveis de Ambiente
- ✅ Nunca commite arquivos `.env` 
- ✅ Use `.env.example` como template
- ✅ Rotacione secrets regularmente
- ✅ Use valores diferentes para cada ambiente

### Boas Práticas
- Containers executam como usuário não-root
- Secrets são gerenciados via Docker Secrets (produção)
- Validação de entrada em todas as APIs
- Rate limiting implementado

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes de integração
npm run test:integration

# Executar testes end-to-end
npm run test:e2e
```

## 📈 Performance

### Métricas Monitoradas
- Response time das APIs
- Memory usage dos containers
- Database connection pool
- Message queue throughput

### Otimizações Implementadas
- Connection pooling (PostgreSQL)
- Query optimization (Prisma)
- Caching strategies (Redis)
- Horizontal scaling ready

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Por favor, siga nosso processo:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. **Commit** suas mudanças:
   ```bash
   git commit -m 'feat: adiciona nova funcionalidade'
   ```
4. **Push** para a branch:
   ```bash
   git push origin feature/nova-funcionalidade
   ```
5. **Abra** um Pull Request

### Convenções de Commit
Usamos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` mudanças na documentação
- `style:` formatação de código
- `refactor:` refatoração de código
- `test:` adição de testes
- `chore:` mudanças de build/ferramentas

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

