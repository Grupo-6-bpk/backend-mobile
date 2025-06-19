# Backend Mobile

## Sobre o Projeto

Este repositório contém o backend para um aplicativo de mobilidade urbana. O sistema é construído em uma arquitetura de microsserviços, projetado para ser escalável, resiliente e de fácil manutenção.

## Tecnologias

As principais tecnologias usadas neste projeto são:

*   **Node.js:** Ambiente de execução para JavaScript no servidor.
*   **Express.js:** Framework web para Node.js, usado para construir as APIs.
*   **Prisma:** ORM para Node.js e TypeScript, facilitando o acesso ao banco de dados.
*   **PostgreSQL:** Banco de dados relacional de código aberto.
*   **Docker:** Plataforma para desenvolver, implantar e executar aplicativos em contêineres.
*   **RabbitMQ:** Message broker para comunicação assíncrona entre os serviços.

## Estrutura do Projeto

O projeto é organizado em uma estrutura de monorepo, com os seguintes serviços principais:

*   `application-service`: Gerencia a lógica principal da aplicação, como usuários, corridas e veículos.
*   `validation-service`: Cuida da validação de documentos e dados dos usuários.

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

## Documentação da API (Swagger)

Cada serviço expõe sua própria documentação da API usando Swagger.

*   **Application Service:** [http://localhost:4040/swagger](http://localhost:4040/swagger)
*   **Validation Service:** [http://localhost:4042/swagger](http://localhost:4042/swagger)

## Serviços

Abaixo está uma breve descrição de cada serviço e suas responsabilidades.

### Application Service

*   **Descrição:** O coração do sistema. Gerencia usuários, autenticação, corridas, veículos e a comunicação entre passageiros e motoristas.
*   **Endpoints Principais:**
    *   `/auth`: Autenticação de usuários.
    *   `/users`: Gerenciamento de usuários.
    *   `/rides`: Criação e gerenciamento de corridas.
    *   `/vehicles`: Cadastro e gerenciamento de veículos.

### Validation Service

*   **Descrição:** Lida com a validação de documentos de motoristas e veículos, garantindo que estejam em conformidade com as políticas.
*   **Endpoints Principais:**
    *   `/validations`: Submissão e verificação de documentos.
