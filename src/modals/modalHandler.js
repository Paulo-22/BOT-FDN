// src/modals/modalHandler.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const { prisma } = require('../database/client');
const logger = require('../logs/logger');
const horasService = require('../services/horasService');

async function handleModal(interaction) {
  const { customId } = interaction;
  try {
    if (customId === 'modal_registro')          return await handleRegistro(interaction);
    if (customId === 'modal_candidatura')       return await handleCandidatura(interaction);
    if (customId === 'modal_transferencia')     return await handleTransferencia(interaction);
    if (customId === 'modal_ausencia')          return await handleAusencia(interaction);
    if (customId === 'modal_advertencia')       return await handleAdvertencia(interaction);
    if (customId === 'modal_promocao')          return await handlePromocao(interaction, 'PROMOCAO');
    if (customId === 'modal_rebaixamento')      return await handlePromocao(interaction, 'REBAIXAMENTO');
    if (customId === 'modal_exoneracao')        return await handleExoneracao(interaction);
    if (customId === 'modal_add_horas')         return await handleGerenciarHoras(interaction, 'ADD');
    if (customId === 'modal_rem_horas')         return await handleGerenciarHoras(interaction, 'REM');
    if (customId === 'modal_consultar_membro')  return await handleConsultarMembro(interaction);
    if (customId.startsWith('modal_punicao_')) {
      const tipo = customId.replace('modal_punicao_', '');
      return await handlePunicao(interaction, tipo);
    }
  } catch (err) {
    console.error('[MODAL ERROR]', err);
    const msg = { content: '❌ Erro ao processar o formulário.', ephemeral: true };
    interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
  }
}

// ── Registro ─────────────────────────────────

async function handleRegistro(interaction) {
  const { user } = interaction;
  const nome_mta = interaction.fields.getTextInputValue('nome_mta').trim();
  const id_gamer = interaction.fields.getTextInputValue('id_gamer').trim();
  const telefone = interaction.fields.getTextInputValue('telefone')?.trim() || null;

  const existente = await prisma.usuario.findFirst({ where: { OR: [{ discord_id: user.id }, { id_gamer }] } });
  if (existente) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.aviso).setDescription('⚠️ Você já possui um cadastro ou o ID Gamer já está em uso.')],
    ephemeral: true,
  });

  const usuario = await prisma.usuario.create({ data: { discord_id: user.id, discord_nome: user.tag, nome_mta, id_gamer, telefone } });
  await logger.logRegistro(interaction.client, usuario);

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setTitle('✅ Registro Concluído!')
      .setDescription('Seu cadastro na **FDN** foi realizado com sucesso!')
      .addFields(
        { name: '🎮 Nome MTA', value: nome_mta, inline: true },
        { name: '🆔 ID Gamer', value: id_gamer, inline: true },
        { name: '📞 Telefone', value: telefone || 'Não informado', inline: true },
      )
      .setFooter({ text: 'FDN — Família do Norte' }).setTimestamp()],
    ephemeral: true,
  });
}

// ── Candidatura ──────────────────────────────

