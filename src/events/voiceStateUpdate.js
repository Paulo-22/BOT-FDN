

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const horasService = require('../services/horasService');
const logger = require('../logs/logger');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(oldState, newState) {

    const userId = oldState.id || newState.id;

    const eraCanalAutorizado =
      oldState.channelId &&
      config.canais.voiceAutorizados.includes(oldState.channelId);

    const saiu =
      !newState.channelId ||
      oldState.channelId !== newState.channelId;

    if (!eraCanalAutorizado || !saiu) {
      return;
    }

    const resultado = await horasService.encerrarPonto(userId);

    if (resultado.erro) {
      return;
    }

    await logger.logBatePonto(
      oldState.client,
      {
        usuario: userId,
        tempo_total: resultado.tempoTotal,
        inicio: resultado.hora.inicio,
        automatico: true,
      },
      'DESLIGAR'
    );

    try {

      const user = await oldState.client.users.fetch(userId);

      await user.send({

        embeds: [

          new EmbedBuilder()
            .setColor(config.cores.neutro)
            .setAuthor({
              name: '🔴 PONTO ENCERRADO AUTOMATICAMENTE · FDN',
            })
            .setDescription(
              `> Seu ponto foi encerrado por você ter **saído do canal de voz**.\n\n` +
              `**⏱️ Tempo registrado:** \`${logger.formatarTempo(resultado.tempoTotal)}\``
            )
            .setFooter({
              text: 'FDN — Bate-Ponto Automático',
            })
            .setTimestamp(),

        ],

      });

    } catch (_) {
      // Ignora erro caso o usuário esteja com DMs fechadas
    }

  },
};