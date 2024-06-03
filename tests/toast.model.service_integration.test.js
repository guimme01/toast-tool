const {executeChatInteraction, executeInteractionSelectMenu, executeModalInteraction, executeInteractionButtons} = require('../toast.service');
const toastModel = require('../toast.model');
const {questions, gamma, smellsNames} = require("../utilities");
const {likertScale} = require("../utilities_button");
const fs = require('fs')

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
//jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(toastModel, "saveNewUser")

mockInteraction = {};

beforeEach(() => {
    smellValues = new Map();
});

mockInteraction = {
    reply: jest.fn(),
    fetchReply: jest.fn().mockImplementation(() => {
        return {id: "replyMessage"};
    }),
    channel: {messages: {fetch: jest.fn().mockImplementation((elem) => {
        return {content: elem, delete: jest.fn().mockImplementation(() => {
            elem = "";})}})}},
}

describe("executeInteractionButtons", () => {
    test('TC_0', async () => {

        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        mockInteraction.customId = 'agree'
        global.index = 1;

        let messages = ["msg1", "msg2"]
        let initialSmell = "1.2"
        smellValues.set(questions[global.index].smell, initialSmell)

        mockInteraction.update = jest.fn();
        mockInteraction.message = {id: "id"};
        mockInteraction.followUp = jest.fn().mockImplementation(async (message) => {
            await mockInteraction.update({
                content: questions[1].content,
                components: [likertScale],
            });
        });

        global.messagesIds = new Map();
        global.messagesIds.set(userId, messages);
    
        await executeInteractionButtons(smellValues, mockInteraction);

        let values = smellValues.get(mockInteraction.user.id);
        for (let value of values) {
            let smellValue = value[1];

            let expectedValue = gamma[mockInteraction.customId].value * questions[global.index - 1].weight + (initialSmell || 0);
            expectedValue = parseFloat(expectedValue);
            expect(smellValue).toBeCloseTo(expectedValue, 5); // 5 digits of precision
        }
    });

    test('TC_1', async () => {

        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        mockInteraction.customId = 'agree'
        global.index = 0;
        let initialSmell = 0
        let messages = ["msg1", "msg2"]
        

        mockInteraction.update = jest.fn();
        mockInteraction.message = {id: "id"};
        mockInteraction.followUp = jest.fn().mockImplementation(async (message) => {
            await mockInteraction.update({
                content: questions[1].content,
                components: [likertScale],
            });
        });

        global.messagesIds = new Map();
        global.messagesIds.set(userId, messages);
    
        await executeInteractionButtons(smellValues, mockInteraction);

        let values = smellValues.get(mockInteraction.user.id);
        for (let value of values) {
            let smellValue = value[1];

            let expectedValue = gamma[mockInteraction.customId].value * questions[global.index - 1].weight + (initialSmell || 0);
            expectedValue = parseFloat(expectedValue);
            expect(smellValue).toBeCloseTo(expectedValue, 5); // 5 digits of precision
        }
    });
});

describe("executeChatInteraction", () => {
    test('TC_0', async () => {
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

        const userId = "1"
        const user = {id: userId, collaborators: []}
        mockInteraction.user = user;

        mockInteraction.commandName = "start"
        await executeChatInteraction(mockInteraction)

        expect(toastModel.saveNewUser).not.toHaveBeenCalled()
    });

    test('TC_0', async () => {
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": "",
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

        const userId = "1"
        const user = {id: userId, collaborators: []}
        mockInteraction.user = user;

        mockInteraction.commandName = "start"
        await executeChatInteraction(mockInteraction)

        try {
            const data = getFileContent();
            let obj = JSON.parse(data);
            expect(obj.users.find((el) => el.userId === userId)).toEqual(user);
        } catch (err) {
            console.error(err);
        }
    });
});


describe("ExecuteModalInteraction", () => {
    test('TC_0', async() => {

        const userId = "1"
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": userId,
                    "collaborators": []
                }
            ]
        }, null, 4);
        const user = {id: userId}
        mockInteraction.user = user;
        global.choicesIds = { set: jest.fn() };
        const collabId = 'collabId'
        
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });

        fs.writeFile.mockImplementation((file, data, encoding, callback) => {
            fs.writeFileSync(testFile, data, encoding);
            callback(null);
        });

        const mockFields = {
            fields: new Map([
                ['nameInput', { value: 'collabName' }],
                ['surnameInput', { value: 'collabSurname' }],
                ['idInput', { value: collabId }]
            ])
        };

        mockInteraction.fields = mockFields;

        await executeModalInteraction(mockInteraction);

        try {
            const data = getFileContent();
            let obj = JSON.parse(data);
            expect(obj.users.some(user => {
                return user.collaborators.some(collaborator => {
                    return collaborator.collaboratorId === collabId;
                });
            })).toBe(true);
        } catch (err) {
            console.error(err);
        }
    });
});

describe("executeInteractionSelectMenu", () => {
    test("TC_1", async () => {
        mockInteraction.values = ["start"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        jest.spyOn(global.choicesIds, 'delete')
        await executeInteractionSelectMenu(mockInteraction);
        expect(global.choicesIds.get(mockInteraction.user.id) === "replyMessage");
    })

    test('TC_2', async () => {

        mockInteraction.values = ["start"];
        const userId = "1"
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": userId,
                    "collaborators": [{
                        "name": "name",
                        "surname": "surname",
                        "collaboratorId": "2"
                    }]
                }
            ]
        }, null, 4);
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        global.choicesIds.set(userId, ["msg1", "msg2"]);

        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });

        await executeInteractionSelectMenu(mockInteraction);
        expect((global.choicesIds.get(userId)) === undefined)
    })

    test('TC_3', async () => {

        mockInteraction.values = ["start"];
        const userId = "1"
        let mockData = JSON.stringify({
            "users": [
                {
                    "userId": userId,
                    "collaborators": []
                }
            ]
        }, null, 4);
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        fs.readFileSync.mockImplementation((file, encoding) => {
            return mockData;
        });
        await executeInteractionSelectMenu(mockInteraction);
        expect(global.choicesIds.get(userId) === "replyMessage");
    });
});
