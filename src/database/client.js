// src/database/client.js
// Instância única do Prisma Client

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// Testa conexão ao iniciar
async function conectar() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados conectado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
}

module.exports = { prisma, conectar };
