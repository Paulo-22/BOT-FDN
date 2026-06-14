// src/index.js
// Ponto de entrada do bot FDN

require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { conectar } = require('./database/client');

// ============================================================
// INICIALIZAR CLIENT
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ============================================================
// CARREGAR EVENTOS AUTOMATICAMENTE
// ============================================================
const eventosDir = path.join(__dirname, 'events');
const arquivosEventos = fs.readdirSync(eventosDir).filter(f => f.endsWith('.js'));

for (const arquivo of arquivosEventos) {
  const evento = require(path.join(eventosDir, arquivo));
  if (evento.once) {
    client.once(evento.name, (...args) => evento.execute(...args));
  } else {
    client.on(evento.name, (...args) => evento.execute(...args));
  }
  console.log(`📡 Evento carregado: ${evento.name}`);
}

// ============================================================
// INICIAR
// ============================================================
async function iniciar() {
  await conectar();
  await client.login(process.env.DISCORD_TOKEN);
}

iniciar().catch(err => {
  console.error('❌ Erro crítico ao iniciar:', err);
  process.exit(1);
});