const {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

/**
 * String to show in the main menu
 */
const select = new StringSelectMenuBuilder()
    .setCustomId('starter')
    .setPlaceholder('Which action you want to perform?')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Add a new collaborator to your team')
            .setDescription('Add a new collaborator to your team to analyze the behavior')
            .setValue('add'), 
        new StringSelectMenuOptionBuilder()
            .setLabel('Start the analysis of a collaborator')
            .setDescription('Start the analysis questions. Select a collaborator to start ')
            .setValue('start'), 
        new StringSelectMenuOptionBuilder()
            .setLabel('See statistics of a collaborator\'s analysis')
            .setDescription('Statistics powered by Grafana. Select a collaborator to start ')
            .setValue('graphic'));

/**
 * This constant creates an action row that contains the select menu for the choose of the operation
 */
const row = new ActionRowBuilder()
    .addComponents(select);

    /**
 * This constant creates a dialog box that contains the form to add a new collaborator
 */
const modal = new ModalBuilder()
    .setCustomId('myModal')
    .setTitle('Add a new collaborator to your team')


modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('nameInput')
        .setLabel("Name of the collaborator")
        .setStyle(TextInputStyle.Short)
    )


).addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('surnameInput')
        .setLabel("Surname of the collaborator")
        .setStyle(TextInputStyle.Short)
    )

).addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId('idInput')
        .setLabel("ID of the collaborator")
        .setStyle(TextInputStyle.Short)
    )

)

module.exports.row = row;
module.exports.modal = modal;
