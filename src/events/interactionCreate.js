// src/events/interactionCreate.js

const { handleButton } = require('../buttons/buttonHandler');
const { handleModal }  = require('../modals/modalHandler');
const { handleSelect } = require('../buttons/selectHandler');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    try {
      if (interaction.isButton())           return await handleButton(interaction);
      if (interaction.isModalSubmit())      return await handleModal(interaction);
      if (interaction.isStringSelectMenu()) return await handleSelect(interaction);
      if (interaction.isUserSelectMenu())   return await handleSelect(interaction);
      if (interaction.isRoleSelectMenu())   return await handleSelect(interaction);
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
    }
  },
};