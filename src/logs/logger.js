// src/logs/logger.js
// Sistema centralizado de logs para canais do Discord

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

async function enviarLog(client, tipo, embed) {
  try {
    const canalId = config.canais.logs[tipo];
    if (!canalId || canalId.startsWith('ID_')) return;
    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) return;
    await canal.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[LOG ERROR] Falha ao enviar log (${tipo}):`, err.message);
  }
}

async function logEdital(client, edital, acao, responsavel) {
  const aprovado = acao === 'APROVADA';
  const cor = aprovado ? config.cores.sucesso : config.cores.erro;

  const linhas = [
    `• **FORMULÁRIO ${aprovado ? 'APROVADO' : 'REPROVADO'} | FDN**`,
    '',
    `Parabéns <@${edital.discord_id}> [${edital.discord_nome}] !`,
    aprovado
      ? 'Seu edital foi **analisado** e **aprovado** com sucesso.\nConfira as instruções enviadas no seu **privado** para dar continuidade e avançar para o próximo passo.'
      : 'Seu edital foi **analisado** e **reprovado**.\nVocê poderá tentar novamente após o período de espera definido pela staff.',
    '',
    `• **ANALISADO POR:**`,
    `<@${responsavel}>`,
  ];

const IMG_APROVADO = 'https://i.ibb.co/1JGGMZxt/aprovado.png';
  const IMG_REPROVADO = 'https://i.ibb.co/PZV7Dm1Z/reprovado.png';

  const embed = new EmbedBuilder()
    .setColor(cor)
    .setDescription(linhas.join('\n'))
    .setImage(aprovado ? IMG_APROVADO : IMG_REPROVADO);

  const canalId = config.canais.resultadoEdital;
  if (!canalId || canalId.startsWith('ID_')) return;
  const canal = await client.channels.fetch(canalId).catch(() => null);
  if (!canal) return;

  await canal.send({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('_disabled')
          .setLabel(aprovado ? 'Aprovado' : 'Reprovado')
          .setStyle(aprovado ? ButtonStyle.Success : ButtonStyle.Danger)
          .setDisabled(true),
      ),
    ],
  });
}

async function logRegistro(client, usuario, novoNick) {
  novoNick = novoNick || `𝑭𝑫𝑵 » ${usuario.nome_mta} ${usuario.id_gamer}`;

  const embed = new EmbedBuilder()
    .setColor(config.cores.sucesso)
    .setTitle('NOVO REGISTRO | FDN')
    .setDescription(
      `👤 **MEMBRO:** <@${usuario.discord_id}> [${novoNick}]\n` +
      `👤 **LOGIN:** ${usuario.login}\n` +
      `🆔 **ID:** ${usuario.id_gamer}`
    )
    .setTimestamp()
    .setFooter({ text: 'FDN — Sistema de Registro' });

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
    .setFooter({ text: 'FDN — Sistema de Recrutamento' });

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
    .setFooter({ text: 'FDN — Sistema de Promoções' });

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
    .setFooter({ text: 'FDN — Sistema de Rebaixamentos' });

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
    .setFooter({ text: 'FDN — Sistema de Advertências' });

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
    .setFooter({ text: 'FDN — Sistema de Exonerações' });

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
    .setFooter({ text: 'FDN — Sistema de Ausências' });

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
    .setFooter({ text: 'FDN — Sistema de Tickets' });

  await enviarLog(client, 'tickets', embed);
}

async function logBatePonto(client, dados, acao) {
  const iniciado = acao === 'LIGAR';
  const agora = Math.floor(Date.now() / 1000);

  let titulo, descricao;

  if (iniciado) {
    titulo = 'PONTO INICIADO';
    descricao =
      `🟢 **MEMBRO:** <@${dados.usuario}>\n` +
      `🟢 **INÍCIO:** <t:${agora}:t>`;
  } else {
    const tsInicio = dados.inicio
      ? Math.floor(new Date(dados.inicio).getTime() / 1000)
      : agora;
    const total = dados.tempo_total ? formatarTempo(dados.tempo_total) : '00h 00min';
    const motivo = dados.automatico ? 'Saiu do canal de voz.' : 'Encerrou manualmente.';

    titulo = 'PONTO FINALIZADO';
    descricao =
      `🟢 **MEMBRO:** <@${dados.usuario}>\n` +
      `🟢 **INÍCIO:** <t:${tsInicio}:t>\n` +
      `🟢 **TÉRMINO:** <t:${agora}:t>\n` +
      `🟢 **TOTAL:** ${total}\n` +
      `🟢 **MOTIVO:** ${motivo}`;
  }

  const embed = new EmbedBuilder()
    .setColor(iniciado ? config.cores.sucesso : config.cores.neutro)
    .setTitle(titulo)
    .setDescription(descricao)
    .setTimestamp();

  await enviarLog(client, 'batePonto', embed);
}

function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
}

module.exports = {
  logRegistro,
  logRecrutamento,
  logEdital,
  logPromocao,
  logRebaixamento,
  logAdvertencia,
  logExoneracao,
  logAusencia,
  logTicket,
  logBatePonto,
  formatarTempo,
};