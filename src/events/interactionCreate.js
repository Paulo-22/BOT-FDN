// src/events/interactionCreate.js

const { handleButton } = require('../buttons/buttonHandler');
const { handleModal }  = require('../modals/modalHandler');
const { handleSelect } = require('../buttons/selectHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isButton())             await handleButton(interaction);
      else if (interaction.isModalSubmit())   await handleModal(interaction);
      else if (interaction.isStringSelectMenu()) await handleSelect(interaction);
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
    }
  },
};
