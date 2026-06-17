

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  UserSelectMenuBuilder,
} = require('discord.js');

const config        = require('../config');
const modals        = require('../modals/modals');
const horasService  = require('../services/horasService');
const editalService = require('../services/editalService');
const { prisma }    = require('../database/client');
const logger        = require('../logs/logger');
const perm          = require('../utils/permissoes');

const SEPARADOR = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

// ─── Cooldown duplo-clique ────────────────────────────────────────────────────
const cooldowns = new Map();
function emCooldown(userId, ms = 5000) {
  const agora = Date.now();
  if (agora - (cooldowns.get(userId) ?? 0) < ms) return true;
  cooldowns.set(userId, agora);
  return false;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const semPermissao = (i) =>
  i.reply({ embeds: [perm.embedSemPermissao()], ephemeral: true });

const erroCatch = async (i, err) => {
  console.error('[BUTTON ERROR]', err);
  const payload = { content: '❌ Ocorreu um erro ao processar esta ação.', ephemeral: true };
  i.replied || i.deferred ? i.followUp(payload) : i.reply(payload);
};

function disableRow(label, style) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('_disabled').setLabel(label).setStyle(style).setDisabled(true),
    ),
  ];
}

async function userSelect(interaction, acao, titulo, placeholder) {
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.principal)
        .setTitle(titulo)
        .setDescription(`${SEPARADOR}\n\n> 👇 Selecione o membro abaixo para continuar:\n\n${SEPARADOR}`),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`userselect_${acao}`)
          .setPlaceholder(placeholder)
          .setMinValues(1).setMaxValues(1),
      ),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROTEADOR
