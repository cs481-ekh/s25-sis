import fetchMock from 'jest-fetch-mock';
import * as fs from 'fs';
import Database from 'better-sqlite3';
const filePath = 'database/test.db';

fetchMock.enableMocks();

describe('database tests', () => {
    // Runs once before all tests
    beforeAll(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Deletes the file
        }
        const db = new Database(filePath);
        db.prepare('CREATE TABLE if NOT EXISTS users (StudentID INTEGER PRIMARY KEY UNIQUE,' +
            ' First_Name TEXT,' +
            ' Last_Name TEXT,' +
            ' Tags INTEGER NOT NULL DEFAULT 0,' +
            ' Active BOOLEAN NOT NULL DEFAULT FALSE,' +
            ' Logged_In BOOLEAN NOT NULL DEFAULT FALSE)'
          ).run();
          db.prepare('CREATE TABLE if NOT EXISTS logs (LogID INTEGER PRIMARY KEY AUTOINCREMENT,' +
            ' Time_In INTEGER,' +
            ' Time_Out INTEGER,' +
            ' User INTEGER REFERENCES users(StudentID) ON DELETE RESTRICT ON UPDATE CASCADE)'
          ).run();
          db.close(); // Close the database connection
    });

    // Runs once after all tests
    afterAll(() => {
        // Clean up the file again after tests
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Deletes the file
        }
    });


    test('bad user GET', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
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
            database: 'test.db',
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
            body: JSON.stringify({ database: 'test.db', mode: 'login', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('bad login POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'login', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('bad logout POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'logout', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('bad register POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'register', StudentID: 'string' }),
        });
        expect(res.status).toBe(400);
    })

    test('bad DELETE', async () => {
        const res = await fetch('/api/db', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'user', StudentID: 123456 }),
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
                database: 'test.db', mode: 'register', StudentID: 123456, First_Name: 'Alice'
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
                database: 'test.db', mode: 'register', StudentID: 123456, First_Name: 'Alice'
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
                database: 'test.db', mode: 'register', StudentID: 1234567, First_Name: 'Bob'
                , Last_Name: 'Smith', Tags: 1
            }),
        });
        expect(res.status).toBe(200);
    })

    test('user GET', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
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
            body: JSON.stringify({ database: 'test.db', mode: 'logout', StudentID: 123456 }),
        });
        expect(res.status).toBe(400);
    })

    test('login POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'login', StudentID: 123456 }),
        });
        expect(res.status).toBe(200);
    })

    test('logout POST', async () => {
        const res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'logout', StudentID: 123456 }),
        });
        expect(res.status).toBe(200);
    })

    test('user DELETE', async () => {
        const res = await fetch('/api/db', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'user', StudentID: 123456 }),
        });
        expect(res.status).toBe(200);
    })
})