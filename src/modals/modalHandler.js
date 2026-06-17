

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config        = require('../config');
const { prisma }    = require('../database/client');
const logger        = require('../logs/logger');
const horasService  = require('../services/horasService');
const editalService = require('../services/editalService');

const SEPARADOR = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

// ─────────────────────────────────────────────────────────────────────────────
// ROTEADOR
// ─────────────────────────────────────────────────────────────────────────────
async function handleModal(interaction) {
  const { customId } = interaction;
  try {
    if (customId === 'modal_registro')         return handleRegistro(interaction);
    if (customId === 'modal_candidatura')      return handleCandidatura(interaction);
    if (customId === 'modal_edital_nome')      return handleEditalNome(interaction);
    if (customId === 'modal_transferencia')    return handleTransferencia(interaction);
    if (customId === 'modal_ausencia')         return handleAusencia(interaction);
    if (customId === 'modal_advertencia')      return handleAdvertencia(interaction);
    if (customId === 'modal_exoneracao')       return handleExoneracao(interaction);
    if (customId === 'modal_consultar_membro') return handleConsultarMembro(interaction);
    if (customId === 'modal_add_horas')        return handleGerenciarHoras(interaction, 'ADD', null);
    if (customId === 'modal_rem_horas')        return handleGerenciarHoras(interaction, 'REM', null);

    if (customId.startsWith('modal_punicao_'))
      return handlePunicao(interaction, customId.replace('modal_punicao_', ''));

    if (customId.startsWith('modal_horas_add_'))
      return handleGerenciarHoras(interaction, 'ADD', customId.replace('modal_horas_add_', ''));
    if (customId.startsWith('modal_horas_rem_'))
      return handleGerenciarHoras(interaction, 'REM', customId.replace('modal_horas_rem_', ''));

    if (customId.startsWith('modal_motivo_advertencia_'))
      return handleAdvertenciaAuto(interaction, customId.replace('modal_motivo_advertencia_', ''));
    if (customId.startsWith('modal_motivo_exoneracao_'))
      return handleExoneracaoAuto(interaction, customId.replace('modal_motivo_exoneracao_', ''));

    if (customId.startsWith('modal_motivo_promocao_')) {
      const [userId, roleId] = customId.replace('modal_motivo_promocao_', '').split('_');
      return handlePromocaoAuto(interaction, 'PROMOCAO', userId, roleId);
    }
    if (customId.startsWith('modal_motivo_rebaixamento_')) {
      const [userId, roleId] = customId.replace('modal_motivo_rebaixamento_', '').split('_');
      return handlePromocaoAuto(interaction, 'REBAIXAMENTO', userId, roleId);
    }

  } catch (err) {
    console.error('[MODAL ERROR]', err);
    const msg = { content: '❌ Erro ao processar o formulário.', ephemeral: true };
    interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────────────────────────────────────
async function handleRegistro(interaction) {
  const { user } = interaction;
  const nome_mta = interaction.fields.getTextInputValue('nome_mta').trim();
  const login    = interaction.fields.getTextInputValue('login').trim();
  const id_gamer = interaction.fields.getTextInputValue('id_gamer').trim();

  if (!/^\d+$/.test(id_gamer)) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ O campo **ID na cidade** deve conter apenas números.')],
      ephemeral: true,
    });
  }

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ discord_id: user.id }, { id_gamer }] },
  });
  if (existente) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setDescription('⚠️ Você já possui um cadastro ou o ID Gamer já está em uso.')],
      ephemeral: true,
    });
  }

  const usuario = await prisma.usuario.create({
    data: { discord_id: user.id, discord_nome: user.tag, nome_mta, login, id_gamer },
  });

  const prefixo      = '𝑭𝑫𝑵 » ';
  const sufixo       = ` ${id_gamer}`;
  const espaco       = 32 - prefixo.length - sufixo.length;
  const nomeTruncado = nome_mta.slice(0, espaco).trim();
  const novoNick     = `${prefixo}${nomeTruncado}${sufixo}`;

  const membro = await interaction.guild.members.fetch(user.id).catch(() => null);
  let nickAlterado = false;

  if (membro) {
    nickAlterado = await membro.setNickname(novoNick).then(() => true).catch(() => false);
    const semCargo     = config.cargos.semCargo;
    const cargoVerific = '1265868400324903023';
    if (semCargo && !semCargo.startsWith('ID_')) await membro.roles.remove(semCargo).catch(() => {});
    await membro.roles.add(cargoVerific).catch(() => {});
  }

  await logger.logRegistro(interaction.client, usuario, novoNick);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setAuthor({ name: '✅  REGISTRO CONCLUÍDO  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `> Seu cadastro na **FDN** foi realizado com sucesso!\n\n` +
          `**🎮  Nome na cidade:** \`${nome_mta}\`\n` +
          `**🔑  Login:** \`${login}\`\n` +
          `**🆔  ID:** \`${id_gamer}\`\n` +
          `**🏷️  Nick atribuído:** \`${novoNick}\`\n\n` +
          (nickAlterado
            ? '✅ Seu nome no servidor foi atualizado automaticamente.'
            : '⚠️ Não foi possível alterar seu nome. Solicite a um administrador.') +
          `\n\n${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Sistema de Registro' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITAL
// ─────────────────────────────────────────────────────────────────────────────
async function handleEditalNome(interaction) {
  const nick = interaction.fields.getTextInputValue('nick').trim();
  return editalService.criarCanalEdital(interaction, nick);
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATURA
// ─────────────────────────────────────────────────────────────────────────────
async function handleCandidatura(interaction) {
  const { user } = interaction;
  const nome        = interaction.fields.getTextInputValue('nome').trim();
  const id_gamer    = interaction.fields.getTextInputValue('id_gamer').trim();
  const horas       = interaction.fields.getTextInputValue('horas').trim();
  const experiencia = interaction.fields.getTextInputValue('experiencia').trim();
  const motivo      = interaction.fields.getTextInputValue('motivo').trim();

  const existente = await prisma.candidatura.findFirst({ where: { discord_id: user.id, status: 'PENDENTE' } });
  if (existente) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.aviso)
        .setDescription('⚠️ Você já possui uma candidatura em análise.')],
      ephemeral: true,
    });
  }

  const candidatura = await prisma.candidatura.create({
    data: { discord_id: user.id, discord_nome: user.tag, nome, id_gamer, horas, experiencia, motivo },
  });

  const canalId = config.canais.analise;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.info)
            .setAuthor({ name: '📋  NOVA CANDIDATURA  ·  FDN' })
            .setDescription(
              `${SEPARADOR}\n\n` +
              `**👤  Discord:** <@${user.id}>\n` +
              `**🎮  Nome MTA:** \`${nome}\`\n` +
              `**🆔  ID Gamer:** \`${id_gamer}\`\n` +
              `**⏱️  Horas:** \`${horas}\`\n\n` +
              `**📖  Experiência:**\n${experiencia}\n\n` +
              `**💬  Motivo:**\n${motivo}\n\n` +
              `${SEPARADOR}`
            )
            .setFooter({ text: `ID da candidatura: ${candidatura.id}` })
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`btn_aprovar_candidatura_${candidatura.id}`)
              .setLabel('✅  APROVAR').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`btn_reprovar_candidatura_${candidatura.id}`)
              .setLabel('❌  REPROVAR').setStyle(ButtonStyle.Danger),
          ),
        ],
      });
    }
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setAuthor({ name: '📨  CANDIDATURA ENVIADA  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `> Sua candidatura foi enviada para análise da staff.\n` +
          `> Você será notificado via **DM** sobre o resultado.\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Recrutamento' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function handleTransferencia(interaction) {
  const { user } = interaction;
  const nome         = interaction.fields.getTextInputValue('nome').trim();
  const faccao_atual = interaction.fields.getTextInputValue('faccao_atual').trim();
  const motivo       = interaction.fields.getTextInputValue('motivo').trim();

  const registrado = await prisma.usuario.findUnique({ where: { discord_id: user.id } });
  if (!registrado) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ Você precisa estar registrado para solicitar uma transferência.')],
      ephemeral: true,
    });
  }

  const transfer = await prisma.transferencia.create({
    data: { usuario: user.id, faccao_atual, motivo },
  });

  const canalId = config.canais.analise;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.info)
            .setAuthor({ name: '🔄  SOLICITAÇÃO DE TRANSFERÊNCIA  ·  FDN' })
            .setDescription(
              `${SEPARADOR}\n\n` +
              `**👤  Discord:** <@${user.id}>\n` +
              `**🎮  Nome MTA:** \`${nome}\`\n` +
              `**🏴  Facção atual:** \`${faccao_atual}\`\n\n` +
              `**💬  Motivo:**\n${motivo}\n\n` +
              `${SEPARADOR}`
            )
            .setFooter({ text: `ID: ${transfer.id}` })
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`btn_aprovar_transfer_${transfer.id}`)
              .setLabel('✅  APROVAR').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`btn_reprovar_transfer_${transfer.id}`)
              .setLabel('❌  REPROVAR').setStyle(ButtonStyle.Danger),
          ),
        ],
      });
    }
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setAuthor({ name: '🔄  TRANSFERÊNCIA SOLICITADA  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `> Sua solicitação foi enviada para análise.\n` +
          `> Você será notificado via **DM** sobre o resultado.\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Recrutamento' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUSÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function handleAusencia(interaction) {
  const { user } = interaction;
  const motivo      = interaction.fields.getTextInputValue('motivo').trim();
  const data_inicio = interaction.fields.getTextInputValue('data_inicio').trim();
  const data_fim    = interaction.fields.getTextInputValue('data_retorno').trim();

  const registrado = await prisma.usuario.findUnique({ where: { discord_id: user.id } });
  if (!registrado) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ Você precisa estar registrado.')],
      ephemeral: true,
    });
  }

  const ausencia = await prisma.ausencia.create({ data: { usuario: user.id, motivo, data_inicio, data_fim } });

  const canalId = config.canais.ausencias;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.info)
            .setAuthor({ name: '📅  SOLICITAÇÃO DE AFASTAMENTO  ·  FDN' })
            .setDescription(
              `${SEPARADOR}\n\n` +
              `**👤  Membro:** <@${user.id}>\n` +
              `**📆  Período:** \`${data_inicio}\` → \`${data_fim}\`\n\n` +
              `**📝  Motivo:**\n${motivo}\n\n` +
              `${SEPARADOR}`
            )
            .setFooter({ text: `ID: ${ausencia.id}` })
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`btn_aprovar_ausencia_${ausencia.id}`)
              .setLabel('✅  Aprovar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`btn_reprovar_ausencia_${ausencia.id}`)
              .setLabel('❌  Reprovar').setStyle(ButtonStyle.Danger),
          ),
        ],
      });
    }
  }

  await logger.logAusencia(interaction.client, ausencia, 'PENDENTE', null);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setAuthor({ name: '✅  AFASTAMENTO SOLICITADO  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**📆  Período:** \`${data_inicio}\` → \`${data_fim}\`\n\n` +
          `> Aguarde a aprovação da liderança.\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: 'FDN — Ausências' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNIÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function handlePunicao(interaction, tipo) {
  const { user, guild } = interaction;
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  await prisma.punicao.create({ data: { usuario: usuario_id, responsavel: user.id, tipo, motivo } });

  const labels = { PUNICAO_1: '⚠️ Punição 1', PUNICAO_2: '🔶 Punição 2', PUNICAO_3: '🔴 Punição 3', REMOCAO: '🚫 Remoção' };

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  membro?.send({
    embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setTitle(`${labels[tipo]} Aplicada`)
      .setDescription(`**Motivo:** ${motivo}\n**Responsável:** <@${user.id}>`)
      .setTimestamp()],
  }).catch(() => {});

  await logger.logPunicao(interaction.client, { usuario: usuario_id, responsavel: user.id, tipo, motivo });

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(`✅ **${labels[tipo]}** aplicada a <@${usuario_id}>.\n\n**Motivo:** ${motivo}`)
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVERTÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function handleAdvertencia(interaction) {
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarAdvertencia(interaction, usuario_id, motivo);
}

async function handleAdvertenciaAuto(interaction, userId) {
  const motivo = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarAdvertencia(interaction, userId, motivo);
}

async function _aplicarAdvertencia(interaction, usuario_id, motivo) {
  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  const adv = await prisma.advertencia.create({
    data: { usuario: usuario_id, responsavel: interaction.user.id, motivo },
  });
  await logger.logAdvertencia(interaction.client, adv);

  const membro = await interaction.guild.members.fetch(usuario_id).catch(() => null);
  membro?.send({
    embeds: [new EmbedBuilder().setColor(config.cores.aviso)
      .setTitle('⚠️ Você recebeu uma advertência')
      .setDescription(`**Motivo:** ${motivo}\n**Responsável:** <@${interaction.user.id}>`)
      .setTimestamp()],
  }).catch(() => {});

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setDescription(`✅ Advertência aplicada a <@${usuario_id}>.\n\n**Motivo:** ${motivo}`)
      .setTimestamp()],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOÇÃO / REBAIXAMENTO
// ─────────────────────────────────────────────────────────────────────────────
async function handlePromocaoAuto(interaction, tipo, userId, roleId) {
  const { user, guild } = interaction;
  const motivo = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: userId } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  const novoCargoFDN = config.cargos.hierarquia.find(c => c.id === roleId);
  if (!novoCargoFDN) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Cargo inválido na hierarquia.')],
      ephemeral: true,
    });
  }

  const cargoAntigoNome = alvo.cargo ?? 'Sem cargo';
  const membro = await guild.members.fetch(userId).catch(() => null);

  if (membro) {
    for (const cargo of config.cargos.hierarquia) {
      if (!cargo.id.startsWith('ID_') && membro.roles.cache.has(cargo.id))
        await membro.roles.remove(cargo.id).catch(() => {});
    }
    if (!novoCargoFDN.id.startsWith('ID_'))
      await membro.roles.add(novoCargoFDN.id).catch(() => {});

    membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(tipo === 'PROMOCAO' ? config.cores.gold : config.cores.aviso)
          .setTitle(tipo === 'PROMOCAO' ? '⬆️ Você foi promovido!' : '⬇️ Você foi rebaixado')
          .setDescription(
            `**Cargo anterior:** \`${cargoAntigoNome}\`\n` +
            `**Novo cargo:** \`${novoCargoFDN.nome}\`\n` +
            `**Motivo:** ${motivo}\n` +
            `**Responsável:** <@${user.id}>`
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  await prisma.usuario.update({ where: { discord_id: userId }, data: { cargo: novoCargoFDN.nome } });

  const dados = { usuario: userId, cargo_antigo: cargoAntigoNome, cargo_novo: novoCargoFDN.nome, motivo, responsavel: user.id };

  if (tipo === 'PROMOCAO') {
    await prisma.promocao.create({ data: dados });
    await logger.logPromocao(interaction.client, dados);
  } else {
    await prisma.rebaixamento.create({ data: dados });
    await logger.logRebaixamento(interaction.client, dados);
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(tipo === 'PROMOCAO' ? config.cores.gold : config.cores.aviso)
        .setAuthor({ name: `${tipo === 'PROMOCAO' ? '⬆️' : '⬇️'}  ${tipo === 'PROMOCAO' ? 'PROMOÇÃO' : 'REBAIXAMENTO'}  ·  FDN` })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Membro:** <@${userId}>\n` +
          `**📉  Cargo anterior:** \`${cargoAntigoNome}\`\n` +
          `**📈  Novo cargo:** \`${novoCargoFDN.nome}\`\n` +
          `**📝  Motivo:** ${motivo}\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: `Responsável: ${interaction.user.tag}` })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXONERAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function handleExoneracao(interaction) {
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarExoneracao(interaction, usuario_id, motivo);
}

async function handleExoneracaoAuto(interaction, userId) {
  const motivo = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarExoneracao(interaction, userId, motivo);
}

async function _aplicarExoneracao(interaction, userId, motivo) {
  const alvo = await prisma.usuario.findUnique({ where: { discord_id: userId } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  const membro = await interaction.guild.members.fetch(userId).catch(() => null);
  if (membro) {
    for (const cargo of config.cargos.hierarquia) {
      if (!cargo.id.startsWith('ID_')) await membro.roles.remove(cargo.id).catch(() => {});
    }
    if (!config.cargos.exonerado.startsWith('ID_'))
      await membro.roles.add(config.cargos.exonerado).catch(() => {});

    membro.send({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setTitle('🚫 Você foi exonerado da FDN')
        .setDescription(`**Motivo:** ${motivo}\n**Responsável:** <@${interaction.user.id}>`)
        .setTimestamp()],
    }).catch(() => {});
  }

  await prisma.usuario.update({ where: { discord_id: userId }, data: { cargo: 'Exonerado' } });
  const exon = await prisma.exoneracao.create({ data: { usuario: userId, motivo, responsavel: interaction.user.id } });
  await logger.logExoneracao(interaction.client, exon);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.erro)
        .setAuthor({ name: '🚫  EXONERAÇÃO REGISTRADA  ·  FDN' })
        .setDescription(
          `${SEPARADOR}\n\n` +
          `**👤  Membro:** <@${userId}>\n` +
          `**📝  Motivo:** ${motivo}\n\n` +
          `${SEPARADOR}`
        )
        .setFooter({ text: `Responsável: ${interaction.user.tag}` })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GERENCIAR HORAS
// ─────────────────────────────────────────────────────────────────────────────
async function handleGerenciarHoras(interaction, tipo, userIdOverride) {
  const usuario_id = userIdOverride ?? interaction.fields.getTextInputValue('usuario_id').trim();
  const horasStr   = interaction.fields.getTextInputValue('horas').trim();
  const horas      = parseFloat(horasStr);

  if (isNaN(horas) || horas <= 0) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Valor de horas inválido.')],
      ephemeral: true,
    });
  }

  tipo === 'ADD'
    ? await horasService.adicionarHorasManual(usuario_id, horas)
    : await horasService.removerHorasManual(usuario_id, horas);

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setDescription(`✅ **${horas}h** ${tipo === 'ADD' ? 'adicionadas a' : 'removidas de'} <@${usuario_id}>`)
      .setTimestamp()],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTAR MEMBRO (via modal direto)
// ─────────────────────────────────────────────────────────────────────────────
async function handleConsultarMembro(interaction) {
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();

  const [usuario, stats, adv, prom, pun] = await Promise.all([
    prisma.usuario.findUnique({ where: { discord_id: usuario_id } }),
    horasService.getEstatisticas(usuario_id),
    prisma.advertencia.count({ where: { usuario: usuario_id } }),
    prisma.promocao.count({ where: { usuario: usuario_id } }),
    prisma.punicao.count({ where: { usuario: usuario_id } }),
  ]);

  if (!usuario) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  const ts = Math.floor(usuario.data_registro.getTime() / 1000);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setAuthor({ name: '📊  FICHA DO MEMBRO  ·  FDN' })
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
    ephemeral: true,
  });
}

module.exports = { handleModal };