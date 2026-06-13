// src/events/ready.js

const config  = require('../config');
const paineis = require('../panels/paineis');

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);
    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'FDN — Família do Norte', type: 4 }],
    });

    // Descomente APENAS na primeira execução para enviar os painéis
     //await configurarPaineis(client);
  },
};

async function configurarPaineis(client) {
  const pares = [
    { canalId: config.canais.registro,     painel: paineis.painelRegistro() },
    { canalId: config.canais.recrutamento, painel: paineis.painelRecrutamento() },
    { canalId: config.canais.batePonto,    painel: paineis.painelBatePonto() },
    { canalId: config.canais.ausencias,    painel: paineis.painelAusencias() },
    { canalId: config.canais.punicao,      painel: paineis.painelPunicao() },
    { canalId: config.canais.adminPanel,   painel: paineis.painelAdmin() },
    { canalId: config.canais.tickets,      painel: paineis.painelTickets() },
  ];

  for (const { canalId, painel } of pares) {
    if (!canalId || canalId.startsWith('ID_')) continue;
    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) { console.warn(`⚠️ Canal não encontrado: ${canalId}`); continue; }
    await canal.send(painel).catch(err => console.error('Erro ao enviar painel:', err));
    console.log(`📋 Painel enviado → #${canal.name}`);
  }
}
