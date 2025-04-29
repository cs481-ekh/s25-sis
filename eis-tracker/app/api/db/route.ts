/**
 * @file route.ts
 * @description This file defines the API routes for the database operations.
 * The API routes are used to interact with the database and perform SQL operations.
 * Any SQL operations should be defined in this file and called from the client.
 * Any non defined operations can be called with the `MANUAL` mode in any of the functions,
 * however, this should be used cautiously as it can lead to SQL injection attacks.
 */
import Database from 'better-sqlite3';

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
 *          StudentID: '123456' //this is one additional parameter dependent on the mode
 *      });
 * 
 * const res = await fetch(`/api/db?${params.toString()}`, {
 * 
 *         method: 'GET',
 *          headers: {
 *            'Content-Type': 'application/json',}
 *        });
 * @param {Request} request - The incoming HTTP request containing the body for the operation.
 * @param {string} database - The database file path. [OPTIONAL]
 * @param {string} mode - The mode of the request:
 *   - `user`: Queries one user given a StudentID in the specified database.
 *   - `log`: Queries one log given a LogID in the specified database.
 *   - `IDCARD`: Queries one user given a CardID in the specified database.
 *   - `all_logged_in`: Queries all users that are logged in.
 *   - `search`: Queries all users that match a search string in the specified database.
 *   - `MANUAL`: Executes a custom query in the specified database with limited error checking (use cautiously). The `value` field should contain a query string.
 *   - `recent_log`: Returns  if the user is logged in
 * @param params - a number of additional parameters dependent on `mode` the names of which are exactly:
 *   - `user`: StudentID - user to be queried.
 *   - `log`: LogID - the log to be queried.
 *   - `IDCARD`: CardID - the user to be queried.
 *   - `all_logged_in`: no additional parameters.
 *   - `search`: search - the search string to be queried.
 *   - `MANUAL`: sql - the SQL statement to be executed.
 * @returns {Response} Returns a response object containing the result from the database
 *   - `status`: `200` if the operation was successful.
 *   - `status`: `400` if the operation failed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.search !== '') {
    // Extract query parameters
    const db = new Database('database/' + (url.searchParams.get('database') || 'database.db'));

    const mode = url.searchParams.get('mode');

    if (mode === 'user') {
      const StudentID = url.searchParams.get('StudentID');
      const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(StudentID);
      if(user === undefined) 
        return new Response(JSON.stringify({ message: 'User not found' }), { status: 400 });
      return new Response(JSON.stringify({ user }), { status: 200 });
    } else if (mode === 'log') {
      const LogID = url.searchParams.get('LogID');
      const log = db.prepare('SELECT * FROM logs WHERE LogID = (?)').get(LogID);
      if(log === undefined) 
        return new Response(JSON.stringify({ message: 'Log not found' }), { status: 400 });
      return new Response(JSON.stringify({ log }), { status: 200 });
    } else if (mode === 'MANUAL') {
      const sql = url.searchParams.get('sql');
      if (sql === null || sql === undefined || sql === '') {
        return new Response(JSON.stringify({ message: 'No SQL query provided' }), { status: 400 });
      }
      const result = db.prepare(sql).all();
      return new Response(JSON.stringify({ result }), { status: 200 });
    } else if (mode == 'IDCARD'){
      const CardID = url.searchParams.get('CardID');
      const user = db.prepare('SELECT * FROM users WHERE CardID = (?)').get(CardID);
      if(user === undefined) 
        return new Response(JSON.stringify({ message: 'User not found' }), { status: 400 }); //change to 200 if not returning 400 is desired
      return new Response(JSON.stringify({ user }), { status: 200 });
    } else if (mode === 'password') {
      const ID = url.searchParams.get('ID');
      const password = db.prepare('SELECT Password FROM passwords WHERE ID = (?)').get(ID);

      return new Response(JSON.stringify({ password }), { status: 200 });
    } else if (mode === 'all_logged_in'){
      const users = db.prepare('SELECT * FROM users WHERE Logged_In = TRUE').all();
      return new Response(JSON.stringify({ users }), { status: 200 });
    } else if (mode === 'recent_log') {
      const ID = url.searchParams.get('StudentID');
      const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(ID);
      if (user === undefined)
        return new Response(JSON.stringify({message: 'User not found'}), {status: 400});
      const log = db.prepare('SELECT * FROM logs WHERE User = (?) AND Time_Out IS NULL').get(ID);
      if (log === undefined)
        return new Response(JSON.stringify({message: 'User not logged in'}), {status: 400});
      return new Response(JSON.stringify({log}), {status: 200});
    } else if (mode === 'search') {
      const search = url.searchParams.get('search');
      const users = db.prepare(`SELECT * FROM users WHERE First_Name LIKE ? OR Last_Name LIKE ? OR StudentID LIKE ? OR (First_Name || ' ' || Last_Name) LIKE ?`).all(`%${search}%`, `%${search}%`,`%${search}%`,`%${search}%`);
      return new Response(JSON.stringify({ users }), { status: 200 });
    }
    } else {
    console.log('Creating tables');
    const db = new Database('database/database.db');

    // Create a table and insert data
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

    db.prepare('DROP TABLE IF EXISTS training_data').run();

    db.prepare('CREATE TABLE if NOT EXISTS logs (LogID INTEGER PRIMARY KEY AUTOINCREMENT,' +
      ' Time_In INTEGER,' +
      ' Time_Out INTEGER,' +
      ' Supervising INTEGER DEFAULT NULL,' +
      ' User INTEGER REFERENCES users(StudentID) ON DELETE RESTRICT ON UPDATE CASCADE)'
    ).run();
    db.prepare('CREATE TABLE if NOT EXISTS passwords (ID INTEGER PRIMARY KEY UNIQUE,' +
        ' Password INTEGER NOT NULL DEFAULT 0)'
    ).run();

    const existingPwd = db.prepare('SELECT * FROM passwords WHERE ID = ?').get(999999999);
    if (!existingPwd) {
      db.prepare('INSERT INTO passwords (ID, Password) VALUES (?, ?)').run(999999999, 'admin123');
      db.prepare('INSERT INTO users (StudentID, Tags) VALUES (?, ?)').run(999999999, 0b10000);
    }

    // Query the users table
    // Join users with training_data and compute Tags from training data eligibility
    const users = db.prepare(`
      SELECT
        StudentID,
        First_Name,
        Last_Name,
        Logged_In,
        (WhiteTag * 1 +
         BlueTag * 2 +
         GreenTag * 4 +
         OrangeTag * 8 +
         PurpleTag * 16) AS Tags
      FROM users
    `).all();

    const logs = db.prepare('SELECT * FROM logs').all();


    // Respond with the data
    return new Response(JSON.stringify({ users, logs }), { status: 200 });

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
 *          body: JSON.stringify({database, mode, values}),
 *        });
 * This call uses fetch to send a POST request to the API route.
 * 
 * @param {Request} request - The incoming HTTP request containing the body for the operation.
 * @param {string} database - The database file path. [OPTIONAL]
 * @param {string} mode - The mode of the request:
 *   - `register`: Inserts a new user into the `users` table.
 *   - `login`: Updates the user to active and logs the action in the `logs` table.
 *   - `logout`: Marks the user as inactive and logs the logout time in the `logs` table.
 *   - `edit_tags`: Updates the tags of a user in the `users` table.
 *   - `set_major`: Updates the major of a user in the `users` table.
 *   - `set_IDCARD`: Updates the CardID of a user in the `users` table.
 *   - `MANUAL`: Executes a custom query in the specified database with limited error checking (use cautiously). The `value` field should contain a query string.
 * @param values - a number of additional parameters dependent on `mode` the names of which are exactly:
 *   - `register`: StudentID, First_Name, Last_Name, Tags(optional) - the user to be inserted.
 *   - `login`: StudentID - the user to log in.
 *   - `logout`: StudentID - the user to log out.
 *   - `edit_tags`: StudentID, Tags - the user to be updated and the tags to set.
 *   - `set_major`: StudentID, Major - the user to be updated and what major to set.
 *   - `set_IDCARD`: StudentID, CardID - the user to be updated and the IDCARD string to set.
 *   - `MANUAL`: sql - the SQL statement to be executed.
 * @returns {Response} Returns a response object containing the result from the database
 *   - `status`: `200` if the operation was successful.
 *   - `status`: `400` if the operation failed.
 */
