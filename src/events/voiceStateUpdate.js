// src/events/voiceStateUpdate.js
// Encerra ponto automaticamente quando o usuário sai da call

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const horasService = require('../services/horasService');
const logger = require('../logs/logger');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(oldState, newState) {
    const userId = oldState.id || newState.id;

    // Verifica se saiu de um canal de voz autorizado
    const eraCanalAutorizado = oldState.channelId && config.canais.voiceAutorizados.includes(oldState.channelId);
    const entrou = newState.channelId !== null;
    const saiu = !entrou || (oldState.channelId !== newState.channelId);

    if (!eraCanalAutorizado || !saiu) return;

    // Tenta encerrar o ponto
    const resultado = await horasService.encerrarPonto(userId);
    if (resultado.erro) return; // Sem ponto ativo, ignora

    // Log
    await logger.logBatePonto(oldState.client, { usuario: userId, tempo_total: resultado.tempoTotal, inicio: resultado.hora.inicio, automatico: true }, 'DESLIGAR');

    // DM para o usuário
    try {
      const user = await oldState.client.users.fetch(userId);
      await user.send({
        embeds: [new EmbedBuilder()
          .setColor(config.cores.neutro)
          .setTitle('🔴 Ponto Encerrado Automaticamente')
          .setDescription(
            'Seu ponto foi encerrado automaticamente por você ter **saído do canal de voz**.\n\n' +
            `⏱️ Tempo registrado: **${logger.formatarTempo(resultado.tempoTotal)}**`
          )
          .setTimestamp()
          .setFooter({ text: 'FDN - Bate-Ponto Automático' })
        ],
      });
    } catch (_) {
      // DMs desativadas, ignora
    }
  },
};
