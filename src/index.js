const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');require('dotenv').config();

// IDs de configuração
const CATEGORY_ID = '1515681495367548952';
const CANAL_RESULTADO_ID = '1389279206390894784';

const CARGOS_STAFF = [
  '1265868396843499530', // superior
  '1265868373062062162', // resp.edital
  '1265868313662197851', // fundador
];

const CARGO_OBSERVACAO = '1265868360613101658';
const CARGO_APROVADO_1FASE = '1265868398194327627';

const IMG_APROVADO = 'https://i.ibb.co/vvL92fX1/aprovado.png';
const IMG_REPROVADO = 'https://i.ibb.co/1YZ0NCTD/reprovado.png';

const PERGUNTAS = [
  'Qual é o seu nick dentro do servidor?',
  'Qual a sua idade?',
  'Há quanto tempo você joga MTA Roleplay?',
  'Em quais servidores RP você já jogou?',
  'Quais facções você já participou?',
  'Qual foi o maior cargo que você já ocupou em uma facção?',
  'Por que deseja entrar para nossa facção?',
  'O que você mais gosta de fazer dentro de um servidor RP?',
  'O que significa MetaGaming (MG)?',
  'O que significa PowerGaming (PG)?',
  'O que significa DeathMatch (DM)?',
  'O que significa FearRP?',
  'Você vê um membro da facção matando outro membro sem motivo algum. O que você faria?',
  'Você descobre que um membro está falando mal da facção pelas costas. Como reagiria?',
  'Um membro começa a criar confusão e discussões no chat da facção. O que você faria?',
  'Você percebe que um membro está mentindo para prejudicar outro integrante. Como agiria?',
  'Um amigo seu entra na facção, mas começa a quebrar regras constantemente. O que você faria?',
  'Você vê um membro tratando os novatos com desrespeito. Qual seria sua atitude?',
  'Um membro pede para você esconder algo errado que ele fez. Você ajudaria ou contaria para a liderança? Por quê?',
  'Se você discordar de uma decisão da liderança, como pretende resolver a situação?',
  'Qual foi a situação mais complicada que você já passou em uma facção ou servidor RP?',
  'Se pudesse mudar uma coisa nas facções RP em geral, o que mudaria e por quê?',
];

// Armazena estado dos formulários em andamento
// Map<userId, { channelId, respostas, perguntaAtual, nome, timer, guildId }>
const formularios = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// ── Interações (botões e modals) ──────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  try {
    // ── Botão: INICIAR FORMULÁRIO (no canal público edital) ─────────────────
    if (interaction.isButton() && interaction.customId === 'iniciar_formulario') {
      await handleIniciarFormulario(interaction);
      return;
    }

    // ── Modal: Nome do candidato ────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'modal_nome') {
      await handleModalNome(interaction);
      return;
    }

    // ── Botão: INICIAR FORMULÁRIO (dentro do canal privado) ─────────────────
    if (interaction.isButton() && interaction.customId === 'iniciar_perguntas') {
      await handleIniciarPerguntas(interaction);
      return;
    }

    // ── Botão: APROVAR ──────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {
      const userId = interaction.customId.replace('aprovar_', '');
      await handleAprovar(interaction, userId);
      return;
    }

    // ── Botão: REPROVAR ─────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('reprovar_')) {
      const userId = interaction.customId.replace('reprovar_', '');
      await handleReprovar(interaction, userId);
      return;
    }
  } catch (err) {
    console.error('Erro em interactionCreate:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Ocorreu um erro. Tente novamente.', ephemeral: true }).catch(() => {});
    }
  }
});