// ─────────────────────────────────────────────────────────────────────────────
async function handleButton(interaction) {
  const { customId, member } = interaction;
  try {
    // Modais diretos
    if (customId === 'btn_registro')           return interaction.showModal(modals.modalRegistro());
    if (customId === 'btn_candidatar')         return interaction.showModal(modals.modalCandidatura());
    if (customId === 'btn_iniciar_edital')     return interaction.showModal(modals.modalEditalNome());
    if (customId === 'btn_transferencia')      return interaction.showModal(modals.modalTransferencia());
    if (customId === 'btn_solicitar_ausencia') return interaction.showModal(modals.modalAusencia());

    // Edital
    if (customId.startsWith('btn_responder_edital_'))
      return editalService.iniciarColetaRespostas(interaction);
    if (customId.startsWith('btn_aprovar_edital_')) {
      if (!perm.podeAnalisarEdital(member)) return semPermissao(interaction);
      return editalService.aprovarEdital(interaction, customId.replace('btn_aprovar_edital_', ''));
    }
    if (customId.startsWith('btn_reprovar_edital_')) {
      if (!perm.podeAnalisarEdital(member)) return semPermissao(interaction);
      return editalService.reprovarEdital(interaction, customId.replace('btn_reprovar_edital_', ''));
    }

    // Gestão de membros
    if (customId === 'btn_promover') {
      if (!perm.podePRomover(member)) return semPermissao(interaction);
      return userSelect(interaction, 'promover', '⬆️ Promover Membro', 'Selecione o membro...');
    }
    if (customId === 'btn_rebaixar') {
      if (!perm.podeRebaixar(member)) return semPermissao(interaction);
      return userSelect(interaction, 'rebaixar', '⬇️ Rebaixar Membro', 'Selecione o membro...');
    }
    if (customId === 'btn_advertir') {
      if (!perm.podeAdvertir(member)) return semPermissao(interaction);
      return userSelect(interaction, 'advertir', '⚠️ Advertir Membro', 'Selecione o membro...');
    }
    if (customId === 'btn_exonerar') {
      if (!perm.podeExonerar(member)) return semPermissao(interaction);
      return userSelect(interaction, 'exonerar', '🚫 Exonerar Membro', 'Selecione o membro...');
    }

    // Dashboard
    if (customId === 'btn_add_horas') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return userSelect(interaction, 'add_horas', '➕ Adicionar Horas', 'Selecione o membro...');
    }
    if (customId === 'btn_rem_horas') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return userSelect(interaction, 'rem_horas', '➖ Remover Horas', 'Selecione o membro...');
    }
    if (customId === 'btn_consultar_membro') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return userSelect(interaction, 'consultar', '📊 Consultar Membro', 'Selecione o membro...');
    }
    if (customId === 'btn_historico') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return handleHistorico(interaction);
    }

    // Bate-ponto
    if (customId === 'btn_ligar')        return handleLigar(interaction);
    if (customId === 'btn_desligar')     return handleDesligar(interaction);
    if (customId === 'btn_minhas_horas') return handleMinhasHoras(interaction);
    if (customId === 'btn_ranking')      return handleRanking(interaction);

    // Aprovações dinâmicas
    const aprovacoesMap = {
      'btn_aprovar_candidatura_':  [perm.podeAprovarRecrutamento, handleAprovarCandidatura],
      'btn_reprovar_candidatura_': [perm.podeAprovarRecrutamento, handleReprovarCandidatura],
      'btn_aprovar_ausencia_':     [perm.podeAprovarAusencia,     handleAprovarAusencia],
      'btn_reprovar_ausencia_':    [perm.podeAprovarAusencia,     handleReprovarAusencia],
      'btn_aprovar_transfer_':     [perm.podeAprovarRecrutamento, handleAprovarTransfer],
      'btn_reprovar_transfer_':    [perm.podeAprovarRecrutamento, handleReprovarTransfer],
    };
    for (const [prefix, [checkPerm, handler]] of Object.entries(aprovacoesMap)) {
      if (customId.startsWith(prefix)) {
        if (!checkPerm(member)) return semPermissao(interaction);
        return handler(interaction, customId.replace(prefix, ''));
      }
    }

    // Exoneração — confirmação e prosseguimento
    if (customId.startsWith('btn_prosseguir_exonerar_')) {
      const userId = customId.replace('btn_prosseguir_exonerar_', '');
      const membro = await interaction.guild.members.fetch(userId).catch(() => null);
      const nome   = membro?.displayName ?? `<@${userId}>`;
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.erro)
          .setDescription(`🚫 Abrindo formulário de exoneração para **${nome}**...`)],
        components: [],
      });
      return interaction.showModal(modals.modalMotivoSimples('exoneracao', userId, nome));
    }
    if (customId.startsWith('btn_cancelar_acao_')) {
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.neutro).setDescription('❌ Ação cancelada.')],
        components: [],
      });
    }

    // Tickets
    if (customId.startsWith('btn_ticket_'))
      return handleCriarTicket(interaction, customId.replace('btn_ticket_', '').toUpperCase());
    if (customId === 'btn_fechar_ticket')
      return handleFecharTicket(interaction);

  } catch (err) { erroCatch(interaction, err); }
}

