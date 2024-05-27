const {StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder} = require("discord.js");
const {questions, gamma, smellsNames} = require("./utilities");
const {likertScale} = require("./utilities_button");
const {row, modal} = require("./utilities_menu");
const fs = require("fs");
const {execSync} = require("child_process");
const {saveNewUser, saveNewCollaborator, updateMap, getCollaborator, getCollaborators, getUser} = require("./toast.model");

/**
 * This function manages all the cases for the smell analysis. All cases are indicated within the function
 * Gestisce le analisi (if, fa iniziare le domande, else, swithc 1 sceglie, switch 2 aggiunge)
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
 */
async function executeInteractionSelectMenu(interaction){
    let choice = interaction.values[0];

    /** This branch let the analysis questions start. At the end of this branch, the questions will be showed.  */
    if (choice.includes("analyze")) {

        let id = choice.split(" ")[1];
        let collaborator = getCollaborator(interaction.user.id, id);

        await interaction.reply({
            content: `Beginning analysis of ${collaborator.name} ${collaborator.surname}`,
            components: [],
        })
        const replyMessage = await interaction.fetchReply();
        global.messagesIds.set(interaction.user.id, [replyMessage.id]);

        /** Showing of the question */
        await nextQuestionButton(interaction, global.index);
    }
    /** This branch manages (in a switch-case) the first menu. The two operations are: 
     *      case 'start' -> the choose of the collaborator to analyze
     *      case 'add' -> add a new collaborator in the users.json file */
    else {
        switch (choice) {
            case 'start':
                await removeMsg(global.choicesIds, interaction);

                let collaborators = getCollaborators(interaction.user.id)
                if (collaborators.length !== 0) {
                    let select = buildCollabsList(collaborators);
                    /** Showing of the message and the collaborators list */
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
                /** Showing of the form for adding a new collaborator  */
                await interaction.showModal(modal);

                break;
            default:
                break;
        }
    }
}

/**
 * This function shows every question with a 1 second timeout after every answer. At the end, it shows the ending results
 * @param {*} smellValues - 
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
 */
async function executeInteractionButtons(smellValues,interaction){
    updateMap(interaction, global.index, gamma, smellValues)
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
    /** In this branch, if there are other questions to show, they will be showed */
    if (global.index < questions.length)
        await nextQuestionButton(interaction, global.index);
    /** In this branch, if the questions are finished, there will be showed the ending results */
    else {
        global.index = 0;
        console.log('smellValues ->' , smellValues);


        setTimeout(() => {
            console.log('1 second timeout');
        }, 1000);

        /** Deleting of all the messages showed before */
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

        /** Getting the smell values */
        let values = smellValues.get(interaction.user.id);
        let message = `The following are contributor's values of Community Smells:`;

        for (let value of values) {
            let smellAcr = value[0];
            let smellValue = value[1];

            const smellName = smellsNames[smellAcr];
            message += `\n- ${smellName}: ${smellValue}`;

        }

        /** Showing the final results */
        interaction.channel.send(message).then((msg) => {
            global.messagesIds.set(interaction.user.id, [msg.id])
        });

        /** Deleting the smellValues map */
        smellValues.delete(interaction.user.id);

    }
}

/**
 * This function shows the main message when the bot starts. After that, if the ID of the user that started the interaction is not
 * saved in the users.json file, it will be saved inside it.
 * @param {*} interaction 
 */
async function executeChatInteraction(interaction){
    if (interaction.commandName === 'start') {
        await interaction.reply({
            content: 'Hi! Welcome to T.O.A.S.T. (Team Observation and Smells Tracking Tool).\n' +
                'I\'m here to help you to assess the Community Smells of your collaborators.\n' +
                'I will ask you a series of questions about the collaborator you want to assess, and you will have to answer them.\n' +
                'In the end, i will give you a report on the Community Smells of your collaborator. Let\'s start!',
            components: [row],
        })

        let user = getUser(interaction.user.id);
        if (user === undefined) {
            saveNewUser(interaction.user.id);
        }
    }
}

/**
 * This function get the data from the form for the adding of a new collaborator and 
 * uses the saveNewCollaborator function to save them.
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
 */
async function executeModalInteraction(interaction){
    console.log(interaction.fields.fields);
    await interaction.reply({
        content: 'Data saved',
        components: [],
    })
    const replyMessage = await interaction.fetchReply();
    global.choicesIds.set(interaction.user.id, [replyMessage.id]);

    let name = interaction.fields.fields.get('nameInput').value;
    let surname = interaction.fields.fields.get('surnameInput').value;
    let id = interaction.fields.fields.get('idInput').value;

    saveNewCollaborator(interaction.user.id, name, surname, id);
}

/**
 * This function deletes a list of messages showed to the user before.
 * @param {*} list - list of messages to delete
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
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
 * This function build the collaborators list to show when a manager has to choose a collaborator to analyze.
 * @param {*} collaborators - collaborators from the users.json file
 * @returns the list of collaborators
 */
function buildCollabsList(collaborators) {
    let select = new StringSelectMenuBuilder()
        .setCustomId('collab_picker')
        .setPlaceholder('Your Collaborators');

    for (let collaborator of collaborators) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(collaborator.name + " " + collaborator.surname + " ID: " + collaborator.collaboratorId)
                .setValue("analyze " + collaborator.collaboratorId));
    }

    return new ActionRowBuilder()
        .addComponents(select);
}

/**
 * This function generates the buttons for the answers to a question
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
 * @param {*} index - index of the question in the set of questions
 */
async function nextQuestionButton(interaction, index) {
    await interaction.followUp({
        content: questions[index].content,
        components: [likertScale],
    });
}




module.exports.executeInteractionSelectMenu = executeInteractionSelectMenu;
module.exports.executeInteractionButtons = executeInteractionButtons;
module.exports.executeChatInteraction = executeChatInteraction;
module.exports.executeModalInteraction = executeModalInteraction;
