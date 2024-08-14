const {StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, MessageAttachment} = require("discord.js");
const {questions, gamma, smellsNames} = require("./utilities");
const {likertScale} = require("./utilities_button");
const {row} = require("./utilities_menu");
const axios = require('axios');
const fs = require("fs");
const {execSync} = require("child_process");
const {saveNewUser, saveNewCollaborator, updateMap, getCollaborator, getCollaborators, getUser} = require("./toast.model");
const config  = require("./config.json");

let collaboratorId;

/**
 * Handles interactions with a select menu in Discord. 
 * Depending on the user's choice, it either starts an analysis of a selected collaborator, 
 * shows a list of collaborators to choose from, opens a modal to add a new collaborator, or displays statistics.
 * 
 * @param {Interaction} interaction - The Discord interaction object.
 */
async function executeInteractionSelectMenu(interaction) {
    let choice = interaction.values[0];
    
    if (choice.includes("analyze")) {
        let id = choice.split(" ")[1];
        let collaborator = await getCollaborator(interaction.user.id, id);
        collaboratorId = collaborator;
        await interaction.reply({
            content: `Beginning analysis of ${collaborator.name} ${collaborator.surname}`,
            components: [],
        });
        const replyMessage = await interaction.fetchReply();
        global.messagesIds.set(interaction.user.id, [replyMessage.id]);

        await nextQuestionButton(interaction, global.index);
    } else if(choice.includes("graphics")){
        let id = choice.split(" ")[1];
        await showGraph(id, interaction);
    }
     else {
        switch (choice) {
            case 'start':
                await removeMsg(global.choicesIds, interaction);

                let collaborators = await getCollaborators(interaction.user.id);
                if (collaborators.length !== 0) {
                    let select = buildCollabsList('start', collaborators);
                    await interaction.reply({
                        content: "Choose the collaborator you want to analyze",
                        components: [select],
                    });
                    const replyMessage = await interaction.fetchReply();
                    global.choicesIds.set(interaction.user.id, [replyMessage.id]);
                }
                break;

            case 'add':
                await removeMsg(global.choicesIds, interaction);
                return interaction;

            case 'graphic':
                await removeMsg(global.choicesIds, interaction);

                let collaboratorStat = await getCollaborators(interaction.user.id);
                if (collaboratorStat.length !== 0) {
                    let select = buildCollabsList('graph', collaboratorStat);
                    await interaction.reply({
                        content: "Choose the collaborator you want to see statistics",
                        components: [select],
                    });
                    const replyMessage = await interaction.fetchReply();
                    global.choicesIds.set(interaction.user.id, [replyMessage.id]);
                }
                break;

            default:
                break;
        }
    }
}


/**
 * Handles interactions with buttons in Discord. Updates the smell values map with the user's answer,
 * updates the content of the message based on the progress, manages the message lifecycle by deleting old messages,
 * and either proceeds to the next question or finishes the interaction and provides the final result to the user.
 * 
 * @param {Map} smellValues - A map holding the smell values for users.
 * @param {Interaction} interaction - The Discord interaction object.
 */
async function executeInteractionButtons(smellValues, interaction) {
    updateMap(interaction, global.index, gamma, smellValues, collaboratorId.collaboratorId);
    let content;

    if (global.index + 1 < questions.length)
        content = `Answer collected. Next question`;
    else
        content = `All questions have been answered`;

    await interaction.update({
        content: content,
        components: [],
    });

    global.messagesIds.get(interaction.user.id).push(interaction.message.id);
    setTimeout(() => {
        console.log('1 second timeout');
    }, 1000);

    global.index = global.index + 1;
    if (global.index < questions.length)
        await nextQuestionButton(interaction, global.index);
    else {
        global.index = 0;
        console.log(smellValues);

        setTimeout(() => {
            console.log('1 second timeout');
        }, 1000);

        if (global.messagesIds.get(interaction.user.id) !== undefined) {
            let row = global.messagesIds.get(interaction.user.id);

            for (let elem of row) {
                try {
                    let message = await interaction.channel.messages.fetch(elem);
                    await message.delete();
                } catch (error) {
                    console.error("non sono riuscito ad eliminare il messageId:" + elem);
                }
            }

            global.messagesIds.delete(interaction.user.id);
        }

        let values = smellValues.get(interaction.user.id);
        let message = `The following are contributor's values of Community Smells:`;

        for (let value of values) {
            let smellAcr = value[0];
            let smellValue = value[1];

            const smellName = smellsNames[smellAcr];
            message += `\n- ${smellName}: ${smellValue}`;
        }

        interaction.channel.send(message).then((msg) => {
            global.messagesIds.set(interaction.user.id, [msg.id]);
        });

        smellValues.delete(interaction.user.id);
    }
}


/**
 * Handles interactions for the 'start' command in Discord. Replies with a welcome message and introduction to the tool,
 * and checks if the user is new, saving their information if they are not already present in the database.
 * 
 * @param {Interaction} interaction - The Discord interaction object.
 */
