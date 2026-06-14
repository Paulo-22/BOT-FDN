// src/services/editalService.js
// Sistema de FORMULÁRIO / EDITAL de recrutamento

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');

const config = require('../config');
const { prisma } = require('../database/client');
const logger = require('../logs/logger');
const perguntas = require('../data/perguntasEdital');

const TEMPO_LIMITE_MS = 30 * 60 * 1000; // 30 minutos
const TEMPO_RESPOSTA_MS = 30 * 60 * 1000; // 30 minutos por resposta (dentro do tempo total)

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sanitizarNomeCanal(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 90) || 'candidato';
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

// ─────────────────────────────────────────────────────────────────────────────
// ETAPA 1 — Modal de nome → cria canal privado + manda mensagem de "Canal criado"
// ─────────────────────────────────────────────────────────────────────────────

async function criarCanalEdital(interaction, nick) {
  const { guild, user } = interaction;

  // Verifica se já existe edital pendente para esse usuário
  const existente = await prisma.edital.findFirst({
    where: { discord_id: user.id, status: 'PENDENTE' },
  });

  if (existente) {
    const canalExistente = await guild.channels.fetch(existente.canal_id).catch(() => null);
    if (canalExistente) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.cores.aviso)
            .setDescription(`⚠️ Você já possui um formulário em andamento: <#${canalExistente.id}>`),
        ],
        ephemeral: true,
      });
    }
    // canal não existe mais, limpa registro órfão
    await prisma.edital.delete({ where: { id: existente.id } }).catch(() => {});
  }

  const categoriaId = config.canais.categoriaEdital;
  const nomeCanal = `edital-${sanitizarNomeCanal(nick)}`;

  const permissoes = [
    { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
  ];

  for (const id of config.cargos.podeAnalisarEdital) {
    if (id && !id.startsWith('ID_')) {
      permissoes.push({
        id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
      });
    }
  }

  const canal = await guild.channels.create({
    name: nomeCanal,
    parent: categoriaId && !categoriaId.startsWith('ID_') ? categoriaId : null,
    permissionOverwrites: permissoes,
  });

  await prisma.edital.create({
    data: {
      discord_id: user.id,
      discord_nome: user.tag,
      nick,
      canal_id: canal.id,
      respostas: {},
      status: 'PENDENTE',
    },
  });

  // Mensagem confirmando criação do canal (ephemeral, no canal de origem)
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(
          `✅ **Canal criado!** Clique abaixo para responder o formulário:`
        ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Ir para o canal do formulário')
          .setEmoji('📂')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${canal.id}`),
      ),
    ],
    ephemeral: true,
  });

  // Mensagem de boas-vindas dentro do canal privado, com botão INICIAR FORMULÁRIO
  await canal.send({
    content: `<@${user.id}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.principal)
        .setTitle('INICIAR FORMULÁRIO')
        .setDescription(
          'Revise cada pergunta cuidadosamente antes de responder.\n' +
          `**Você tem ${TEMPO_LIMITE_MS / 60000} minutos para concluir. ` +
          'Após esse tempo, o formulário será encerrado.**'
        ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_responder_edital_${canal.id}`)
          .setLabel('INICIAR FORMULÁRIO')
          .setStyle(ButtonStyle.Success),
      ),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ETAPA 2 — Inicia a coleta sequencial de respostas (1 pergunta por vez)
// ─────────────────────────────────────────────────────────────────────────────

async function iniciarColetaRespostas(interaction) {
  const canal = interaction.channel;
  const edital = await prisma.edital.findUnique({ where: { canal_id: canal.id } });

  if (!edital) {
    return interaction.reply({ content: '❌ Formulário não encontrado para este canal.', ephemeral: true });
  }
  if (edital.discord_id !== interaction.user.id) {
    return interaction.reply({ content: '❌ Apenas o candidato pode responder este formulário.', ephemeral: true });
  }
  if (edital.status !== 'PENDENTE') {
    return interaction.reply({ content: '⚠️ Este formulário já foi finalizado.', ephemeral: true });
  }

  await interaction.update({ components: [] }).catch(() => interaction.deferUpdate().catch(() => {}));

  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.aviso)
        .setDescription('📣 **Atenção:** Seja sincero ao responder.'),
    ],
  });

  const respostas = {};
  const inicioGeral = Date.now();

  for (let i = 0; i < perguntas.length; i++) {
    const pergunta = perguntas[i];
    const prazoRestante = TEMPO_LIMITE_MS - (Date.now() - inicioGeral);

    if (prazoRestante <= 0) {
      return await encerrarPorTempo(canal, edital, respostas);
    }

    await canal.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.principal)
          .setTitle('FORMULÁRIO FDN')
          .addFields({ name: `${i + 1}º — Pergunta`, value: pergunta })
          .setFooter({ text: `Pergunta ${i + 1}/${perguntas.length}` })
          .setTimestamp(),
      ],
    });

    const tempoEspera = Math.min(TEMPO_RESPOSTA_MS, Math.max(prazoRestante, 0));

    let resposta;
    try {
      const coletadas = await canal.awaitMessages({
        filter: (m) => m.author.id === edital.discord_id,
        max: 1,
        time: tempoEspera,
        errors: ['time'],
      });
      resposta = coletadas.first();
    } catch {
      return await encerrarPorTempo(canal, edital, respostas);
    }

    respostas[`pergunta_${i + 1}`] = {
      pergunta,
      resposta: resposta.content.slice(0, 1024) || '(sem texto / anexo)',
    };

    // Atualiza progressivamente no banco
    await prisma.edital.update({
      where: { id: edital.id },
      data: { respostas },
    }).catch(() => {});
  }

  await finalizarFormulario(canal, edital, respostas);
}

async function encerrarPorTempo(canal, edital, respostasParciais) {
  await prisma.edital.update({
    where: { id: edital.id },
    data: { status: 'EXPIRADO', respostas: respostasParciais },
  }).catch(() => {});

  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.erro)
        .setDescription('⏱️ **Tempo esgotado!** O formulário foi encerrado automaticamente. Este canal será removido em breve.'),
    ],
  });

  setTimeout(() => canal.delete().catch(() => {}), 10_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// ETAPA 3 — Finaliza: envia para canal de análise + avisa candidato
// ─────────────────────────────────────────────────────────────────────────────

async function finalizarFormulario(canal, edital, respostas) {
  await prisma.edital.update({
    where: { id: edital.id },
    data: { status: 'EM_ANALISE', respostas },
  });

  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor(config.cores.sucesso)
        .setDescription(
          '✅ **Formulário concluído!**\n' +
          'Suas respostas foram enviadas para análise da staff. ' +
          'Você será notificado por aqui e via DM sobre o resultado.'
        ),
    ],
  });

  const canalAnaliseId = config.canais.analiseEdital;
  if (!canalAnaliseId || canalAnaliseId.startsWith('ID_')) return;

  const canalAnalise = await canal.client.channels.fetch(canalAnaliseId).catch(() => null);
  if (!canalAnalise) return;

  const embeds = montarEmbedsResumo(edital, respostas);

  const componentes = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_aprovar_edital_${edital.id}`)
        .setLabel('✅ APROVAR')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`btn_reprovar_edital_${edital.id}`)
        .setLabel('❌ REPROVAR')
        .setStyle(ButtonStyle.Danger),
    ),
  ];

  for (let i = 0; i < embeds.length; i++) {
    await canalAnalise.send({
      embeds: [embeds[i]],
      components: i === embeds.length - 1 ? componentes : [],
    });
  }
}

