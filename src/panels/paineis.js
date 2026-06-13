// src/panels/paineis.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../config');

const BANNER_FDN = 'https://i.ibb.co/JjH1WktY/FDN.png';

// ─────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────
function painelRegistro() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '• **REGISTRO | FDN**\n\n' +
      'Para liberar o acesso ao nosso servidor e vincular seu perfil ao banco de dados, ' +
      'é necessário que você realize o registro.\n\n' +
      'Clique no botão **REGISTRAR-SE** abaixo e preencha os campos solicitados.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_registro')
      .setLabel('REGISTRAR-SE')
      .setStyle(ButtonStyle.Success),
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
      '• **RECRUTAMENTO | FDN**\n\n' +
      'Deseja fazer parte da **Família do Norte**? Clique no botão abaixo e preencha ' +
      'o formulário de candidatura.\n\n' +
      'Sua candidatura será analisada pela liderança e você será notificado via DM sobre o resultado.\n\n' +
      'Caso venha de outra facção e deseje se transferir para a FDN, clique em **TRANSFERÊNCIA**.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_candidatar')
      .setLabel('CANDIDATAR-SE')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_transferencia')
      .setLabel('TRANSFERÊNCIA')
      .setStyle(ButtonStyle.Primary),
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
      '## 📋 BATE-PONTO | FDN\n\n' +
      '> 🟢 Clique em **LIGAR** para iniciar seu serviço.\n' +
      '> 🔴 Clique em **DESLIGAR** para encerrar seu serviço.\n' +
      '> 📊 Consulte suas horas registradas.\n' +
      '> 🏆 Visualize o ranking dos membros.\n\n' +
      '> ⚠️ Ao sair do canal de voz o ponto será encerrado automaticamente.'
    )
    .setImage(BANNER_FDN)
    .setFooter({
      text: 'FDN • Sistema de Controle de Ponto'
    })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ligar')
      .setLabel('LIGAR')
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('btn_desligar')
      .setLabel('DESLIGAR')
      .setEmoji('🔴')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('btn_minhas_horas')
      .setLabel('HORAS')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('btn_ranking')
      .setLabel('RANKING')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row]
  };
}

// ─────────────────────────────────────────────
// AUSÊNCIAS
// ─────────────────────────────────────────────
function painelAusencias() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '• **AFASTAMENTO | FDN**\n\n' +
      'Clique no botão abaixo para registrar seu afastamento.\n\n' +
      '• **REGRAS**\n\n' +
      'Máximo de **30 dias** por solicitação.\n' +
      'Justificativa obrigatória.\n' +
      'Atividade durante o afastamento pode resultar em punição.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_solicitar_ausencia')
      .setLabel('REGISTRAR AFASTAMENTO')
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// PUNIÇÃO
// ─────────────────────────────────────────────
function painelPunicao() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '• **SISTEMA DE PUNIÇÃO | FDN**\n\n' +
      'Caso seja identificada qualquer violação das diretrizes, selecione abaixo ' +
      'a ação que deseja aplicar.\n\n' +
      '• **AÇÕES DISPONÍVEIS**\n\n' +
      '**Punição 1:** aplica o primeiro cargo de punição.\n' +
      '**Punição 2:** aplica o segundo cargo de punição.\n' +
      '**Punição 3:** aplica o terceiro cargo de punição.\n' +
      '**Remoção:** remove os cargos do membro e aplica o cargo de removido.'
    )
    .setImage(BANNER_FDN);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_punicao')
    .setPlaceholder('Selecione uma ação')
    .addOptions([
      { label: 'Punição 1', value: 'PUNICAO_1', description: 'Aplica o 1º cargo de punição' },
      { label: 'Punição 2', value: 'PUNICAO_2', description: 'Aplica o 2º cargo de punição' },
      { label: 'Punição 3', value: 'PUNICAO_3', description: 'Aplica o 3º cargo de punição' },
      { label: 'Remoção',   value: 'REMOCAO',   description: 'Remove o membro da facção' },
    ]);

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

// ─────────────────────────────────────────────
// PAINEL ADMINISTRATIVO
// ─────────────────────────────────────────────
function painelAdmin() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '• **PAINEL ADMINISTRATIVO | FDN**\n\n' +
      'Central de gerenciamento da **Família do Norte**. ' +
      'Todas as ações são registradas em log e banco de dados.\n\n' +
      '• **GESTÃO DE MEMBROS**\n\n' +
      '**Promover** — eleva o cargo do membro na hierarquia.\n' +
      '**Rebaixar** — reduz o cargo do membro na hierarquia.\n' +
      '**Advertir** — registra uma advertência formal ao membro.\n' +
      '**Exonerar** — remove o membro da facção definitivamente.\n\n' +
      '• **GESTÃO DE HORAS**\n\n' +
      '**Adicionar / Remover** — ajusta horas manualmente.\n' +
      '**Consultar** — exibe a ficha completa do membro.'
    )
    .setImage(BANNER_FDN);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_promover').setLabel('PROMOVER').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_rebaixar').setLabel('REBAIXAR').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_advertir').setLabel('ADVERTIR').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_exonerar').setLabel('EXONERAR').setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_add_horas').setLabel('Adicionar Horas').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_rem_horas').setLabel('Remover Horas').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_consultar_membro').setLabel('Consultar Membro').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_historico').setLabel('Histórico').setStyle(ButtonStyle.Secondary),
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
      '• **ATENDIMENTO | FDN**\n\n' +
      'Olá, tudo bem? Precisa falar com a equipe ou está com dúvidas? Selecione ' +
      'uma das opções abaixo para abrir o atendimento e receber a ajuda que precisa.\n\n' +
      '| Suporte em Geral\n' +
      '| Denúncia\n' +
      '| Dúvida\n' +
      '| Recurso'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_ticket_suporte').setLabel('Suporte em Geral').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_ticket_denuncia').setLabel('Denúncia').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_ticket_duvida').setLabel('Dúvida').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_ticket_recurso').setLabel('Recurso').setStyle(ButtonStyle.Secondary),
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
