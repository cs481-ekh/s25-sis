// app/api/db/route.ts
import  Database  from 'better-sqlite3';

export async function GET() {
  // Initialize the database in memory
  const db = new Database('database/database.db', { verbose: console.log });

  // Create a table and insert data
  db.prepare('CREATE TABLE if NOT EXISTS users (studentID INTEGER PRIMARY KEY,'+
                                                ' First_Name TEXT,'+
                                                ' Last_Name TEXT,'+
                                                ' Tags INTEGER,'+
                                                ' Active INTEGER,'+
                                                ' Logged_In INTEGER)'
                                                ).run();
//   db.prepare('INSERT INTO users (name) VALUES (?)').run('Alice');
//   db.prepare('INSERT INTO users (name) VALUES (?)').run('Bob');

  // Query the users table
  const users = db.prepare('SELECT * FROM users').all();


  // Respond with the data, This function currently returns all the users in the database
  // TODO: Use this fucntion to do somehting useful
  return new Response(JSON.stringify({ users }), { status: 200 });
}

export async function POST(request: Request) {
  // Initialize the database in memory
  const db = new Database('database/database.db', { verbose: console.log });

  // Get the data from the request
  const data = await request.json();

  // Insert the data into the users table
  db.prepare('INSERT INTO users (First_Name) VALUES (?)').run(data.name);

  // Query the users table
  const user = db.prepare('SELECT * FROM users WHERE name = (?)').get(data.name);

  // Respond with the data
  return new Response(JSON.stringify({ user }), { status: 200 });
    
}

//must use HTML methods, and differentiate in the body of the request
export async function DELETE(request: Request) {
    const db = new Database('database.db', { verbose: console.log });
  
    const data = await request.json();
  
    db.prepare('DELETE FROM users WHERE name = (?)').run(data.name);
  
    return new Response(JSON.stringify({ message: 'User deleted' }), { status: 200 });
  }