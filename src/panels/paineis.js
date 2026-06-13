// src/panels/paineis.js
// Painéis visuais estilo PMBA-BVB: banner + bullet points + botões

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../config');

// Banner padrão FDN — substitua pela URL da imagem real da facção
const BANNER_FDN = 'https://i.imgur.com/4M34hi2.png';

// ─────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────
function painelRegistro() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## 📋  REGISTRO | FDN\n\n' +
      '> Para liberar o acesso ao servidor e vincular seu perfil,\n' +
      '> é necessário realizar o registro no nosso banco de dados.\n\n' +
      '**• Clique em REGISTRAR-SE e preencha os campos solicitados.**'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Família do Norte' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_registro')
      .setLabel('REGISTRAR-SE')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📝'),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// RECRUTAMENTO
// ─────────────────────────────────────────────
function painelRecrutamento() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## 🎯  RECRUTAMENTO | FDN\n\n' +
      '> Deseja fazer parte da **Família do Norte**?\n' +
      '> Clique no botão abaixo e preencha o formulário de candidatura.\n\n' +
      '**• Sua candidatura será analisada pela liderança.**\n' +
      '**• Você será notificado via DM sobre o resultado.**'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Família do Norte' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_candidatar')
      .setLabel('CANDIDATAR-SE')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✍️'),
    new ButtonBuilder()
      .setCustomId('btn_transferencia')
      .setLabel('TRANSFERÊNCIA')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🔄'),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// BATE-PONTO
// ─────────────────────────────────────────────
function painelBatePonto() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## ⏱️  BATE-PONTO | FDN\n\n' +
      '> Para iniciar o registro de ponto, o membro deverá estar\n' +
      '> em um canal de voz autorizado e clicar em **LIGAR**.\n\n' +
      '**• LIGAR** — inicia o ponto no canal de voz atual\n' +
      '**• DESLIGAR** — encerra o ponto e salva as horas\n' +
      '**• HORAS** — visualize seu resumo de horas\n' +
      '**• RANKING** — top 10 membros com mais horas\n\n' +
      '> ⚠️ O ponto é encerrado automaticamente ao sair da call.'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Família do Norte' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_ligar').setLabel('LIGAR').setStyle(ButtonStyle.Success).setEmoji('🟢'),
    new ButtonBuilder().setCustomId('btn_desligar').setLabel('DESLIGAR').setStyle(ButtonStyle.Danger).setEmoji('🔴'),
    new ButtonBuilder().setCustomId('btn_minhas_horas').setLabel('HORAS').setStyle(ButtonStyle.Secondary).setEmoji('📊'),
    new ButtonBuilder().setCustomId('btn_ranking').setLabel('RANKING').setStyle(ButtonStyle.Secondary).setEmoji('🏆'),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// AUSÊNCIAS
// ─────────────────────────────────────────────
function painelAusencias() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## 📅  AFASTAMENTO | FDN\n\n' +
      '> Clique no botão abaixo para registrar seu afastamento.\n\n' +
      '**• REGRAS**\n' +
      '> Máximo de **30 dias** por solicitação.\n' +
      '> Justificativa obrigatória.\n' +
      '> Atividade durante o afastamento pode resultar em punição.'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Família do Norte' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_solicitar_ausencia')
      .setLabel('REGISTRAR AFASTAMENTO')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📅'),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// PUNIÇÃO (menu suspenso)
