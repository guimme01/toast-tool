const fs = require("fs");
const {questions} = require("./utilities");
const file = "users.json"

/**
 * 
 * This function saves a new user (with a manager role) into the file users.json
 * @param {*} userId - The user's ID obtained from the Discord information.
 * @returns the user that has been added
 */
function saveNewUser(userId) {
    let newUser = {userId: userId, collaborators: []};
    let data = getData();

    data.users.push(newUser);
    const jsonString = JSON.stringify(data, null, 4);
    writeData(jsonString)

    return newUser;
}

/**
 * This function will update a map that contains all the smell values for a collaborator 
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
 * @param {*} index - index of the question that the manager is answering
 * @param {*} gamma - constant that indicates the value of the answer to a question
 * @param {*} smellValues - hashMap that has a manager as a key and the value will be a new hashMap that will contain all the
 *                          smell value for each question
 */

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

/**
 * This function saves a new user (with a collaborator role) into the file users.json
 * @param {*} userId - the collaborator's manager id
 * @param {*} name - the collaborator's name
 * @param {*} surname - the collaborator's surname
 * @param {*} id - the collaborator's id
 */

function saveNewCollaborator(userId, name, surname, id) {
    data = getData();

    let user = data.users.find((el) => {
        return el.userId === userId
    });

    let collaborator = {name: name, surname: surname, collaboratorId: id};

    user.collaborators.push(collaborator);
    const jsonString = JSON.stringify(data, null, 4);

    writeData(jsonString);
}

/**
 * This function reads the file users.json and converts it into JSON format
 * @returns the converted file
 */
function getData(){
    try {
        const data = fs.readFileSync(file, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error(err);
        return { users: [] };
    }
}

/**
 * This function writes on the file users.json a new user
 * @param {*} jsonString - the user that will be written in the users.json file
 */
function writeData(jsonString){
    fs.writeFile(file, jsonString, 'utf8', (err) => {
        if (err) {
            console.error('Errore durante l\'aggiunta di un nuovo utente del file:', err);
        } else {
            console.log('Nuovo utente aggiunto con successo!');
        }
    });
}

/**
 * This function will get from the users.json file the list of collaborators of a manager. 
 * If the user is not found, it will be written inside it.
 * @param {*} userId - the manager's id
 * @returns the list of the collaborators if found or an empty list if not found
 */
function getCollaborators(userId){
    let data = getData();

    let user = data.users.find((el) => {
        return el.userId === userId
    });

    if (user === undefined) {
        saveNewUser(userId);
        return [];
    } else
        return user.collaborators;
}

/**
 * This function will find and get a specific collaborator in the list of a manager's collaborators
 * @param {*} userId - the manager's id
 * @param {*} collabId - the collaborator's id
 * @returns the collaborator's data or undefined if not found.
 */
function getCollaborator(userId, collabId){
    let collabs = getCollaborators(userId);
    return collabs.find((el) => el.userId === collabId);
}

/**
 * This function will find and get a specific user into the users.json file.
 * @param {*} userId - Th user's id
 * @returns the users if found, undefined if not found.
 */
function getUser(userId){
    let data = getData();

    return data.users.find((el) => {
        return el.userId === userId
    });
}

module.exports.saveNewUser = saveNewUser;
module.exports.updateMap = updateMap;
module.exports.saveNewCollaborator = saveNewCollaborator;
module.exports.getCollaborators = getCollaborators;
module.exports.getCollaborator = getCollaborator;
module.exports.getUser = getUser;