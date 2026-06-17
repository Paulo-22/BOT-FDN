
// Todos os modais do bot FDN

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

// ── Registro ─────────────────────────────────

function modalRegistro() {
  return new ModalBuilder()
    .setCustomId('modal_registro')
    .setTitle('📋 Registro — FDN')
    .addComponents(
      row(input('nome_mta', 'Nome do seu personagem na cidade', TextInputStyle.Short, true, 50)
        .setPlaceholder('Ex: João Silva')),
      row(input('login',    'Seu login na cidade (usuário)',    TextInputStyle.Short, true, 30)
        .setPlaceholder('Ex: joaosilva')),
      row(input('id_gamer', 'Seu ID na cidade',                TextInputStyle.Short, true, 10)
        .setPlaceholder('Ex: 12345')),
    );
}

// ── Candidatura ──────────────────────────────

function modalCandidatura() {
  return new ModalBuilder()
    .setCustomId('modal_candidatura')
    .setTitle('🎯 Candidatura — FDN')
    .addComponents(
      row(input('nome', 'Nome no MTA', TextInputStyle.Short, true, 50)),
      row(input('id_gamer', 'ID Gamer no MTA', TextInputStyle.Short, true, 10)),
      row(input('horas', 'Horas jogadas no MTA', TextInputStyle.Short, true, 30)),
      row(input('experiencia', 'Experiência em facções', TextInputStyle.Paragraph, true, 500)),
      row(input('motivo', 'Por que deseja entrar na FDN?', TextInputStyle.Paragraph, true, 500)),
    );
}

// ── Edital (Formulário de Recrutamento) ──────

function modalEditalNome() {
  return new ModalBuilder()
    .setCustomId('modal_edital_nome')
    .setTitle('Formulário de Registro')
    .addComponents(
      row(input('nick', 'QUAL SEU NOME?', TextInputStyle.Short, true, 32)
        .setPlaceholder('Digite seu nome')),
    );
}

// ── Transferência ────────────────────────────

function modalTransferencia() {
  return new ModalBuilder()
    .setCustomId('modal_transferencia')
    .setTitle('🔄 Transferência — FDN')
    .addComponents(
      row(input('nome', 'Nome no MTA', TextInputStyle.Short, true, 50)),
      row(input('faccao_atual', 'Facção atual', TextInputStyle.Short, true, 50)),
      row(input('motivo', 'Motivo da transferência', TextInputStyle.Paragraph, true, 500)),
    );
}

// ── Ausência ─────────────────────────────────

function modalAusencia() {
  return new ModalBuilder()
    .setCustomId('modal_ausencia')
    .setTitle('📅 Registrar Afastamento')
    .addComponents(
      row(input('motivo', 'Motivo do afastamento', TextInputStyle.Paragraph, true, 300)),
      row(input('data_inicio', 'Data de início (DD/MM/AAAA)', TextInputStyle.Short, true, 10).setPlaceholder('Ex: 01/07/2025')),
      row(input('data_retorno', 'Data de retorno (DD/MM/AAAA)', TextInputStyle.Short, true, 10).setPlaceholder('Ex: 15/07/2025')),
    );
}

// ── Punição (via UserSelectMenu — só pede o motivo) ──

function modalMotivoPunicao(tipo, userId) {
  const labels = {
    PUNICAO_1: '⚠️ Punição Nível 1',
    PUNICAO_2: '🔶 Punição Nível 2',
    PUNICAO_3: '🔴 Punição Nível 3',
    REMOCAO:   '🚫 Remoção',
  };
  return new ModalBuilder()
    .setCustomId(`modal_motivo_punicao_${tipo}_${userId}`)
    .setTitle(labels[tipo] || 'Punição')
    .addComponents(
      row(
        input('motivo', 'Motivo da punição', TextInputStyle.Paragraph, true, 500)
          .setPlaceholder('Descreva o motivo da punição...'),
      ),
    );
}

// ── Advertência ──────────────────────────────

function modalAdvertencia() {
  return new ModalBuilder()
    .setCustomId('modal_advertencia')
    .setTitle('⚠️ Aplicar Advertência')
    .addComponents(
      row(input('usuario_id', 'ID do Discord do membro', TextInputStyle.Short, true, 20).setPlaceholder('Cole o ID do usuário')),
      row(input('motivo', 'Motivo da advertência', TextInputStyle.Paragraph, true, 500)),
    );
}