export async function POST(request: Request) {
  // Get the data from the request
  const data = await request.json();
  const db = new Database('database/' + (data.database || 'database.db'));



  if (data.mode === 'register') {
    {
      const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
      if(user !== undefined) 
        return new Response(JSON.stringify({ message: 'StudentID in use' }), { status: 400 });
    }
    if (data.StudentID === undefined || data.First_Name === undefined || data.Last_Name === undefined)
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    if (data.StudentID === '' || data.First_Name === '' || data.Last_Name === '')
      return new Response(JSON.stringify({ message: 'Empty required fields' }), { status: 400 });

    if (data.Tags === undefined) {
      // Insert the data into the users table
      db.prepare('INSERT INTO users (StudentID, First_Name, Last_Name) VALUES (?,?,?)').run(Number(data.StudentID), data.First_Name, data.Last_Name);
      const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
      return new Response(JSON.stringify({ user }), { status: 200 });
    } else {
      db.prepare('INSERT INTO users (StudentID, First_Name, Last_Name, Tags) VALUES (?,?,?,?)').run(Number(data.StudentID), data.First_Name, data.Last_Name, Number(data.Tags));
      const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
      return new Response(JSON.stringify({ user }), { status: 200 });
    }

  } else if (data.mode === 'login') {
    {
    const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
    if(user === undefined) 
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 400 });
    }
    db.prepare('INSERT INTO logs (Time_In, User, Supervising) VALUES (?,?,?)').run(Date.now(), data.StudentID, Number(data.Supervising));
    db.prepare('UPDATE users SET Logged_In = TRUE WHERE StudentID = (?)').run(data.StudentID);
    db.prepare('UPDATE users SET Active = TRUE WHERE StudentID = (?)').run(data.StudentID);


    const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.StudentID);
    return new Response(JSON.stringify({ log }), { status: 200 });

  } else if (data.mode === 'logout') {
    {
    const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
    if(user === undefined) 
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 400 });
    const log = db.prepare('SELECT * FROM logs WHERE User = (?) AND Time_Out IS NULL').get(data.StudentID);
    if(log === undefined)
      return new Response(JSON.stringify({ message: 'User not logged in' }), { status: 400 });
    }
    db.prepare('UPDATE logs SET Time_Out = ? WHERE User = ? AND Time_Out IS NULL').run(Date.now(), data.StudentID);
    db.prepare('UPDATE users SET Logged_In = FALSE WHERE StudentID = (?)').run(data.StudentID);

    const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.StudentID);
    return new Response(JSON.stringify({ log }), { status: 200 });
  } else if (data.mode === 'registerPwd') {
    const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(Number(data.StudentID));
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 400 });
    }

    if (data.Password === undefined || data.Password === '') {
      return new Response(JSON.stringify({ message: 'Missing or empty password' }), { status: 400 });
    }

    // Insert or replace password (assumes 1:1 mapping with StudentID)
    db.prepare('INSERT OR REPLACE INTO passwords (ID, Password) VALUES (?, ?)').run(
        Number(data.StudentID),
        data.Password // You may want to hash this in a real app
    );

    return new Response(JSON.stringify({ message: 'Password registered' }), { status: 200 });
  }



  else if (data.mode === 'MANUAL') {
    const sql = data.sql;
    if (sql === null || sql === undefined || sql === '') {
      return new Response(JSON.stringify({ message: 'No SQL query provided' }), { status: 400 });
    }
    const result = db.prepare(sql).all();
    return new Response(JSON.stringify({ result }), { status: 200 });
  } else if (data.mode === 'edit_tags') {
    if (data.StudentID === undefined || data.Tags === undefined) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }

    // Decompose the Tags bitmask into individual booleans
    const tags = Number(data.Tags);
    const white = (tags & 0b1) ? 1 : 0;
    const blue = (tags & 0b10) ? 1 : 0;
    const green = (tags & 0b100) ? 1 : 0;
    const orange = (tags & 0b1000) ? 1 : 0;
    const purple = (tags & 0b10000) ? 1 : 0;

    // Update both Tags field AND individual tag columns
    db.prepare(`
    UPDATE users
    SET Tags = ?, WhiteTag = ?, BlueTag = ?, GreenTag = ?, OrangeTag = ?, PurpleTag = ?
    WHERE StudentID = ?
  `).run(tags, white, blue, green, orange, purple, data.StudentID);

    const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
    return new Response(JSON.stringify({ user }), { status: 200 });
  } else if(data.mode === 'set_major'){
    if (data.StudentID === undefined || data.Major === undefined) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }
    if (data.Major === '' || data.StudentID === '') {
      return new Response(JSON.stringify({ message: 'Empty required fields' }), { status: 400 });
    }
    db.prepare('UPDATE users SET Major = ? WHERE StudentID = ?').run(data.Major, data.StudentID);
    const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
    return new Response(JSON.stringify({ user }), { status: 200 });
  } else if(data.mode === 'set_IDCARD'){
    if (data.StudentID === undefined || data.CardID === undefined) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }
    if (data.CardID === '' || data.StudentID === '') {
      return new Response(JSON.stringify({ message: 'Empty required fields' }), { status: 400 });
    }
    db.prepare('UPDATE users SET CardID = ? WHERE StudentID = ?').run(data.CardID, data.StudentID);
    const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
    return new Response(JSON.stringify({ user }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ message: 'Invalid mode' }), { status: 400 });
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
 * @param {string} database - The database file path. [OPTIONAL]
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
  const data = await request.json();

  const db = new Database('database/' + (data.database || 'database.db'));
  if(data.mode === 'user') {
    {
      if(data.StudentID === undefined || data.StudentID === '')
        return new Response(JSON.stringify({ message: 'No StudentID provided' }), { status: 400 });
      const user = db.prepare('SELECT * FROM users WHERE StudentID = (?)').get(data.StudentID);
      if(user === undefined) 
        return new Response(JSON.stringify({ message: 'User not found' }), { status: 400 });
      const log = db.prepare('SELECT * FROM logs WHERE User = (?)').all(data.StudentID);
      if(log.length > 0) 
        return new Response(JSON.stringify({ message: 'User has logs' }), { status: 400 });
    }
  db.prepare('DELETE FROM users WHERE StudentID = (?)').run(data.StudentID);
  } else if(data.mode === 'MANUAL') {
    const sql = data.sql;
    if (sql === null || sql === undefined || sql === '') {
      return new Response(JSON.stringify({ message: 'No SQL query provided' }), { status: 400 });
    }
    const res = db.prepare(sql).all();
    return new Response(JSON.stringify({ res }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ message: 'Invalid mode' }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: 'User deleted' }), { status: 200 });
}