// ─────────────────────────────────────────────────────────────────────────────
// BATE-PONTO
// ─────────────────────────────────────────────────────────────────────────────
async function handleLigar(interaction) {
  if (emCooldown(interaction.user.id)) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setDescription('⏳ Aguarde alguns segundos antes de tentar novamente.')],
      ephemeral: true,
    });
  }

  const canal = interaction.member.voice?.channel;
  if (!canal) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ Você precisa estar em um **canal de voz** para iniciar o ponto.')],
      ephemeral: true,
    });
  }

  const resultado = await horasService.iniciarPonto(interaction.user.id, canal.id);
  if (resultado.erro) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso).setDescription(`⚠️ ${resultado.erro}`)],
      ephemeral: true,
    });
  }

  await logger.logBatePonto(interaction.client, { usuario: interaction.user.id }, 'LIGAR');

  const ts = Math.floor(Date.now() / 1000);
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setAuthor({ name: '🟢  PONTO INICIADO  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Membro:** ${interaction.user}\n` +
          `**🔊  Canal:** \`${canal.name}\`\n` +
          `**🕐  Início:** <t:${ts}:T>\n\n` +
          `> O ponto será encerrado ao sair do canal de voz\n` +
          `> ou manualmente pelo botão **DESLIGAR**.\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Controle de Ponto' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

async function handleDesligar(interaction) {
  if (emCooldown(interaction.user.id)) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setDescription('⏳ Aguarde alguns segundos antes de tentar novamente.')],
      ephemeral: true,
    });
  }

  const resultado = await horasService.encerrarPonto(interaction.user.id);
  if (resultado.erro) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso).setDescription(`⚠️ ${resultado.erro}`)],
      ephemeral: true,
    });
  }

  await logger.logBatePonto(interaction.client, {
    usuario:     interaction.user.id,
    inicio:      resultado.hora.inicio,
    tempo_total: resultado.tempoTotal,
    automatico:  false,
  }, 'DESLIGAR');

  const tsInicio = Math.floor(new Date(resultado.hora.inicio).getTime() / 1000);
  const tsFim    = Math.floor(Date.now() / 1000);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.neutro)
        .setAuthor({ name: '🔴  PONTO FINALIZADO  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Membro:** ${interaction.user}\n` +
          `**🟢  Início:** <t:${tsInicio}:T>\n` +
          `**🔴  Término:** <t:${tsFim}:T>\n` +
          `**⏱️  Total:** \`${logger.formatarTempo(resultado.tempoTotal)}\`\n` +
          `**📌  Motivo:** Encerrou manualmente.\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Controle de Ponto' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

async function handleMinhasHoras(interaction) {
  const stats = await horasService.getEstatisticas(interaction.user.id);
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setAuthor({ name: '⏱️  MINHAS HORAS  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Membro:** ${interaction.user}\n\n` +
          `**📅  Hoje:** \`${logger.formatarTempo(stats.hoje)}\`\n` +
          `**📆  Esta semana:** \`${logger.formatarTempo(stats.semana)}\`\n` +
          `**🗓️  Este mês:** \`${logger.formatarTempo(stats.mes)}\`\n\n` +
          `**🏆  Total geral:** \`${logger.formatarTempo(stats.total)}\`\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Estatísticas de Ponto' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

async function handleRanking(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const agora = new Date();
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay() + 1);
  inicioSemana.setHours(0, 0, 0, 0);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [geral, semanal, mensal] = await Promise.all([
    horasService.getRankingGeral(),
    horasService.getRankingPeriodo(inicioSemana),
    horasService.getRankingPeriodo(inicioMes),
  ]);

  const medalhas = ['🥇', '🥈', '🥉'];
  const fmt = (arr) =>
    arr.length
      ? arr.map((r, i) => `${medalhas[i] ?? '🏅'} <@${r.usuario}> — \`${logger.formatarTempo(r.total)}\``).join('\n')
      : '_Nenhum registro encontrado._';

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.gold)
        .setAuthor({ name: '🏆  RANKING DE ATIVIDADE  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**🥇  Ranking Geral**\n${fmt(geral)}\n\n` +
          `**📆  Ranking Semanal**\n${fmt(semanal)}\n\n` +
          `**🗓️  Ranking Mensal**\n${fmt(mensal)}\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Estatísticas da Facção' })
        .setTimestamp(),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATURA
// ─────────────────────────────────────────────────────────────────────────────
async function handleAprovarCandidatura(interaction, id) {
  const candidatura = await prisma.candidatura.findUnique({ where: { id: parseInt(id) } });
  if (!candidatura) return interaction.reply({ content: '❌ Candidatura não encontrada.', ephemeral: true });

  await prisma.candidatura.update({
    where: { id: candidatura.id },
    data: { status: 'APROVADA', responsavel: interaction.user.id },
  });

  const membro = await interaction.guild.members.fetch(candidatura.discord_id).catch(() => null);
  if (membro) {
    const cargoId = config.cargos.hierarquia[0]?.id;
    if (cargoId && !cargoId.startsWith('ID_')) await membro.roles.add(cargoId).catch(() => {});
    membro.send({
      embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
        .setTitle('✅ Candidatura Aprovada!')
        .setDescription('Parabéns! Sua candidatura para a **FDN** foi **aprovada**! Bem-vindo à família! 🎉')
        .setTimestamp()],
    }).catch(() => {});
  }

  await logger.logRecrutamento(interaction.client, candidatura, 'APROVADA', interaction.user.id);
  return interaction.update({ components: disableRow('✅  Aprovada', ButtonStyle.Success) });
}

async function handleReprovarCandidatura(interaction, id) {
  const candidatura = await prisma.candidatura.findUnique({ where: { id: parseInt(id) } });
  if (!candidatura) return interaction.reply({ content: '❌ Candidatura não encontrada.', ephemeral: true });

  await prisma.candidatura.update({
    where: { id: candidatura.id },
    data: { status: 'REPROVADA', responsavel: interaction.user.id },
  });

  const membro = await interaction.guild.members.fetch(candidatura.discord_id).catch(() => null);
  membro?.send({
    embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setTitle('❌ Candidatura Reprovada')
      .setDescription('Sua candidatura para a **FDN** foi **reprovada** desta vez. Tente novamente mais tarde.')
      .setTimestamp()],
  }).catch(() => {});

  await logger.logRecrutamento(interaction.client, candidatura, 'REPROVADA', interaction.user.id);
  return interaction.update({ components: disableRow('❌  Reprovada', ButtonStyle.Danger) });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUSÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function handleAprovarAusencia(interaction, id) {
  const ausencia = await prisma.ausencia.findUnique({ where: { id: parseInt(id) } });
  if (!ausencia) return interaction.reply({ content: '❌ Ausência não encontrada.', ephemeral: true });
  await prisma.ausencia.update({ where: { id: ausencia.id }, data: { status: 'APROVADA', responsavel: interaction.user.id } });
  await logger.logAusencia(interaction.client, ausencia, 'APROVADA', interaction.user.id);
  return interaction.update({ components: disableRow('✅  Aprovada', ButtonStyle.Success) });
}

async function handleReprovarAusencia(interaction, id) {
  const ausencia = await prisma.ausencia.findUnique({ where: { id: parseInt(id) } });
  if (!ausencia) return interaction.reply({ content: '❌ Ausência não encontrada.', ephemeral: true });
  await prisma.ausencia.update({ where: { id: ausencia.id }, data: { status: 'REPROVADA', responsavel: interaction.user.id } });
  await logger.logAusencia(interaction.client, ausencia, 'REPROVADA', interaction.user.id);
  return interaction.update({ components: disableRow('❌  Reprovada', ButtonStyle.Danger) });
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function handleAprovarTransfer(interaction, id) {
  await prisma.transferencia.update({ where: { id: parseInt(id) }, data: { status: 'APROVADA', responsavel: interaction.user.id } });
  return interaction.update({ components: disableRow('✅  Aprovada', ButtonStyle.Success) });
}

async function handleReprovarTransfer(interaction, id) {
  await prisma.transferencia.update({ where: { id: parseInt(id) }, data: { status: 'REPROVADA', responsavel: interaction.user.id } });
  return interaction.update({ components: disableRow('❌  Reprovada', ButtonStyle.Danger) });
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────────────────────────────────────
async function handleCriarTicket(interaction, tipo) {
  await interaction.deferReply({ ephemeral: true });

  const existente = await prisma.ticket.findFirst({ where: { autor_id: interaction.user.id, status: 'ABERTO' } });
  if (existente) return interaction.editReply({ content: `❌ Você já tem um ticket aberto: <#${existente.canal_id}>` });

  const nomes   = { SUPORTE: '🔧suporte', DENUNCIA: '🚨denuncia', DUVIDA: '❓duvida', RECURSO: '⚖️recurso' };
  const labels  = { SUPORTE: '🔧 Suporte em Geral', DENUNCIA: '🚨 Denúncia', DUVIDA: '❓ Dúvida', RECURSO: '⚖️ Recurso' };

  const permissoes = [
    { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
  ];
  for (const id of config.cargos.podeTicketStaff) {
    if (!id.startsWith('ID_')) permissoes.push({ id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
  }

  const cat   = config.canais.categoriaTickets;
  const canal = await interaction.guild.channels.create({
    name: `${nomes[tipo] ?? 'ticket'}-${interaction.user.username}`,
    parent: !cat.startsWith('ID_') ? cat : null,
    permissionOverwrites: permissoes,
  });

  const ticket = await prisma.ticket.create({ data: { canal_id: canal.id, autor_id: interaction.user.id, tipo } });

  await canal.send({
    content: `<@${interaction.user.id}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setAuthor({ name: `🎫  ${labels[tipo]}  ·  FDN` })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `> Olá <@${interaction.user.id}>! Seu ticket foi criado com sucesso.\n` +
          `> Descreva sua solicitação e aguarde o atendimento da equipe.\n\n` +
          `**📌  Para fechar o ticket, clique no botão abaixo.**\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Sistema de Tickets' })
        .setTimestamp(),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_fechar_ticket').setLabel('FECHAR TICKET').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
      ),
    ],
  });

  await logger.logTicket(interaction.client, ticket, 'ABERTO');
  return interaction.editReply({ content: `✅ Ticket criado com sucesso! Acesse: <#${canal.id}>` });
}

async function handleFecharTicket(interaction) {
  const ticket = await prisma.ticket.findUnique({ where: { canal_id: interaction.channel.id } });
  if (!ticket || ticket.status === 'FECHADO') {
    return interaction.reply({ content: '❌ Ticket inválido ou já fechado.', ephemeral: true });
  }

  await interaction.reply({ content: '🔒 Encerrando ticket em **5 segundos**...' });

  const msgs = await interaction.channel.messages.fetch({ limit: 100 });
  const transcript = msgs.reverse()
    .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`)
    .join('\n');

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: 'FECHADO', transcript, fechado_em: new Date() },
  });

  await logger.logTicket(interaction.client, ticket, 'FECHADO');
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTÓRICO
// ─────────────────────────────────────────────────────────────────────────────
async function handleHistorico(interaction) {
  const [adv, prom, exon, pun] = await Promise.all([
    prisma.advertencia.findMany({ take: 5, orderBy: { data: 'desc' } }),
    prisma.promocao.findMany({ take: 5, orderBy: { data: 'desc' } }),
    prisma.exoneracao.findMany({ take: 5, orderBy: { data: 'desc' } }),
    prisma.punicao.findMany({ take: 5, orderBy: { data: 'desc' } }),
  ]);

  const fmt = (arr, fn) => arr.length ? arr.map(fn).join('\n') : '_Nenhum registro_';

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.principal)
        .setAuthor({ name: '📋  HISTÓRICO RECENTE  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**⚠️  Advertências**\n${fmt(adv,  a => `<@${a.usuario}> — ${a.motivo.slice(0, 40)}`)}\n\n` +
          `**⬆️  Promoções**\n${fmt(prom,    p => `<@${p.usuario}> → \`${p.cargo_novo}\``)}\n\n` +
          `**⚖️  Punições**\n${fmt(pun,      p => `<@${p.usuario}> — ${p.tipo}`)}\n\n` +
          `**🚫  Exonerações**\n${fmt(exon,  e => `<@${e.usuario}> — ${e.motivo.slice(0, 40)}`)}\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Painel Administrativo' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

module.exports = { handleButton };