// ── Motivo simples (advertência/exoneração via UserSelect) ───

function modalMotivoSimples(acao, userId, nomeAlvo) {
  const titulos = {
    advertencia: '⚠️ Motivo da Advertência',
    exoneracao:  '🚫 Motivo da Exoneração',
  };
  return new ModalBuilder()
    .setCustomId(`modal_motivo_${acao}_${userId}`)
    .setTitle(titulos[acao] || 'Motivo')
    .addComponents(
      row(
        input('motivo', `Motivo — ${nomeAlvo}`, TextInputStyle.Paragraph, true, 500)
          .setPlaceholder('Descreva o motivo da ação...'),
      ),
    );
}

// ── Motivo com cargo (promoção/rebaixamento via UserSelect + RoleSelect) ──

function modalMotivo(acao, userId, roleId, nomeCargo) {
  const titulos = {
    promocao:    '⬆️ Motivo da Promoção',
    rebaixamento:'⬇️ Motivo do Rebaixamento',
  };
  return new ModalBuilder()
    .setCustomId(`modal_motivo_${acao}_${userId}_${roleId}`)
    .setTitle(titulos[acao] || 'Motivo')
    .addComponents(
      row(
        input('motivo', `Motivo — Cargo: ${nomeCargo}`, TextInputStyle.Paragraph, true, 500)
          .setPlaceholder('Descreva o motivo da ação...'),
      ),
    );
}

// ── Exoneração ───────────────────────────────

function modalExoneracao() {
  return new ModalBuilder()
    .setCustomId('modal_exoneracao')
    .setTitle('🚫 Exonerar Membro')
    .addComponents(
      row(input('usuario_id', 'ID do Discord do membro', TextInputStyle.Short, true, 20).setPlaceholder('Cole o ID do usuário')),
      row(input('motivo', 'Motivo da exoneração', TextInputStyle.Paragraph, true, 500)),
    );
}

// ── Gerenciar Horas (dashboard manual) ──────

function modalGerenciarHoras(tipo = 'ADD') {
  return new ModalBuilder()
    .setCustomId(tipo === 'ADD' ? 'modal_add_horas' : 'modal_rem_horas')
    .setTitle(tipo === 'ADD' ? '➕ Adicionar Horas' : '➖ Remover Horas')
    .addComponents(
      row(input('usuario_id', 'ID do Discord do membro', TextInputStyle.Short, true, 20)),
      row(
        input('horas', 'Quantidade de horas', TextInputStyle.Short, true, 5)
          .setPlaceholder('Ex: 2.5'),
      ),
    );
}

// ── Gerenciar Horas com userId já preenchido (via UserSelect) ──

function modalGerenciarHorasAuto(tipo = 'ADD', userId) {
  return new ModalBuilder()
    .setCustomId(`modal_horas_${tipo.toLowerCase()}_${userId}`)
    .setTitle(tipo === 'ADD' ? '➕ Adicionar Horas' : '➖ Remover Horas')
    .addComponents(
      row(
        input('horas', 'Quantidade de horas', TextInputStyle.Short, true, 5)
          .setPlaceholder('Ex: 2.5'),
      ),
    );
}

// ── Consultar Membro ─────────────────────────

function modalConsultarMembro() {
  return new ModalBuilder()
    .setCustomId('modal_consultar_membro')
    .setTitle('📊 Consultar Membro')
    .addComponents(
      row(input('usuario_id', 'ID do Discord do membro', TextInputStyle.Short, true, 20).setPlaceholder('Cole o ID do usuário')),
    );
}

// ── Helpers ──────────────────────────────────

function input(customId, label, style, required = true, maxLength = 100) {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setRequired(required)
    .setMaxLength(maxLength);
}

function row(component) {
  return new ActionRowBuilder().addComponents(component);
}

module.exports = {
  modalRegistro,
  modalCandidatura,
  modalEditalNome,
  modalTransferencia,
  modalAusencia,
  modalMotivoPunicao,
  modalAdvertencia,
  modalMotivoSimples,
  modalMotivo,
  modalExoneracao,
  modalGerenciarHoras,
  modalGerenciarHorasAuto,
  modalConsultarMembro,
};