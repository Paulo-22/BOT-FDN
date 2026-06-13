// src/utils/permissoes.js
// Utilitários para verificação de permissões de cargos

const config = require('../config');

/**
 * Verifica se um membro possui ao menos um dos cargos da lista
 * @param {GuildMember} member
 * @param {string[]} cargosPermitidos - Array de IDs de cargo
 * @returns {boolean}
 */
function temPermissao(member, cargosPermitidos) {
  if (!member || !cargosPermitidos) return false;
  return cargosPermitidos.some(id => member.roles.cache.has(id));
}

function podePRomover(member) {
  return temPermissao(member, config.cargos.podePRomover);
}

function podeRebaixar(member) {
  return temPermissao(member, config.cargos.podeRebaixar);
}

function podeAdvertir(member) {
  return temPermissao(member, config.cargos.podeAdvertir);
}

function podeExonerar(member) {
  return temPermissao(member, config.cargos.podeExonerar);
}

function podeAprovarAusencia(member) {
  return temPermissao(member, config.cargos.podeAprovarAusencia);
}

function podeAprovarRecrutamento(member) {
  return temPermissao(member, config.cargos.podeAprovarRecrutamento);
}

function podeDashboard(member) {
  return temPermissao(member, config.cargos.podeDashboard);
}

function podeTicketStaff(member) {
  return temPermissao(member, config.cargos.podeTicketStaff);
}

/**
 * Retorna embed de erro de permissão
 */
function embedSemPermissao() {
  const { EmbedBuilder } = require('discord.js');
  return new EmbedBuilder()
    .setColor(config.cores.erro)
    .setTitle('❌ Acesso Negado')
    .setDescription('Você não tem permissão para realizar esta ação.')
    .setTimestamp();
}

module.exports = {
  temPermissao,
  podePRomover,
  podeRebaixar,
  podeAdvertir,
  podeExonerar,
  podeAprovarAusencia,
  podeAprovarRecrutamento,
  podeDashboard,
  podeTicketStaff,
  embedSemPermissao,
};