function montarEmbedsResumo(edital, respostas) {
  const embeds = [];
  const itens = Object.values(respostas);

  // Monta o texto de todas as perguntas/respostas em formato compacto
  const linhas = itens.map((item, idx) =>
    `**${idx + 1}º — ${item.pergunta}**\n${item.resposta || '(sem resposta)'}`
  );

  // Discord limita 4096 caracteres na description; dividimos em blocos seguros
  const LIMITE = 3500;
  const blocos = [];
  let atual = '';

  for (const linha of linhas) {
    if ((atual + '\n\n' + linha).length > LIMITE) {
      blocos.push(atual);
      atual = linha;
    } else {
      atual = atual ? `${atual}\n\n${linha}` : linha;
    }
  }
  if (atual) blocos.push(atual);

  for (let i = 0; i < blocos.length; i++) {
    const embed = new EmbedBuilder()
      .setColor(config.cores.info)
      .setDescription(blocos[i])
      .setTimestamp();

    if (i === 0) {
      embed
        .setTitle('📋 Novo Formulário — Análise')
        .addFields(
          { name: '👤 Candidato', value: `<@${edital.discord_id}>`, inline: true },
          { name: '📛 Nick informado', value: edital.nick, inline: true },
          { name: '📂 Canal', value: edital.canal_id, inline: true },
        );
    }

    if (i === blocos.length - 1) {
      embed.setFooter({ text: `ID do Edital: ${edital.id}` });
    }

    embeds.push(embed);
  }

  return embeds;
}

