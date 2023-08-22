// Require the necessary discord.js classes
const dotenv = require('dotenv')
const {
    Client, GatewayIntentBits, Routes, ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const {REST} = require('@discordjs/rest');
const {commands, questions, gamma, soglia, smellsNames} = require('./utilities');
const {likertScale} = require('./utilities_button');
const {execSync} = require('child_process');
const {row, modal} = require("./utilities_menu");
const fs = require('fs');
let jsonUserData = {};


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

    let messagesIds = new Map();
    let choicesIds = new Map();
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
            const data = fs.readFileSync('users.json', 'utf8');
            jsonUserData = JSON.parse(data);
        });

        client.on('interactionCreate', async interaction => {

            console.log("id " + interaction.id)
            console.log("username " + interaction.user.username)
            console.log("channelId " + interaction.channelId)
            console.log("userId " + interaction.user.id)

            if (interaction.isChatInputCommand()) {

                if (interaction.commandName === 'start') {
                    await interaction.reply({
                        content: 'Hi! Welcome to T.O.A.S.T. (Team Observation and Smells Tracking Tool).\n' +
                            'I\'m here to help you to assess the Community Smells of your collaborators.\n' +
                            'I will ask you a series of questions about the collaborator you want to assess, and you will have to answer them.\n' +
                            'In the end, i will give you a report on the Community Smells of your collaborator. Let\'s start!',
                        components: [row],
                    })
                    let user = getUserById(interaction.user.id);
                    if(user === undefined) {
                        saveNewUser(interaction.user.id);
                    }
                }

            } else if (interaction.isButton()) {
                updateMap(interaction, index, gamma, smellValues)
                let content;
                if (index + 1 < questions.length)
                    content = `Answer collected. Next question`;
                else
                    content = `All questions have been answered`;

                await interaction.update({
                    content: content,
                    components: [],
                });
                messagesIds.get(interaction.user.id).push(interaction.message.id);
                execSync('sleep 1');

                index = index + 1;
                if (index < questions.length)
                    await executeInteractionButtons(interaction, index);
                else {
                    interactionInProgress = false;
                    index = 0;
                    console.log(smellValues);
                    //console.log(messagesIds);

                    // do 1 secondo di sleep prima di cancellare i messaggi.
                    execSync('sleep 1');

                    if (messagesIds.get(interaction.user.id) !== undefined) {
                        let row = messagesIds.get(interaction.user.id);

                        for (let elem of row) {
                            try {
                                let message = await interaction.channel.messages.fetch(elem);
                                await message.delete();
                            } catch (error) {
                                console.error("non sono riuscito ad eliminare il messageId:" + elem);
                            }
                        }

                        messagesIds.delete(interaction.user.id);
                    }
                    let values = smellValues.get(interaction.user.id);
                    let message = "";
                    for(let value of values) {
                        let smellAcr = value[0];
                        let smellValue = value[1];

                        if(smellValue >= soglia) {
                            const smellName = smellsNames[smellAcr];
                            if(message === "")
                                message += `The contributor analyzed can be subject to the Community Smells:\n - ${smellName}`;
                            else
                                message += `\n- ${smellName}`;
                        }
                    }
                    if(message === "")
                        message = "The contributor analyzed is not subject to any Community Smells";

                    // comunico all'utente il risultato degli smell
                    interaction.channel.send(message).then((msg) => {
                        messagesIds.set(interaction.user.id, [msg.id])
                    });

                    smellValues.delete(interaction.user.id);


                }
            }
            else if (interaction.isStringSelectMenu()) {
                let choice = interaction.values[0];

                if(choice.includes("analyze")) {
                    let id = choice.split(" ")[1];
                    let collaborator = jsonUserData.users.find((el) => el.userId === interaction.user.id).collaborators.find((el) => el.collaboratorId === id)

                    await interaction.reply({
                        content: `Beginning analysis of ${collaborator.name} ${collaborator.surname}`,
                        components: [],
                    })
                    const replyMessage = await interaction.fetchReply();
                    messagesIds.set(interaction.user.id, [replyMessage.id]);
                    await executeInteractionButtons(interaction, index);
                } else {
                    switch (choice) {
                        case 'start':
                            await removeMsg(choicesIds, interaction);

                            let collaborators = getCollabsByUserID(interaction.user.id);
                            if (collaborators.length !== 0) {
                                let select = buildCollabsList(collaborators);
                                await interaction.reply({
                                    content: "Choose the collaborator you want to analyze",
                                    components: [select],
                                });
                                const replyMessage = await interaction.fetchReply();
                                choicesIds.set(interaction.user.id, [replyMessage.id]);
                            }
                            break;
                            case 'add':
                                await removeMsg(choicesIds, interaction);
                                // Show the modal to the user
                                await interaction.showModal(modal);

                                break;


                        default:
                            break;
                    } gitkxx
                }
            }
            else if (interaction.isModalSubmit()){
                console.log(interaction.fields.fields);
                await interaction.reply({
                    content: 'Bravo bro, hai inserito i dati',
                    components: [],
                })
                const replyMessage = await interaction.fetchReply();
                choicesIds.set(interaction.user.id, [replyMessage.id]);

                let name = interaction.fields.fields.get('nameInput').value;
                let surname = interaction.fields.fields.get('surnameInput').value;
                let id = interaction.fields.fields.get('idInput').value;

                saveNewCollaborator(interaction.user.id, name, surname, id);
            }

        });
    } catch (error) {
        console.error(error);
    }
}

