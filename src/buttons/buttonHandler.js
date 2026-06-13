// src/buttons/buttonHandler.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  UserSelectMenuBuilder,
} = require('discord.js');

const config       = require('../config');
const modals       = require('../modals/modals');
const horasService = require('../services/horasService');
const { prisma }   = require('../database/client');
const logger       = require('../logs/logger');
const perm         = require('../utils/permissoes');

// ─────────────────────────────────────────────────────────────────────────────
// ROTEADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

async function handleButton(interaction) {
  const { customId, member, user } = interaction;

  try {
    // ── Modais diretos ────────────────────────────────────────────────────────
    if (customId === 'btn_registro')           return await interaction.showModal(modals.modalRegistro());
    if (customId === 'btn_candidatar')         return await interaction.showModal(modals.modalCandidatura());
    if (customId === 'btn_transferencia')      return await interaction.showModal(modals.modalTransferencia());
    if (customId === 'btn_solicitar_ausencia') return await interaction.showModal(modals.modalAusencia());

    // ── Ações administrativas → UserSelect (fluxo automático) ────────────────
    if (customId === 'btn_promover') {
      if (!perm.podePRomover(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'promover', '⬆️ Promover Membro', 'Selecione o membro a ser promovido...');
    }
    if (customId === 'btn_rebaixar') {
      if (!perm.podeRebaixar(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'rebaixar', '⬇️ Rebaixar Membro', 'Selecione o membro a ser rebaixado...');
    }
    if (customId === 'btn_advertir') {
      if (!perm.podeAdvertir(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'advertir', '⚠️ Advertir Membro', 'Selecione o membro a ser advertido...');
    }
    if (customId === 'btn_exonerar') {
      if (!perm.podeExonerar(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'exonerar', '🚫 Exonerar Membro', 'Selecione o membro a ser exonerado...');
    }

    // ── Dashboard (horas / consulta) ─────────────────────────────────────────
    if (customId === 'btn_add_horas') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'add_horas', '➕ Adicionar Horas', 'Selecione o membro...');
    }
    if (customId === 'btn_rem_horas') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'rem_horas', '➖ Remover Horas', 'Selecione o membro...');
    }
    if (customId === 'btn_consultar_membro') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return await mostrarUserSelect(interaction, 'consultar', '📊 Consultar Membro', 'Selecione o membro...');
    }
    if (customId === 'btn_historico') {
      if (!perm.podeDashboard(member)) return semPermissao(interaction);
      return await handleHistorico(interaction);
    }

    // ── Bate-Ponto ───────────────────────────────────────────────────────────
    if (customId === 'btn_ligar')        return await handleLigar(interaction);
    if (customId === 'btn_desligar')     return await handleDesligar(interaction);
    if (customId === 'btn_minhas_horas') return await handleMinhasHoras(interaction);
    if (customId === 'btn_ranking')      return await handleRanking(interaction);

    // ── Aprovações (candidatura, ausência, transferência) ────────────────────
    if (customId.startsWith('btn_aprovar_candidatura_'))
      return await handleAprovarCandidatura(interaction, customId.replace('btn_aprovar_candidatura_', ''));
    if (customId.startsWith('btn_reprovar_candidatura_'))
      return await handleReprovarCandidatura(interaction, customId.replace('btn_reprovar_candidatura_', ''));
    if (customId.startsWith('btn_aprovar_ausencia_'))
      return await handleAprovarAusencia(interaction, customId.replace('btn_aprovar_ausencia_', ''));
    if (customId.startsWith('btn_reprovar_ausencia_'))
      return await handleReprovarAusencia(interaction, customId.replace('btn_reprovar_ausencia_', ''));
    if (customId.startsWith('btn_aprovar_transfer_'))
      return await handleAprovarTransfer(interaction, customId.replace('btn_aprovar_transfer_', ''));
    if (customId.startsWith('btn_reprovar_transfer_'))
      return await handleReprovarTransfer(interaction, customId.replace('btn_reprovar_transfer_', ''));

    // ── Prosseguir com exoneração (abre modal de motivo) ─────────────────────
    if (customId.startsWith('btn_prosseguir_exonerar_')) {
      const userId = customId.replace('btn_prosseguir_exonerar_', '');
      const membro = await interaction.guild.members.fetch(userId).catch(() => null);
      const nome   = membro ? membro.displayName : `<@${userId}>`;
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.erro)
          .setDescription(`🚫 Abrindo formulário de exoneração para **${nome}**...`)],
        components: [],
      });
      return await interaction.showModal(modals.modalMotivoSimples('exoneracao', userId, nome));
    }
    if (customId.startsWith('btn_cancelar_acao_'))
      return await handleCancelarAcao(interaction);

    // ── Tickets ──────────────────────────────────────────────────────────────
    if (customId.startsWith('btn_ticket_')) {
      const tipo = customId.replace('btn_ticket_', '').toUpperCase();
      return await handleCriarTicket(interaction, tipo);
    }
    if (customId === 'btn_fechar_ticket') return await handleFecharTicket(interaction);

  } catch (err) {
    console.error('[BUTTON ERROR]', err);
    const msg = { content: '❌ Ocorreu um erro ao processar a ação.', ephemeral: true };
    interaction.replied || interaction.deferred
      ? interaction.followUp(msg)
      : interaction.reply(msg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function semPermissao(interaction) {
  return interaction.reply({ embeds: [perm.embedSemPermissao()], ephemeral: true });
}

function disableRow(label, style) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('_disabled')
      .setLabel(label)
      .setStyle(style)
      .setDisabled(true),
  )];
}