// ── Mensagens (respostas às perguntas no canal privado) ───────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const estado = formularios.get(userId);
  if (!estado) return;
  if (message.channelId !== estado.channelId) return;

  // Salva resposta
  estado.respostas.push(message.content);
  const proxima = estado.respostas.length;

  if (proxima < PERGUNTAS.length) {
    // Próxima pergunta
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle('FORMULÁRIO FDN')
          .setDescription(`**${proxima + 1}º – ${PERGUNTAS[proxima]}**`)
          .setFooter({ text: `Pergunta ${proxima + 1}/${PERGUNTAS.length} • ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` })
      ]
    });
  } else {
    // Formulário concluído
    clearTimeout(estado.timer);
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('✅ Formulário concluído!')
          .setDescription('Suas respostas foram enviadas. Aguarde a análise da staff.')
      ]
    });

    await enviarRespostasParaStaff(message.guild, userId, estado);
    formularios.delete(userId);

    // Deleta o canal após 5 segundos
    setTimeout(() => {
      message.channel.delete().catch(() => {});
    }, 5000);
  }
});

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleIniciarFormulario(interaction) {
  const userId = interaction.user.id;

  // Verifica se já tem formulário em andamento
  if (formularios.has(userId)) {
    return interaction.reply({ content: '⚠️ Você já possui um formulário em andamento!', ephemeral: true });
  }

  // Mostra modal para pedir o nome
  const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
  const modal = new ModalBuilder()
    .setCustomId('modal_nome')
    .setTitle('Formulário de Registro');

  const nomeInput = new TextInputBuilder()
    .setCustomId('nome_input')
    .setLabel('QUAL SEU NOME?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Digite seu nome')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(nomeInput));
  await interaction.showModal(modal);
}

async function handleModalNome(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const nome = interaction.fields.getTextInputValue('nome_input');
  const userId = interaction.user.id;
  const guild = interaction.guild;

  // Cria o canal privado
  const canal = await guild.channels.create({
    name: `fdn-edital_${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: CATEGORY_ID,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: userId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
      ...CARGOS_STAFF.map(roleId => ({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      })),
      {
        id: client.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels,
        ],
      },
    ],
  });

  // Mensagem no canal de edital (ephemeral com link)
  await interaction.editReply({
    content: `✅ Canal criado! Clique abaixo para responder o formulário:\n📁 [Ir para o canal do formulário](https://discord.com/channels/${guild.id}/${canal.id})`,
  });

  // Mensagem inicial no canal privado
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('iniciar_perguntas')
      .setLabel('INICIAR FORMULÁRIO')
      .setStyle(ButtonStyle.Success)
  );

  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xcc0000)
        .setTitle('FORMULÁRIO | FDN')
        .setDescription(
          'Esse formulário contém uma lista de perguntas para conhecer seu conhecimento e suas informações.\nPara começar basta clicar no botão **INICIAR FORMULÁRIO**.'
        )
    ],
    components: [row],
  });

  // Salva estado
  formularios.set(userId, {
    channelId: canal.id,
    respostas: [],
    nome,
    guildId: guild.id,
    timer: null,
  });
}

async function handleIniciarPerguntas(interaction) {
  const userId = interaction.user.id;
  const estado = formularios.get(userId);

  if (!estado || interaction.channelId !== estado.channelId) {
    return interaction.reply({ content: '❌ Formulário não encontrado.', ephemeral: true });
  }

  await interaction.deferUpdate();

  // Aviso de sinceridade
  await interaction.channel.send({
    content: `📢 **Atenção:** Seja sincero ao responder.`,
    ephemeral: false,
  });

  // Primeira pergunta
  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('FORMULÁRIO FDN')
        .setDescription(`**1º – ${PERGUNTAS[0]}**`)
        .setFooter({ text: `Pergunta 1/${PERGUNTAS.length} • ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` })
    ]
  });

  // Timer de 30 minutos
  const timer = setTimeout(async () => {
    if (formularios.has(userId)) {
      formularios.delete(userId);
      const channel = interaction.guild.channels.cache.get(estado.channelId);
      if (channel) {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('⏰ Tempo esgotado!')
              .setDescription('Você não concluiu o formulário a tempo. O canal será deletado em 10 segundos.')
          ]
        });
        setTimeout(() => channel.delete().catch(() => {}), 10000);
      }
    }
  }, 30 * 60 * 1000);

  estado.timer = timer;
}

