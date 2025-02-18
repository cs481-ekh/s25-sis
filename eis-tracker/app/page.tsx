"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [studentID, setStudentID] = useState("");
  const [name, setName] = useState("");
  
  useEffect(() => {
    // Make a fetch request to the API route
    async function fetchData() {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        console.log('Database Content:', data.users); // Logs the users data to the console
      } else {
        console.error('Failed to fetch data');
      }
    }

    // Fetch data when the component mounts
    fetchData();
  }, []);

  const simulateLogin = async () => {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Inserted User:', data.user);
    } else {
      console.error('Failed to insert user');
    }
  };


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
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={simulateLogin}
          className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
        >
          SimulateLogin
        </button>
      </div>
    </div>
  );
}
