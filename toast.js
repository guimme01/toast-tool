// Require the necessary discord.js classes
const dotenv = require('dotenv')
const {row, modal} = require("./utilities_menu");
const {
    Client, GatewayIntentBits, Routes, ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const {REST} = require('@discordjs/rest');
const {commands, questions, gamma, smellsNames} = require('./utilities');
const fs = require('fs');
const {executeInteractionSelectMenu, executeInteractionButtons, executeChatInteraction, executeModalInteraction} = require("./toast.service");

/**
 * This is the main function that starts the bot
 */
async function main() {
    dotenv.config();
    let interactionInProgress = false;
    global.index = 0;
    let smellValues = new Map();
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    global.messagesIds = new Map();
    global.choicesIds = new Map();
    const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
            body: commands,
        });

        client.login(process.env.DISCORD_TOKEN).then(() => {
            console.log('Bot is ready');
        });

        client.on('interactionCreate', async interaction => {
            console.log("id " + interaction.id);
            console.log("username " + interaction.user.username);
            console.log("channelId " + interaction.channelId);
            console.log("userId " + interaction.user.id);

            if (interaction.isChatInputCommand()) {
                await executeChatInteraction(interaction);
            } else if (interaction.isButton()) {
                await executeInteractionButtons(smellValues, interaction);
            } else if (interaction.isStringSelectMenu()) {
                await executeInteractionSelectMenu(interaction);
                if (interaction.values[0] === 'add') {
                    await interaction.showModal(modal);
                }
            } else if (interaction.isModalSubmit()) {
                await executeModalInteraction(interaction);
            }
        });
    } catch (error) {
        console.error(error);
    }
}

main();