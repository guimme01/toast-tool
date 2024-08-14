const fs = require("fs");
const {questions} = require("./utilities");
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
 * This function saves a new user (with a manager role) into cloud database
 * @param {*} userId - The user's ID obtained from the Discord information.
 * @param {*} username - The user's username obtained from the Discord information.
 * @returns the user that has been added
 */
async function saveNewUser(userId, username) {
    try {
        var poolConnection = await connectToDatabase();
            
        await poolConnection.request()
        .input('managerId', sql.NVarChar(20), userId)
        .input('username', sql.NVarChar(20), username)
        .query('INSERT INTO manager (managerId, username) VALUES (@managerId, @username)');
        
        poolConnection.close();

    } catch (err) {console.error("Error:", err.message);}
}

async function getNextId() {
    try {
        var poolConnection = await connectToDatabase();
        const result = await poolConnection.request()
            .query('SELECT MAX(id) as maxId FROM analysis');
        
        poolConnection.close();
        
        return result.recordset[0].maxId + 1;
    } catch (err) {
        console.error("Error:", err.message);
        return 1;
    }
}

/**
 * This function will update a map that contains all the smell values for a collaborator 
 * @param {*} interaction - discord.js object to manage the GUI interaction with the user
 * @param {*} index - index of the question that the manager is answering
 * @param {*} gamma - constant that indicates the value of the answer to a question
 * @param {*} smellValues - hashMap that has a manager as a key and the value will be a new hashMap that will contain all the
 *                          smell value for each question
 */
async function updateMap(interaction, index, gamma, smellValues, collaboratorId) {
    console.log("CollaboratorId object:", collaboratorId)
    let userSmell = smellValues.get(interaction.user.id);
    if (userSmell === undefined) {
        userSmell = new Map();
        smellValues.set(interaction.user.id, userSmell);
    }

    let prevValue = userSmell.get(questions[index].smell) || 0;
    let value = gamma[interaction.customId].value * questions[index].weight + prevValue;
    userSmell.set(questions[index].smell, value);

    if(index + 1 >= questions.length){
        let values = smellValues.get(interaction.user.id);
        let smells = []
        for (let value of values) {
            smells.push(value[0]);
        }
        const today = new Date().toISOString().slice(0, 10);

        const uniqueId = await getNextId();

        const lwValue = values.get('LW') !== undefined ? parseFloat(values.get('LW')) : 0;
        const pdValue = values.get('PD') !== undefined ? parseFloat(values.get('PD')) : 0;
        const bcValue = values.get('BC') !== undefined ? parseFloat(values.get('BC')) : 0;

        try {
            console.log("LW: ", lwValue)
            var poolConnection = await connectToDatabase();
                
            await poolConnection.request()
            .input('LW', sql.Float, lwValue)
            .input('PD', sql.Float, pdValue)
            .input('BC', sql.Float, bcValue)
            .input('AnalysisDate', sql.Date, today) 
            .input('Id', sql.Int, uniqueId) 
            .input('CollaboratorId', sql.VarChar, collaboratorId)
            .query('INSERT INTO analysis (id, lw, pd, bc, analysisDate, collaboratorid) VALUES (@Id, @LW, @PD, @BC, @AnalysisDate, @CollaboratorId)');
            
            poolConnection.close();
    
        } catch (err) {console.error("Error:", err.message);} 
    }
}


/**
 * This function saves a new user (with a collaborator role) into the cloud database
 * @param {*} userId - the collaborator's manager id
 * @param {*} name - the collaborator's name
 * @param {*} surname - the collaborator's surname
 * @param {*} id - the collaborator's id
 */
async function saveNewCollaborator(managerId, name, surname, collaboratorId) {
    try {
        var poolConnection = await connectToDatabase();

        var resultSet = await poolConnection.request()
            .input('managerId', sql.NVarChar(20), managerId)
            .query(`SELECT collaboratorId FROM collaborator WHERE managerId = @managerId`);
        
        var flag = false;
        for (let index = 0; index < resultSet.recordset.length; index++) {
            if (collaboratorId === resultSet.recordset[index].collaboratorId) {
                flag = true;
                break;
            }
        }
            
        if(!flag){
            await poolConnection.request()
                .input('collaboratorId', sql.NVarChar(20), collaboratorId)
                .input('name', sql.NVarChar(20), name)
                .input('surname', sql.NVarChar(20), surname)
                .input('managerId', sql.NVarChar(20), managerId)
                .query('INSERT INTO collaborator (collaboratorId, name, surname, managerId) VALUES (@collaboratorId, @name, @surname, @managerId)');
            poolConnection.close();    
            return true;
        }
        else
            return false;
        

    } catch (err) {console.error("Error:", err.message);}

}

/**
 * This function will get from the cloud database the list of collaborators of a manager. 
 * @param {*} managerId - the manager's id
 * @returns the list of the collaborators if found or an empty list if not found
 */
async function getCollaborators(managerId){
        
        try {
            var poolConnection = await sql.connect(configuration);

            var resultSet = await poolConnection.request()
                .input('managerId', sql.NVarChar(20), managerId)
                .query(`SELECT c.collaboratorId, c.name, c.surname FROM 
                        manager m JOIN collaborator c ON m.managerId = c.managerId
                        WHERE m.managerId = @managerId`)
            poolConnection.close();
    
            return resultSet.recordset
        } catch (err) {
            console.error(err.message);
        }
}

/**
 * This function will find and get a specific collaborator in the list of a manager's collaborators
 * @param {*} userId - the manager's id
 * @param {*} collabId - the collaborator's id
 * @returns the collaborator's data or undefined if not found.
 */
async function getCollaborator(managerId, collaboratorId){
    try {
        var collabs = await getCollaborators(managerId)
        return collabs.find((el) => el.collaboratorId === collaboratorId)
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * This function will find and get a specific user into the users.json file.
 * @param {*} userId - Th user's id
 * @returns the users if found, undefined if not found.
 */
async function getUser(userId){
    var poolConnection = await connectToDatabase();

        var resultSet = await poolConnection.request().query(`SELECT managerId FROM manager`);
        for (let index = 0; index < resultSet.recordset.length; index++)
            if(userId === resultSet.recordset[index].managerId)
                return resultSet[index]
        return undefined
}
    

module.exports.saveNewUser = saveNewUser;
module.exports.updateMap = updateMap;
module.exports.saveNewCollaborator = saveNewCollaborator;
module.exports.getCollaborators = getCollaborators;
module.exports.getCollaborator = getCollaborator;
module.exports.getUser = getUser;
module.exports.connectToDatabase = connectToDatabase;