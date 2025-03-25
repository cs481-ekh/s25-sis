"use client";


import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
    const [StudentID, setStudentID] = useState("");
    const [list, setlist] = useState<string[]>([]);
    const [logs, setlogs] = useState<string[]>([]);
    const [First_Name, setName] = useState("");

    //Path to default student image
    const imagePath = `/blankimage.png`;

    interface Student {
        StudentID: string;
        First_Name: string;
        Tags: string;
        Logged_In: boolean;
    }

    const [loggedInStudents, setLoggedInStudents] = useState<Student[]>([]);    //function for fetching students from db

    async function fetchStudents() {
        const res = await fetch('/api/db');
        console.log(loggedInStudents);

        if (res.ok) {
            const data = await res.json();
            setLoggedInStudents(data.users || []);
        } else {
            console.error('Failed to fetch logged-in students');
        }
    }

    const loginButton = async () => {
        const d = new Date().toLocaleString("en-US");
        let newList;
        if (!list.includes(StudentID)) {
            newList = list.concat(StudentID);
            setlogs((logs) => [...logs, `${StudentID} logged in at ${d}`]);
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ First_Name , StudentID, mode: 'login'}),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('New log:', data.log);
            } else {
                console.error('Failed to insert log');
            }
        }
        else {
            newList = list.filter((item) => item !== StudentID );
            setlogs((prevLogs) => [...prevLogs, `${StudentID} logged out at ${d}`]);
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ First_Name , StudentID, mode: 'logout' }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Completed log:', data.log);
            } else {
                console.error('Failed to finish log');
            }
        }

        setlist(newList);

        //Fetch students
        await fetchStudents();
    }

  useEffect(() => {
    // Make a fetch request to the API route
    async function fetchData() {
        const res = await fetch('/api/db');
        if (res.ok) {
          const data = await res.json();
          console.log('User Database Content:', data.users); // Logs the users data to the console
          console.log('Logs Database Content:', data.logs); // Logs the logs data to the console
        } else {
          console.error('Failed to fetch data');
        }
    }
  async function createTable() {
      try {
          const res = await fetch('/api/db', { method: 'GET' });
          if (res.ok) {
              const data = await res.json();
              console.log('Database initialized:', data);
              await fetchStudents(); // Fetch users after database creation
          } else {
              console.error('Failed to initialize database');
          }
      } catch (error) {
          console.error('Error creating database:', error);
      }
  }

  // Initialize database on mount
  createTable();
    fetchData();
  }, []);

    //updates every time 'list' gets changed
    useEffect(() => {
        fetchStudents();
    }, [list]);



  const registerUser = async () => {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ First_Name , StudentID, mode: 'register', Last_Name: 'Smith'}),
    });

    if (res.ok) {
      console.log('Inserted User');
      const data = await res.json();
      console.log('New User:', data.user);
    } else {
      console.error('Failed to insert user');
    }
  };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Navigation Bar */}
            <nav className="bg-blue-500 p-4 flex items-center">
                {/* Logo */}
                <img src="/logo.png" alt="EIS Logo" className="h-8 mr-4" /> {/* Adjust height and margin */}

                {/* Title and Navigation Link */}
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-white text-2xl font-bold">EIS Dashboard</h1>
                    <Link href="/login" className="text-white text-lg hover:underline">Back to Login</Link>
                </div>
            </nav>
            <div className="flex min-h-screen flex-row">
                <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100">
                    <h1 className="text-2xl font-bold mb-4">Welcome to the EIS</h1>
                    <p className="mb-6 text-gray-700">Please enter your Student ID to log in:</p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Enter Student ID"
                            value={StudentID}
                            onChange={(e) => setStudentID(e.target.value)}
                            className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Enter Name"
                            value={First_Name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={registerUser}
                            className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        >
                            Register
                        </button>
                        <button
                            className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                            onClick={() => loginButton()}
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
                <div className="w-1/2 flex flex-col items-center justify-center p-8 sm:p-20 bg-white border-l">
                    <h2 className="text-2xl font-bold mb-4">Currently Logged In</h2>
                    <ul className="list-disc pl-5">
                        {loggedInStudents.map(student => (
                            //Possible code when we have folder of student photos:
                            //const imagePath = `/photos/${student.StudentID}.png`;
                            <li key={student.StudentID} className="flex items-center space-x-4 border p-4 rounded-lg shadow-md">
                                <img
                                    src={imagePath}
                                    alt={`${student.First_Name}'s Profile`}
                                    className="w-12 h-12 rounded-full border object-cover"
                                    //onError={(e) => (e.currentTarget.src = 'blankimage.png')}
                                />

                                    <div><strong>First Name:</strong> {student.First_Name}</div>
                                    <div><strong>Tags:</strong> {student.Tags}</div>
                                    <div><strong>Logged In:</strong> {student.Logged_In ? 'Yes' : 'No'}</div>
                            </li>
                            ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