async function enviarRespostasParaStaff(guild, userId, estado) {
  const canalResultado = guild.channels.cache.get(CANAL_RESULTADO_ID);
  if (!canalResultado) return console.error('Canal de resultado não encontrado!');

  const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
  const tag = member ? `${member.user.tag}` : userId;

  // Divide respostas em chunks de 10 (limite de fields no embed)
  const chunks = [];
  for (let i = 0; i < PERGUNTAS.length; i += 10) {
    chunks.push(PERGUNTAS.slice(i, i + 10).map((p, j) => ({
      pergunta: p,
      resposta: estado.respostas[i + j] || 'Sem resposta',
      num: i + j + 1,
    })));
  }

  // Envia cada chunk como embed
  for (let c = 0; c < chunks.length; c++) {
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(c === 0 ? `📋 FDN | Formulário de ${estado.nome} (${tag})` : `📋 FDN | Formulário de ${estado.nome} — Parte ${c + 1}`)
      .setDescription(c === 0 ? `<@${userId}> respondeu o formulário.` : null)
      .addFields(
        chunks[c].map(item => ({
          name: `${item.num}. ${item.pergunta}`,
          value: item.resposta.substring(0, 1024) || 'Sem resposta',
        }))
      )
      .setTimestamp();

    if (c === 0) {
      await canalResultado.send({ embeds: [embed] });
    } else {
      await canalResultado.send({ embeds: [embed] });
    }
  }

  // Botões de aprovação
  const rowAcao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${userId}`)
      .setLabel('✅ APROVAR')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reprovar_${userId}`)
      .setLabel('❌ REPROVAR')
      .setStyle(ButtonStyle.Danger),
  );

  await canalResultado.send({
    content: `Candidato: <@${userId}> | Nome: **${estado.nome}**`,
    components: [rowAcao],
  });
}

async function handleAprovar(interaction, userId) {
  if (!temCargoStaff(interaction.member)) {
    return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
  }

  await interaction.deferUpdate();

  const guild = interaction.guild;
  const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
  const tag = member ? member.user.tag : userId;

  if (member) {
    await member.roles.add(CARGO_OBSERVACAO).catch(console.error);
    await member.roles.add(CARGO_APROVADO_1FASE).catch(console.error);
  }

  // Embed + imagem APROVADO embaixo (tudo numa mensagem só)
  await interaction.channel.send({
    content: `<@${userId}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('FORMULÁRIO APROVADO | FDN')
        .setDescription(
          `Parabéns <@${userId}>!\nSeu edital foi **analisado e aprovado** com sucesso.\nConfira as instruções enviadas no seu **privado** para dar continuidade e avançar para o próximo passo.`
        )
        .addFields({
          name: 'APROVADO POR:',
          value: `<@${interaction.user.id}>`,
        })
        .setImage('https://i.ibb.co/vvL92fX1/aprovado.png')
        .setTimestamp()
    ],
  });

  // Desabilita botões
  await interaction.editReply({ components: [] }).catch(() => {});
}

async function handleReprovar(interaction, userId) {
  if (!temCargoStaff(interaction.member)) {
    return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
  }

  await interaction.deferUpdate();

  // Embed + imagem REPROVADO embaixo (tudo numa mensagem só)
  await interaction.channel.send({
    content: `<@${userId}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('FORMULÁRIO REPROVADO | FDN')
        .setDescription(
          `Infelizmente <@${userId}>, seu edital foi **analisado e reprovado**.\nCaso tenha dúvidas, entre em contato com a liderança.`
        )
        .addFields({
          name: 'REPROVADO POR:',
          value: `<@${interaction.user.id}>`,
        })
        .setImage('https://i.ibb.co/1YZ0NCTD/reprovado.png')
        .setTimestamp()
    ],
  });

  await interaction.editReply({ components: [] }).catch(() => {});
}

function temCargoStaff(member) {
  return CARGOS_STAFF.some(id => member.roles.cache.has(id));
}

// ── Comando de setup (envia mensagem com botão no canal desejado) ─────────────
// Use !setup no canal onde quer o botão de edital
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (msg.content !== '!setup') return;
  if (!temCargoStaff(msg.member)) return;

  await msg.delete().catch(() => {});

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('iniciar_formulario')
      .setLabel('INICIAR FORMULÁRIO')
      .setStyle(ButtonStyle.Success)
  );

  await msg.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xcc0000)
        .setTitle('FORMULÁRIO | FDN')
        .setDescription(
          'Esse formulário contém uma lista de perguntas para conhecer seu conhecimento e suas informações.\nPara começar basta clicar no botão **INICIAR FORMULÁRIO**.'
        )
    ],
    components: [row],
  });
});

client.login(process.env.DISCORD_TOKEN);