const {StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder} = require("discord.js");
const select = new StringSelectMenuBuilder()
    .setCustomId('starter')
    .setPlaceholder('Make a selection!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Strongly Disagree')
            .setDescription('Strongly Disagree')
            .setValue('strDis'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Disagree')
            .setDescription('Disagree')
            .setValue('dis'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Neither Agree nor Disagree')
            .setDescription('Neither Agree nor Disagree')
            .setValue('neutral'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Agree')
            .setDescription('Agree')
            .setValue('agree'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Strongly Agree')
            .setDescription('Strongly Agree')
            .setValue('strAgree'),
    );

const row = new ActionRowBuilder()
    .addComponents(select);

module.exports.row = row;
