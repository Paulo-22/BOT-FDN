const {
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config          = require('../config');
const modals          = require('../modals/modals');
const perm            = require('../utils/permissoes');
const { prisma }      = require('../database/client');
const horasService    = require('../services/horasService');
const punicaoScheduler = require('../services/punicaoScheduler');
const logger          = require('../logs/logger');

const SEPARADOR = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

const LABELS_PUNICAO = {
  PUNICAO_1: '⚠️ Punição Nível 1',
  PUNICAO_2: '🔶 Punição Nível 2',
  PUNICAO_3: '🔴 Punição Nível 3',
  REMOCAO:   '🚫 Remoção',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — mensagem padrão de "membro não registrado" com botão de voltar
// ─────────────────────────────────────────────────────────────────────────────
function membroNaoRegistrado(userId, nome, customIdVoltar) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.erro)
        .setAuthor({ name: '❌  MEMBRO NÃO REGISTRADO  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `> **${nome}** (<@${userId}>) não realizou o registro na FDN.\n\n` +
          `Apenas membros registrados podem ser gerenciados por este painel.\n\n` +
          `${SEPARADOR}`
        ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(customIdVoltar)
          .setLabel('🔄  Selecionar outro membro')
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

async function handleSelect(interaction) {
  const { customId, values } = interaction;
  try {
    if (customId === 'menu_punicao') {
      if (!perm.podeAdvertir(interaction.member))
        return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });

      const tipo = values[0];

      if (tipo === 'REMOVER') {
        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(config.cores.info)
              .setAuthor({ name: '🔄  REMOVER PUNIÇÃO  ·  FDN' })
              .setDescription(
                `${SEPARADOR}\n\n` +
                `Selecione o **membro** para ver as punições ativas:\n\n` +
                `${SEPARADOR}`
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new UserSelectMenuBuilder()
                .setCustomId('userselect_remover_punicao')
                .setPlaceholder('Selecione o membro...')
                .setMinValues(1).setMaxValues(1),
            ),
          ],
        });
      }

      const label = LABELS_PUNICAO[tipo] ?? 'Punição';

      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.aviso)
            .setAuthor({ name: `⚖️  ${label.toUpperCase()}  ·  FDN` })
            .setDescription(
              `${SEPARADOR}\n\n` +
              `Selecione o **membro** que receberá esta punição:\n\n` +
              `${SEPARADOR}`
            ),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId(`userselect_punicao_${tipo}`)
              .setPlaceholder('Selecione o membro...')
              .setMinValues(1).setMaxValues(1),
          ),
        ],
      });
    }

    if (customId.startsWith('userselect_punicao_')) {
      const tipo = customId.replace('userselect_punicao_', '');
      return handlePunicaoUsuarioSelecionado(interaction, tipo, values[0]);
    }

    if (customId === 'userselect_remover_punicao')
      return handleRemoverPunicaoUsuarioSelecionado(interaction, values[0]);

    if (customId.startsWith('select_remover_punicao_')) {
      const userId = customId.replace('select_remover_punicao_', '');
      return handleConfirmarRemocaoPunicao(interaction, userId, parseInt(values[0], 10));
    }

    if (customId.startsWith('userselect_'))
      return handleUserSelecionado(interaction, customId.replace('userselect_', ''), values[0]);

    if (customId.startsWith('roleselect_')) {
      const partes = customId.split('_');
      return handleCargoSelecionado(interaction, partes[1], partes[2], values[0]);
    }
  } catch (err) {
    console.error('[SELECT ERROR]', err);
    const msg = { content: '❌ Erro ao processar seleção.', ephemeral: true };
    interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBRO SELECIONADO PARA PUNIÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function handlePunicaoUsuarioSelecionado(interaction, tipo, userId) {
  const registrado = await prisma.usuario.findUnique({ where: { discord_id: userId } });

  if (!registrado) {
    const membro = await interaction.guild.members.fetch(userId).catch(() => null);
    const nome   = membro?.displayName ?? `<@${userId}>`;
    return interaction.update(
      membroNaoRegistrado(userId, nome, `btn_voltar_select_punicao_${tipo}`),
    );
  }

  return interaction.showModal(modals.modalMotivoPunicao(tipo, userId));
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBRO SELECIONADO PARA REMOVER PUNIÇÃO — lista as punições ativas
// ─────────────────────────────────────────────────────────────────────────────
async function handleRemoverPunicaoUsuarioSelecionado(interaction, userId) {
  const ativas = await prisma.punicao.findMany({
    where: { usuario: userId, status: 'ATIVA' },
    orderBy: { data: 'desc' },
  });

  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  const nome   = membro?.displayName ?? `<@${userId}>`;

  if (!ativas.length) {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.aviso)
          .setDescription(`⚠️ **${nome}** não possui nenhuma punição ativa no momento.`),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_voltar_select_remover_punicao')
            .setLabel('🔄  Selecionar outro membro')
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
    });
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`select_remover_punicao_${userId}`)
    .setPlaceholder('Selecione a punição para remover...')
    .addOptions(
      ativas.slice(0, 25).map(p => ({
        label: `${LABELS_PUNICAO[p.tipo] ?? p.tipo} — #${p.id}`,
        value: String(p.id),
        description: p.motivo.slice(0, 90),
      })),
    );

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setAuthor({ name: '🔄  REMOVER PUNIÇÃO  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Membro:** ${nome}\n\n` +
          `Selecione abaixo a punição ativa que deseja remover:\n\n` +
          `${SEPARADOR}`
        ),
    ],
    components: [new ActionRowBuilder().addComponents(menu)],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRMA E EXECUTA A REMOÇÃO MANUAL DA PUNIÇÃO ESCOLHIDA
