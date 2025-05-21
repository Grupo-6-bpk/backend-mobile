#!/bin/sh
set -e

# Gera o cliente Prisma
echo "Generating Prisma client..."
npx prisma generate

# Aguarda o banco de dados estar pronto
echo "Waiting for database to be ready..."
sleep 5

# Verifica se já existe uma pasta de migrações
if [ ! -d "/app/prisma/migrations" ] || [ -z "$(ls -A /app/prisma/migrations)" ]; then
  echo "No migrations found. Creating and applying initial migration..."
  
  # Executa a primeira migração de forma não interativa
  echo "Creating migration files..."
  npx prisma migrate dev --name initial-migration --create-only
  
  echo "Applying migration (schema push)..."
  # Usa schema push para forçar a criação das tabelas no primeiro uso
  # Isso garante que as tabelas sejam criadas mesmo que as migrações tenham problemas
  npx prisma db push --force-reset
  
  echo "Initial schema setup completed."
else
  # Aplica as migrações existentes
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

# População inicial do banco de dados
echo "Seeding the database..."
npm run seed

# Inicia a aplicação
echo "Starting application..."
exec "$@"