/**
 * Exibe um UserSelectMenu para escolher o alvo da ação
 */
async function mostrarUserSelect(interaction, acao, titulo, placeholder) {
  const menu = new UserSelectMenuBuilder()
    .setCustomId(`userselect_${acao}`)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.principal)
        .setTitle(titulo)
        .setDescription('👇 Selecione o membro abaixo para continuar:'),
    ],
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATE-PONTO
// ─────────────────────────────────────────────────────────────────────────────

async function handleLigar(interaction) {
  await horasService.iniciarPonto(interaction.user.id);
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor('#22C55E')
        .setDescription(
          `☑️ **Ponto iniciado às <t:${Math.floor(Date.now() / 1000)}:T>**\n\n` +
          '• Ele será finalizado ao sair do canal de voz.\n' +
          '• Também pode ser encerrado manualmente pelo botão **DESLIGAR**.'
        )
        .setFooter({ text: 'FDN • Sistema de Controle de Ponto' })
        .setTimestamp()
    ],
    ephemeral: true,
  });
}

async function handleDesligar(interaction) {
  const resultado = await horasService.finalizarPonto(interaction.user.id);
  if (!resultado) {
    return interaction.reply({ content: '❌ Você não possui um ponto ativo.', ephemeral: true });
  }
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor('#EF4444')
        .setTitle('✅ PONTO FINALIZADO')
        .setDescription(
          `🔴 Seu ponto foi encerrado com sucesso.\n\n` +
          `⏱️ **Tempo Registrado**\n` +
          `\`${logger.formatarTempo(resultado.tempoTotal)}\``
        )
        .addFields(
          { name: '👤 Membro', value: `${interaction.user}`, inline: true },
          { name: '📅 Data',   value: `<t:${Math.floor(Date.now() / 1000)}:d>`, inline: true }
        )
        .setFooter({ text: 'FDN • Sistema de Controle de Ponto' })
        .setTimestamp()
    ],
    ephemeral: true,
  });
}

async function handleMinhasHoras(interaction) {
  const stats = await horasService.getEstatisticas(interaction.user.id);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor('#3B82F6')
        .setTitle('📊 RELATÓRIO DE HORAS')
        .setDescription(
          `👤 **Membro:** ${interaction.user}\n\n` +
          'Confira abaixo suas estatísticas de atividade.'
        )
        .addFields(
          {
            name: '📅 Hoje',
            value: `\`${logger.formatarTempo(stats.hoje)}\``,
            inline: true
          },
          {
            name: '📆 Semana',
            value: `\`${logger.formatarTempo(stats.semana)}\``,
            inline: true
          },
          {
            name: '🗓️ Mês',
            value: `\`${logger.formatarTempo(stats.mes)}\``,
            inline: true
          },
          {
            name: '━━━━━━━━━━━━━━',
            value: '\u200B',
            inline: false
          },
          {
            name: '🏆 TOTAL GERAL',
            value: `\`${logger.formatarTempo(stats.total)}\``,
            inline: false
          }
        )
        .setFooter({
          text: 'FDN • Estatísticas de Ponto'
        })
        .setTimestamp()
    ],
    ephemeral: true
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
const fmt = arr =>
  arr.length
    ? arr
        .map((r, i) => {
          const posicao =
            i === 0 ? '🥇' :
            i === 1 ? '🥈' :
            i === 2 ? '🥉' :
            `🏅`;

          return `${posicao} <@${r.usuario}> • \`${logger.formatarTempo(r.total)}\``;
        })
        .join('\n')
    : '_Nenhum registro encontrado._';

  return interaction.editReply({
  embeds: [
    new EmbedBuilder()
      .setColor('#FBBF24')
      .setTitle('🏆 TOP MEMBROS FDN')
      .setDescription(
        'Confira abaixo os membros mais ativos da facção.\n'
      )
      .addFields(
        {
          name: '🥇 RANKING GERAL',
          value: fmt(geral)
        },
        {
          name: '📆 RANKING SEMANAL',
          value: fmt(semanal)
        },
        {
          name: '🗓️ RANKING MENSAL',
          value: fmt(mensal)
        }
      )
      .setFooter({
        text: 'FDN • Estatísticas da Facção'
      })
      .setTimestamp()
  ]
});
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATURA
// ─────────────────────────────────────────────────────────────────────────────