// ─────────────────────────────────────────────────────────────────────────────
async function handleConfirmarRemocaoPunicao(interaction, userId, punicaoId) {
  const punicao = await prisma.punicao.findUnique({ where: { id: punicaoId } });

  if (!punicao || punicao.status !== 'ATIVA') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.aviso)
          .setDescription('⚠️ Essa punição já não está mais ativa — alguém pode ter removido ela antes de você.'),
      ],
      components: [],
    });
  }

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setDescription(`⏳ Removendo punição de <@${userId}>...`),
    ],
    components: [],
  });

  await punicaoScheduler.removerPunicao(interaction.client, punicao, 'REMOVIDA_MANUAL', interaction.user.id);

  return interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(
          `✅ Punição **${LABELS_PUNICAO[punicao.tipo] ?? punicao.tipo}** de <@${userId}> foi removida.\n` +
          `**Motivo original:** ${punicao.motivo}`
        ),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMBRO SELECIONADO
// ─────────────────────────────────────────────────────────────────────────────
async function handleUserSelecionado(interaction, acao, userId) {
  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  const nome   = membro?.displayName ?? `<@${userId}>`;

  const registrado = await prisma.usuario.findUnique({ where: { discord_id: userId } });
  if (!registrado) {
    return interaction.update(
      membroNaoRegistrado(userId, nome, `btn_voltar_select_${acao}`),
    );
  }

  if (acao === 'promover') {
    const idx = getCargoIdx(membro);
    const disponiveis = config.cargos.hierarquia.slice(idx + 1);
    if (!disponiveis.length) {
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.aviso)
          .setDescription(`⚠️ **${nome}** já está no cargo máximo da hierarquia.`)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_voltar_select_${acao}`)
              .setLabel('🔄  Selecionar outro membro')
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
        .setAuthor({ name: '⬆️  PROMOVER MEMBRO  ·  FDN' })
        .setDescription(`${SEPARADOR}\n\n**👤  Membro:** ${nome}\n\nSelecione o **novo cargo** abaixo:\n\n${SEPARADOR}`)],
      components: [new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`roleselect_promocao_${userId}`)
          .setPlaceholder('Selecione o novo cargo...')
          .setMinValues(1).setMaxValues(1),
      )],
    });
  }

  if (acao === 'rebaixar') {
    const idx = getCargoIdx(membro);
    if (idx <= 0) {
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(config.cores.aviso)
          .setDescription(`⚠️ **${nome}** não pode ser rebaixado (já está no cargo mínimo ou sem cargo).`)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_voltar_select_${acao}`)
              .setLabel('🔄  Selecionar outro membro')
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setAuthor({ name: '⬇️  REBAIXAR MEMBRO  ·  FDN' })
        .setDescription(`${SEPARADOR}\n\n**👤  Membro:** ${nome}\n\nSelecione o **novo cargo** abaixo:\n\n${SEPARADOR}`)],
      components: [new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`roleselect_rebaixamento_${userId}`)
          .setPlaceholder('Selecione o novo cargo...')
          .setMinValues(1).setMaxValues(1),
      )],
    });
  }

  if (acao === 'advertir')
    return interaction.showModal(modals.modalMotivoSimples('advertencia', userId, nome));

  if (acao === 'exonerar') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setAuthor({ name: '🚫  CONFIRMAR EXONERAÇÃO  ·  FDN' })
          .setDescription(
            `${SEPARADOR}\n\n` +
            `> Você está prestes a **exonerar** <@${userId}>.\n\n` +
            `**Esta ação irá:**\n` +
            `\` • \` Remover **todos** os cargos da hierarquia\n` +
            `\` • \` Aplicar o cargo de **Exonerado**\n` +
            `\` • \` Notificar o membro via **DM**\n\n` +
            `**Tem certeza que deseja continuar?**\n\n` +
            `${SEPARADOR}`
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`btn_prosseguir_exonerar_${userId}`)
            .setLabel('Sim, exonerar').setStyle(ButtonStyle.Danger).setEmoji('🚫'),
          new ButtonBuilder().setCustomId(`btn_voltar_select_${acao}`)
            .setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
        ),
      ],
    });
  }

  if (acao === 'add_horas' || acao === 'rem_horas')
    return interaction.showModal(modals.modalGerenciarHorasAuto(acao === 'add_horas' ? 'ADD' : 'REM', userId));

  if (acao === 'consultar') {
    await interaction.deferUpdate();
    return handleConsultarMembro(interaction, userId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARGO SELECIONADO
// ─────────────────────────────────────────────────────────────────────────────
async function handleCargoSelecionado(interaction, acao, userId, roleId) {
  const cargoFDN = config.cargos.hierarquia.find(c => c.id === roleId);
  if (!cargoFDN) {
    const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setDescription(`⚠️ O cargo **${role?.name ?? roleId}** não pertence à hierarquia da FDN.`)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_voltar_select_${acao === 'promocao' ? 'promover' : 'rebaixar'}`)
            .setLabel('🔄  Selecionar outro membro')
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
    });
  }
  return interaction.showModal(modals.modalMotivo(acao, userId, roleId, cargoFDN.nome));
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
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado no sistema.')],
      components: [],
    });
  }

  const ts = Math.floor(usuario.data_registro.getTime() / 1000);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setAuthor({ name: '📊  FICHA DO MEMBRO  ·  FDN' })
        .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${usuario.avatar ?? '0'}.png`)
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Discord:** <@${usuario.discord_id}>\n` +
          `**🎮  Nome MTA:** \`${usuario.nome_mta}\`\n` +
          `**🆔  ID Gamer:** \`${usuario.id_gamer}\`\n` +
          `**🏅  Cargo:** \`${usuario.cargo ?? 'N/A'}\`\n` +
          `**📅  Registro:** <t:${ts}:D>\n\n` +
          `**⏱️  Horas totais:** \`${logger.formatarTempo(stats.total)}\`\n` +
          `**⚠️  Advertências:** \`${adv}\`\n` +
          `**⬆️  Promoções:** \`${prom}\`\n` +
          `**⚖️  Punições:** \`${pun}\`\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Painel Administrativo' })
        .setTimestamp(),
    ],
    components: [],
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getCargoIdx(membro) {
  if (!membro) return -1;
  for (let i = config.cargos.hierarquia.length - 1; i >= 0; i--) {
    if (membro.roles.cache.has(config.cargos.hierarquia[i].id)) return i;
  }
  return -1;
}

module.exports = { handleSelect };