// ─────────────────────────────────────────────────────────────────────────────
// ETAPA 4 — Aprovar / Reprovar (chamado pelo buttonHandler)
// ─────────────────────────────────────────────────────────────────────────────

async function aprovarEdital(interaction, id) {
  const edital = await prisma.edital.findUnique({ where: { id: parseInt(id) } });
  if (!edital) return interaction.reply({ content: '❌ Edital não encontrado.', ephemeral: true });
  if (edital.status === 'APROVADA' || edital.status === 'REPROVADA') {
    return interaction.reply({ content: '⚠️ Este edital já foi analisado.', ephemeral: true });
  }

  await prisma.edital.update({
    where: { id: edital.id },
    data: { status: 'APROVADA', responsavel: interaction.user.id, analisado_em: new Date() },
  });

  const membro = await interaction.guild.members.fetch(edital.discord_id).catch(() => null);
  if (membro) {
    for (const cargoId of config.cargos.cargosAprovacaoEdital) {
      if (cargoId && !cargoId.startsWith('ID_')) {
        await membro.roles.add(cargoId).catch(() => {});
      }
    }

    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.sucesso)
          .setTitle('✅ Formulário Aprovado!')
          .setDescription(
            `Parabéns, **${edital.nick}**! Seu formulário foi **analisado e aprovado** com sucesso.\n\n` +
            'Aguarde novas instruções da equipe para dar continuidade ao processo de recrutamento.'
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  await logger.logEdital(interaction.client, edital, 'APROVADA', interaction.user.id);
  await interaction.update({ components: disableRow('✅ Aprovado', ButtonStyle.Success) });

  await removerCanalEdital(interaction.client, edital);
}

async function reprovarEdital(interaction, id) {
  const edital = await prisma.edital.findUnique({ where: { id: parseInt(id) } });
  if (!edital) return interaction.reply({ content: '❌ Edital não encontrado.', ephemeral: true });
  if (edital.status === 'APROVADA' || edital.status === 'REPROVADA') {
    return interaction.reply({ content: '⚠️ Este edital já foi analisado.', ephemeral: true });
  }

  await prisma.edital.update({
    where: { id: edital.id },
    data: { status: 'REPROVADA', responsavel: interaction.user.id, analisado_em: new Date() },
  });

  const membro = await interaction.guild.members.fetch(edital.discord_id).catch(() => null);
  if (membro) {
    await membro.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.cores.erro)
          .setTitle('❌ Formulário Reprovado')
          .setDescription(
            `Olá, **${edital.nick}**. Infelizmente seu formulário foi **analisado e reprovado** desta vez.\n\n` +
            'Você poderá enviar um novo formulário após o período definido pela staff.'
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  }

  await logger.logEdital(interaction.client, edital, 'REPROVADA', interaction.user.id);
  await interaction.update({ components: disableRow('❌ Reprovado', ButtonStyle.Danger) });

  await removerCanalEdital(interaction.client, edital);
}

async function removerCanalEdital(client, edital) {
  const canal = await client.channels.fetch(edital.canal_id).catch(() => null);
  if (canal) {
    await canal.delete().catch(() => {});
  }
}

module.exports = {
  criarCanalEdital,
  iniciarColetaRespostas,
  aprovarEdital,
  reprovarEdital,
};