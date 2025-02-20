// app/api/db/route.ts
import  Database  from 'better-sqlite3';
const db = new Database('database/database.db', { verbose: console.log });
// db.pragma('journal_mode = WAL');  // WAL = write-ahead logging TODO: DECIDED LATER

export async function GET() {
  // Initialize the database in memory
  

  // Create a table and insert data
  db.prepare('CREATE TABLE if NOT EXISTS users (studentID INTEGER PRIMARY KEY UNIQUE,'+
                                                ' First_Name TEXT,'+
                                                ' Last_Name TEXT,'+
                                                ' Tags INTEGER NOT NULL DEFAULT 0,'+
                                                ' Active BOOLEAN NOT NULL DEFAULT FALSE,'+
                                                ' Logged_In BOOLEAN NOT NULL DEFAULT FALSE)'
                                                ).run();
  db.prepare('CREATE TABLE if NOT EXISTS logs (LogID INTEGER PRIMARY KEY AUTOINCREMENT,'+
                                                ' Time_In INTEGER,'+ //TODO: change to not null
                                                ' Time_Out INTEGER,'+ //TODO: change to not null
                                                ' User INTEGER REFERENCES users(studentID) ON DELETE RESTRICT ON UPDATE CASCADE)'
                                                ).run();

  // Query the users table
  const users = db.prepare('SELECT * FROM users').all();


  // Respond with the data, This function currently returns all the users in the database
  // TODO: Use this function to do something useful
  return new Response(JSON.stringify({ users }), { status: 200 });
}

export async function POST(request: Request) {
  
  // Initialize the database in memory
//   const db = new Database('database/database.db', { verbose: console.log });

  // Get the data from the request
  const data = await request.json();

  if(data.mode === 'register'){
  // Insert the data into the users table
  db.prepare('INSERT INTO users (StudentID, First_Name) VALUES (?,?)').run(data.studentID, data.name);

  // Query the users table
  const user = db.prepare('SELECT * FROM users WHERE First_Name = (?)').get(data.name);

  // Respond with the data
  return new Response(JSON.stringify({ user }), { status: 200 });

  } else if(data.mode === 'login'){
    db.prepare('UPDATE users SET Active = TRUE WHERE StudentID = (?)').run(data.studentID);
    db.prepare('INSERT INTO logs (Time_In, User) VALUES (?,?)').run(Date.now(), data.studentID);
    db.prepare('UPDATE users SET Logged_In = TRUE WHERE StudentID = (?)').run(data.studentID);

    const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.studentID); //TODO: THIS ONLY WORKS ONCE
    return new Response(JSON.stringify({ log }), { status: 200 });

  } else if(data.mode === 'logout'){
    db.prepare('UPDATE logs SET Time_Out = ? WHERE User = ?').run(Date.now(), data.studentID);
    db.prepare('UPDATE users SET Logged_In = FALSE WHERE StudentID = (?)').run(data.studentID);

    const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.studentID); //TODO: THIS ONLY WORKS ONCE
    return new Response(JSON.stringify({ log }), { status: 200 });
  }
    
}

//must use HTML methods, and differentiate in the body of the request
export async function DELETE(request: Request) {
    // const db = new Database('database.db', { verbose: console.log });
  
    const data = await request.json();
  
    db.prepare('DELETE FROM users WHERE name = (?)').run(data.name);
  
    return new Response(JSON.stringify({ message: 'User deleted' }), { status: 200 });
  }