// ─────────────────────────────────────────────
function painelPunicao() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## ⚖️  SISTEMA DE PUNIÇÃO | FDN\n\n' +
      '> Caso seja identificada qualquer violação das diretrizes,\n' +
      '> selecione abaixo a ação que deseja aplicar.\n\n' +
      '**• AÇÕES DISPONÍVEIS**\n' +
      '> **Punição 1:** aplica o primeiro cargo de punição.\n' +
      '> **Punição 2:** aplica o segundo cargo de punição.\n' +
      '> **Punição 3:** aplica o terceiro cargo de punição.\n' +
      '> **Remoção:** remove os cargos do membro e aplica o cargo de removido.'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Painel Administrativo' });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_punicao')
    .setPlaceholder('Selecione uma ação')
    .addOptions([
      { label: 'Punição 1', value: 'PUNICAO_1', emoji: '⚠️', description: 'Aplica o 1º cargo de punição' },
      { label: 'Punição 2', value: 'PUNICAO_2', emoji: '🔶', description: 'Aplica o 2º cargo de punição' },
      { label: 'Punição 3', value: 'PUNICAO_3', emoji: '🔴', description: 'Aplica o 3º cargo de punição' },
      { label: 'Remoção',   value: 'REMOCAO',   emoji: '🚫', description: 'Remove o membro da facção' },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// PAINEL ADMINISTRATIVO
// ─────────────────────────────────────────────
function painelAdmin() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## ⚙️  PAINEL ADMINISTRATIVO | FDN\n\n' +
      '> Central de gerenciamento da **Família do Norte**.\n' +
      '> Todas as ações são registradas em log e banco de dados.\n\n' +
      '**• GESTÃO DE MEMBROS**\n' +
      '> **Promover / Rebaixar** — alterar cargo do membro\n' +
      '> **Advertir** — registrar advertência formal\n' +
      '> **Exonerar** — remover membro da facção\n\n' +
      '**• GESTÃO DE HORAS**\n' +
      '> **Adicionar / Remover** — ajustar horas manualmente\n' +
      '> **Consultar** — ver ficha completa do membro'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Painel Administrativo' });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_promover').setLabel('PROMOVER').setStyle(ButtonStyle.Success).setEmoji('⬆️'),
    new ButtonBuilder().setCustomId('btn_rebaixar').setLabel('REBAIXAR').setStyle(ButtonStyle.Danger).setEmoji('⬇️'),
    new ButtonBuilder().setCustomId('btn_advertir').setLabel('ADVERTIR').setStyle(ButtonStyle.Primary).setEmoji('⚠️'),
    new ButtonBuilder().setCustomId('btn_exonerar').setLabel('EXONERAR').setStyle(ButtonStyle.Danger).setEmoji('🚫'),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_add_horas').setLabel('Adicionar Horas').setStyle(ButtonStyle.Secondary).setEmoji('➕'),
    new ButtonBuilder().setCustomId('btn_rem_horas').setLabel('Remover Horas').setStyle(ButtonStyle.Secondary).setEmoji('➖'),
    new ButtonBuilder().setCustomId('btn_consultar_membro').setLabel('Consultar Membro').setStyle(ButtonStyle.Secondary).setEmoji('📊'),
    new ButtonBuilder().setCustomId('btn_historico').setLabel('Histórico').setStyle(ButtonStyle.Secondary).setEmoji('📋'),
  );

  return { embeds: [embed], components: [row1, row2] };
}

// ─────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────
function painelTickets() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## 🎫  ATENDIMENTO | FDN\n\n' +
      '> Olá, tudo bem? Precisa falar com a equipe ou está com dúvidas?\n' +
      '> Selecione uma das opções abaixo para abrir o atendimento.\n\n' +
      '**• 🔧 Suporte em Geral**\n' +
      '**• 🚨 Denúncia**\n' +
      '**• ❓ Dúvida**\n' +
      '**• ⚖️ Recurso**'
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN — Família do Norte' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_ticket_suporte').setLabel('Suporte em Geral').setStyle(ButtonStyle.Primary).setEmoji('🔧'),
    new ButtonBuilder().setCustomId('btn_ticket_denuncia').setLabel('Denúncia').setStyle(ButtonStyle.Danger).setEmoji('🚨'),
    new ButtonBuilder().setCustomId('btn_ticket_duvida').setLabel('Dúvida').setStyle(ButtonStyle.Secondary).setEmoji('❓'),
    new ButtonBuilder().setCustomId('btn_ticket_recurso').setLabel('Recurso').setStyle(ButtonStyle.Secondary).setEmoji('⚖️'),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  painelRegistro,
  painelRecrutamento,
  painelBatePonto,
  painelAusencias,
  painelPunicao,
  painelAdmin,
  painelTickets,
};
