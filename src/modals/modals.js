// src/modals/modals.js

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function modalRegistro() {
  const modal = new ModalBuilder().setCustomId('modal_registro').setTitle('📋 Registro FDN');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('nome_mta').setLabel('Nome no MTA (RP)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('id_gamer').setLabel('ID de jogador no MTA').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('telefone').setLabel('Telefone in-game (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(20)
    ),
  );
  return modal;
}

function modalCandidatura() {
  const modal = new ModalBuilder().setCustomId('modal_candidatura').setTitle('🎯 Candidatura FDN');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('nome').setLabel('Nome no MTA').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('id_gamer').setLabel('ID Gamer').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('horas').setLabel('Horas jogadas no MTA').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(30)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('experiencia').setLabel('Experiência anterior em facções').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Por que deseja entrar na FDN?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
  );
  return modal;
}

function modalTransferencia() {
  const modal = new ModalBuilder().setCustomId('modal_transferencia').setTitle('🔄 Transferência para FDN');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('nome').setLabel('Nome no MTA').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('faccao_atual').setLabel('Facção atual').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Motivo da transferência').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
  );
  return modal;
}

function modalAusencia() {
  const modal = new ModalBuilder().setCustomId('modal_ausencia').setTitle('📅 Registrar Afastamento');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Motivo do afastamento').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('data_inicio').setLabel('Data de início (DD/MM/AAAA)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('data_retorno').setLabel('Data de retorno (DD/MM/AAAA)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
    ),
  );
  return modal;
}

function modalPunicao(tipo) {
  const labels = { PUNICAO_1: '⚠️ Punição 1', PUNICAO_2: '🔶 Punição 2', PUNICAO_3: '🔴 Punição 3', REMOCAO: '🚫 Remoção' };
  const modal = new ModalBuilder().setCustomId(`modal_punicao_${tipo}`).setTitle(labels[tipo] || 'Punição');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('usuario_id').setLabel('ID do Discord do membro').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Motivo').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
  );
  return modal;
}

function modalAdvertencia() {
  const modal = new ModalBuilder().setCustomId('modal_advertencia').setTitle('⚠️ Aplicar Advertência');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('usuario_id').setLabel('ID do Discord do membro').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Motivo da advertência').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
  );
  return modal;
}

function modalPromocao(tipo = 'PROMOCAO') {
  const modal = new ModalBuilder()
    .setCustomId(tipo === 'PROMOCAO' ? 'modal_promocao' : 'modal_rebaixamento')
    .setTitle(tipo === 'PROMOCAO' ? '⬆️ Promover Membro' : '⬇️ Rebaixar Membro');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('usuario_id').setLabel('ID do Discord do membro').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('cargo_atual').setLabel('Cargo atual').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('novo_cargo').setLabel('Novo cargo').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Motivo').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
  );
  return modal;
}

function modalExoneracao() {
  const modal = new ModalBuilder().setCustomId('modal_exoneracao').setTitle('🚫 Exonerar Membro');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('usuario_id').setLabel('ID do Discord do membro').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('Motivo da exoneração').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
    ),
  );
  return modal;
}

function modalGerenciarHoras(tipo = 'ADD') {
  const modal = new ModalBuilder()
    .setCustomId(tipo === 'ADD' ? 'modal_add_horas' : 'modal_rem_horas')
    .setTitle(tipo === 'ADD' ? '➕ Adicionar Horas' : '➖ Remover Horas');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('usuario_id').setLabel('ID do Discord do membro').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('horas').setLabel('Quantidade de horas').setStyle(TextInputStyle.Short).setPlaceholder('Ex: 5').setRequired(true).setMaxLength(5)
    ),
  );
  return modal;
}

function modalConsultarMembro() {
  const modal = new ModalBuilder().setCustomId('modal_consultar_membro').setTitle('📊 Consultar Membro');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('usuario_id').setLabel('ID do Discord do membro').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
    ),
  );
  return modal;
}

module.exports = {
  modalRegistro, modalCandidatura, modalTransferencia, modalAusencia,
  modalPunicao, modalAdvertencia, modalPromocao, modalExoneracao,
  modalGerenciarHoras, modalConsultarMembro,
};
