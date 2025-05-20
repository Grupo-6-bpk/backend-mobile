import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()

async function main() {
  const users = [
    {
      name: 'João',
      last_name: 'Silva',
      email: 'joao@example.com',
      password: 'senha123',
      cpf: '12345678900',
      phone: '11999999999',
      street: 'Rua A',
      number: 100,
      city: 'São Paulo',
      zipcode: '01001000',
      verified: true,
    },
    {
      name: 'Maria',
      last_name: 'Oliveira',
      email: 'maria@example.com',
      password: 'senha123',
      cpf: '98765432100',
      phone: '11988888888',
      street: 'Avenida B',
      number: 200,
      city: 'Rio de Janeiro',
      zipcode: '20040002',
      verified: false,
    },
    {
      name: 'Carlos',
      last_name: 'Pereira',
      email: 'carlos@example.com',
      password: 'senha123',
      verified: true,
    },
  ]

  for (const user of users) {
    await prisma.user.create({
      data: user,
    })
  }

  console.log('Seed de usuários concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
