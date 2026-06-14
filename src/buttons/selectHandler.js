// src/buttons/selectHandler.js
// Gerencia UserSelect, RoleSelect e StringSelect
// Fluxo automático: UserSelect → (RoleSelect) → Modal de motivo → Ação

const {
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config       = require('../config');
const modals       = require('../modals/modals');
const perm         = require('../utils/permissoes');
const { prisma }   = require('../database/client');
const logger       = require('../logs/logger');
const horasService = require('../services/horasService');

// ─────────────────────────────────────────────────────────────────────────────
// ROTEADOR
// ─────────────────────────────────────────────────────────────────────────────

async function handleSelect(interaction) {
  const { customId, values } = interaction;

  try {
    // ── StringSelect: menu de punição ─────────────────────────────────────────
    if (customId === 'menu_punicao') {
      if (!perm.podeAdvertir(interaction.member)) {
        return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
      }
      return await interaction.showModal(modals.modalPunicao(values[0]));
    }

    // ── UserSelect ────────────────────────────────────────────────────────────
    if (customId.startsWith('userselect_')) {
      const acao   = customId.replace('userselect_', '');
      const userId = values[0];
      return await handleUserSelecionado(interaction, acao, userId);
    }

    // ── RoleSelect ────────────────────────────────────────────────────────────
    if (customId.startsWith('roleselect_')) {
      // formato: roleselect_<acao>_<userId>
      const partes = customId.split('_');
      const acao   = partes[1]; // 'promocao' ou 'rebaixamento'
      const userId = partes[2];
      const roleId = values[0];
      return await handleCargoSelecionado(interaction, acao, userId, roleId);
    }

  } catch (err) {
    console.error('[SELECT ERROR]', err);
    const msg = { content: '❌ Erro ao processar seleção.', ephemeral: true };
    interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSO 1 — Membro selecionado via UserSelect
// ─────────────────────────────────────────────────────────────────────────────

async function handleUserSelecionado(interaction, acao, userId) {
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  const nome   = membro ? membro.displayName : `<@${userId}>`;

  // ── Verifica se o membro está registrado no sistema ──────────────────────
  const registrado = await prisma.usuario.findUnique({ where: { discord_id: userId } });
  if (!registrado) {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setTitle('❌ Membro não registrado')
          .setDescription(
            `**${nome}** (<@${userId}>) ainda não realizou o registro na FDN.\n\n` +
            `Apenas membros registrados podem ser gerenciados por este painel.`
          ),
      ],
      components: [],
    });
  }

  // ── Promoção → selecionar o novo cargo ───────────────────────────────────
  if (acao === 'promover') {
    const cargoAtualIdx = _getCargoAtualIdx(membro);
    const cargosDisponiveis = config.cargos.hierarquia.slice(cargoAtualIdx + 1);

    if (!cargosDisponiveis.length) {
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.aviso)
          .setDescription(`⚠️ **${nome}** já está no cargo máximo da hierarquia.`)],
        components: [],
      });
    }

    // Apenas update — sem showModal nesta etapa
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
        .setTitle('⬆️ Promover Membro')
        .setDescription(`Membro selecionado: **${nome}**\nSelecione o **novo cargo** abaixo:`)],
      components: [
        new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`roleselect_promocao_${userId}`)
            .setPlaceholder('Selecione o novo cargo...')
            .setMinValues(1)
            .setMaxValues(1),
        ),
      ],
    });
  }

  // ── Rebaixamento → selecionar o novo cargo ────────────────────────────────
  if (acao === 'rebaixar') {
    const cargoAtualIdx = _getCargoAtualIdx(membro);
    const cargosDisponiveis = config.cargos.hierarquia.slice(0, cargoAtualIdx);

    if (!cargosDisponiveis.length) {
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.aviso)
          .setDescription(`⚠️ **${nome}** não pode ser rebaixado (já está no cargo mínimo ou sem cargo na hierarquia).`)],
        components: [],
      });
    }

    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setTitle('⬇️ Rebaixar Membro')
        .setDescription(`Membro selecionado: **${nome}**\nSelecione o **novo cargo** abaixo:`)],
      components: [
        new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`roleselect_rebaixamento_${userId}`)
            .setPlaceholder('Selecione o novo cargo...')
            .setMinValues(1)
            .setMaxValues(1),
        ),
      ],
    });
  }

  // ── Advertir → showModal direto (sem update antes — mesma interação) ──────
  if (acao === 'advertir') {
    return await interaction.showModal(modals.modalMotivoSimples('advertencia', userId, nome));
  }

  // ── Exonerar → update com confirmação (sem showModal — botão abrirá depois) ─
  if (acao === 'exonerar') {
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setTitle('🚫 Confirmar Exoneração')
        .setDescription(
          `Você está prestes a **exonerar** <@${userId}> (${nome}).\n\n` +
          `Esta ação irá:\n` +
          `• Remover **todos** os cargos da hierarquia\n` +
          `• Aplicar o cargo de **Exonerado**\n` +
          `• Notificar o membro via DM\n\n` +
          `Tem certeza?`,
        )],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_prosseguir_exonerar_${userId}`)
            .setLabel('Sim, exonerar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚫'),
          new ButtonBuilder()
            .setCustomId('btn_cancelar_acao_')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
    });
  }

  // ── Adicionar / Remover Horas → showModal direto (sem update antes) ───────
  if (acao === 'add_horas' || acao === 'rem_horas') {
    return await interaction.showModal(
      modals.modalGerenciarHorasAuto(acao === 'add_horas' ? 'ADD' : 'REM', userId),
    );
  }

  // ── Consultar Membro ──────────────────────────────────────────────────────
  if (acao === 'consultar') {
    // deferUpdate para poder usar editReply depois (operação assíncrona longa)
    await interaction.deferUpdate();
    return await handleConsultarMembro(interaction, userId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSO 2 — Cargo selecionado via RoleSelect → abre modal de motivo
// ─────────────────────────────────────────────────────────────────────────────

async function handleCargoSelecionado(interaction, acao, userId, roleId) {
  const role   = await interaction.guild.roles.fetch(roleId).catch(() => null);
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  const nomeCargo  = role   ? role.name           : roleId;
  const nomeMembro = membro ? membro.displayName  : `<@${userId}>`;

  // Valida se o cargo está na hierarquia FDN
  const cargoFDN = config.cargos.hierarquia.find(c => c.id === roleId);
  if (!cargoFDN) {
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setDescription(`⚠️ O cargo **${nomeCargo}** não pertence à hierarquia da FDN. Selecione um cargo válido.`)],
      components: [],
    });
  }

  // showModal direto — não chamar update antes na mesma interação
  return await interaction.showModal(modals.modalMotivo(acao, userId, roleId, nomeCargo));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTAR MEMBRO
// ─────────────────────────────────────────────────────────────────────────────

async function handleConsultarMembro(interaction, userId) {
  const [usuario, stats, adv, prom, pun] = await Promise.all([
    prisma.usuario.findUnique({ where: { discord_id: userId } }),
    horasService.getEstatisticas(userId),
    prisma.advertencia.count({ where: { usuario: userId } }),
    prisma.promocao.count({ where: { usuario: userId } }),
    prisma.punicao.count({ where: { usuario: userId } }),
  ]);

  if (!usuario) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ Membro não encontrado no sistema.')],
      components: [],
    });
  }

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setTitle('📊 Ficha do Membro — FDN')
        .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${usuario.avatar || '0'}.png`)
        .addFields(
          { name: '👤 Discord',       value: `<@${usuario.discord_id}>`,                                      inline: true },
          { name: '🎮 Nome MTA',      value: usuario.nome_mta,                                               inline: true },
          { name: '🆔 ID Gamer',      value: usuario.id_gamer,                                               inline: true },
          { name: '🏅 Cargo',         value: usuario.cargo || 'N/A',                                         inline: true },
          { name: '📅 Registro',      value: `<t:${Math.floor(usuario.data_registro.getTime() / 1000)}:D>`,  inline: true },
          { name: '⏱️ Horas Totais', value: logger.formatarTempo(stats.total),                              inline: true },
          { name: '⚠️ Advertências', value: String(adv),                                                    inline: true },
          { name: '⬆️ Promoções',    value: String(prom),                                                   inline: true },
          { name: '⚖️ Punições',     value: String(pun),                                                    inline: true },
        )
        .setFooter({ text: 'FDN — Painel Administrativo' })
        .setTimestamp(),
    ],
    components: [],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — descobre o índice do cargo atual do membro na hierarquia
// ─────────────────────────────────────────────────────────────────────────────

function _getCargoAtualIdx(membro) {
  if (!membro) return -1;
  // Percorre da hierarquia mais alta para a mais baixa
  for (let i = config.cargos.hierarquia.length - 1; i >= 0; i--) {
    if (membro.roles.cache.has(config.cargos.hierarquia[i].id)) return i;
  }
  return -1; // sem cargo na hierarquia
}

module.exports = { handleSelect };