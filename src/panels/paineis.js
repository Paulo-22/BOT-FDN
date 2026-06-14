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
      '## REGISTRO | FDN\n\n' +
      'Para liberar o acesso ao nosso servidor e mudar seu nome e ID, é necessário que ' +
      'você realize o registro no nosso banco de dados.\n\n' +
      'Clique no botão **REGISTRE-SE** abaixo e preencha os campos solicitados.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_registro')
      .setLabel('REGISTRE-SE')
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
      '## FORMULÁRIO | FDN\n\n' +
      'Esse formulário contém uma lista de perguntas para conhecer seu conhecimento e suas informações.\n' +
      'Para começar basta clicar no botão **INICIAR FORMULÁRIO**.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_candidatar')
      .setLabel('INICIAR FORMULÁRIO')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// TRANSFERÊNCIA
// ─────────────────────────────────────────────
function painelTransferencia() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## TRANSFERÊNCIA | FDN\n\n' +
      'Deseja entrar na **FDN** por transferência?\n' +
      'Clique no botão abaixo para iniciar sua solicitação e aguarde um superior.\n\n' +
      '## INFORMAÇÕES\n\n' +
      'Após abrir a solicitação, envie uma foto dos seus cargos no grupo atual.\n' +
      'A imagem deve mostrar a tela toda, data e hora, e ser tirada pelo computador.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_transferencia')
      .setLabel('Iniciar Transferência')
      .setStyle(ButtonStyle.Secondary),
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
      '## BATE-PONTO | FDN\n\n' +
      'Para iniciar um registro de ponto o membro deverá entrar em qualquer ' +
      'canal de voz e clicar no botão **\'LIGAR\'** localizado abaixo.\n\n' +
      'Para finalizar o registro, o membro deve permanecer no canal de voz e ' +
      'utilizar o botão **\'DESLIGAR\'** para que o ponto seja contabilizado. ' +
      'Caso o membro saia do canal de voz sem utilizar o comando o ponto é finalizado automaticamente.\n\n' +
      'Para verificar o total de horas registradas, basta clicar no botão **\'HORAS\'**.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ligar')
      .setLabel('LIGAR')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_desligar')
      .setLabel('DESLIGAR')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_minhas_horas')
      .setLabel('HORAS')
      .setStyle(ButtonStyle.Secondary),
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
      '## AFASTAMENTO | FDN\n\n' +
      'Clique no botão abaixo para registrar seu afastamento.\n\n' +
      '## REGRAS\n\n' +
      'Máximo de **30 dias** por solicitação.\n' +
      'Justificativa obrigatória.\n' +
      'Atividade durante o afastamento pode resultar em punição.'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_solicitar_ausencia')
      .setLabel('REGISTRAR AFASTAMENTO')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// ATENDIMENTO (TICKETS)
// ─────────────────────────────────────────────
function painelTickets() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setDescription(
      '## ATENDIMENTO | FDN\n\n' +
      'Olá, tudo bem? Precisa falar com a equipe ou está com dúvidas? Selecione ' +
      'uma das opções abaixo para abrir o atendimento e receber a ajuda que precisa.\n\n' +
      '🎫 | Suporte em Geral\n' +
      '🔧 | Denúncia\n' +
      '❓ | Dúvida\n' +
      '⚖️ | Recurso'
    )
    .setImage(BANNER_FDN);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_ticket_suporte').setLabel('Suporte em Geral').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_ticket_denuncia').setLabel('Denúncia').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_ticket_duvida').setLabel('Dúvida').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_ticket_recurso').setLabel('Recurso').setStyle(ButtonStyle.Secondary),
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
      '## SISTEMA DE PUNIÇÃO | FDN\n\n' +
      'Caso seja identificada qualquer violação das diretrizes, selecione abaixo ' +
      'a ação que deseja aplicar.\n\n' +
      '## AÇÕES DISPONÍVEIS\n\n' +
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
    .setAuthor({ name: 'FDN • Família do Norte' })
    .setTitle('🛠️ PAINEL ADMINISTRATIVO')
    .setDescription(
      'Central de gerenciamento da facção. ' +
      'Todas as ações abaixo afetam **somente membros registrados** e são ' +
      'automaticamente registradas no canal de logs e no banco de dados.'
    )
    .addFields(
      {
        name: '👥 Gestão de Membros',
        value:
          '⬆️ **Promover** — eleva o cargo na hierarquia\n' +
          '⬇️ **Rebaixar** — reduz o cargo na hierarquia\n' +
          '⚠️ **Advertir** — registra uma advertência formal\n' +
          '🚫 **Exonerar** — remove o membro da facção',
      },
      {
        name: '⏱️ Gestão de Horas',
        value:
          '➕ **Adicionar** — soma horas manualmente\n' +
          '➖ **Remover** — subtrai horas manualmente\n' +
          '📊 **Consultar** — exibe a ficha completa\n' +
          '🗂️ **Histórico** — exibe o histórico de ações',
      },
    )
    .setImage(BANNER_FDN)
    .setFooter({ text: 'FDN • Painel Administrativo' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_promover').setLabel('Promover').setEmoji('⬆️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_rebaixar').setLabel('Rebaixar').setEmoji('⬇️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_advertir').setLabel('Advertir').setEmoji('⚠️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_exonerar').setLabel('Exonerar').setEmoji('🚫').setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_add_horas').setLabel('Adicionar Horas').setEmoji('➕').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_rem_horas').setLabel('Remover Horas').setEmoji('➖').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_consultar_membro').setLabel('Consultar Membro').setEmoji('📊').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_historico').setLabel('Histórico').setEmoji('🗂️').setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = {
  painelRegistro,
  painelRecrutamento,
  painelTransferencia,
  painelBatePonto,
  painelAusencias,
  painelPunicao,
  painelAdmin,
  painelTickets,
};