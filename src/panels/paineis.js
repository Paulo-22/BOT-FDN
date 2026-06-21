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

// Imagens individuais por painel — troque cada link quando tiver a imagem específica.
// Por padrão, todas apontam para BANNER_FDN.
const BANNER_REGISTRO       = 'https://i.ibb.co/WWQrgjQn/FDN-registre-se.png';
const BANNER_RECRUTAMENTO   = BANNER_FDN;
const BANNER_EDITAL         = 'https://i.ibb.co/hJjddXF8/FDN-edital.png';
const BANNER_TRANSFERENCIA  = BANNER_FDN;
const BANNER_BATEPONTO      = 'https://i.ibb.co/gb1vP6gZ/FDN-BATE-PONTO.png';
const BANNER_AUSENCIAS      = 'https://i.ibb.co/JFHnPS5s/FDN-painel-Ausencia.png';
const BANNER_TICKETS        = 'https://i.ibb.co/PzFSWc3k/FDN-atendimento.png';
const BANNER_PUNICAO        = 'https://i.ibb.co/6cSwBn3w/FDN-painel-puni.png';
const BANNER_ADMIN          = 'https://i.ibb.co/S4p5wY2z/FDN-painel-ADM.png';

// ─────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────
function painelRegistro() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setImage(BANNER_REGISTRO)
    .setDescription(
      '**REGISTRO | FDN**\n' +
      '──────────────────────────\n\n' +
      'Para liberar o acesso ao nosso servidor e mudar seu nome e ID, é necessário que ' +
      'você realize o registro no nosso banco de dados.\n\n' +
      'Clique no botão **REGISTRE-SE** abaixo e preencha os campos solicitados.'
    );

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
    .setImage(BANNER_RECRUTAMENTO);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_candidatar')
      .setLabel('INICIAR FORMULÁRIO')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

// ─────────────────────────────────────────────
// EDITAL (FORMULÁRIO DE RECRUTAMENTO)
// ─────────────────────────────────────────────
function painelEdital() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setTitle('Formulário de Registro')
    .setDescription(
      'Este formulário será enviado a **FDN**.\n' +
      'Não compartilhe sua senha ou outras informações confidenciais.'
    )
    .setImage(BANNER_EDITAL);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_iniciar_edital')
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
    .setImage(BANNER_TRANSFERENCIA);

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
      'Para verificar o total de horas registradas, basta clicar no botão **\'HORAS\'**.\n\n' +
      'Para ver o ranking de atividade da facção, clique no botão **\'RANKING\'**.'
    )
    .setImage(BANNER_BATEPONTO);

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
    new ButtonBuilder()
      .setCustomId('btn_ranking')
      .setLabel('RANKING')
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
    .setImage(BANNER_AUSENCIAS);

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
    .setImage(BANNER_TICKETS);

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
      '**Remoção:** remove os cargos do membro e aplica o cargo de removido.\n' +
      '**Remover Punição:** retira uma punição ativa de um membro antes do prazo.'
    )
    .setImage(BANNER_PUNICAO);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_punicao')
    .setPlaceholder('Selecione uma ação')
    .addOptions([
      { label: 'Punição 1', value: 'PUNICAO_1', description: 'Aplica o 1º cargo de punição' },
      { label: 'Punição 2', value: 'PUNICAO_2', description: 'Aplica o 2º cargo de punição' },
      { label: 'Punição 3', value: 'PUNICAO_3', description: 'Aplica o 3º cargo de punição' },
      { label: 'Remoção',   value: 'REMOCAO',   description: 'Remove o membro da facção' },
      { label: 'Remover Punição', value: 'REMOVER', description: 'Retira uma punição ativa de um membro' },
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
      '══════════════════════════\n' +
      'Central de gerenciamento da facção.\n' +
      'Todas as ações afetam **somente membros registrados** e são\n' +
      'automaticamente registradas nos logs e no banco de dados.\n' +
      '══════════════════════════\n\n' +
      '**👥 GESTÃO DE MEMBROS**\n' +
      '<:hitoricofdn:1516088810457530490> **Promover** — eleva o cargo na hierarquia\n' +
      '<:rabaixarfdn:1516089291854315720> **Rebaixar** — reduz o cargo na hierarquia\n' +
      '<:advfdn:1516090237695168522> **Advertir** — registra uma advertência formal\n' +
      '<:exofdn:1516094539243327598> **Exonerar** — remove o membro da facção\n\n' +
      '**⏱️ GESTÃO DE HORAS**\n' +
      '<:horamaisfdn:1516097229763645631> **Adicionar** — soma horas manualmente\n' +
      '<:menoshorasfdn:1516104581463933170> **Remover** — subtrai horas manualmente\n' +
      '<:consultarfdn:1516109851607175249> **Consultar** — exibe a ficha completa\n' +
      '<:hitoricofdn:1516109786741997698> **Histórico** — exibe o histórico de ações\n'
    )
    .setImage(BANNER_ADMIN)
    .setFooter({ text: 'FDN • Painel Administrativo' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_promover')
      .setLabel('Promover')
      .setEmoji({ id: '1516088810457530490', name: 'hitoricofdn' })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_rebaixar')
      .setLabel('Rebaixar')
      .setEmoji({ id: '1516089291854315720', name: 'rabaixarfdn' })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_advertir')
      .setLabel('Advertir')
      .setEmoji({ id: '1516090237695168522', name: 'advfdn' })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_exonerar')
      .setLabel('Exonerar')
      .setEmoji({ id: '1516094539243327598', name: 'exofdn' })
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_add_horas')
      .setLabel('Adicionar Horas')
      .setEmoji({ id: '1516097229763645631', name: 'horamaisfdn' })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_rem_horas')
      .setLabel('Remover Horas')
      .setEmoji({ id: '1516104581463933170', name: 'menoshorasfdn' })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_consultar_membro')
      .setLabel('Consultar Membro')
      .setEmoji({ id: '1516109851607175249', name: 'consultarfdn' })
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_historico')
      .setLabel('Histórico')
      .setEmoji({ id: '1516109786741997698', name: 'hitoricofdn' })
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = {
  painelRegistro,
  painelRecrutamento,
  painelEdital,
  painelTransferencia,
  painelBatePonto,
  painelAusencias,
  painelPunicao,
  painelAdmin,
  painelTickets,
};