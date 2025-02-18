// app/api/db/route.ts
import  Database  from 'better-sqlite3';

export async function GET() {
  // Initialize the database in memory
  const db = new Database(':memory:', { verbose: console.log });

  // Create a table and insert data
  db.prepare('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)').run();
  db.prepare('INSERT INTO users (name) VALUES (?)').run('Alice');
  db.prepare('INSERT INTO users (name) VALUES (?)').run('Bob');

  // Query the users table
  const users = db.prepare('SELECT * FROM users').all();

  // Output the database content to the console
  console.log(users); // Logs the users to the console

  // Respond with the data
  return new Response(JSON.stringify({ users }), { status: 200 });
}
