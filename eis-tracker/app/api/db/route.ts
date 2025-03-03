/**
 * @file route.ts
 * @description This file defines the API routes for the database operations.
 * The API routes are used to interact with the database and perform SQL operations.
 * Any SQL operations should be defined in this file and called from the client.
 * Any non defined operations can be called with the `MANUAL` mode in any of the functions,
 * however, this should be used cautiously as it can lead to SQL injection attacks.
 */
import Database from 'better-sqlite3';
const db = new Database('database/database.db', { verbose: console.log });

/**
 * @description
 * This function is called when a GET request is made to the route.
 * This function should only be used to query the database and return data to the client
 * with no side effects. This function should not be used to insert data into the database.
 * 
 * @usage
 * const params = new URLSearchParams({
 * 
 *          database: 'database.db',
 *          mode: 'user',
 *          StudentID: '123456'
 *      });
 * 
 * const res = await fetch(`/api/db?${params.toString()}`, {
 * 
 *         method: 'GET',
 *          headers: {
 *            'Content-Type': 'application/json',}
 *        });
 * @param {Request} request - The incoming HTTP request containing the body for the operation.
 * @param {string} database - The database file path.
 * @param {string} mode - The mode of the request:
 *   - `user`: Queries one user given a StudentID in the specified database.
 *   - `log`: Queries one log given a LogID in the specified database.
 *   - `MANUAL`: Executes a custom query in the specified database with limited error checking (use cautiously). The `value` field should contain a query string.
 * @param values - a number of additional parameters dependent on `mode` the names of which are exactly:
 *   - `user`: StudentID - user to be queried.
 *   - `log`: LogID - the log to be queried.
 *   - `MANUAL`: sql - the SQL statement to be executed.
 * @returns {Response} Returns a response object containing the result from the database
 *   - `status`: `200` if the operation was successful.
 *   - `status`: `400` if the operation failed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.search !== '') {
    // Extract query parameters
    const database = url.searchParams.get('database');
    const mode = url.searchParams.get('mode');
    const logID = url.searchParams.get('LogID');

    console.log(database, mode, logID); // You can now use the parameters as needed

    return new Response(JSON.stringify({ message: 'not implemented' }), { status: 501 });

  } else {

    // Create a table and insert data
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

    // Query the users table
    const users = db.prepare('SELECT * FROM users').all();


    // Respond with the data, This function currently returns all the users in the database
    // TODO: Use this function to do something useful
    return new Response(JSON.stringify({ users }), { status: 200 });

  }
}

/**
 * @description
 * This function is invoked when a POST request is made to the API route.
 * It inserts or updates data in the database based on the provided parameters.
 * It should only be used to insert or update data with no side effects.
 * 
 * @usage
 * const res = await fetch('/api/db', {
 * 
 *         method: 'POST',
 *          headers: {
 *            'Content-Type': 'application/json',
 *          },
 *          body: JSON.stringify({database, mode, value}),
 *        });
 * This call uses fetch to send a POST request to the API route.
 * 
 * @param {Request} request - The incoming HTTP request containing the body for the operation.
 * @param {string} database - The database file path.
 * @param {string} mode - The mode of the request:
 *   - `register`: Inserts a new user into the `users` table.
 *   - `login`: Updates the user to active and logs the action in the `logs` table.
 *   - `logout`: Marks the user as inactive and logs the logout time in the `logs` table.
 *   - `MANUAL`: Executes a custom query in the specified database with limited error checking (use cautiously). The `value` field should contain a query string.
 * @param values - a number of additional parameters dependent on `mode` the names of which are exactly:
 *   - `register`: StudentID, First_Name, Last_Name, Tags(optional) - the user to be inserted.
 *   - `login`: StudentID - the user to log in.
 *   - `logout`: StudentID - the user to log out.
 *   - `MANUAL`: sql - the SQL statement to be executed.
 * @returns {Response} Returns a response object containing the result from the database
 *   - `status`: `200` if the operation was successful.
 *   - `status`: `400` if the operation failed.
 */
