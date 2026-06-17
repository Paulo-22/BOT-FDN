// src/services/editalService.js

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

const TEMPO_LIMITE_MS = 30 * 60 * 1000;

/**
 * Sanitiza o nome do canal
 */
function sanitizarNomeCanal(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 90) || 'candidato';
}

/**
 * Desabilita os botões após análise
 */
function disableRow(label, style) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('_disabled')
                .setLabel(label)
                .setStyle(style)
                .setDisabled(true)
        ),
    ];
}

/**
 * Cria o canal do edital
 */
async function criarCanalEdital(interaction, nick) {

    const { guild, user } = interaction;

    const existente = await prisma.edital.findFirst({
        where: {
            discord_id: user.id,
            status: 'PENDENTE',
        },
    });

    if (existente) {

        const canalExistente = await guild.channels
            .fetch(existente.canal_id)
            .catch(() => null);

        if (canalExistente) {

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(config.cores.aviso)
                        .setDescription(
                            `⚠️ Você já possui um formulário em andamento: <#${canalExistente.id}>`
                        ),
                ],
                ephemeral: true,
            });

        }

        await prisma.edital
            .delete({
                where: {
                    id: existente.id,
                },
            })
            .catch(() => {});

    }

    const nomeCanal = `edital-${sanitizarNomeCanal(nick)}`;

    const permissoes = [

        {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
        },

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
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
            });

        }

    }

    const categoriaId = config.canais.categoriaEdital;

    const canal = await guild.channels.create({

        name: nomeCanal,

        parent:
            categoriaId && !categoriaId.startsWith('ID_')
                ? categoriaId
                : null,

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

    await interaction.reply({

        embeds: [

            new EmbedBuilder()
                .setColor(config.cores.sucesso)
                .setDescription(
                    '✅ **Canal criado!** Clique abaixo para responder o formulário:'
                ),

        ],

        components: [

            new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setLabel('Ir para o canal')
                    .setEmoji('📂')
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                        `https://discord.com/channels/${guild.id}/${canal.id}`
                    ),

            ),

        ],

        ephemeral: true,

    });

    await canal.send({

        content: `<@${user.id}>`,

        embeds: [

            new EmbedBuilder()
                .setColor(config.cores.principal)
                .setTitle('INICIAR FORMULÁRIO')
                .setDescription(
                    `Revise cada pergunta cuidadosamente.\n**Você tem ${TEMPO_LIMITE_MS / 60000} minutos para concluir.**`
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
/**
 * Inicia a coleta das respostas do candidato
 */
async function iniciarColetaRespostas(interaction) {

    const canal = interaction.channel;

    const edital = await prisma.edital.findUnique({
        where: {
            canal_id: canal.id,
        },
    });

    if (!edital) {
        return interaction.reply({
            content: '❌ Formulário não encontrado.',
            ephemeral: true,
        });
    }

    if (edital.discord_id !== interaction.user.id) {
        return interaction.reply({
            content: '❌ Apenas o candidato pode responder.',
            ephemeral: true,
        });
    }

    if (edital.status !== 'PENDENTE') {
        return interaction.reply({
            content: '⚠️ Este formulário já foi finalizado.',
            ephemeral: true,
        });
    }

    await interaction
        .update({
            components: [],
        })
        .catch(() => interaction.deferUpdate().catch(() => {}));

    await canal.send({
        embeds: [
            new EmbedBuilder()
                .setColor(config.cores.aviso)
                .setDescription(
                    '📣 **Atenção:** Seja sincero ao responder.'
                ),
        ],
    });

    const respostas = {};
    const inicioGeral = Date.now();

    for (let i = 0; i < perguntas.length; i++) {

        const prazoRestante =
            TEMPO_LIMITE_MS - (Date.now() - inicioGeral);

        if (prazoRestante <= 0) {
            return encerrarPorTempo(
                canal,
                edital,
                respostas
            );
        }

        await canal.send({

            embeds: [

                new EmbedBuilder()
                    .setColor(config.cores.principal)
                    .setTitle('FORMULÁRIO FDN')
                    .addFields({
                        name: `${i + 1}º — Pergunta`,
                        value: perguntas[i],
                    })
                    .setFooter({
                        text: `Pergunta ${i + 1}/${perguntas.length}`,
                    })
                    .setTimestamp(),

            ],

        });

        let resposta;

        try {

            const coletadas = await canal.awaitMessages({

                filter: (m) =>
                    m.author.id === edital.discord_id,

                max: 1,

                time: Math.min(
                    TEMPO_LIMITE_MS,
                    prazoRestante
                ),

                errors: ['time'],

            });

            resposta = coletadas.first();

        } catch {

            return encerrarPorTempo(
                canal,
                edital,
                respostas
            );

        }

        respostas[`pergunta_${i + 1}`] = {

            pergunta: perguntas[i],

            resposta:
                resposta.content.slice(0, 1024) ||
                '(sem texto)',

        };

        await prisma.edital
            .update({

                where: {
                    id: edital.id,
                },

                data: {
                    respostas,
                },

            })
            .catch(() => {});

    }

    await finalizarFormulario(
        canal,
        edital,
        respostas
    );

}

/**
 * Encerra automaticamente por tempo
 */
async function encerrarPorTempo(
    canal,
    edital,
    respostasParciais
) {

    await prisma.edital
        .update({

            where: {
                id: edital.id,
            },

            data: {

                status: 'EXPIRADO',
                respostas: respostasParciais,

            },

        })
        .catch(() => {});

    await canal.send({

        embeds: [

            new EmbedBuilder()
                .setColor(config.cores.erro)
                .setDescription(
                    '⏱️ **Tempo esgotado!** O formulário foi encerrado automaticamente.'
                ),

        ],

    });

    setTimeout(() => {

        canal.delete().catch(() => {});

    }, 10000);

}

/**
 * Finaliza o formulário e envia para análise
 */
async function finalizarFormulario(canal, edital, respostas) {

    await prisma.edital.update({
        where: {
            id: edital.id,
        },
        data: {
            status: 'EM_ANALISE',
            respostas,
        },
    });

    await canal.send({
        embeds: [
            new EmbedBuilder()
                .setColor(config.cores.sucesso)
                .setDescription(
                    '✅ **Formulário concluído!** Suas respostas foram enviadas para análise da staff.'
                ),
        ],
    });

    const canalAnaliseId = config.canais.analiseEdital;

    if (!canalAnaliseId || canalAnaliseId.startsWith('ID_')) {
        return;
    }

    const canalAnalise = await canal.client.channels
        .fetch(canalAnaliseId)
        .catch(() => null);

    if (!canalAnalise) {
        return;
    }

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
                .setStyle(ButtonStyle.Danger)
        ),
    ];

    for (let i = 0; i < embeds.length; i++) {

        await canalAnalise.send({

            embeds: [embeds[i]],

            components:
                i === embeds.length - 1
                    ? componentes
                    : [],

        });

    }

}

/**
 * Monta os embeds com o resumo das respostas
 */
function montarEmbedsResumo(edital, respostas) {

    const embeds = [];

    const linhas = Object.values(respostas).map(
        (item, index) =>
            `**${index + 1}º — ${item.pergunta}**\n${item.resposta || '(sem resposta)'}`
    );

    const LIMITE = 3500;

    const blocos = [];

    let atual = '';

    for (const linha of linhas) {

        if ((atual + '\n\n' + linha).length > LIMITE) {

            blocos.push(atual);

            atual = linha;

        } else {

            atual = atual
                ? `${atual}\n\n${linha}`
                : linha;

        }

    }

    if (atual) {
        blocos.push(atual);
    }

    for (let i = 0; i < blocos.length; i++) {

        const embed = new EmbedBuilder()
            .setColor(config.cores.info)
            .setDescription(blocos[i])
            .setTimestamp();

        if (i === 0) {

            embed
                .setTitle('📋 Novo Formulário — Análise')
                .addFields(
                    {
                        name: '👤 Candidato',
                        value: `<@${edital.discord_id}>`,
                        inline: true,
                    },
                    {
                        name: '📛 Nick',
                        value: edital.nick,
                        inline: true,
                    }
                );

        }

        if (i === blocos.length - 1) {

            embed.setFooter({
                text: `ID do Edital: ${edital.id}`,
            });

        }

        embeds.push(embed);

    }

    return embeds;

}

/**
 * Aprova um edital
 */
async function aprovarEdital(interaction, id) {

    const edital = await prisma.edital.findUnique({
        where: {
            id: parseInt(id),
        },
    });

    if (!edital) {
        return interaction.reply({
            content: '❌ Edital não encontrado.',
            ephemeral: true,
        });
    }

    if (['APROVADA', 'REPROVADA'].includes(edital.status)) {
        return interaction.reply({
            content: '⚠️ Edital já analisado.',
            ephemeral: true,
        });
    }

    await prisma.edital.update({
        where: {
            id: edital.id,
        },
        data: {
            status: 'APROVADA',
            responsavel: interaction.user.id,
            analisado_em: new Date(),
        },
    });

    const membro = await interaction.guild.members
        .fetch(edital.discord_id)
        .catch(() => null);

    if (membro) {

        for (const cargoId of config.cargos.cargosAprovacaoEdital) {

            if (cargoId && !cargoId.startsWith('ID_')) {
                await membro.roles.add(cargoId).catch(() => {});
            }

        }

        membro.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(config.cores.sucesso)
                    .setTitle('✅ Formulário Aprovado!')
                    .setDescription(
                        `Parabéns, **${edital.nick}**! Seu formulário foi aprovado. Aguarde as instruções da equipe.`
                    )
                    .setTimestamp(),
            ],
        }).catch(() => {});
    }

    await logger.logEdital(
        interaction.client,
        edital,
        'APROVADA',
        interaction.user.id
    );

    await interaction.update({
        components: disableRow(
            '✅ Aprovado',
            ButtonStyle.Success
        ),
    });

    await removerCanalEdital(
        interaction.client,
        edital
    );

}

