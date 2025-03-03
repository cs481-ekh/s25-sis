import fetchMock from 'jest-fetch-mock';
import * as fs from 'fs';
import * as path from 'path';
const filePath = path.join(__dirname, 'tests/test.db');

fetchMock.enableMocks();

describe('database tests', () => {
    // Runs once before all tests
    beforeAll(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Deletes the file
        }
    });

    // Runs once after all tests
    afterAll(() => {
        // Clean up the file again after tests
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Deletes the file
        }
    });

    test('database CONNECT', async () => {
        const users = await fetch('/api/db', {
            method: 'CONNECT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'setup' }),
        });
        expect(users.status).toBe(200);
    })

    test('bad user GET', async () => {
        const params = new URLSearchParams({
            database: 'tests/test.db',
            mode: 'user',
            StudentID: '123456'
        });

        const res = await fetch(`/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(res.status).toBe(400);
    })

    test('bad log GET', async () => {
        const params = new URLSearchParams({
            database: 'tests/test.db',
            mode: 'log',
            StudentID: '123456'
        });

        const res = await fetch(`/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        expect(res.status).toBe(400);
    })

    test('bad login POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'login', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('bad login POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'login', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('bad logout POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'logout', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('bad register POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'register', StudentID: 'string' }),
        });
        expect(res.status).toBe(400);
    })

    test('bad DELETE', async () => {
        const res = await fetch('/api/db', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'user', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('register POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                database: 'tests/test.db', mode: 'register', StudentID: 123456, First_Name: 'Alice'
                , Last_Name: 'Smith'
            }),
        });
        expect(res.status).toBe(200);
    })

    test('bad register 2 POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                database: 'tests/test.db', mode: 'register', StudentID: 123456, First_Name: 'Alice'
                , Last_Name: 'Smith'
            }),
        });
        expect(res.status).toBe(400);
    })

    test('register tags POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                database: 'tests/test.db', mode: 'register', StudentID: 1234567, First_Name: 'Bob'
                , Last_Name: 'Smith', Tags: 1
            }),
        });
        expect(res.status).toBe(200);
    })

    test('user GET', async () => {
        const params = new URLSearchParams({
            database: 'tests/test.db',
            mode: 'user',
            StudentID: '123456'
        });

        const res = await fetch(`/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        expect(res.status).toBe(200);
    })

    test('logout without login POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'logout', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('login POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'login', StudentID: 123456 }),
        });
        expect(res.status).toBe(200);
    })

    test('logout POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'logout', StudentID: 123456 }),
        });
        expect(res.status).toBe(200);
    })

    test('user DELETE', async () => {
        const res = await fetch('/api/db', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'tests/test.db', mode: 'user', StudentID: 123456 }),
        });
        expect(res.status).toBe(200);
    })
})