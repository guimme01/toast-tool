const {executeChatInteraction, executeInteractionSelectMenu, executeModalInteraction, executeInteractionButtons} = require('../toast.service');
const toastModel = require('../toast.model');
const {questions, gamma, smellsNames} = require("../utilities");
const {likertScale} = require("../utilities_button");

mockInteraction = {};

beforeEach(() => {
    mockJsonUserData = {
        "users": [
            {
                userId: "",
                collaborators: []
            }
        ]
    };
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

        const userId = "1"
        const user = {id: userId, collaborators: []}
        mockInteraction.user = user;

        mockInteraction.commandName = "start"
        await executeChatInteraction(mockInteraction, mockJsonUserData)

        newUser = mockJsonUserData.users.find((el) => {
            return el.userId === userId
        })

        expect(JSON.stringify(newUser) === JSON.stringify({userId: userId, collaborators: []})).toBe(true)
    });
});


describe("ExecuteModalInteraction", () => {
    test('TC_0', async() => {
        mockJsonUserData = {
            "users": [
                {
                    "userId": "1",
                    "collaborators": [{
                        "name": "",
                        "surname": "",
                        "collaboratorId": ""
                    }]
                }
            ]
        }
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;
        global.choicesIds = { set: jest.fn() };

        const mockFields = {
            fields: new Map([
                ['nameInput', { value: 'collabName' }],
                ['surnameInput', { value: 'collabSurname' }],
                ['idInput', { value: 'collabId' }]
            ])
        };

        mockInteraction.fields = mockFields;

        await executeModalInteraction(mockInteraction, mockJsonUserData);

        expect(mockJsonUserData.users.some(user => {
            return user.collaborators.some(collaborator => {
                return collaborator.collaboratorId === "collabId"
                && collaborator.name === "collabName"
                && collaborator.surname === 'collabSurname';
            });
        })).toBe(true);
    });
});