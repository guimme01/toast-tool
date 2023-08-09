// Require the necessary discord.js classes
const dotenv = require('dotenv')
const {Client, GatewayIntentBits, Routes, ButtonInteraction} = require('discord.js');
const {REST} = require('@discordjs/rest');
const { commands, questions, gamma} = require('./utilities');
const {likertScale} = require('./utilities_button');
const {execSync} = require('child_process');
const {row} = require("./utilities_menu");


async function main() {

    dotenv.config();
    let interactionInProgress = false;
    let index = 0;
    let smellValues = new Map();

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
            body: commands,
        });

        client.login(process.env.DISCORD_TOKEN).then(() => {
            console.log('Bot is ready');
        });

        client.on('interactionCreate', async interaction => {

                if (interaction.isChatInputCommand()) {

                    console.log(interaction.commandName )

                    if (interaction.commandName === 'question_button') {
                        if(interactionInProgress) {
                            return;
                        }
                        interactionInProgress = true;
                        await interaction.reply({
                            content: `Thanks for joining!`,
                            components: [],
                        })

                        await executeInteractionButtons(interaction, index);
                    }

                } else if (interaction.isButton()) {
                    updateMap(interaction, index, gamma, smellValues)
                    let content = "";
                    if(index +1 < questions.length)
                        content = `Answer collected. Next question`;
                    else
                        content = `All questions have been answered`;

                    await interaction.update({
                        content: content,
                        components: [],
                    });

                    execSync('sleep 1');

                    index = index + 1;
                    if (index < questions.length)
                        await executeInteractionButtons(interaction, index);
                    else {
                        interactionInProgress = false;
                        index = 0;
                        console.log(smellValues);
                    }
                }

        });
    } catch (error) {
        console.error(error);
    }
}

async function executeInteractionButtons(interaction,index){

    await interaction.followUp({
        content: questions[index].content,
        components: [likertScale],
    });
}


function updateMap(interaction, index, gamma, smellValues){
    console.log(interaction.customId);
    let prevValue = smellValues.get(interaction.customId) || 0;
    let value = gamma[interaction.customId].value*questions[index].weight + prevValue;
    smellValues.set(questions[index].smell, value);
}

main();
