const toastModel = require('../toast.model');
const {executeChatInteraction, executeInteractionSelectMenu, executeModalInteraction, executeInteractionButtons} = require('../toast.service');
const {questions, gamma, smellsNames} = require("../utilities");
const {likertScale} = require("../utilities_button");

beforeEach(() => {
    mockJsonUserData = {
        "users": [
            {
                "userId": "",
                "collaborators": []
            }
        ]
    }
});

afterEach(() => {
    toastModel.saveNewUser.mockClear();
    toastModel.saveNewCollaborator.mockClear();
    mockInteraction.reply.mockClear();
});

jest.mock('../toast.model', () => ({
    ...jest.requireActual('../toast.model'),
    saveNewUser: jest.fn().mockImplementation((userId, jsonUserData) => {
        let newUser = {userId: userId, collaborators: []};
        jsonUserData.users.push(newUser);
    }),
    saveNewCollaborator: jest.fn().mockImplementation((userId, name, surname, id, jsonUserData) => {
        let user = jsonUserData.users.find((el) => {
            return el.userId === userId
        });
    
        let collaborator = {name: name, surname: surname, collaboratorId: id};
    
        user.collaborators.push(collaborator);
        const jsonString = JSON.stringify(jsonUserData, null, 4);
    }),
    updateMap: jest.fn()
}));

mockInteraction = {
    reply: jest.fn(),
    fetchReply: jest.fn().mockImplementation(() => {
        return {id: "replyMessage"};
    }),
    channel: {messages: {fetch: jest.fn().mockImplementation((elem) => {
        return {content: elem, delete: jest.fn().mockImplementation(() => {
            elem = "";})}})}}
}

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe("executeInteractionSelectMenu", () => {
    test('TC_0', async () => {
        const userId = "1"
        const user = {id: userId}
        mockJsonUserData.users = [{userId: userId, collaborators: [{
            "name": "name",
            "surname": "surname",
            "collaboratorId": "2"
        }]}]

        mockInteraction.user = user;
        mockInteraction.values = ["analyze 2"];
        mockInteraction.update = jest.fn();
        global.index = 1;
        mockInteraction.followUp = jest.fn().mockImplementation(async (message) => {
            await mockInteraction.update({
                content: questions[1].content,
                components: [likertScale],
            });
        });
    

        global.messagesIds = new Map();
        
        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);

        expect(global.messagesIds.get(mockInteraction.user.id) === "replyMessage");
    });

    test('TC_1', async () => {
        mockInteraction.values = ["start"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        jest.spyOn(global.choicesIds, 'delete')
        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);
        expect(global.choicesIds.delete).not.toHaveBeenCalled();
        expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    test('TC_2', async () => {
        mockJsonUserData = {
            "users": [
                {
                    "userId": "1",
                    "collaborators": []
                }
            ]
        }

        mockInteraction.values = ["start"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        global.choicesIds.set(userId, ["msg1", "msg2"]);
        
        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);
        expect((global.choicesIds.get(userId)) === undefined)
    });

    test('TC_3', async () => {
        mockJsonUserData = {
            "users": [
                {
                    "userId": "1",
                    "collaborators": [{
                        "name": "name",
                        "surname": "surname",
                        "collaboratorId": "id"
                    }]
                }
            ]
        }

        mockInteraction.values = ["start"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();

        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);
        expect(global.choicesIds.get(userId) === "replyMessage");
    });

    test('TC_4', async () => {
        mockInteraction.values = ["add"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;
        mockInteraction.showModal = jest.fn();
        global.choicesIds = new Map();
        jest.spyOn(global.choicesIds, 'delete').mockImplementation(() => {

        })

        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);
        expect(mockInteraction.showModal).toHaveBeenCalled();
        expect(global.choicesIds.delete).not.toHaveBeenCalled();
    });
    test('TC_5', async () => {
        mockInteraction.values = ["add"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;
        mockInteraction.showModal = jest.fn();
        global.choicesIds = new Map();
        global.choicesIds.set(userId, ["msg1", "msg2"]);

        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);
        expect(mockInteraction.showModal).toHaveBeenCalled();
        expect((global.choicesIds.get(userId)) === undefined)
        mockInteraction.showModal.mockReset();
    });

    test('TC_6', async () => {
        mockInteraction.values = ["other"];
        global.choicesIds = new Map();
        jest.spyOn(global.choicesIds, 'get').mockImplementation(() => {

        })
        jest.spyOn(global.choicesIds, 'set').mockImplementation(() => {

        })
        await executeInteractionSelectMenu(mockInteraction, mockJsonUserData);

        expect(mockInteraction.showModal).not.toHaveBeenCalled();
        expect(global.choicesIds.get).not.toHaveBeenCalled();
        expect(global.choicesIds.set).not.toHaveBeenCalled();
    });
});

describe("executeChatInteraction", () => {
    test('TC_0', async () => {
        mockInteraction.commandName = "start";
        const userId = "3"
        const user = {id: userId}
        mockInteraction.user = user;

        await executeChatInteraction(mockInteraction, mockJsonUserData)
        expect(mockJsonUserData.users.find((el) => {
            return el.userId === userId
        }) !== undefined).toBe(true)
    });

    test('TC_1', async () => {
        mockJsonUserData = {
            "users": [
                {
                    "userId": "1",
                    "collaborators": []
                }
            ]
        }

        mockInteraction.commandName = "start";
        const userId = "1"
        const mockUser = {id: userId}
        mockInteraction.user = mockUser;

        await executeChatInteraction(mockInteraction, mockJsonUserData)
        expect(toastModel.saveNewUser).not.toHaveBeenCalled();

    });
    test('TC_2', async () => {
        mockInteraction.commandName = "other";
        const userId = "3"
        const user = {id: userId}
        mockInteraction.user = user;

        await executeChatInteraction(mockInteraction, mockJsonUserData)
        expect(mockInteraction.reply).not.toHaveBeenCalled();
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
                return collaborator.collaboratorId === "collabId";
            });
        })).toBe(true);
    });
});

describe("executeInteractionButtons", () => {
    test('TC_0', async() => {
        global.index = 0;
        let smellValues = new Map();
        mockInteraction.message = {id: "id"};
    
        await executeInteractionButtons(smellValues, mockInteraction);
        expect(mockInteraction.followUp).toHaveBeenCalled();
        
    });
    test('TC_1', async() => {
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        let messages = ["msg1", "msg2"]
        let smellValues = new Map();
        smellValues.set(userId, "12")
        mockInteraction.message = {id: "id"};

        global.index = questions.length;
        global.messagesIds = new Map();
        global.messagesIds.set(userId, messages);


        mockInteraction.channel = {send: jest.fn().mockImplementation((msg) => {
            return {id: "msgId", then: jest.fn()}
        })}

        await executeInteractionButtons(smellValues, mockInteraction);
        expect(global.messagesIds.get(userId) === undefined);
        expect(smellValues.get(userId) === undefined);
    });

    /*test('TC_2', async() => {
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        let smellValues = new Map();
        smellValues.set(userId, "12")
        mockInteraction.message = {id: "id"};

        global.index = questions.length;
        global.messagesIds = new Map();


        mockInteraction.channel = {send: jest.fn().mockImplementation((msg) => {
            return {id: "msgId", then: jest.fn()}
        })}

        await executeInteractionButtons(smellValues, mockInteraction);
        expect(global.messagesIds.delete).not.toHaveBeenCalled();
        expect(smellValues.get(userId) === undefined);
    });*/
});