/**
 * Reprova um edital
 */
async function reprovarEdital(interaction, id) {

    const edital = await prisma.edital.findUnique({
        where: {
            id: parseInt(id),
        },
    });

    if (!edital) {
        return interaction.reply({
            content: '❌ Edital não encontrado.',
            ephemeral: true,
        });
    }

    if (['APROVADA', 'REPROVADA'].includes(edital.status)) {
        return interaction.reply({
            content: '⚠️ Edital já analisado.',
            ephemeral: true,
        });
    }

    await prisma.edital.update({
        where: {
            id: edital.id,
        },
        data: {
            status: 'REPROVADA',
            responsavel: interaction.user.id,
            analisado_em: new Date(),
        },
    });

    const membro = await interaction.guild.members
        .fetch(edital.discord_id)
        .catch(() => null);

    membro?.send({
        embeds: [
            new EmbedBuilder()
                .setColor(config.cores.erro)
                .setTitle('❌ Formulário Reprovado')
                .setDescription(
                    `Olá, **${edital.nick}**. Infelizmente seu formulário foi reprovado. Tente novamente após o período definido pela staff.`
                )
                .setTimestamp(),
        ],
    }).catch(() => {});

    await logger.logEdital(
        interaction.client,
        edital,
        'REPROVADA',
        interaction.user.id
    );

    await interaction.update({
        components: disableRow(
            '❌ Reprovado',
            ButtonStyle.Danger
        ),
    });

    await removerCanalEdital(
        interaction.client,
        edital
    );

}

/**
 * Remove o canal do edital
 */
async function removerCanalEdital(client, edital) {

    const canal = await client.channels
        .fetch(edital.canal_id)
        .catch(() => null);

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