async function handleAprovarCandidatura(interaction, id) {
  if (!perm.podeAprovarRecrutamento(interaction.member)) return semPermissao(interaction);

  const candidatura = await prisma.candidatura.findUnique({ where: { id: parseInt(id) } });
  if (!candidatura) return interaction.reply({ content: '❌ Candidatura não encontrada.', ephemeral: true });

  await prisma.candidatura.update({
    where: { id: candidatura.id },
    data: { status: 'APROVADA', responsavel: interaction.user.id },
  });

  const membro = await interaction.guild.members.fetch(candidatura.discord_id).catch(() => null);
  if (membro) {
    const cargoRecrutaId = config.cargos.hierarquia[0]?.id;
    if (cargoRecrutaId && !cargoRecrutaId.startsWith('ID_')) {
      await membro.roles.add(cargoRecrutaId).catch(() => {});
    }
    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.sucesso)
          .setTitle('✅ Candidatura Aprovada!')
          .setDescription('Parabéns! Sua candidatura para a **FDN** foi **aprovada**! Bem-vindo à família! 🎉')
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  await logger.logRecrutamento(interaction.client, candidatura, 'APROVADA', interaction.user.id);
  await interaction.update({ components: disableRow('✅ Aprovada', ButtonStyle.Success) });
}