async function executeInteractionButtons(interaction, index) {

    await interaction.followUp({
        content: questions[index].content,
        components: [likertScale],
    });
}


function updateMap(interaction, index, gamma, smellValues) {
    let userSmell = smellValues.get(interaction.user.id);
    if (userSmell === undefined) {
        userSmell = new Map();
        smellValues.set(interaction.user.id, userSmell);
    }

    let prevValue = userSmell.get(questions[index].smell) || 0;
    let value = gamma[interaction.customId].value * questions[index].weight + prevValue;
    userSmell.set(questions[index].smell, value);
}

function getCollabsByUserID(userId) {
    let user = jsonUserData.users.find((el) => {
        return el.userId === userId
    });
    if (user.length === 0) {
        saveNewUser(userId, json);
        return [];
    } else
        return user.collaborators;
}

function getUserById(userId) {
    return jsonUserData.users.find((el) => {
        return el.userId === userId
    });
}

function saveNewUser(userId) {
    let newUser = {userId: userId, collaborators: []};
    jsonUserData.users.push(newUser);
    const jsonString = JSON.stringify(jsonUserData, null, 4);

    fs.writeFile('users.json', jsonString, 'utf8', (err) => {
        if (err) {
            console.error('Errore durante l\'aggiunta di un nuovo utente del file:', err);
        } else {
            console.log('Nuovo utente aggiunto con successo!');
        }
    });
    return newUser;
}

function saveNewCollaborator(userId, name,surname,id) {
    let user = jsonUserData.users.find((el) => {
        return el.userId === userId
    });

    let collaborator = {name: name, surname: surname, collaboratorId: id};

    user.collaborators.push(collaborator);
    const jsonString = JSON.stringify(jsonUserData, null, 4);

    fs.writeFile('users.json', jsonString, 'utf8', (err) => {
        if (err) {
            console.error('Errore durante l\'aggiunta di un nuovo utente del file:', err);
        } else {
            console.log('Nuovo utente aggiunto con successo!');
        }
    });
}

function buildCollabsList(collaborators) {
    let select = new StringSelectMenuBuilder()
        .setCustomId('collab_picker')
        .setPlaceholder('Your Collaborators');

    for (let collaborator of collaborators) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(collaborator.name + " " + collaborator.surname + " ID: " + collaborator.collaboratorId)
                .setValue("analyze "+ collaborator.collaboratorId));
    }

    const row = new ActionRowBuilder()
        .addComponents(select);
    return row;
}

async function removeMsg(list,interaction){
    let row = list.get(interaction.user.id);

    if(row !== undefined) {
        for (let elem of row) {
            try {
                let message = await interaction.channel.messages.fetch(elem);
                await message.delete();
            } catch (error) {
                console.error("non sono riuscito ad eliminare il messageId:" + elem);
            }
        }
        list.delete(interaction.user.id);
    }
}

main();
