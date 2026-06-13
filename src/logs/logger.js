// src/logs/logger.js
// Sistema centralizado de logs para canais do Discord

const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Envia um log para o canal correspondente
 * @param {Client} client - O cliente Discord
 * @param {string} tipo - Tipo do log (registro, recrutamento, etc.)
 * @param {EmbedBuilder} embed - O embed a ser enviado
 */
async function enviarLog(client, tipo, embed) {
  try {
    const canalId = config.canais.logs[tipo];
    if (!canalId || canalId.startsWith('ID_')) return; // Canal não configurado

    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) return;

    await canal.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[LOG ERROR] Falha ao enviar log (${tipo}):`, err.message);
  }
}

// ============================================================
// FUNÇÕES DE LOG POR MÓDULO
// ============================================================

async function logRegistro(client, usuario) {
  const embed = new EmbedBuilder()
    .setColor(config.cores.sucesso)
    .setTitle('📋 Novo Registro')
    .addFields(
      { name: 'Discord', value: `<@${usuario.discord_id}>`, inline: true },
      { name: 'Nome MTA', value: usuario.nome_mta, inline: true },
      { name: 'ID Gamer', value: usuario.id_gamer, inline: true },
      { name: 'Telefone', value: usuario.telefone || 'Não informado', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Registro' });

  await enviarLog(client, 'registro', embed);
}

async function logRecrutamento(client, candidatura, acao, responsavel) {
  const cor = acao === 'APROVADA' ? config.cores.sucesso : config.cores.erro;
  const emoji = acao === 'APROVADA' ? '✅' : '❌';

  const embed = new EmbedBuilder()
    .setColor(cor)
    .setTitle(`${emoji} Candidatura ${acao}`)
    .addFields(
      { name: 'Candidato', value: `<@${candidatura.discord_id}>`, inline: true },
      { name: 'Nome', value: candidatura.nome, inline: true },
      { name: 'ID Gamer', value: candidatura.id_gamer, inline: true },
      { name: 'Responsável', value: `<@${responsavel}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Recrutamento' });

  await enviarLog(client, 'recrutamento', embed);
}

async function logPromocao(client, dados) {
  const embed = new EmbedBuilder()
    .setColor(config.cores.gold)
    .setTitle('⬆️ Promoção Registrada')
    .addFields(
      { name: 'Membro', value: `<@${dados.usuario}>`, inline: true },
      { name: 'Cargo Anterior', value: dados.cargo_antigo, inline: true },
      { name: 'Novo Cargo', value: dados.cargo_novo, inline: true },
      { name: 'Motivo', value: dados.motivo },
      { name: 'Responsável', value: `<@${dados.responsavel}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Promoções' });

  await enviarLog(client, 'promocoes', embed);
}

async function logRebaixamento(client, dados) {
  const embed = new EmbedBuilder()
    .setColor(config.cores.aviso)
    .setTitle('⬇️ Rebaixamento Registrado')
    .addFields(
      { name: 'Membro', value: `<@${dados.usuario}>`, inline: true },
      { name: 'Cargo Anterior', value: dados.cargo_antigo, inline: true },
      { name: 'Novo Cargo', value: dados.cargo_novo, inline: true },
      { name: 'Motivo', value: dados.motivo },
      { name: 'Responsável', value: `<@${dados.responsavel}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Rebaixamentos' });

  await enviarLog(client, 'rebaixamentos', embed);
}

async function logAdvertencia(client, dados) {
  const embed = new EmbedBuilder()
    .setColor(config.cores.erro)
    .setTitle('⚠️ Advertência Aplicada')
    .addFields(
      { name: 'Membro', value: `<@${dados.usuario}>`, inline: true },
      { name: 'Motivo', value: dados.motivo },
      { name: 'Responsável', value: `<@${dados.responsavel}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Advertências' });

  await enviarLog(client, 'advertencias', embed);
}

async function logExoneracao(client, dados) {
  const embed = new EmbedBuilder()
    .setColor(config.cores.erro)
    .setTitle('🚫 Exoneração Registrada')
    .addFields(
      { name: 'Membro', value: `<@${dados.usuario}>`, inline: true },
      { name: 'Motivo', value: dados.motivo },
      { name: 'Responsável', value: `<@${dados.responsavel}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Exonerações' });

  await enviarLog(client, 'exoneracoes', embed);
}

async function logAusencia(client, ausencia, acao, responsavel) {
  const cor = acao === 'APROVADA' ? config.cores.sucesso : acao === 'REPROVADA' ? config.cores.erro : config.cores.info;
  const emoji = acao === 'APROVADA' ? '✅' : acao === 'REPROVADA' ? '❌' : '📋';

  const embed = new EmbedBuilder()
    .setColor(cor)
    .setTitle(`${emoji} Ausência ${acao}`)
    .addFields(
      { name: 'Membro', value: `<@${ausencia.usuario}>`, inline: true },
      { name: 'Status', value: acao, inline: true },
      { name: 'Período', value: `${ausencia.data_inicio} → ${ausencia.data_fim}`, inline: true },
      { name: 'Motivo', value: ausencia.motivo },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Ausências' });

  if (responsavel) embed.addFields({ name: 'Responsável', value: `<@${responsavel}>`, inline: true });

  await enviarLog(client, 'ausencias', embed);
}

async function logTicket(client, ticket, acao) {
  const embed = new EmbedBuilder()
    .setColor(acao === 'ABERTO' ? config.cores.info : config.cores.neutro)
    .setTitle(`🎫 Ticket ${acao}`)
    .addFields(
      { name: 'Autor', value: `<@${ticket.autor_id}>`, inline: true },
      { name: 'Tipo', value: ticket.tipo, inline: true },
      { name: 'Canal', value: `<#${ticket.canal_id}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'FDN - Sistema de Tickets' });

  await enviarLog(client, 'tickets', embed);
}

async function logBatePonto(client, dados, acao) {
  const embed = new EmbedBuilder()
    .setColor(acao === 'LIGAR' ? config.cores.sucesso : config.cores.neutro)
    .setTitle(`${acao === 'LIGAR' ? '🟢' : '🔴'} Ponto ${acao === 'LIGAR' ? 'Iniciado' : 'Encerrado'}`)
    .addFields(
      { name: 'Membro', value: `<@${dados.usuario}>`, inline: true },
    );

  if (acao === 'DESLIGAR' && dados.tempo_total) {
    embed.addFields({ name: 'Tempo', value: formatarTempo(dados.tempo_total), inline: true });
  }

  embed.setTimestamp().setFooter({ text: 'FDN - Bate-Ponto' });

  await enviarLog(client, 'batePonto', embed);
}

// Formata segundos em hh:mm:ss
function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

module.exports = {
  logRegistro,
  logRecrutamento,
  logPromocao,
  logRebaixamento,
  logAdvertencia,
  logExoneracao,
  logAusencia,
  logTicket,
  logBatePonto,
  formatarTempo,
};
