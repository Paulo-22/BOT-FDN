// src/logs/logger.js
// Sistema centralizado de logs — FDN (redesenhado)

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

const SEPARADOR = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — envia embed para o canal de log correto
// ─────────────────────────────────────────────────────────────────────────────
async function enviarLog(client, tipo, payload) {
  try {
    const canalId = config.canais.logs[tipo];
    if (!canalId || canalId.startsWith('ID_')) return;
    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) return;
    await canal.send(typeof payload === 'object' && payload.embeds ? payload : { embeds: [payload] });
  } catch (err) {
    console.error(`[LOG ERROR] (${tipo}):`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────────────────────────────────────
async function logRegistro(client, usuario, novoNick) {
  const nick = novoNick || `𝑭𝑫𝑵 » ${usuario.nome_mta} ${usuario.id_gamer}`;
  const ts   = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(config.cores.sucesso)
    .setAuthor({ name: '📋  NOVO REGISTRO  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `> <@${usuario.discord_id}> acabou de se registrar na **FDN**.\n\n` +
      `**👤  Membro:** <@${usuario.discord_id}>\n` +
      `**🏷️  Nick atribuído:** \`${nick}\`\n` +
      `**🎮  Nome MTA:** \`${usuario.nome_mta}\`\n` +
      `**🔑  Login:** \`${usuario.login}\`\n` +
      `**🆔  ID na cidade:** \`${usuario.id_gamer}\`\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Registro' })
    .setTimestamp();

  await enviarLog(client, 'registro', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// RECRUTAMENTO
// ─────────────────────────────────────────────────────────────────────────────
async function logRecrutamento(client, candidatura, acao, responsavel) {
  const aprovado = acao === 'APROVADA';
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(aprovado ? config.cores.sucesso : config.cores.erro)
    .setAuthor({ name: `${aprovado ? '✅' : '❌'}  CANDIDATURA ${acao}  ·  FDN` })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Candidato:** <@${candidatura.discord_id}>\n` +
      `**🎮  Nome MTA:** \`${candidatura.nome}\`\n` +
      `**🆔  ID Gamer:** \`${candidatura.id_gamer}\`\n` +
      `**📋  Status:** \`${acao}\`\n` +
      `**🛡️  Responsável:** <@${responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Recrutamento' })
    .setTimestamp();

  await enviarLog(client, 'recrutamento', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITAL
// ─────────────────────────────────────────────────────────────────────────────
async function logEdital(client, edital, acao, responsavel) {
  const aprovado = acao === 'APROVADA';
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(aprovado ? config.cores.sucesso : config.cores.erro)
    .setDescription(
      `${SEPARADOR}\n\n` +
      `> <@${edital.discord_id}>, seu formulário foi **analisado** e **${aprovado ? 'aprovado' : 'reprovado'}**.\n\n` +
      (aprovado
        ? '✅ Parabéns! Confira as instruções enviadas no seu **privado** para dar continuidade ao processo.'
        : '❌ Você poderá tentar novamente após o período de espera definido pela staff.') +
      `\n\n**🛡️  Analisado por:** <@${responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setImage(aprovado ? config.banners?.aprovado || null : config.banners?.reprovado || null)
    .setFooter({ text: 'FDN — Formulário de Recrutamento' })
    .setTimestamp();

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
          .setLabel(aprovado ? '✅  Aprovado' : '❌  Reprovado')
          .setStyle(aprovado ? ButtonStyle.Success : ButtonStyle.Danger)
          .setDisabled(true),
      ),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function logPromocao(client, dados) {
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(config.cores.sucesso)
    .setAuthor({ name: '⬆️  PROMOÇÃO REGISTRADA  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro:** <@${dados.usuario}>\n` +
      `**📉  Cargo anterior:** \`${dados.cargo_antigo}\`\n` +
      `**📈  Novo cargo:** \`${dados.cargo_novo}\`\n` +
      `**📝  Motivo:** ${dados.motivo}\n` +
      `**🛡️  Responsável:** <@${dados.responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Promoções' })
    .setTimestamp();

  await enviarLog(client, 'promocoes', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// REBAIXAMENTO
// ─────────────────────────────────────────────────────────────────────────────
async function logRebaixamento(client, dados) {
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(config.cores.aviso)
    .setAuthor({ name: '⬇️  REBAIXAMENTO REGISTRADO  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro:** <@${dados.usuario}>\n` +
      `**📈  Cargo anterior:** \`${dados.cargo_antigo}\`\n` +
      `**📉  Novo cargo:** \`${dados.cargo_novo}\`\n` +
      `**📝  Motivo:** ${dados.motivo}\n` +
      `**🛡️  Responsável:** <@${dados.responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Rebaixamentos' })
    .setTimestamp();

  await enviarLog(client, 'rebaixamentos', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVERTÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function logAdvertencia(client, dados) {
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(config.cores.aviso)
    .setAuthor({ name: '⚠️  ADVERTÊNCIA REGISTRADA  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro advertido:** <@${dados.usuario}>\n` +
      `**📝  Motivo:** ${dados.motivo}\n` +
      `**🛡️  Responsável:** <@${dados.responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Advertências' })
    .setTimestamp();

  await enviarLog(client, 'advertencias', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXONERAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function logExoneracao(client, dados) {
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(config.cores.erro)
    .setAuthor({ name: '🚫  EXONERAÇÃO REGISTRADA  ·  FDN' })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro exonerado:** <@${dados.usuario}>\n` +
      `**📝  Motivo:** ${dados.motivo}\n` +
      `**🛡️  Responsável:** <@${dados.responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Exonerações' })
    .setTimestamp();

  await enviarLog(client, 'exoneracoes', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUSÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function logAusencia(client, ausencia, acao, responsavel) {
  const cores = { APROVADA: config.cores.sucesso, REPROVADA: config.cores.erro, PENDENTE: config.cores.info };
  const icone = { APROVADA: '✅', REPROVADA: '❌', PENDENTE: '📋' };
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(cores[acao] ?? config.cores.neutro)
    .setAuthor({ name: `${icone[acao] ?? '📋'}  AUSÊNCIA ${acao}  ·  FDN` })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro:** <@${ausencia.usuario}>\n` +
      `**📅  Período:** \`${ausencia.data_inicio}\` → \`${ausencia.data_fim}\`\n` +
      `**📝  Motivo:** ${ausencia.motivo}\n` +
      (responsavel ? `**🛡️  Responsável:** <@${responsavel}>\n` : '') +
      `**🕐  Registrado em:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Ausências' })
    .setTimestamp();

  await enviarLog(client, 'ausencias', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKET
// ─────────────────────────────────────────────────────────────────────────────
async function logTicket(client, ticket, acao) {
  const aberto = acao === 'ABERTO';
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(aberto ? config.cores.info : config.cores.neutro)
    .setAuthor({ name: `🎫  TICKET ${acao}  ·  FDN` })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Autor:** <@${ticket.autor_id}>\n` +
      `**📂  Categoria:** \`${ticket.tipo}\`\n` +
      `**💬  Canal:** <#${ticket.canal_id}>\n` +
      `**📋  Status:** \`${acao}\`\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Tickets' })
    .setTimestamp();

  await enviarLog(client, 'tickets', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// BATE-PONTO
// ─────────────────────────────────────────────────────────────────────────────
async function logBatePonto(client, dados, acao) {
  const iniciado = acao === 'LIGAR';
  const agora    = Math.floor(Date.now() / 1000);

  let descricao;

  if (iniciado) {
    descricao =
      `${SEPARADOR}\n\n` +
      `**👤  Membro:** <@${dados.usuario}>\n` +
      `**🟢  Início:** <t:${agora}:T> — <t:${agora}:d>\n\n` +
      `${SEPARADOR}`;
  } else {
    const tsInicio = dados.inicio
      ? Math.floor(new Date(dados.inicio).getTime() / 1000)
      : agora;
    const total  = dados.tempo_total ? formatarTempo(dados.tempo_total) : '00h 00min';
    const motivo = dados.automatico ? 'Saiu do canal de voz.' : 'Encerrou manualmente.';

    descricao =
      `${SEPARADOR}\n\n` +
      `**👤  Membro:** <@${dados.usuario}>\n` +
      `**🟢  Início:** <t:${tsInicio}:T>\n` +
      `**🔴  Término:** <t:${agora}:T>\n` +
      `**⏱️  Total registrado:** \`${total}\`\n` +
      `**📌  Motivo:** ${motivo}\n\n` +
      `${SEPARADOR}`;
  }

  const embed = new EmbedBuilder()
    .setColor(iniciado ? config.cores.sucesso : config.cores.neutro)
    .setAuthor({ name: `${iniciado ? '🟢' : '🔴'}  PONTO ${iniciado ? 'INICIADO' : 'FINALIZADO'}  ·  FDN` })
    .setDescription(descricao)
    .setFooter({ text: 'FDN — Sistema de Bate-Ponto' })
    .setTimestamp();

  await enviarLog(client, 'batePonto', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNIÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function logPunicao(client, dados) {
  const labels = {
    PUNICAO_1: '⚠️  Punição Nível 1',
    PUNICAO_2: '🔶  Punição Nível 2',
    PUNICAO_3: '🔴  Punição Nível 3',
    REMOCAO:   '🚫  Remoção',
  };
  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(config.cores.erro)
    .setAuthor({ name: `⚖️  PUNIÇÃO APLICADA  ·  FDN` })
    .setDescription(
      `${SEPARADOR}\n\n` +
      `**👤  Membro punido:** <@${dados.usuario}>\n` +
      `**⚖️  Tipo:** \`${labels[dados.tipo] ?? dados.tipo}\`\n` +
      `**📝  Motivo:** ${dados.motivo}\n` +
      `**🛡️  Responsável:** <@${dados.responsavel}>\n` +
      `**📅  Data:** <t:${ts}:F>\n\n` +
      `${SEPARADOR}`
    )
    .setFooter({ text: 'FDN — Sistema de Punições' })
    .setTimestamp();

  await enviarLog(client, 'punicoes', embed);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIO
// ─────────────────────────────────────────────────────────────────────────────
function formatarTempo(segundos) {
  const h = Math.floor(Math.abs(segundos) / 3600);
  const m = Math.floor((Math.abs(segundos) % 3600) / 60);
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
  logPunicao,
  formatarTempo,
};