export async function POST(request: Request) {

  // Initialize the database in memory
  //   const db = new Database('database/database.db', { verbose: console.log });

  // Get the data from the request
  const data = await request.json();

  if (data.mode === 'register') {
    // Insert the data into the users table
    db.prepare('INSERT INTO users (StudentID, First_Name) VALUES (?,?)').run(data.StudentID, data.name);

    // Query the users table
    const user = db.prepare('SELECT * FROM users WHERE First_Name = (?)').get(data.name);

    // Respond with the data
    return new Response(JSON.stringify({ user }), { status: 200 });

  } else if (data.mode === 'login') {
    db.prepare('UPDATE users SET Active = TRUE WHERE StudentID = (?)').run(data.StudentID);
    db.prepare('INSERT INTO logs (Time_In, User) VALUES (?,?)').run(Date.now(), data.StudentID);
    db.prepare('UPDATE users SET Logged_In = TRUE WHERE StudentID = (?)').run(data.StudentID);

    const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.StudentID);
    return new Response(JSON.stringify({ log }), { status: 200 });

  } else if (data.mode === 'logout') {
    db.prepare('UPDATE logs SET Time_Out = ? WHERE User = ? AND Time_Out IS NULL').run(Date.now(), data.StudentID);
    db.prepare('UPDATE users SET Logged_In = FALSE WHERE StudentID = (?)').run(data.StudentID);

    const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.StudentID);
    return new Response(JSON.stringify({ log }), { status: 200 });
  }

}

/**
 * @description
 * This function is called when a DELETE request is made to the route.
 * This function should only be used to remove data from the database 
 * with no side effects
 * 
 * @usage
 * const res = await fetch('/api/db', {
 * 
 *         method: 'DELETE',
 *          headers: {
 *            'Content-Type': 'application/json',
 *          },
 *          body: JSON.stringify({database, mode, value}),
 *        });
 * @param {Request} request - The incoming HTTP request containing the body for the operation.
 * @param {string} database - The database file path.
 * @param {string} mode - The mode of the request:
 *   - `user`: Deletes the specified user from the `users` table.
 *   - `MANUAL`: Executes a custom query in the specified database with limited error checking (use cautiously). The `value` field should contain a query string.
 * @param values - a number of additional parameters dependent on `mode` the names of which are exactly:
 *   - `user`: StudentID - the user to be deleted.
 *   - `MANUAL`: sql - the SQL statement to be executed.
 * @returns {Response} Returns a response object containing the result from the database
 *   - `status`: `200` if the operation was successful.
 *   - `status`: `400` if the operation failed.
 */
export async function DELETE(request: Request) {
  // const db = new Database('database.db', { verbose: console.log });

  const data = await request.json();

  db.prepare('DELETE FROM users WHERE name = (?)').run(data.StudentID);

  return new Response(JSON.stringify({ message: 'User deleted' }), { status: 200 });
}



/**
 * @description
 * This function is called when a CONNECT request is made to the route.
 * This function should only be used to ensure that a connection to
 * the database can be established and that the required tables exist.
 * If the file at databasePath does not exist, it will be created.
 * This function should be called before any other database operations.
 * 
 * @usage
 * const res = await fetch('/api/db', {
 * 
 *         method: 'CONNECT',
 *          headers: {
 *            'Content-Type': 'application/json',
 *          },
 *          body: JSON.stringify({database, mode, value}),
 *        });
 * @param {Request} request - The incoming HTTP request containing the body for the operation.
 * @param {string} database - The database file path.
 * @param {string} mode - The mode of the request:
 *   - `setup`: Ensures that the required tables exist in the specified database.(DEFAULT)
 *   - `MANUAL`: Executes a custom query in the specified database with limited error checking (use cautiously). The `value` field should contain a query string.
 * @param values - a number of additional parameters dependent on `mode` the names of which are exactly:
 *   - `setup`: None
 *   - `MANUAL`: sql - the SQL statement to be executed.
 * @returns {Response} Returns a response object containing the result from the database
 *   - `status`: `200` if the operation was successful.
 *   - `status`: `400` if the operation failed.
 */
export async function CONNECT(request: Request) {
  // const db = new Database('database.db', { verbose: console.log });

  // const data = await request.json();

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

  return new Response(JSON.stringify({ message: 'Connected to database' }), { status: 200 });
}