async function handleCandidatura(interaction) {
  const { user } = interaction;
  const nome        = interaction.fields.getTextInputValue('nome').trim();
  const id_gamer    = interaction.fields.getTextInputValue('id_gamer').trim();
  const horas       = interaction.fields.getTextInputValue('horas').trim();
  const experiencia = interaction.fields.getTextInputValue('experiencia').trim();
  const motivo      = interaction.fields.getTextInputValue('motivo').trim();

  const existente = await prisma.candidatura.findFirst({ where: { discord_id: user.id, status: 'PENDENTE' } });
  if (existente) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.aviso).setDescription('⚠️ Você já possui uma candidatura em análise.')],
    ephemeral: true,
  });

  const candidatura = await prisma.candidatura.create({
    data: { discord_id: user.id, discord_nome: user.tag, nome, id_gamer, horas, experiencia, motivo },
  });

  const canalId = config.canais.analise;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [new EmbedBuilder().setColor(config.cores.info)
          .setTitle('📋 Nova Candidatura')
          .addFields(
            { name: '👤 Discord', value: `<@${user.id}>`, inline: true },
            { name: '🎮 Nome MTA', value: nome, inline: true },
            { name: '🆔 ID Gamer', value: id_gamer, inline: true },
            { name: '⏱️ Horas', value: horas, inline: true },
            { name: '📖 Experiência', value: experiencia },
            { name: '💬 Motivo', value: motivo },
          )
          .setFooter({ text: `ID: ${candidatura.id}` }).setTimestamp()],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`btn_aprovar_candidatura_${candidatura.id}`).setLabel('✅ APROVAR').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`btn_reprovar_candidatura_${candidatura.id}`).setLabel('❌ REPROVAR').setStyle(ButtonStyle.Danger),
        )],
      });
    }
  }

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setTitle('📨 Candidatura Enviada!')
      .setDescription('Sua candidatura foi enviada para análise. Você será notificado via DM sobre o resultado.')
      .setFooter({ text: 'FDN — Recrutamento' }).setTimestamp()],
    ephemeral: true,
  });
}

// ── Transferência ────────────────────────────

async function handleTransferencia(interaction) {
  const { user } = interaction;
  const nome         = interaction.fields.getTextInputValue('nome').trim();
  const faccao_atual = interaction.fields.getTextInputValue('faccao_atual').trim();
  const motivo       = interaction.fields.getTextInputValue('motivo').trim();

  const usuario = await prisma.usuario.findUnique({ where: { discord_id: user.id } });
  if (!usuario) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Você precisa estar registrado para solicitar transferência.')],
    ephemeral: true,
  });

  const transfer = await prisma.transferencia.create({ data: { usuario: user.id, faccao_atual, motivo } });

  const canalId = config.canais.analise;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [new EmbedBuilder().setColor(config.cores.info)
          .setTitle('🔄 Solicitação de Transferência')
          .addFields(
            { name: '👤 Discord', value: `<@${user.id}>`, inline: true },
            { name: '🎮 Nome MTA', value: nome, inline: true },
            { name: '🏴 Facção Atual', value: faccao_atual, inline: true },
            { name: '💬 Motivo', value: motivo },
          )
          .setFooter({ text: `ID: ${transfer.id}` }).setTimestamp()],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`btn_aprovar_transfer_${transfer.id}`).setLabel('✅ APROVAR').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`btn_reprovar_transfer_${transfer.id}`).setLabel('❌ REPROVAR').setStyle(ButtonStyle.Danger),
        )],
      });
    }
  }

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setTitle('🔄 Transferência Solicitada!')
      .setDescription('Sua solicitação foi enviada para análise. Você será notificado via DM sobre o resultado.')
      .setFooter({ text: 'FDN — Recrutamento' }).setTimestamp()],
    ephemeral: true,
  });
}

// ── Ausência ─────────────────────────────────

async function handleAusencia(interaction) {
  const { user } = interaction;
  const motivo      = interaction.fields.getTextInputValue('motivo').trim();
  const data_inicio = interaction.fields.getTextInputValue('data_inicio').trim();
  const data_fim    = interaction.fields.getTextInputValue('data_retorno').trim();

  const usuario = await prisma.usuario.findUnique({ where: { discord_id: user.id } });
  if (!usuario) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Você precisa estar registrado.')],
    ephemeral: true,
  });

  const ausencia = await prisma.ausencia.create({ data: { usuario: user.id, motivo, data_inicio, data_fim } });

  const canalId = config.canais.ausencias;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [new EmbedBuilder().setColor(config.cores.info)
          .setTitle('📅 Solicitação de Afastamento')
          .addFields(
            { name: '👤 Membro', value: `<@${user.id}>`, inline: true },
            { name: '📆 Período', value: `${data_inicio} → ${data_fim}`, inline: true },
            { name: '📝 Motivo', value: motivo },
          )
          .setFooter({ text: `ID: ${ausencia.id}` }).setTimestamp()],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`btn_aprovar_ausencia_${ausencia.id}`).setLabel('✅ Aprovar').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`btn_reprovar_ausencia_${ausencia.id}`).setLabel('❌ Reprovar').setStyle(ButtonStyle.Danger),
        )],
      });
    }
  }

  await logger.logAusencia(interaction.client, ausencia, 'PENDENTE', null);
  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setTitle('✅ Afastamento Solicitado')
      .setDescription(`Período: **${data_inicio}** → **${data_fim}**\n\nAguarde a aprovação da liderança.`)
      .setFooter({ text: 'FDN — Ausências' }).setTimestamp()],
    ephemeral: true,
  });
}

