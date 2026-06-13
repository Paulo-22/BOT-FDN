// src/buttons/selectHandler.js
// Gerencia menus suspensos (StringSelectMenu)

const { modalPunicao } = require('../modals/modals');
const perm = require('../utils/permissoes');

async function handleSelect(interaction) {
  const { customId, values } = interaction;

  // ── MENU DE PUNIÇÃO ──
  if (customId === 'menu_punicao') {
    if (!perm.podeAdvertir(interaction.member)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para aplicar punições.',
        ephemeral: true,
      });
    }
    const tipo = values[0]; // PUNICAO_1, PUNICAO_2, PUNICAO_3, REMOCAO
    return await interaction.showModal(modalPunicao(tipo));
  }
}

module.exports = { handleSelect };