async function executeChatInteraction(interaction) {
    if (interaction.commandName === 'start') {
        await interaction.reply({
            content: 'Hi! Welcome to T.O.A.S.T. (Team Observation and Smells Tracking Tool).\n' +
                'I\'m here to help you assess the Community Smells of your collaborators.\n' +
                'I will ask you a series of questions about the collaborator you want to assess, and you will have to answer them.\n' +
                'In the end, I will give you a report on the Community Smells of your collaborator. Let\'s start!',
            components: [row],
        });

        let user = await getUser(interaction.user.id);
        if (user === undefined) {
            saveNewUser(interaction.user.id, interaction.user.username);
        }
    }
}


/**
 * Handles interactions with modals in Discord. Retrieves data from the modal fields, attempts to save a new collaborator,
 * and replies to the interaction based on whether the data was successfully saved or if a collaborator with the same ID already exists.
 * 
 * @param {Interaction} interaction - The Discord interaction object.
 */
async function executeModalInteraction(interaction) {
    console.log(interaction.fields.fields);
    let name = interaction.fields.fields.get('nameInput').value;
    let surname = interaction.fields.fields.get('surnameInput').value;
    let id = interaction.fields.fields.get('idInput').value;

    let result = await saveNewCollaborator(interaction.user.id, name, surname, id);
    console.log('result:', result);
    if (result) {
        await interaction.reply({
            content: 'Data saved',
            components: [],
        });
    } else {
        await interaction.reply({
            content: 'Data not saved: collaborator with same ID exists',
            components: [],
        });
    }
}


/**
 * Deletes all messages associated with the user from the specified list.
 * @param {Map} list - A map that holds lists of message IDs for each user.
 * @param {Interaction} interaction - The Discord interaction object used to access the channel and fetch messages.
 */
async function removeMsg(list, interaction) {
    let row = list.get(interaction.user.id);

    if (row !== undefined) {
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

/**
 * Creates a select menu for choosing collaborators based on the specified action.
 *
 * @param {string} action - The action type that determines the options' value (`'analyze'` or `'graphics'`).
 * @param {Array} collaborators - An array of collaborator objects, each containing `name`, `surname`, and `collaboratorId`.
 */
function buildCollabsList(action, collaborators) {
    let select = new StringSelectMenuBuilder()
        .setCustomId('collab_picker')
        .setPlaceholder('Your Collaborators');

    for (let collaborator of collaborators) {
        if(action === 'start'){
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(collaborator.name + " " + collaborator.surname + " ID: " + collaborator.collaboratorId)
                .setValue("analyze " + collaborator.collaboratorId));
        } else if (action === 'graph'){
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(collaborator.name + " " + collaborator.surname + " ID: " + collaborator.collaboratorId)
                    .setValue("graphics " + collaborator.collaboratorId));
        }
    }

    return new ActionRowBuilder()
        .addComponents(select);
}

/**
 * Sends the next question and response options to the user.
 * @param {Interaction} interaction - The Discord interaction object used to send the follow-up message.
 * @param {number} index - The index of the current question in the `questions` array. 
 */
async function nextQuestionButton(interaction, index) {
    await interaction.followUp({
        content: questions[index].content,
        components: [likertScale],
    });
}


/**
 * Generates and sends a graphical report for a specified collaborator.
 *
 * @param {string} collaboratorId - The ID of the collaborator for whom the graph is generated.
 * @param {Interaction} interaction - The Discord interaction object that triggered the graph generation request.
 */
async function showGraph(collaboratorId, interaction) {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Collaborator ID: ${collaboratorId}, Date: ${today}`);

    const grafanaUrl = config.grafana.url
        .replace('{collaboratorId}', collaboratorId)
        .replace('{today}', today);

    try {
        await interaction.deferUpdate();

        await interaction.followUp({
            content: 'Generazione del grafico in corso, per favore attendi...'
        });

        const response = await axios.get(grafanaUrl, {
            headers: {
                'Authorization': `Bearer ${config.grafana.token}`,
            },
            responseType: 'arraybuffer'
        });

        const imagePath = `./grafico_${collaboratorId}.png`;
        fs.writeFileSync(imagePath, response.data);

        await interaction.followUp({
            content: 'Ecco il grafico richiesto:',
            files: [imagePath]
        });

        fs.unlinkSync(imagePath);

    } catch (error) {
        console.error('Errore durante il rendering del grafico:', error);
        try {
            await interaction.followUp('Si è verificato un errore durante la generazione del grafico.');
        } catch (followUpError) {
            console.error('Errore durante il follow-up del messaggio:', followUpError);
        }
    }
}




module.exports.executeInteractionSelectMenu = executeInteractionSelectMenu;
module.exports.executeInteractionButtons = executeInteractionButtons;
module.exports.executeChatInteraction = executeChatInteraction;
module.exports.executeModalInteraction = executeModalInteraction;
module.exports.showGraph = showGraph;
