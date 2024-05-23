const fs = require('fs');
const toastModel = require('../toast.model');
const { questions, gamma } = require('../utilities');

const mockJsonUserData = {
    "users": [
        {
            "userId": "1",
            "collaborators": []
        }
    ]
};

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
describe("SaveNewUser", () => {
    test('TC_0', (done) => {
        const userId = '2';

        // Mock di fs.writeFile per simulare il successo
        fs.writeFile = jest.fn((path, data, options, callback) => callback(null));
        
        toastModel.saveNewUser(userId, mockJsonUserData)

        process.nextTick(() => {
            // Verifica che fs.writeFile sia stato chiamato correttamente
            expect(fs.writeFile).toHaveBeenCalledWith(
                'users.json',
                expect.any(String),
                'utf8',
                expect.any(Function)
            );

            expect(mockJsonUserData.users.find((el) => {
                return el.userId === userId
            }) !== undefined).toBe(true)

            done();
        });
    });
    test('TC_1', (done) => {
        const userId = '3';

        const error = new Error('Failed to write file');

        // Mock di fs.writeFile per simulare un errore
        fs.writeFile = jest.fn((path, data, options, callback) => callback(error));
        
        toastModel.saveNewUser(userId, mockJsonUserData)

        process.nextTick(() => {
            // Verifica che fs.writeFile sia stato chiamato correttamente
            expect(fs.writeFile).toHaveBeenCalledWith(
                'users.json',
                expect.any(String),
                'utf8',
                expect.any(Function)
            );

            expect(mockJsonUserData.users.find((el) => {
                return el.userId === userId
            }) !== undefined).toBe(true)

            done();
        });
    });
});

describe("SaveNewCollaborator", () => {
    test('TC_0', (done) => {
        const userId = '2';
        const name = 'name';
        const surname = 'surname';
        const id = 'id';

        // Mock di fs.writeFile per simulare il successo
        fs.writeFile = jest.fn((path, data, options, callback) => callback(null));
        
        toastModel.saveNewCollaborator(userId, name, surname, id, mockJsonUserData)

        process.nextTick(() => {
            // Verifica che fs.writeFile sia stato chiamato correttamente
            expect(fs.writeFile).toHaveBeenCalledWith(
                'users.json',
                expect.any(String),
                'utf8',
                expect.any(Function)
            );

            expect(mockJsonUserData.users.some(user => {
                return user.collaborators.some(collaborator => {
                    return collaborator.collaboratorId === id;
                });
            })).toBe(true);

            done();
        });
    });
    test('TC_1', (done) => {
        const userId = '3';
        const name = 'name';
        const surname = 'surname';
        const id = 'id';

        const error = new Error('Failed to write file');

        // Mock di fs.writeFile per simulare un errore
        fs.writeFile = jest.fn((path, data, options, callback) => callback(error));
        
        toastModel.saveNewCollaborator(userId, name, surname, id, mockJsonUserData)

        process.nextTick(() => {
            // Verifica che fs.writeFile sia stato chiamato correttamente
            expect(fs.writeFile).toHaveBeenCalledWith(
                'users.json',
                expect.any(String),
                'utf8',
                expect.any(Function)
            );

            expect(mockJsonUserData.users.some(user => {
                return user.collaborators.some(collaborator => {
                    return collaborator.collaboratorId === id;
                });
            })).toBe(true);

            done();
        });
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
