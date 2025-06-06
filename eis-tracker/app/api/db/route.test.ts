import * as fs from 'fs';
import Database from 'better-sqlite3';
import * as route from './route';
const filePath = 'database/test.db';


describe('database tests', () => {
    // Runs once before all tests
    beforeAll(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Deletes the file
        }

        const db = new Database(filePath, { verbose: void 0 });

        // ✅ Updated schema with all expected columns
        db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            StudentID INTEGER PRIMARY KEY UNIQUE,
            First_Name TEXT,
            Last_Name TEXT,
            Tags INTEGER NOT NULL DEFAULT 0,
            Active BOOLEAN NOT NULL DEFAULT FALSE,
            Logged_In BOOLEAN NOT NULL DEFAULT FALSE,
            Major TEXT DEFAULT NULL,
            CardID TEXT DEFAULT NULL,
            WhiteTag BOOLEAN NOT NULL DEFAULT 0,
            BlueTag BOOLEAN NOT NULL DEFAULT 0,
            GreenTag BOOLEAN NOT NULL DEFAULT 0,
            OrangeTag BOOLEAN NOT NULL DEFAULT 0,
            PurpleTag BOOLEAN NOT NULL DEFAULT 0
        )
    `).run();

        db.prepare(`
        CREATE TABLE IF NOT EXISTS logs (
            LogID INTEGER PRIMARY KEY AUTOINCREMENT,
            Time_In INTEGER,
            Time_Out INTEGER,
            Supervising INTEGER DEFAULT NULL,
            User INTEGER REFERENCES users(StudentID) ON DELETE RESTRICT ON UPDATE CASCADE
        )
    `).run();

        db.close();
    });

    // Runs once after all tests
    // @todo: Uncomment this after fixing the issue with the database file being locked
    // afterAll(() => {
    //     // Clean up the file again after tests
    //     if (fs.existsSync(filePath)) {
    //         fs.unlinkSync(filePath); // Deletes the file
    //     }
    // });


    test('bad user GET', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
            mode: 'user',
            StudentID: '123456'
        });
        const req = new Request(`http://localhost:3000/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const res = await route.GET(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(404);
    })

    test('bad log GET', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
            mode: 'log',
            StudentID: '123456'
        });

        const req = new Request(`http://localhost:3000/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const res = await route.GET(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('bad login POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'login', StudentID: 123456 }),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('bad logout POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'logout', StudentID: 123456 }),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('bad register POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'register', StudentID: 'string' }),
        }); 
        
        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('bad DELETE', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'user', StudentID: 123456 }),
        }); 
        
        const res = await route.DELETE(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('register POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                database: 'test.db', mode: 'register', StudentID: 123456, First_Name: 'Alice'
                , Last_Name: 'Smith'
            }),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('bad register 2 POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                database: 'test.db', mode: 'register', StudentID: 123456, First_Name: 'Alice'
                , Last_Name: 'Smith'
            }),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('register tags POST', async () => {
        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                database: 'test.db', mode: 'register', StudentID: 1234567, First_Name: 'Bob'
                , Last_Name: 'Smith', Tags: 1
            }),
        });
        
        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('user GET', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
            mode: 'user',
            StudentID: '123456'
        });

        const req = new Request(`http://localhost:3000/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const res = await route.GET(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('logout without login POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'logout', StudentID: 123456 }),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('login POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'login', StudentID: 123456 }),
        });
        
        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('logout POST', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'logout', StudentID: 123456 }),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('set_major POST', async () => {
        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({database: 'test.db', mode: 'set_major', StudentID: 123456, Major: 'Computer Science'}),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        expect(res.status).toBe(200);

    })

    test('user with logs DELETE', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'user', StudentID: 123456 }),
        });

        const res = await route.DELETE(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('IDCard null get', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
            mode: 'IDCARD',
            CardID: 'X5'
        });

        const req = new Request(`http://localhost:3000/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const res = await route.GET(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(400);
    })

    test('IDCard set', async () => {
        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({database: 'test.db', mode: 'set_IDCARD', StudentID: 123456, CardID: 'X5'}),
        });

        const res = await route.POST(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('IDCard get', async () => {
        const params = new URLSearchParams({
            database: 'test.db',
            mode: 'IDCARD',
            CardID: 'X5'
        });

        const req = new Request(`http://localhost:3000/api/db?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const res = await route.GET(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })

    test('user DELETE', async () => {

        const req = new Request(`http://localhost:3000/api/db?`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ database: 'test.db', mode: 'user', StudentID: 1234567 }),
        });

        const res = await route.DELETE(req);
        if(!res)
            fail();
        // const resBody = await res.json();
        expect(res.status).toBe(200);
    })
    
})