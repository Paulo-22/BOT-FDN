// src/buttons/selectHandler.js
// Gerencia menus suspensos — UserSelect, RoleSelect e StringSelect

const {
  EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const config  = require('../config');
const modals  = require('../modals/modals');
const perm    = require('../utils/permissoes');
const { prisma } = require('../database/client');
const logger  = require('../logs/logger');
const horasService = require('../services/horasService');

async function handleSelect(interaction) {
  const { customId, values } = interaction;

  try {
    // ── Punição (string select) ──────────────
    if (customId === 'menu_punicao') {
      if (!perm.podeAdvertir(interaction.member)) {
        return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
      }
      return await interaction.showModal(modals.modalPunicao(values[0]));
    }

    // ── UserSelect: membro selecionado ───────
    if (customId.startsWith('userselect_')) {
      const acao   = customId.replace('userselect_', '');
      const userId = values[0];
      return await handleUserSelecionado(interaction, acao, userId);
    }

    // ── RoleSelect: cargo selecionado ────────
    if (customId.startsWith('roleselect_')) {
      const parts  = customId.split('_');
      const acao   = parts[1]; // promocao ou rebaixamento
      const userId = parts[2];
      const roleId = values[0];
      return await handleCargoSelecionado(interaction, acao, userId, roleId);
    }

  } catch (err) {
    console.error('[SELECT ERROR]', err);
    const msg = { content: '❌ Erro ao processar seleção.', ephemeral: true };
    interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
  }
}

// ── Após selecionar o membro ─────────────────────────────────

async function handleUserSelecionado(interaction, acao, userId) {
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  const nome   = membro ? membro.displayName : userId;

  // Promoção/Rebaixamento → próximo passo: selecionar cargo
  if (acao === 'promover' || acao === 'rebaixar') {
    const titulo = acao === 'promover' ? '⬆️ Promover' : '⬇️ Rebaixar';
    const roleMenu = new RoleSelectMenuBuilder()
      .setCustomId(`roleselect_${acao === 'promover' ? 'promocao' : 'rebaixamento'}_${userId}`)
      .setPlaceholder('Selecione o novo cargo...')
      .setMinValues(1)
      .setMaxValues(1);

    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.principal)
        .setTitle(`${titulo} — ${nome}`)
        .setDescription('Agora selecione o **novo cargo** para este membro:')
      ],
      components: [new ActionRowBuilder().addComponents(roleMenu)],
    });
  }

  // Advertir → modal só com motivo
  if (acao === 'advertir') {
    await interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.principal)
        .setDescription(`⚠️ Advertindo **${nome}**...`)],
      components: [],
    });
    return await interaction.showModal(modals.modalMotivoSimples('advertencia', userId, nome));
  }

  // Exonerar → modal só com motivo
  if (acao === 'exonerar') {
    await interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.principal)
        .setDescription(`🚫 Exonerando **${nome}**...`)],
      components: [],
    });
    return await interaction.showModal(modals.modalMotivoSimples('exoneracao', userId, nome));
  }

  // Adicionar/Remover horas → modal com quantidade
  if (acao === 'add_horas' || acao === 'rem_horas') {
    await interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.principal)
        .setDescription(`Abrindo formulário para **${nome}**...`)],
      components: [],
    });
    return await interaction.showModal(
      modals.modalGerenciarHorasAuto(acao === 'add_horas' ? 'ADD' : 'REM', userId)
    );
  }

  // Consultar membro
  if (acao === 'consultar') {
    await interaction.deferUpdate();
    return await handleConsultarMembro(interaction, userId);
  }
}

// ── Após selecionar o cargo ──────────────────────────────────

async function handleCargoSelecionado(interaction, acao, userId, roleId) {
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  const role   = await interaction.guild.roles.fetch(roleId).catch(() => null);
  const nome   = membro ? membro.displayName : userId;
  const cargo  = role ? role.name : roleId;

  await interaction.update({
    embeds: [new EmbedBuilder().setColor(config.cores.principal)
      .setDescription(`Cargo selecionado: **${cargo}** para **${nome}**\nAbrindo formulário de motivo...`)
    ],
    components: [],
  });

  return await interaction.showModal(modals.modalMotivo(acao, userId, roleId, cargo));
}

// ── Consultar membro ─────────────────────────────────────────

async function handleConsultarMembro(interaction, userId) {
  const [usuario, stats, adv, prom, pun] = await Promise.all([
    prisma.usuario.findUnique({ where: { discord_id: userId } }),
    horasService.getEstatisticas(userId),
    prisma.advertencia.count({ where: { usuario: userId } }),
    prisma.promocao.count({ where: { usuario: userId } }),
    prisma.punicao.count({ where: { usuario: userId } }),
  ]);

  if (!usuario) return interaction.editReply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setDescription('❌ Membro não encontrado no sistema.')],
    components: [],
  });

  return interaction.editReply({
    embeds: [new EmbedBuilder().setColor(config.cores.info)
      .setTitle('📊 Ficha do Membro — FDN')
      .addFields(
        { name: '👤 Discord',      value: `<@${usuario.discord_id}>`, inline: true },
        { name: '🎮 Nome MTA',     value: usuario.nome_mta, inline: true },
        { name: '🆔 ID Gamer',     value: usuario.id_gamer, inline: true },
        { name: '🏅 Cargo',        value: usuario.cargo, inline: true },
        { name: '📅 Registro',     value: `<t:${Math.floor(usuario.data_registro.getTime()/1000)}:D>`, inline: true },
        { name: '⏱️ Horas Totais', value: logger.formatarTempo(stats.total), inline: true },
        { name: '⚠️ Advertências', value: String(adv), inline: true },
        { name: '⬆️ Promoções',    value: String(prom), inline: true },
        { name: '⚖️ Punições',     value: String(pun), inline: true },
      )
      .setFooter({ text: 'FDN — Painel Administrativo' }).setTimestamp()],
    components: [],
  });
}

module.exports = { handleSelect };
