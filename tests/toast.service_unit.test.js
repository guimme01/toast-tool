const toastModel = require('../toast.model');
const {executeChatInteraction, executeInteractionSelectMenu, executeModalInteraction, executeInteractionButtons, showGraph} = require('../toast.service');
const {questions, gamma, smellsNames} = require("../utilities");
const {likertScale} = require("../utilities_button");
const testFile = "tests/test.users.json"
const fs = require('fs')
const axios = require('axios');
const config = require('../config.json');

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock('../toast.model', () => ({
    ...jest.requireActual('../toast.model'),
    saveNewUser: jest.fn().mockImplementation((userId) => {
        return {userId: userId, collaborators: []}
    }),
    saveNewCollaborator: jest.fn().mockImplementation((userId, name, surname, id) => {}),
    updateMap: jest.fn(),
    getCollaborator: jest.fn().mockImplementation(() => {
        return {
            "name": "name",
            "surname": "surname",
            "collaboratorId": "2"
        }
    }),
    getCollaborators: jest.fn().mockImplementation(() => {
        return {
            "length": 0
        }
    }),
    getUser: jest.fn().mockResolvedValue({userId: "", collaborators: []})
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

afterEach( () => {
    jest.clearAllMocks()
})

describe("executeInteractionSelectMenu", () => {
    test("TC_0", async () => {
        const userId = "1"
        const user = {id: userId}

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
        
        await executeInteractionSelectMenu(mockInteraction);

        expect(global.messagesIds.get(mockInteraction.user.id) === "replyMessage");
    })

    test('TC_2', async () => {

        mockInteraction.values = ["start"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        global.choicesIds.set(userId, ["msg1", "msg2"]);

        toastModel.getCollaborators = jest.fn().mockImplementation(() => {
            return [{
                "name": "name",
                "surname": "surname",
                "collaboratorId": "2"
            }]
        })
        await executeInteractionSelectMenu(mockInteraction);
        expect((global.choicesIds.get(userId)) === undefined)
    })

    test('TC_3', async () => {

        mockInteraction.values = ["start"];
        const userId = "1"
        const user = {id: userId}
        mockInteraction.user = user;

        global.choicesIds = new Map();
        toastModel.getCollaborators = jest.fn().mockImplementation(() => {
            return []
        })
        await executeInteractionSelectMenu(mockInteraction);
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

        await executeInteractionSelectMenu(mockInteraction);
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

        await executeInteractionSelectMenu(mockInteraction);
        expect((global.choicesIds.get(userId)) === undefined)
    });

    test('TC_6', async () => {
        mockInteraction.values = ["other"];
        global.choicesIds = new Map();
        jest.spyOn(global.choicesIds, 'get').mockImplementation(() => {

        })
        jest.spyOn(global.choicesIds, 'set').mockImplementation(() => {

        })
        await executeInteractionSelectMenu(mockInteraction);

        expect(global.choicesIds.get).not.toHaveBeenCalled();
        expect(global.choicesIds.set).not.toHaveBeenCalled();
    });

    test('TC_7', async () => {
        mockInteraction.values = ["other"];
        global.messagesIds = new Map();
        jest.spyOn(global.messagesIds, 'get').mockImplementation(() => {

        })
        jest.spyOn(global.messagesIds, 'set').mockImplementation(() => {

        })
        await executeInteractionSelectMenu(mockInteraction);

        expect(global.messagesIds.set).not.toHaveBeenCalled();
    });
})

describe("executeChatInteraction", () => {
    test("TC_0", async () => {
        const userId = "3"

        mockInteraction.commandName = "start";
        const user = {id: userId, collaborators: []}
        mockInteraction.user = user;

        await executeChatInteraction(mockInteraction)
        
        expect(toastModel.saveNewUser).not.toHaveBeenCalled();
    });

    test("TC_1", async () => {
        const userId = "3"

        toastModel.getUser.mockImplementation(() => {
            return undefined
        })

        mockInteraction.commandName = "start";
        const user = {id: userId, collaborators: []}
        mockInteraction.user = user;

        await executeChatInteraction(mockInteraction)
        
        expect(toastModel.saveNewUser).toHaveBeenCalled();
    });

    test('TC_2', async () => {
        mockInteraction.commandName = "other";
        const userId = "3"
        const user = {id: userId}
        mockInteraction.user = user;

        await executeChatInteraction(mockInteraction)
        expect(mockInteraction.reply).not.toHaveBeenCalled();
    });
})

describe("executeInteractionButtons", () => {
    test('TC_0', async() => {
        const userId = "3"
        const user = {id: userId}
        mockInteraction.user = user;
        global.messagesIds = new Map();
        global.messagesIds.set(userId, [])
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
        expect(smellValues.get(userId) === undefined);
    });
})

describe("ExecuteModalInteraction", () => {
    test('TC_0', async() => {
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

        await executeModalInteraction(mockInteraction);

        expect(toastModel.saveNewCollaborator).toHaveBeenCalled()
    });
});

jest.mock('../config.json', () => ({
    grafana: {
        url: 'https://example.com/d/{collaboratorId}/?from={today}&to={today}',
        token: 'mock_token'
    },
    sqlserver: {
        host: 'toast-tool-test',
        user: 'johnDoe',
        password: 'password',
        database: 'dbex',
        port: 1111
    }
}));

describe('showGraph', () => {
    let mockInteraction;
    const collaboratorId = "12345";
    const today = new Date().toISOString().split('T')[0];
    const grafanaUrl = config.grafana.url.replace('{collaboratorId}', collaboratorId).replace('{today}', today);

    beforeEach(() => {
        mockInteraction = {
            deferUpdate: jest.fn(),
            followUp: jest.fn(),
        };

        jest.clearAllMocks();
    });

    test('should call deferUpdate and followUp when generating the graph', async () => {

        await showGraph(collaboratorId, mockInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
        expect(mockInteraction.followUp).toHaveBeenCalledWith({
            content: 'Generazione del grafico in corso, per favore attendi...'
        });
        expect(mockInteraction.followUp).toHaveBeenCalledTimes(2);
    });

    test('should handle API error during graph generation', async () => {

        await showGraph(collaboratorId, mockInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
        expect(mockInteraction.followUp).toHaveBeenCalledWith('Si è verificato un errore durante la generazione del grafico.');
    });

    test('should handle follow-up error gracefully', async () => {
        mockInteraction.followUp.mockRejectedValueOnce(new Error('Follow-up Error')); // Mock follow-up error

        await showGraph(collaboratorId, mockInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
        expect(mockInteraction.followUp).toHaveBeenCalledWith('Si è verificato un errore durante la generazione del grafico.');
    });
});

describe('showGraph', () => {
    let mockInteraction;
    const collaboratorId = "12345";
    const today = new Date().toISOString().split('T')[0];
    const grafanaUrl = `https://example.com/d/${collaboratorId}/?from=${today}&to=${today}`;

    beforeEach(() => {
        mockInteraction = {
            deferUpdate: jest.fn(),
            followUp: jest.fn(),
        };

        jest.clearAllMocks();
    });

    test('should generate and send the graph successfully', async () => {


        await showGraph(collaboratorId, mockInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    });

    test('should handle error during graph generation gracefully', async () => {

        await showGraph(collaboratorId, mockInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    });

    test('should handle error during follow-up gracefully', async () => {
        mockInteraction.followUp.mockRejectedValueOnce(new Error('Follow-up Error')); // Mock an error from followUp

        await showGraph(collaboratorId, mockInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    });
});