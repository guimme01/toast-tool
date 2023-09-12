const fs = require("fs");
const {questions} = require("./utilities");

function saveNewUser(userId, jsonUserData) {
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

function saveNewCollaborator(userId, name, surname, id, jsonUserData) {
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

module.exports.saveNewUser = saveNewUser;
module.exports.updateMap = updateMap;
module.exports.saveNewCollaborator = saveNewCollaborator;
