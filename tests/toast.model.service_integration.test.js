const {
    saveNewUser,
    saveNewCollaborator,
    updateMap,
    getCollaborator,
    getCollaborators,
    getUser
} = require('../toast.model');

const {
    executeInteractionSelectMenu,
    executeInteractionButtons,
    executeChatInteraction,
    executeModalInteraction
} = require('../toast.service');

jest.mock('../toast.model');

describe('Integration Test: Toast Model and Toast Service', () => {
    let mockInteraction;

    beforeEach(() => {
        // Mock interaction object
        mockInteraction = {
            user: { id: 'user123', username: 'testuser' },
            values: [],
            commandName: '',
            reply: jest.fn(),
            fetchReply: jest.fn().mockResolvedValue({ id: 'message123' }),
            update: jest.fn(),
            followUp: jest.fn(),
            channel: {
                messages: {
                    fetch: jest.fn().mockResolvedValue({
                        delete: jest.fn(),
                    }),
                },
                send: jest.fn().mockResolvedValue({ id: 'message456' }),
            },
            message: {
                id: 'message123' // Ensure this is set up for tests that require it
            }
        };

        // Mock global variables
        global.index = 0;
        global.messagesIds = new Map();
        global.choicesIds = new Map();
        global.smellValues = new Map();

        // Initialize global.messagesIds with an empty array for user123
        global.messagesIds.set('user123', []);
    });

    test('executeInteractionSelectMenu should interact with toast.model correctly', async () => {
        const collaboratorData = { name: 'John', surname: 'Doe', collaboratorId: 'collab123' };
        getCollaborators.mockResolvedValue([collaboratorData]);
        getCollaborator.mockResolvedValue(collaboratorData);

        mockInteraction.values = ['analyze collab123'];
        await executeInteractionSelectMenu(mockInteraction);

        expect(getCollaborator).toHaveBeenCalledWith(mockInteraction.user.id, 'collab123');
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: `Beginning analysis of ${collaboratorData.name} ${collaboratorData.surname}`,
            components: []
        });
        expect(mockInteraction.fetchReply).toHaveBeenCalled();
    });

    test('executeInteractionButtons should update map and interact with toast.model', async () => {
        const smellValues = new Map([['user123', [['smellAcr', 'smellValue']]]]);
        updateMap.mockImplementation(() => {});

        global.smellValues = smellValues;
        mockInteraction.values = ['someSmellValue'];

        await executeInteractionButtons(smellValues, mockInteraction);

        expect(updateMap).toHaveBeenCalled();
        expect(mockInteraction.update).toHaveBeenCalledWith({
            content: 'Answer collected. Next question',
            components: []
        });
        // Ensure that the message ID is pushed into the array
        expect(global.messagesIds.get('user123')).toContain('message123');
    });

    test('executeChatInteraction should save new user if not found', async () => {
        getUser.mockResolvedValue(undefined);
        saveNewUser.mockImplementation(() => {});

        mockInteraction.commandName = 'start';
        await executeChatInteraction(mockInteraction);

        expect(saveNewUser).toHaveBeenCalledWith(mockInteraction.user.id, mockInteraction.user.username);
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: 'Hi! Welcome to T.O.A.S.T. (Team Observation and Smells Tracking Tool).\n' +
                'I\'m here to help you to assess the Community Smells of your collaborators.\n' +
                'I will ask you a series of questions about the collaborator you want to assess, and you will have to answer them.\n' +
                'In the end, i will give you a report on the Community Smells of your collaborator. Let\'s start!',
            components: [expect.anything()]
        });
    });

    test('executeModalInteraction should save new collaborator', async () => {
        saveNewCollaborator.mockResolvedValue(true);

        mockInteraction.fields = {
            fields: new Map([
                ['nameInput', { value: 'John' }],
                ['surnameInput', { value: 'Doe' }],
                ['idInput', { value: 'collab123' }]
            ])
        };

        await executeModalInteraction(mockInteraction);

        expect(saveNewCollaborator).toHaveBeenCalledWith(mockInteraction.user.id, 'John', 'Doe', 'collab123');
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: 'Data saved',
            components: []
        });
    });
});
