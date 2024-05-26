const fs = require("fs");
const {questions} = require("./utilities");
const file = "users.json"

function saveNewUser(userId) {
    let newUser = {userId: userId, collaborators: []};
    let data = getData();

    data.users.push(newUser);
    const jsonString = JSON.stringify(data, null, 4);
    writeData(jsonString)

    return newUser;
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

function getData(){
    try {
        const data = fs.readFileSync(file, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error(err);
        return { users: [] };
    }
}

function writeData(jsonString){
    fs.writeFile(file, jsonString, 'utf8', (err) => {
        if (err) {
            console.error('Errore durante l\'aggiunta di un nuovo utente del file:', err);
        } else {
            console.log('Nuovo utente aggiunto con successo!');
        }
    });
}

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

function getCollaborator(userId, collabId){
    let collabs = getCollaborators(userId);
    return collabs.find((el) => el.userId === collabId);
}

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