// ── Punição ──────────────────────────────────

async function handlePunicao(interaction, tipo) {
  const { user, guild } = interaction;
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
    ephemeral: true,
  });

  await prisma.punicao.create({ data: { usuario: usuario_id, responsavel: user.id, tipo, motivo } });

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  if (membro) {
    const labels = { PUNICAO_1: '⚠️ Punição 1', PUNICAO_2: '🔶 Punição 2', PUNICAO_3: '🔴 Punição 3', REMOCAO: '🚫 Remoção' };
    await membro.send({ embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setTitle(`${labels[tipo]} Aplicada`)
      .addFields({ name: 'Motivo', value: motivo }, { name: 'Responsável', value: `<@${user.id}>` })
      .setTimestamp()]
    }).catch(() => {});
  }

  const logCanalId = config.canais.logs.advertencias;
  if (!logCanalId.startsWith('ID_')) {
    const logCanal = await interaction.client.channels.fetch(logCanalId).catch(() => null);
    if (logCanal) {
      await logCanal.send({ embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setTitle(`⚖️ Punição Aplicada — ${tipo}`)
        .addFields(
          { name: 'Membro', value: `<@${usuario_id}>`, inline: true },
          { name: 'Tipo', value: tipo, inline: true },
          { name: 'Motivo', value: motivo },
          { name: 'Responsável', value: `<@${user.id}>`, inline: true },
        )
        .setTimestamp()]
      });
    }
  }

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setDescription(`✅ Punição **${tipo}** aplicada a <@${usuario_id}>.\n\n**Motivo:** ${motivo}`)
      .setTimestamp()],
    ephemeral: true,
  });
}

// ── Advertência ──────────────────────────────

async function handleAdvertencia(interaction) {
  const { user, guild } = interaction;
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
    ephemeral: true,
  });

  const adv = await prisma.advertencia.create({ data: { usuario: usuario_id, responsavel: user.id, motivo } });
  await logger.logAdvertencia(interaction.client, adv);

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  if (membro) {
    await membro.send({ embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setTitle('⚠️ Você recebeu uma advertência')
      .addFields({ name: 'Motivo', value: motivo }, { name: 'Responsável', value: `<@${user.id}>` })
      .setTimestamp()]
    }).catch(() => {});
  }

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setDescription(`✅ Advertência aplicada a <@${usuario_id}>.\n\n**Motivo:** ${motivo}`)
      .setTimestamp()],
    ephemeral: true,
  });
}

// ── Promoção / Rebaixamento ──────────────────