async function handleReprovarCandidatura(interaction, id) {
  if (!perm.podeAprovarRecrutamento(interaction.member)) return semPermissao(interaction);

  const candidatura = await prisma.candidatura.findUnique({ where: { id: parseInt(id) } });
  if (!candidatura) return interaction.reply({ content: '❌ Candidatura não encontrada.', ephemeral: true });

  await prisma.candidatura.update({
    where: { id: candidatura.id },
    data: { status: 'REPROVADA', responsavel: interaction.user.id },
  });

  const membro = await interaction.guild.members.fetch(candidatura.discord_id).catch(() => null);
  if (membro) {
    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setTitle('❌ Candidatura Reprovada')
          .setDescription('Sua candidatura para a **FDN** foi **reprovada** desta vez. Tente novamente mais tarde.')
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  await logger.logRecrutamento(interaction.client, candidatura, 'REPROVADA', interaction.user.id);
  await interaction.update({ components: disableRow('❌ Reprovada', ButtonStyle.Danger) });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUSÊNCIA
// ─────────────────────────────────────────────────────────────────────────────

async function handleAprovarAusencia(interaction, id) {
  if (!perm.podeAprovarAusencia(interaction.member)) return semPermissao(interaction);

  const ausencia = await prisma.ausencia.findUnique({ where: { id: parseInt(id) } });
  if (!ausencia) return interaction.reply({ content: '❌ Ausência não encontrada.', ephemeral: true });

  await prisma.ausencia.update({
    where: { id: ausencia.id },
    data: { status: 'APROVADA', responsavel: interaction.user.id },
  });

  await logger.logAusencia(interaction.client, ausencia, 'APROVADA', interaction.user.id);
  await interaction.update({ components: disableRow('✅ Aprovada', ButtonStyle.Success) });
}

async function handleReprovarAusencia(interaction, id) {
  if (!perm.podeAprovarAusencia(interaction.member)) return semPermissao(interaction);

  const ausencia = await prisma.ausencia.findUnique({ where: { id: parseInt(id) } });
  if (!ausencia) return interaction.reply({ content: '❌ Ausência não encontrada.', ephemeral: true });

  await prisma.ausencia.update({
    where: { id: ausencia.id },
    data: { status: 'REPROVADA', responsavel: interaction.user.id },
  });

  await logger.logAusencia(interaction.client, ausencia, 'REPROVADA', interaction.user.id);
  await interaction.update({ components: disableRow('❌ Reprovada', ButtonStyle.Danger) });
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERÊNCIA
// ─────────────────────────────────────────────────────────────────────────────

async function handleAprovarTransfer(interaction, id) {
  if (!perm.podeAprovarRecrutamento(interaction.member)) return semPermissao(interaction);
  await prisma.transferencia.update({
    where: { id: parseInt(id) },
    data: { status: 'APROVADA', responsavel: interaction.user.id },
  });
  await interaction.update({ components: disableRow('✅ Aprovada', ButtonStyle.Success) });
}

async function handleReprovarTransfer(interaction, id) {
  if (!perm.podeAprovarRecrutamento(interaction.member)) return semPermissao(interaction);
  await prisma.transferencia.update({
    where: { id: parseInt(id) },
    data: { status: 'REPROVADA', responsavel: interaction.user.id },
  });
  await interaction.update({ components: disableRow('❌ Reprovada', ButtonStyle.Danger) });
}

async function handleCancelarAcao(interaction) {
  return interaction.update({
    embeds: [new EmbedBuilder().setColor(config.cores.neutro).setDescription('❌ Ação cancelada.')],
    components: [],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────────────────────────────────────

async function handleCriarTicket(interaction, tipo) {
  await interaction.deferReply({ ephemeral: true });

  const existente = await prisma.ticket.findFirst({
    where: { autor_id: interaction.user.id, status: 'ABERTO' },
  });
  if (existente) {
    return interaction.editReply({ content: `❌ Você já tem um ticket aberto: <#${existente.canal_id}>` });
  }

  const nomes = { SUPORTE: '🔧suporte', DENUNCIA: '🚨denuncia', DUVIDA: '❓duvida', RECURSO: '⚖️recurso' };
  const permissoes = [
    { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
  ];

  for (const id of config.cargos.podeTicketStaff) {
    if (!id.startsWith('ID_')) {
      permissoes.push({ id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
    }
  }

  const cat = config.canais.categoriaTickets;
  const canal = await interaction.guild.channels.create({
    name: `${nomes[tipo] || 'ticket'}-${interaction.user.username}`,
    parent: cat.startsWith('ID_') ? null : cat,
    permissionOverwrites: permissoes,
  });

  const ticket = await prisma.ticket.create({
    data: { canal_id: canal.id, autor_id: interaction.user.id, tipo },
  });

  const tiposLabel = {
    SUPORTE:  '🔧 Suporte em Geral',
    DENUNCIA: '🚨 Denúncia',
    DUVIDA:   '❓ Dúvida',
    RECURSO:  '⚖️ Recurso',
  };

  await canal.send({
    content: `<@${interaction.user.id}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setDescription(
          `## ${tiposLabel[tipo]}\n\n` +
          `> Olá <@${interaction.user.id}>! Seu ticket foi criado com sucesso.\n` +
          `> Descreva sua solicitação e aguarde o atendimento da equipe.\n\n` +
          `**• Para fechar o ticket, clique no botão abaixo.**`,
        )
        .setFooter({ text: 'FDN — Sistema de Tickets' })
        .setTimestamp(),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_fechar_ticket')
          .setLabel('FECHAR TICKET')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
      ),
    ],
  });

  await logger.logTicket(interaction.client, ticket, 'ABERTO');
  await interaction.editReply({ content: `✅ Ticket criado! Acesse: <#${canal.id}>` });
}

async function handleFecharTicket(interaction) {
  const ticket = await prisma.ticket.findUnique({ where: { canal_id: interaction.channel.id } });
  if (!ticket || ticket.status === 'FECHADO') {
    return interaction.reply({ content: '❌ Ticket inválido ou já fechado.', ephemeral: true });
  }

  await interaction.reply({ content: '🔒 Encerrando ticket em 5 segundos...' });

  const msgs = await interaction.channel.messages.fetch({ limit: 100 });
  const transcript = msgs
    .reverse()
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

  const fmt = (arr, fn) => (arr.length ? arr.map(fn).join('\n') : '_Nenhum registro_');

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.principal)
        .setTitle('📋 Histórico Recente — FDN')
        .addFields(
          { name: '⚠️ Advertências', value: fmt(adv,  a => `<@${a.usuario}> — ${a.motivo.slice(0, 40)}`) },
          { name: '⬆️ Promoções',    value: fmt(prom, p => `<@${p.usuario}> → ${p.cargo_novo}`) },
          { name: '⚖️ Punições',     value: fmt(pun,  p => `<@${p.usuario}> — ${p.tipo}`) },
          { name: '🚫 Exonerações',  value: fmt(exon, e => `<@${e.usuario}> — ${e.motivo.slice(0, 40)}`) },
        )
        .setFooter({ text: 'FDN — Painel Administrativo' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

module.exports = { handleButton };