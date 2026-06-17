// src/database/client.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error']
      : ['error'],
});

async function conectar() {
  try {

    await prisma.$connect();

    console.log('✅ Banco de dados conectado!');

  } catch (err) {

    console.error('❌ Erro BD:', err);

    process.exit(1);

  }
}

module.exports = {
  prisma,
  conectar,
};