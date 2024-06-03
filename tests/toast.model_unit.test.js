const fs = require('fs');
const toastModel = require('../toast.model');
const { questions, gamma } = require('../utilities');
const testFile = "tests/test.users.json";

const originalReadFile = fs.readFileSync;

function getFileContent() {
    try {
        return originalReadFile(testFile, 'utf8');
    } catch (err) {
        throw err;
    }
}

afterEach(() => {
    fs.writeFileSync(testFile, "", 'utf-8');
});

jest.spyOn(fs, 'writeFile');
jest.spyOn(fs, 'readFileSync');
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe("SaveNewUser", () => {

    test('TC_0', (done) => {

        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "1",
                    "collaborators": []
                }
            ]
        }, null, 4);
    
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });

        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            fs.writeFileSync(testFile, data, encoding);
            callback(null);
        });

        const userId = "2";
        const expectedUser = { userId: userId, collaborators: [] };

        toastModel.saveNewUser(userId);

        try {
            const data = getFileContent();
            let obj = JSON.parse(data);
            expect(obj.users.find((el) => el.userId === userId)).toEqual(expectedUser);
            done();
        } catch (err) {
            console.error(err);
            done(err);
        }
    });

    test('TC_1', (done) => {
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "1",
                    "collaborators": []
                }
            ]
        }, null, 4);
    
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });
        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            try {
                fs.writeFileSync("", data, encoding);
                callback(null);
            } catch (error) {
                callback(error);
            }
        });

        const userId = "2";

        toastModel.saveNewUser(userId);

        try {
            const data = getFileContent();
            expect(data === "").toBe(true)
            done();
        } catch (err) {
            console.error(err);
            done(err);
        }
    });
});

describe("SaveNewCollaborator", () => {
    test('TC_0', (done) => {
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "2",
                    "collaborators": []
                }
            ]
        }, null, 4);
    
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });
        const userId = '2';
        const name = 'name';
        const surname = 'surname';
        const id = 'id';

        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            fs.writeFileSync(testFile, data, encoding);
            callback(null);
        });

        toastModel.saveNewCollaborator(userId, name, surname, id)

        try {
            const data = getFileContent();
            let obj = JSON.parse(data);
            expect(obj.users.some(user => {
                return user.collaborators.some(collaborator => {
                    return collaborator.collaboratorId === id;
                });
            })).toBe(true);
            done();
        } catch (err) {
            console.error(err);
            done(err);
        }
    });

    test('TC_1', (done) => {
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "2",
                    "collaborators": []
                }
            ]
        }, null, 4);
    
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });
        
        const userId = '2';
        const name = 'name';
        const surname = 'surname';
        const id = 'id';

        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            try {
                fs.writeFileSync("", data, encoding);
            } catch (error) {
                callback(error)
            }
        });

        toastModel.saveNewCollaborator(userId, name, surname, id)

        try {
            const data = getFileContent();
            expect(data === "").toBe(true)
            done();
        } catch (err) {
            console.error(err);
            done(err);
        }
    });
});

describe("UpdateMap", () => {
    test('TC_0', () => {
        const interaction = {
            user: {
                id: '1'
            },
            customId: 'agree' 
        };
        const index = 0;
        const smellValues = new Map();

        toastModel.updateMap(interaction, index, gamma, smellValues);

        console.log(smellValues);

        const userSmell = smellValues.get(interaction.user.id);
        const expectedValue = gamma[interaction.customId].value * questions[index].weight;

        console.log(userSmell);
        console.log(questions[index].smell);
        console.log(userSmell.get(questions[index].smell));

        expect(userSmell).toBeDefined();
        expect(userSmell.get(questions[index].smell)).toBe(expectedValue);
    });

    test('TC_1', () => {
        const interaction = {
            user: {
                id: '1'
            },
            customId: 'agree'
        };
        const index = 0;
        const smellValues = new Map();
        smellValues.set(interaction.user.id, new Map())

        toastModel.updateMap(interaction, index, gamma, smellValues);

        console.log(smellValues);

        const userSmell = smellValues.get(interaction.user.id);
        const expectedValue = gamma[interaction.customId].value * questions[index].weight;

        console.log(userSmell);
        console.log(questions[index].smell);
        console.log(userSmell.get(questions[index].smell));

        expect(userSmell).toBeDefined();
        expect(userSmell.get(questions[index].smell)).toBe(expectedValue);
    });
});

describe("GetCollaborator", () => {

    test("TC_0", (done) => {

        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "2",
                    "collaborators": [{
                        "name": "collabName",
                        "surname": "collabSurname",
                        "collaboratorId": "collabId"
                    }]
                }
            ]
        }, null, 4);
    
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });

        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            fs.writeFileSync(testFile, data, encoding);
            callback(null);
        });

        userId = "2"
        collabId = "collabId"

        let expectedCollaborator = toastModel.getCollaborator(userId, collabId)

        expect(collabId === expectedCollaborator.collaboratorId);
        done();
    });

    test("TC_1", (done) => {
        userId = "1"
        collabId = "collabId"

        process.nextTick(() => {
            let expectedCollaborator = toastModel.getCollaborator(userId, collabId)

            try {
                expect(expectedCollaborator === undefined)
                done();
            } catch (err) {
                console.error(err);
                done(err);
            }
        })
    });
});

describe("GetCollaborator", () => {

    test("TC_0", (done) => {

        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "2",
                    "collaborators": []
                }
            ]
        }, null, 4);
    
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });

        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            fs.writeFileSync(testFile, data, encoding);
            callback(null);
        });

        userId = "2"

        let expectedUser = toastModel.getUser(userId)

        expect(userId === expectedUser.userId);
        done();
    });

    test("TC_1", (done) => {
        userId = "12"

        process.nextTick(() => {
            let expectedUser = toastModel.getCollaborator(userId, collabId)

            try {
                expect(expectedUser === undefined)
                done();
            } catch (err) {
                console.error(err);
                done(err);
            }
        })
    });
});