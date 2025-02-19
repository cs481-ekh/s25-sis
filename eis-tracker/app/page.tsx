"use client";

import React, { useState } from "react";

export default function Home() {
  const [studentID, setStudentID] = useState("");
  const [list, setlist] = useState<string[]>([]);
  const [logs, setlogs] = useState<string[]>([]);

  function loginButton() {
      const d = new Date().toLocaleString("en-US");
      let newList;
      if (!list.includes(studentID)) {
          newList = list.concat(studentID);
          setlogs((logs) => [...logs, `${studentID} logged in at ${d}`]);
      }
      else {
          newList = list.filter((item) => item !== studentID );
          setlogs((prevLogs) => [...prevLogs, `${studentID} logged out at ${d}`]);
      }

      setlist(newList);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Welcome to the EIS</h1>
      <p className="mb-6 text-gray-700">Please enter your Student ID to log in:</p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Enter Student ID"
          value={studentID}
          onChange={(e) => setStudentID(e.target.value)}
          className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition" onClick={() => loginButton()}
        >
          Login
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-8 items-center m-4">
          <ul>
              {logs.map((log, index) => (
                  <li key={index}>{log}</li>
              ))}
          </ul>
      </div>
    </div>
  );
}
