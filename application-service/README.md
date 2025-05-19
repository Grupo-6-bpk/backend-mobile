# BPkar Application Service

Este é o guia de configuração e execução do serviço de aplicação (Application Service) do projeto BPkar, responsável por gerenciar usuários, motoristas, passageiros, grupos de caronas e mais.

## Pré-requisitos

- Node.js (versão recomendada: 18.x ou superior)
- MySQL (versão 8.0 ou superior)
- npm (gerenciador de pacotes do Node.js)

## Configuração Inicial

### 1. Instalação das Dependências

Clone o repositório e instale as dependências:

```bash
# Navegue até a pasta do application-service
cd backend-mobile/aplication-service

# Instale todas as dependências
npm install
```

### 2. Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto application-service:

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

Configure as seguintes variáveis no arquivo `.env`:

- `DATABASE_URL`: URL de conexão com o banco de dados MySQL (formato: `mysql://usuario:senha@host:porta/nome_banco`)
- `PORT`: Porta em que o serviço será executado (padrão: 4040)
- `JWTSECRET`: Chave secreta para geração de tokens JWT (use uma string aleatória e segura)
- `JWTEXPIRE`: Tempo de expiração dos tokens JWT (padrão: 1d)

Exemplo:
```
DATABASE_URL="mysql://root:minhasenha@localhost:3306/bpkar_db"
PORT=4040
JWTSECRET=minhasecretasupersegura
JWTEXPIRE=1d
```

### 3. Configuração e Migração do Banco de Dados

Antes de iniciar o serviço, é necessário configurar o banco de dados:

```bash
# Crie o banco de dados MySQL (caso ainda não exista)
mysql -u root -p -e "CREATE DATABASE bpkar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Gere o cliente Prisma baseado no schema
npm run prisma:generate

# Execute as migrações do banco de dados
npm run prisma:migrate
```

Caso precise criar uma nova migração depois de modificar o schema:

```bash
# Cria uma nova migração sem aplicá-la
npm run prisma:migrate:create -- --name nome_da_migracao

# Aplica as migrações pendentes
npm run prisma:migrate
```

## Executando o Serviço

### Modo de Desenvolvimento

```bash
# Inicia o servidor com hot-reload (reinicia quando há mudanças nos arquivos)
npm run start:watch
```

### Modo de Produção

```bash
# Inicia o servidor sem hot-reload
npm run start
```

O serviço estará disponível em `http://localhost:4040` (ou na porta configurada no arquivo .env).

## Documentação da API (Swagger)

O projeto utiliza Swagger para documentação da API.

### Gerando a Documentação

```bash
# Gera a documentação do Swagger
npm run swagger
```

### Visualizando a Documentação

Após iniciar o serviço, a documentação estará disponível em:

```
http://localhost:4040/swagger
```

### Modo de Desenvolvimento da Documentação

```bash
# Gera a documentação com hot-reload
npm run swagger:watch
```

## Ferramentas Adicionais

### Prisma Studio

Para visualizar e editar os dados do banco de dados através de uma interface gráfica:

```bash
npm run prisma:studio
```

O Prisma Studio estará disponível em `http://localhost:5555`.

## Estrutura do Projeto

```
aplication-service/
├── prisma/              # Configuração e migrações do Prisma
│   ├── schema.prisma    # Schema do banco de dados
│   └── migrations/      # Migrações do banco de dados
├── src/
│   ├── application/     # Casos de uso da aplicação
│   ├── domain/          # Entidades e regras de negócio
│   ├── infrastructure/  # Implementações concretas e configurações
│   ├── presentation/    # Controladores e rotas da API
│   ├── app.js           # Configuração da aplicação Express
│   ├── server.js        # Ponto de entrada da aplicação
│   └── swagger.js       # Configuração do Swagger
└── package.json         # Dependências e scripts
```

## Solução de Problemas

### Erro de Conexão com o Banco de Dados

- Verifique se o MySQL está em execução
- Confirme se as credenciais no arquivo `.env` estão corretas
- Certifique-se de que o banco de dados especificado existe

### Erro nas Migrações

Se ocorrerem problemas durante a migração:

```bash
# Redefina o banco de dados (cuidado: isso apaga todos os dados!)
npx prisma migrate reset

# Aplique novamente as migrações
npm run prisma:migrate
```

### Outros Problemas

Para qualquer outro problema, verifique os logs do servidor e consulte a documentação do Prisma ou do Express conforme necessário.
