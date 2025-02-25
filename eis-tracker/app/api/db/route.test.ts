import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('database tests', () => {
    test('database connection', async () => {
        const db = await fetch('/api/db');
        expect(db).toBeTruthy();
    })
})