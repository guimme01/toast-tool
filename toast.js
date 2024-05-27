const dotenv = require('dotenv')
const {
    Client, GatewayIntentBits, Routes, ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const {REST} = require('@discordjs/rest');
const {commands, questions, gamma, smellsNames} = require('./utilities');
const fs = require('fs');
const {executeInteractionSelectMenu, executeInteractionButtons, executeChatInteraction, executeModalInteraction} = require("./toast.service");

/**
 * This is the main function. It manages the bot
 */
async function main() {

    /** This section loads the environment variables from the .env file
     *  and initializes them and other variables used from the bot  */
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

        /**From here, the bot is ready to work */
        client.login(process.env.DISCORD_TOKEN).then(() => {
            console.log('Bot is ready');
        });

        client.on('interactionCreate', async interaction => {

            console.log("id " + interaction.id)
            console.log("username " + interaction.user.username)
            console.log("channelId " + interaction.channelId)
            console.log("userId " + interaction.user.id)

            /**  case command (/start) and bot not already interacting with the user */
            if (interaction.isChatInputCommand()) {
                await executeChatInteraction(interaction)
            }
            /**  case button interaction */
            else if (interaction.isButton()) {
                await executeInteractionButtons(smellValues, interaction)
            }
            /** case select menu interaction */
            else if (interaction.isStringSelectMenu()) {
                await executeInteractionSelectMenu(interaction)
            }
            /** case modal interaction (processing the data of the new collaborator) */
            else if (interaction.isModalSubmit()) {
                await executeModalInteraction(interaction)
            }
        });
    } catch (error) {
        console.error(error);
    }
}

main();
