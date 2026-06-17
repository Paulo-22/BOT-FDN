
const config = require('../config');

function temPermissao(member, cargosPermitidos) {
  if (!member || !cargosPermitidos) return false;
  return cargosPermitidos.some(id => member.roles.cache.has(id));
}

const podePRomover            = m => temPermissao(m, config.cargos.podePRomover);
const podeRebaixar            = m => temPermissao(m, config.cargos.podeRebaixar);
const podeAdvertir            = m => temPermissao(m, config.cargos.podeAdvertir);
const podeExonerar            = m => temPermissao(m, config.cargos.podeExonerar);
const podeAprovarAusencia     = m => temPermissao(m, config.cargos.podeAprovarAusencia);
const podeAprovarRecrutamento = m => temPermissao(m, config.cargos.podeAprovarRecrutamento);
const podeAnalisarEdital      = m => temPermissao(m, config.cargos.podeAnalisarEdital);
const podeDashboard           = m => temPermissao(m, config.cargos.podeDashboard);
const podeTicketStaff         = m => temPermissao(m, config.cargos.podeTicketStaff);

function embedSemPermissao() {
  const { EmbedBuilder } = require('discord.js');
  return new EmbedBuilder()
    .setColor(config.cores.erro)
    .setTitle('🔒 Acesso Negado')
    .setDescription('> Você não tem permissão para realizar esta ação.')
    .setTimestamp();
}

module.exports = {
  temPermissao, podePRomover, podeRebaixar, podeAdvertir,
  podeExonerar, podeAprovarAusencia, podeAprovarRecrutamento,
  podeAnalisarEdital, podeDashboard, podeTicketStaff, embedSemPermissao,
};