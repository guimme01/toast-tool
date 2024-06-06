const fs = require("fs");
const {questions} = require("./utilities");
const file = "users.json"
const mysql = require('mysql2/promise');
const sql = require('mssql');
const { create } = require("domain");
const config  = require("./config.json");
const configuration = {
    user: config.sqlserver.user,
    password: config.sqlserver.password,
    server: config.sqlserver.host,
    port: config.sqlserver.port,
    database: config.sqlserver.database,
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

/**
 * This function will connect the bot to the Azure SQL cloud database
 * @returns the connection pool
 */
async function connectToDatabase() {
    try {
        var poolConnection = await sql.connect(configuration);
        console.log("Connected to the database.");
        return poolConnection;
    } catch (err) {
        console.error("Error connecting to the database:", err.message);
        throw err;
    }
}

/**
 * 
 * This function saves a new user (with a manager role) into azure database
 * @param {*} userId - The user's ID obtained from the Discord information.
 * @param {*} username - The user's username obtained from the Discord information.
 * @returns the user that has been added
 */
async function saveNewUser(userId, username) {
    try {
        var poolConnection = await connectToDatabase();

        var resultSet = await poolConnection.request().query(`SELECT managerId FROM manager`);
        var flag = false;
        for (let index = 0; index < resultSet.recordset.length; index++)
            if(userId === resultSet.recordset[index].managerId)
                flag = true;
            
        if(!flag)
            await poolConnection.request()
            .input('managerId', sql.NVarChar(20), userId)
            .input('username', sql.NVarChar(20), username)
            .query('INSERT INTO manager (managerId, username) VALUES (@managerId, @username)');
        poolConnection.close();

    } catch (err) {console.error("Error:", err.message);}
}

//TODO
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

//TODO
/**
 * This function saves a new user (with a collaborator role) into the file users.json
 * @param {*} userId - the collaborator's manager id
 * @param {*} name - the collaborator's name
 * @param {*} surname - the collaborator's surname
 * @param {*} id - the collaborator's id
 */
async function saveNewCollaborator(managerId, name, surname, collaboratorId) {
    /*data = getData();
    let user = data.users.find((el) => {
        return el.userId === userId
    });

    let collaborator = {name: name, surname: surname, collaboratorId: id};

    user.collaborators.push(collaborator);
    const jsonString = JSON.stringify(data, null, 4);

    writeData(jsonString);*/

    try {
        var poolConnection = await connectToDatabase();

        var resultSet = await poolConnection.request()
            .input('managerId', sql.NVarChar(20), managerId)
            .query(`SELECT collaboratorId FROM collaborator WHERE managerId = @managerId`);
        var flag = false;
        for (let index = 0; index < resultSet.recordset.length; index++)
            if(collaboratorId === resultSet.recordset[index].collaboratorId)
                flag = true;
            
        if(!flag)
            await poolConnection.request()
            .input('collaboratorId', sql.NVarChar(20), collaboratorId)
            .input('name', sql.NVarChar(20), name)
            .input('surname', sql.NVarChar(20), surname)
            .input('managerId', sql.NVarChar(20), managerId)
            .query('INSERT INTO collaborator (collaboratorId, name, surname, managerId) VALUES (@collaboratorId, @name, @surname, @managerId)');
        else
            return false;
        poolConnection.close();

    } catch (err) {console.error("Error:", err.message);}

}

//TODO
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

//TODO
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

//TODO
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

//TODO
/**
 * This function will find and get a specific collaborator in the list of a manager's collaborators
 * @param {*} userId - the manager's id
 * @param {*} collabId - the collaborator's id
 * @returns the collaborator's data or undefined if not found.
 */
function getCollaborator(userId, collabId){
    let collabs = getCollaborators(userId);
    return collabs.find((el) => el.collaboratorId === collabId);
}

//TODO
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

    async function connectAndQuery() {
        try {
            var poolConnection = await sql.connect(configuration);
    
            console.log("Reading rows from the Table...");
            var resultSet = await poolConnection.request().query(`SELECT * FROM manager`);
    
            console.log(`${resultSet.recordset.length} rows returned.`);
    
            // output column headers
            var columns = "";
            for (var column in resultSet.recordset.columns) {
                columns += column + ", ";
            }
            console.log("%s\t", columns.substring(0, columns.length - 2));
    
            // ouput row contents from default record set
            resultSet.recordset.forEach(row => {
                console.log("%s\t%s", row.managerId, row.username);
            });
    
            // close connection only when we're certain application is finished
            poolConnection.close();
        } catch (err) {
            console.error(err.message);
        }
    }

    async function executeQuery() {
        try {
            // Connessione al database
            var poolConnection = await sql.connect(configuration);
            console.log("Connected to the database.");
    
            // Esecuzione della query
            console.log("Reading rows from the Table...");
            var resultSet = await poolConnection.request().query(`SELECT * FROM manager`);
    
            console.log(`${resultSet.recordset.length} rows returned.`);
    
            // Output column headers
            var columns = "";
            for (var column in resultSet.recordset.columns) {
                columns += column + ", ";
            }
            console.log("%s\t", columns.substring(0, columns.length - 2));
    
            // Output row contents from default record set
            resultSet.recordset.forEach(row => {
                console.log("%s\t%s", row.managerId, row.username);
            });
    
            // Chiusura della connessione
            poolConnection.close();
    
        } catch (err) {
            console.error("Error:", err.message);
        }
    }


    async function executeInsert(data) {
        try {
            // Connessione al database
            var poolConnection = await sql.connect(configuration);
            console.log("Connected to the database.");
    
            // Esecuzione dell'inserimento
            await poolConnection.request()
                .input('managerId', sql.Int, data.managerId)
                .input('username', sql.NVarChar(50), data.username)
                .query('INSERT INTO manager (managerId, username) VALUES (@managerId, @username)');
            
            console.log("Insert successful.");
    
            // Chiusura della connessione
            poolConnection.close();
    
        } catch (err) {
            console.error("Error:", err.message);
        }
    }
    

module.exports.saveNewUser = saveNewUser;
module.exports.updateMap = updateMap;
module.exports.saveNewCollaborator = saveNewCollaborator;
module.exports.getCollaborators = getCollaborators;
module.exports.getCollaborator = getCollaborator;
module.exports.getUser = getUser;
module.exports.connectAndQuery = connectAndQuery;
module.exports.executeQuery = executeQuery;
module.exports.connectToDatabase = connectToDatabase;