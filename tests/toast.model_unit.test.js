const sql = require('mssql');
const { saveNewUser, saveNewCollaborator, getCollaborators, getCollaborator, getUser } = require('../toast.model');

jest.mock('mssql');

describe('Database Functions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('saveNewUser should connect to the database and insert a new manager', async () => {
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({}),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        await saveNewUser('123', 'testuser');

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
        expect(mockPoolConnection.input).toHaveBeenCalled();
        expect(mockPoolConnection.query).toHaveBeenCalled();
        expect(mockPoolConnection.close).toHaveBeenCalled();
    });

    test('saveNewCollaborator should insert a new collaborator if not already exists', async () => {
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({ recordset: [] }).mockResolvedValueOnce({}),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        const result = await saveNewCollaborator('456', 'John', 'Doe');

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
        expect(mockPoolConnection.input).toHaveBeenCalled();
        expect(mockPoolConnection.query).toHaveBeenCalled();
        expect(mockPoolConnection.close).toHaveBeenCalled();
    });

    test('saveNewCollaborator should not insert if collaborator already exists', async () => {
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({ recordset: [{ collaboratorId: '456' }] }),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        const result = await saveNewCollaborator('456', 'John', 'Doe');

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
        expect(mockPoolConnection.query).toHaveBeenCalled();
        expect(mockPoolConnection.close).toHaveBeenCalled();
    });

    test('getCollaborators should return a list of collaborators', async () => {
        const mockData = [
            { collaboratorId: '789', name: 'John', surname: 'Doe' },
            { collaboratorId: '456', name: 'Jane', surname: 'Doe' },
        ];
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({ recordset: mockData }),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        const result = await getCollaborators();

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
    });

    test('getCollaborator should return a specific collaborator', async () => {
        const mockData = { collaboratorId: '789', name: 'John', surname: 'Doe' };
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({ recordset: [mockData] }),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        const result = await getCollaborator('789');

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
    });

    test('getUser should return the user if found', async () => {
        const mockData = [{ managerId: '123' }];
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({ recordset: mockData }),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        const result = await getUser('123');

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
        expect(mockPoolConnection.query).toHaveBeenCalled();
    });

    test('getUser should return undefined if user not found', async () => {
        const mockPoolConnection = {
            request: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValueOnce({ recordset: [] }),
            close: jest.fn(),
        };
        sql.connect.mockResolvedValueOnce(mockPoolConnection);

        const result = await getUser('999');

        expect(sql.connect).toHaveBeenCalled();
        expect(mockPoolConnection.request).toHaveBeenCalled();
        expect(mockPoolConnection.query).toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
});