async function handlePromocao(interaction, tipo) {
  const { user, guild } = interaction;
  const usuario_id  = interaction.fields.getTextInputValue('usuario_id').trim();
  const cargo_atual = interaction.fields.getTextInputValue('cargo_atual').trim();
  const novo_cargo  = interaction.fields.getTextInputValue('novo_cargo').trim();
  const motivo      = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
    ephemeral: true,
  });

  await prisma.usuario.update({ where: { discord_id: usuario_id }, data: { cargo: novo_cargo } });

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  if (membro) {
    const antigo = config.cargos.hierarquia.find(c => c.nome.toLowerCase() === cargo_atual.toLowerCase());
    const novo   = config.cargos.hierarquia.find(c => c.nome.toLowerCase() === novo_cargo.toLowerCase());
    if (antigo && !antigo.id.startsWith('ID_')) await membro.roles.remove(antigo.id).catch(() => {});
    if (novo   && !novo.id.startsWith('ID_'))   await membro.roles.add(novo.id).catch(() => {});
    await membro.send({ embeds: [new EmbedBuilder()
      .setColor(tipo === 'PROMOCAO' ? config.cores.gold : config.cores.aviso)
      .setTitle(tipo === 'PROMOCAO' ? '⬆️ Você foi promovido!' : '⬇️ Você foi rebaixado')
      .addFields(
        { name: 'Cargo Anterior', value: cargo_atual, inline: true },
        { name: 'Novo Cargo', value: novo_cargo, inline: true },
        { name: 'Motivo', value: motivo },
      )
      .setTimestamp()]
    }).catch(() => {});
  }

  const dados = { usuario: usuario_id, cargo_antigo: cargo_atual, cargo_novo: novo_cargo, motivo, responsavel: user.id };
  if (tipo === 'PROMOCAO') {
    await prisma.promocao.create({ data: dados });
    await logger.logPromocao(interaction.client, dados);
  } else {
    await prisma.rebaixamento.create({ data: dados });
    await logger.logRebaixamento(interaction.client, dados);
  }

  return interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(tipo === 'PROMOCAO' ? config.cores.gold : config.cores.aviso)
      .setDescription(`${tipo === 'PROMOCAO' ? '⬆️' : '⬇️'} <@${usuario_id}> **${cargo_atual}** → **${novo_cargo}**\n\n**Motivo:** ${motivo}`)
      .setTimestamp()],
    ephemeral: true,
  });
}

// ── Exoneração ───────────────────────────────

async function handleExoneracao(interaction) {
  const { user, guild } = interaction;
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
    ephemeral: true,
  });

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  if (membro) {
    for (const cargo of config.cargos.hierarquia) {
      if (!cargo.id.startsWith('ID_')) await membro.roles.remove(cargo.id).catch(() => {});
    }
    if (!config.cargos.exonerado.startsWith('ID_')) await membro.roles.add(config.cargos.exonerado).catch(() => {});
    await membro.send({ embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setTitle('🚫 Você foi exonerado da FDN')
      .addFields({ name: 'Motivo', value: motivo })
      .setTimestamp()]
    }).catch(() => {});
  }

  await prisma.usuario.update({ where: { discord_id: usuario_id }, data: { cargo: 'Exonerado' } });
  const exon = await prisma.exoneracao.create({ data: { usuario: usuario_id, motivo, responsavel: user.id } });
  await logger.logExoneracao(interaction.client, exon);

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro)
      .setDescription(`🚫 <@${usuario_id}> foi exonerado da **FDN**.\n\n**Motivo:** ${motivo}`)
      .setTimestamp()],
    ephemeral: true,
  });
}

// ── Gerenciar Horas ──────────────────────────

async function handleGerenciarHoras(interaction, tipo) {
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const horas = parseFloat(interaction.fields.getTextInputValue('horas').trim());

  if (isNaN(horas) || horas <= 0) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Valor inválido.')],
    ephemeral: true,
  });

  tipo === 'ADD'
    ? await horasService.adicionarHorasManual(usuario_id, horas)
    : await horasService.removerHorasManual(usuario_id, horas);

  return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.sucesso)
      .setDescription(`✅ ${tipo === 'ADD' ? 'Adicionadas' : 'Removidas'} **${horas}h** de <@${usuario_id}>`)],
    ephemeral: true,
  });
}

// ── Consultar Membro ─────────────────────────

async function handleConsultarMembro(interaction) {
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();

  const [usuario, stats, adv, prom, pun] = await Promise.all([
    prisma.usuario.findUnique({ where: { discord_id: usuario_id } }),
    horasService.getEstatisticas(usuario_id),
    prisma.advertencia.count({ where: { usuario: usuario_id } }),
    prisma.promocao.count({ where: { usuario: usuario_id } }),
    prisma.punicao.count({ where: { usuario: usuario_id } }),
  ]);

  if (!usuario) return interaction.reply({
    embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
    ephemeral: true,
  });

  return interaction.reply({
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
    ephemeral: true,
  });
}

module.exports = { handleModal };
