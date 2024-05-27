const {ButtonBuilder, ButtonStyle, ActionRowBuilder} = require("discord.js");
/** Strongly Disagree button */
const strDis = new ButtonBuilder()
    .setCustomId('strDis')
    .setLabel('Strongly Disagree')
    .setStyle(ButtonStyle.Primary);

/** Disagree button */
const dis = new ButtonBuilder()
    .setCustomId('dis')
    .setLabel('Disagree')
    .setStyle(ButtonStyle.Primary);

/** Neutral button */
const neutral = new ButtonBuilder()
    .setCustomId('neutral')
    .setLabel('Neither Agree nor Disagree')
    .setStyle(ButtonStyle.Primary);

/** Agree button */
const agree = new ButtonBuilder()
    .setCustomId('agree')
    .setLabel('Agree')
    .setStyle(ButtonStyle.Primary);

/** Strongly Agree button */
const strAgree = new ButtonBuilder()
    .setCustomId('strAgree')
    .setLabel('Strongly Agree')
    .setStyle(ButtonStyle.Primary)
;

/** Discord.js constat to create a button row representing a Likert scale */
const likertScale = new ActionRowBuilder()
    .addComponents(strDis, dis, neutral, agree, strAgree);

module.exports.likertScale = likertScale;
