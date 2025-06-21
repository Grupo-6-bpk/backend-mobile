# Backend Mobile

## Sobre o Projeto

Este é o guia de configuração e execução do serviço de aplicação (Application Service) do projeto BPkar, responsável por gerenciar usuários, motoristas, passageiros, grupos de caronas e mais.

## Tecnologias

As principais tecnologias usadas neste projeto são:

*   **Node.js:** Ambiente de execução para JavaScript no servidor.
*   **Express.js:** Framework web para Node.js, usado para construir as APIs.
*   **Prisma:** ORM para Node.js e TypeScript, facilitando o acesso ao banco de dados.
*   **PostgreSQL:** Banco de dados relacional de código aberto.
*   **Docker:** Plataforma para desenvolver, implantar e executar aplicativos em contêineres.
*   **RabbitMQ:** Message broker para comunicação assíncrona entre os serviços.
* **Socket.IO:** Biblioteca para comunicação em tempo real via WebSocket.

## Estrutura do Projeto

O projeto é organizado em uma estrutura de microsserviço, com os seguintes serviços principais:

*   `application-service`: Gerencia a lógica principal da aplicação, como usuários, corridas e veículos.
*   `validation-service`: Cuida da validação de documentos e dados dos usuários.

### Estrutura do Serviço de Aplicação

O serviço de aplicação possui a seguinte estrutura de pastas:

```
application-service/
├── prisma/              # Configuração e migrações do Prisma
│   ├── schema.prisma    # Schema do banco de dados
│   └── migrations/      # Migrações do banco de dados
├── src/
│   ├── application/     # Casos de uso da aplicação
│   ├── domain/          # Entidades e regras de negócio
│   ├── infrastructure/  # Implementações concretas e configurações
│   ├── presentation/    # Controladores e rotas da API
│   ├── app.js           # Configuração da aplicação Express
│   ├── [server.js](http://_vscodecontentref_/0)        # Ponto de entrada da aplicação
│   └── swagger.js       # Configuração do Swagger
└── package.json         # Dependências e scripts
```

### Estrutura do Serviço de Validação

O serviço de validação possui a seguinte estrutura de pastas:

```
validation-service/
├── prisma/              # Configuração e migrações do Prisma
├── src/
│   ├── controllers/     # Controladores da API
│   ├── services/        # Lógica de validação
│   ├── models/          # Modelos de dados
│   └── routes/          # Rotas da API
└── package.json         # Dependências e scripts
```

### Estrutura do Serviço de Notificação

O serviço de notificação possui a seguinte estrutura de pastas:

```
notification-service/
├── src/
│   ├── controllers/     # Controladores da API
│   ├── services/        # Lógica de notificações
│   ├── models/          # Modelos de dados
│   └── routes/          # Rotas da API
└── package.json         # Dependências e scripts
```

## Como Executar o Projeto com Docker

Siga as instruções abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento usando Docker.

### Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas:

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Instalação e Execução

1.  Clone o repositório:

    ```bash
    git clone https://github.com/seu-usuario/backend-mobile-2.git
    cd backend-mobile-2
    ```

2.  Na raiz do projeto, execute o seguinte comando para construir e iniciar os contêineres:

    ```bash
    docker-compose up --build
    ```

3.  Os serviços estarão disponíveis nos seguintes endereços:

    *   **Application Service:** `http://localhost:4040`
    *   **Validation Service:** `http://localhost:4042`
    *   **Notification Service:** `http://localhost:4044`

## Documentação da API (Swagger)

Cada serviço expõe sua própria documentação da API usando Swagger.

*   **Application Service:** [http://localhost:4040/swagger](http://localhost:4040/swagger)
*   **Validation Service:** [http://localhost:4042/swagger](http://localhost:4042/swagger)
*   **Notification Service:** [http://localhost:4044/swagger](http://localhost:4044/swagger)

## Serviços

### Application Service

*   **Descrição:** O coração do sistema. Gerencia usuários, autenticação, corridas, veículos e a comunicação entre passageiros e motoristas.
*   **Endpoints Principais:**
    *   `/auth`: Autenticação de usuários.
    *   `/users`: Gerenciamento de usuários.
    *   `/rides`: Criação e gerenciamento de corridas.
    *   `/vehicles`: Cadastro e gerenciamento de veículos.
    *   `/groups`: Gerenciamento de grupos de caronas.
    *   `/chats`: Comunicação entre usuários.

### Validation Service

*   **Descrição:** Lida com a validação de documentos de motoristas e veículos, garantindo que estejam em conformidade com as políticas.
*   **Endpoints Principais:**
    *   `/validations`: Submissão e verificação de documentos.

### Notification Service

*   **Descrição:** Gerencia notificações e mensagens entre os usuários.
*   **Endpoints Principais:**
    * `/notifications`: Envio e gerenciamento de notificações.
    * `/messages`: Comunicação em tempo real.

# Solução de Problemas

### Erro de Conexão com o Banco de Dados

- Verifique se o PostgreSQL está em execução.
- Confirme se as credenciais no arquivo `.env` estão corretas.
- Certifique-se de que o banco de dados especificado existe.

### Erro nas Migrações

Se ocorrerem problemas durante a migração:

```bash
# Redefina o banco de dados (cuidado: isso apaga todos os dados!)
npx prisma migrate reset

# Aplique novamente as migrações
npm run prisma:migrate
```

## Ferramentas Adicionais

### Prisma Studio
Para visualizar e editar os dados do banco de dados através de uma interface gráfica:
```bash
npm run prisma:studio
```

O Prisma Studio estará disponível em http://localhost:5555.

## Contribuição
Contribuições são bem-vindas! Siga os passos abaixo para contribuir:

1. Faça um fork do repositório.
2. Crie uma branch para sua funcionalidade (git checkout -b minha-funcionalidade).
3. Commit suas alterações (git commit -m 'Adiciona nova funcionalidade').
4. Envie para o repositório remoto (git push origin minha-funcionalidade).
5. Abra um Pull Request.

##Licença
Este projeto está licenciado sob a MIT License.```