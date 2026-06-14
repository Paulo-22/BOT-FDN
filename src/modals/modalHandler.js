// src/modals/modalHandler.js
// Processa todos os modais submetidos

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config       = require('../config');
const { prisma }   = require('../database/client');
const logger       = require('../logs/logger');
const horasService = require('../services/horasService');
const editalService = require('../services/editalService');

// ─────────────────────────────────────────────────────────────────────────────
// ROTEADOR
// ─────────────────────────────────────────────────────────────────────────────

async function handleModal(interaction) {
  const { customId } = interaction;

  try {
    if (customId === 'modal_registro')         return await handleRegistro(interaction);
    if (customId === 'modal_candidatura')      return await handleCandidatura(interaction);
    if (customId === 'modal_edital_nome')      return await handleEditalNome(interaction);
    if (customId === 'modal_transferencia')    return await handleTransferencia(interaction);
    if (customId === 'modal_ausencia')         return await handleAusencia(interaction);
    if (customId === 'modal_advertencia')      return await handleAdvertencia(interaction);
    if (customId === 'modal_exoneracao')       return await handleExoneracao(interaction);
    if (customId === 'modal_consultar_membro') return await handleConsultarMembro(interaction);

    // Punição (com tipo no customId)
    if (customId.startsWith('modal_punicao_')) {
      return await handlePunicao(interaction, customId.replace('modal_punicao_', ''));
    }

    // Horas via dashboard manual
    if (customId === 'modal_add_horas') return await handleGerenciarHoras(interaction, 'ADD', null);
    if (customId === 'modal_rem_horas') return await handleGerenciarHoras(interaction, 'REM', null);

    // Horas via UserSelect (userId embutido no customId)
    if (customId.startsWith('modal_horas_add_')) {
      return await handleGerenciarHoras(interaction, 'ADD', customId.replace('modal_horas_add_', ''));
    }
    if (customId.startsWith('modal_horas_rem_')) {
      return await handleGerenciarHoras(interaction, 'REM', customId.replace('modal_horas_rem_', ''));
    }

    // Motivo simples: advertência ou exoneração via UserSelect
    // formato: modal_motivo_<acao>_<userId>
    if (customId.startsWith('modal_motivo_advertencia_')) {
      const userId = customId.replace('modal_motivo_advertencia_', '');
      return await handleAdvertenciaAuto(interaction, userId);
    }
    if (customId.startsWith('modal_motivo_exoneracao_')) {
      const userId = customId.replace('modal_motivo_exoneracao_', '');
      return await handleExoneracaoAuto(interaction, userId);
    }

    // Motivo com cargo: promoção ou rebaixamento via UserSelect + RoleSelect
    // formato: modal_motivo_<acao>_<userId>_<roleId>
    if (customId.startsWith('modal_motivo_promocao_')) {
      const partes = customId.replace('modal_motivo_promocao_', '').split('_');
      const userId = partes[0];
      const roleId = partes[1];
      return await handlePromocaoAuto(interaction, 'PROMOCAO', userId, roleId);
    }
    if (customId.startsWith('modal_motivo_rebaixamento_')) {
      const partes = customId.replace('modal_motivo_rebaixamento_', '').split('_');
      const userId = partes[0];
      const roleId = partes[1];
      return await handlePromocaoAuto(interaction, 'REBAIXAMENTO', userId, roleId);
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

  // ── Validação do ID (somente números) ────────────────────────────────────
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
    data: {
      discord_id:   user.id,
      discord_nome: user.tag,
      nome_mta,
      login,
      id_gamer,
    },
  });

  // ── Montar e truncar o nick (limite do Discord: 32 caracteres) ─────────────
  const sufixoId = ` ${id_gamer}`;
  const prefixo  = '𝑭𝑫𝑵 » ';
  const espacoNome = 32 - prefixo.length - sufixoId.length;
  const nomeTruncado = nome_mta.length > espacoNome
    ? nome_mta.slice(0, espacoNome).trim()
    : nome_mta;
  const novoNick = `${prefixo}${nomeTruncado}${sufixoId}`;

  // ── Renomear o membro no servidor ──────────────────────────────────────────
  const membro = await interaction.guild.members.fetch(user.id).catch(() => null);
  let nickAlterado = true;

  if (membro) {
    await membro.setNickname(novoNick).catch((err) => {
      nickAlterado = false;
      console.error(`[REGISTRO] Falha ao alterar nick de ${user.tag} (${user.id}):`, err.message);
    });

    // ── Remover cargo "Sem Cargo" e atribuir "Verificado" ──────────────────
    const cargoSemCargo = config.cargos.semCargo;
    const cargoVerificado = '1265868400324903023'; // Verificado

    if (cargoSemCargo && !cargoSemCargo.startsWith('ID_')) {
      await membro.roles.remove(cargoSemCargo).catch(() => {});
    }
    await membro.roles.add(cargoVerificado).catch(() => {});
  }

  await logger.logRegistro(interaction.client, usuario, novoNick);

  const descricaoNick = nickAlterado
    ? `Seu nome no servidor foi atualizado para:\n**${novoNick}**\n\n`
    : `⚠️ Não foi possível atualizar seu nome automaticamente. Peça a um administrador para te renomear para:\n**${novoNick}**\n\n`;

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setTitle('✅ Registro Concluído!')
        .setDescription(
          `Seu cadastro na **FDN** foi realizado com sucesso!\n\n` +
          descricaoNick +
          `Você recebeu o cargo de **Verificado** automaticamente.`
        )
        .addFields(
          { name: '🎮 Nome na Cidade', value: nome_mta, inline: true },
          { name: '👤 Login',          value: login,    inline: true },
          { name: '🆔 ID',             value: id_gamer, inline: true },
        )
        .setFooter({ text: 'FDN • Sistema de Registro' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITAL (FORMULÁRIO DE RECRUTAMENTO)
// ─────────────────────────────────────────────────────────────────────────────

async function handleEditalNome(interaction) {
  const nick = interaction.fields.getTextInputValue('nick').trim();
  return await editalService.criarCanalEdital(interaction, nick);
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

  const existente = await prisma.candidatura.findFirst({
    where: { discord_id: user.id, status: 'PENDENTE' },
  });

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
            .setTitle('📋 Nova Candidatura')
            .addFields(
              { name: '👤 Discord',    value: `<@${user.id}>`, inline: true },
              { name: '🎮 Nome MTA',   value: nome,            inline: true },
              { name: '🆔 ID Gamer',   value: id_gamer,        inline: true },
              { name: '⏱️ Horas',     value: horas,           inline: true },
              { name: '📖 Experiência', value: experiencia },
              { name: '💬 Motivo',     value: motivo },
            )
            .setFooter({ text: `ID: ${candidatura.id}` })
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_aprovar_candidatura_${candidatura.id}`)
              .setLabel('✅ APROVAR')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`btn_reprovar_candidatura_${candidatura.id}`)
              .setLabel('❌ REPROVAR')
              .setStyle(ButtonStyle.Danger),
          ),
        ],
      });
    }
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setTitle('📨 Candidatura Enviada!')
        .setDescription('Sua candidatura foi enviada para análise. Você será notificado via DM sobre o resultado.')
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

  const usuario = await prisma.usuario.findUnique({ where: { discord_id: user.id } });
  if (!usuario) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ Você precisa estar registrado para solicitar transferência.')],
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
            .setTitle('🔄 Solicitação de Transferência')
            .addFields(
              { name: '👤 Discord',      value: `<@${user.id}>`, inline: true },
              { name: '🎮 Nome MTA',     value: nome,            inline: true },
              { name: '🏴 Facção Atual', value: faccao_atual,    inline: true },
              { name: '💬 Motivo',       value: motivo },
            )
            .setFooter({ text: `ID: ${transfer.id}` })
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_aprovar_transfer_${transfer.id}`)
              .setLabel('✅ APROVAR')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`btn_reprovar_transfer_${transfer.id}`)
              .setLabel('❌ REPROVAR')
              .setStyle(ButtonStyle.Danger),
          ),
        ],
      });
    }
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setTitle('🔄 Transferência Solicitada!')
        .setDescription('Sua solicitação foi enviada para análise. Você será notificado via DM sobre o resultado.')
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

  const usuario = await prisma.usuario.findUnique({ where: { discord_id: user.id } });
  if (!usuario) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro)
        .setDescription('❌ Você precisa estar registrado.')],
      ephemeral: true,
    });
  }

  const ausencia = await prisma.ausencia.create({
    data: { usuario: user.id, motivo, data_inicio, data_fim },
  });

  const canalId = config.canais.ausencias;
  if (!canalId.startsWith('ID_')) {
    const canal = await interaction.client.channels.fetch(canalId).catch(() => null);
    if (canal) {
      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.info)
            .setTitle('📅 Solicitação de Afastamento')
            .addFields(
              { name: '👤 Membro',  value: `<@${user.id}>`,                 inline: true },
              { name: '📆 Período', value: `${data_inicio} → ${data_fim}`,  inline: true },
              { name: '📝 Motivo',  value: motivo },
            )
            .setFooter({ text: `ID: ${ausencia.id}` })
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_aprovar_ausencia_${ausencia.id}`)
              .setLabel('✅ Aprovar')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`btn_reprovar_ausencia_${ausencia.id}`)
              .setLabel('❌ Reprovar')
              .setStyle(ButtonStyle.Danger),
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
        .setTitle('✅ Afastamento Solicitado')
        .setDescription(`Período: **${data_inicio}** → **${data_fim}**\n\nAguarde a aprovação da liderança.`)
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

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  if (membro) {
    const labels = { PUNICAO_1: '⚠️ Punição 1', PUNICAO_2: '🔶 Punição 2', PUNICAO_3: '🔴 Punição 3', REMOCAO: '🚫 Remoção' };
    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setTitle(`${labels[tipo]} Aplicada`)
          .addFields(
            { name: 'Motivo',       value: motivo },
            { name: 'Responsável',  value: `<@${user.id}>` },
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  // Log no canal de punições
  const logCanalId = config.canais.logs.punicoes;
  if (logCanalId && !logCanalId.startsWith('ID_')) {
    const logCanal = await interaction.client.channels.fetch(logCanalId).catch(() => null);
    if (logCanal) {
      await logCanal.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.erro)
            .setTitle(`⚖️ Punição Aplicada — ${tipo}`)
            .addFields(
              { name: 'Membro',      value: `<@${usuario_id}>`, inline: true },
              { name: 'Tipo',        value: tipo,               inline: true },
              { name: 'Motivo',      value: motivo },
              { name: 'Responsável', value: `<@${user.id}>`,    inline: true },
            )
            .setTimestamp(),
        ],
      });
    }
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(`✅ Punição **${tipo}** aplicada a <@${usuario_id}>.\n\n**Motivo:** ${motivo}`)
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVERTÊNCIA (manual via modal direto)
// ─────────────────────────────────────────────────────────────────────────────

async function handleAdvertencia(interaction) {
  const { user, guild } = interaction;
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarAdvertencia(interaction, guild, user, usuario_id, motivo);
}

// ── Advertência via UserSelect (userId já conhecido) ─────────────────────────

async function handleAdvertenciaAuto(interaction, userId) {
  const motivo = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarAdvertencia(interaction, interaction.guild, interaction.user, userId, motivo);
}

async function _aplicarAdvertencia(interaction, guild, responsavel, usuario_id, motivo) {
  const alvo = await prisma.usuario.findUnique({ where: { discord_id: usuario_id } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  const adv = await prisma.advertencia.create({
    data: { usuario: usuario_id, responsavel: responsavel.id, motivo },
  });

  await logger.logAdvertencia(interaction.client, adv);

  const membro = await guild.members.fetch(usuario_id).catch(() => null);
  if (membro) {
    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setTitle('⚠️ Você recebeu uma advertência')
          .addFields(
            { name: 'Motivo',      value: motivo },
            { name: 'Responsável', value: `<@${responsavel.id}>` },
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(`✅ Advertência aplicada a <@${usuario_id}>.\n\n**Motivo:** ${motivo}`)
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOÇÃO / REBAIXAMENTO AUTOMÁTICO (via UserSelect + RoleSelect + Modal)
// ─────────────────────────────────────────────────────────────────────────────

async function handlePromocaoAuto(interaction, tipo, userId, roleId) {
  const { user, guild } = interaction;
  const motivo = interaction.fields.getTextInputValue('motivo').trim();

  const alvo = await prisma.usuario.findUnique({ where: { discord_id: userId } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado no sistema.')],
      ephemeral: true,
    });
  }

  const membro = await guild.members.fetch(userId).catch(() => null);
  const novoCargoFDN = config.cargos.hierarquia.find(c => c.id === roleId);

  if (!novoCargoFDN) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Cargo inválido na hierarquia FDN.')],
      ephemeral: true,
    });
  }

  // Descobre o cargo atual do membro no banco
  const cargoAntigoNome = alvo.cargo || 'Sem cargo';

  if (membro) {
    // Remove TODOS os cargos da hierarquia
    for (const cargo of config.cargos.hierarquia) {
      if (!cargo.id.startsWith('ID_') && membro.roles.cache.has(cargo.id)) {
        await membro.roles.remove(cargo.id).catch(() => {});
      }
    }
    // Adiciona o novo cargo
    if (!novoCargoFDN.id.startsWith('ID_')) {
      await membro.roles.add(novoCargoFDN.id).catch(() => {});
    }

    // DM para o membro
    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(tipo === 'PROMOCAO' ? config.cores.gold : config.cores.aviso)
          .setTitle(tipo === 'PROMOCAO' ? '⬆️ Você foi promovido!' : '⬇️ Você foi rebaixado')
          .addFields(
            { name: 'Cargo Anterior', value: cargoAntigoNome,    inline: true },
            { name: 'Novo Cargo',     value: novoCargoFDN.nome,  inline: true },
            { name: 'Motivo',         value: motivo },
            { name: 'Responsável',    value: `<@${user.id}>`,    inline: true },
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  // Atualiza DB
  await prisma.usuario.update({
    where: { discord_id: userId },
    data: { cargo: novoCargoFDN.nome },
  });

  const dados = {
    usuario:     userId,
    cargo_antigo: cargoAntigoNome,
    cargo_novo:   novoCargoFDN.nome,
    motivo,
    responsavel:  user.id,
  };

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
        .setTitle(tipo === 'PROMOCAO' ? '⬆️ Promoção Registrada' : '⬇️ Rebaixamento Registrado')
        .setDescription(
          `<@${userId}> **${cargoAntigoNome}** → **${novoCargoFDN.nome}**\n\n**Motivo:** ${motivo}`,
        )
        .setFooter({ text: `Responsável: ${interaction.user.tag}` })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXONERAÇÃO AUTOMÁTICA (via UserSelect + Modal)
// ─────────────────────────────────────────────────────────────────────────────

async function handleExoneracaoAuto(interaction, userId) {
  const motivo = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarExoneracao(interaction, interaction.guild, interaction.user, userId, motivo);
}

// Exoneração manual (via modal direto)
async function handleExoneracao(interaction) {
  const usuario_id = interaction.fields.getTextInputValue('usuario_id').trim();
  const motivo     = interaction.fields.getTextInputValue('motivo').trim();
  return _aplicarExoneracao(interaction, interaction.guild, interaction.user, usuario_id, motivo);
}

async function _aplicarExoneracao(interaction, guild, responsavel, userId, motivo) {
  const alvo = await prisma.usuario.findUnique({ where: { discord_id: userId } });
  if (!alvo) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(config.cores.erro).setDescription('❌ Membro não encontrado.')],
      ephemeral: true,
    });
  }

  const membro = await guild.members.fetch(userId).catch(() => null);
  if (membro) {
    // Remove todos os cargos da hierarquia
    for (const cargo of config.cargos.hierarquia) {
      if (!cargo.id.startsWith('ID_')) await membro.roles.remove(cargo.id).catch(() => {});
    }
    // Aplica cargo de exonerado
    if (!config.cargos.exonerado.startsWith('ID_')) {
      await membro.roles.add(config.cargos.exonerado).catch(() => {});
    }

    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setTitle('🚫 Você foi exonerado da FDN')
          .addFields(
            { name: 'Motivo',      value: motivo },
            { name: 'Responsável', value: `<@${responsavel.id}>` },
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  await prisma.usuario.update({ where: { discord_id: userId }, data: { cargo: 'Exonerado' } });
  const exon = await prisma.exoneracao.create({
    data: { usuario: userId, motivo, responsavel: responsavel.id },
  });
  await logger.logExoneracao(interaction.client, exon);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.erro)
        .setTitle('🚫 Exoneração Registrada')
        .setDescription(`<@${userId}> foi exonerado da **FDN**.\n\n**Motivo:** ${motivo}`)
        .setFooter({ text: `Responsável: ${responsavel.tag}` })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GERENCIAR HORAS
// ─────────────────────────────────────────────────────────────────────────────

async function handleGerenciarHoras(interaction, tipo, userIdOverride) {
  // Se userIdOverride for null, lê do campo do modal (fluxo manual)
  const usuario_id = userIdOverride || interaction.fields.getTextInputValue('usuario_id').trim();
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
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(
          `✅ **${horas}h** ${tipo === 'ADD' ? 'adicionadas a' : 'removidas de'} <@${usuario_id}>`,
        )
        .setTimestamp(),
    ],
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

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.info)
        .setTitle('📊 Ficha do Membro — FDN')
        .addFields(
          { name: '👤 Discord',       value: `<@${usuario.discord_id}>`,                                     inline: true },
          { name: '🎮 Nome MTA',      value: usuario.nome_mta,                                              inline: true },
          { name: '🆔 ID Gamer',      value: usuario.id_gamer,                                              inline: true },
          { name: '🏅 Cargo',         value: usuario.cargo || 'N/A',                                        inline: true },
          { name: '📅 Registro',      value: `<t:${Math.floor(usuario.data_registro.getTime() / 1000)}:D>`, inline: true },
          { name: '⏱️ Horas Totais', value: logger.formatarTempo(stats.total),                             inline: true },
          { name: '⚠️ Advertências', value: String(adv),                                                   inline: true },
          { name: '⬆️ Promoções',    value: String(prom),                                                  inline: true },
          { name: '⚖️ Punições',     value: String(pun),                                                   inline: true },
        )
        .setFooter({ text: 'FDN — Painel Administrativo' })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}

module.exports = { handleModal };