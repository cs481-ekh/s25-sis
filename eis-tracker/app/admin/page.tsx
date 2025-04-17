'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Page() {
    const [StudentID, setStudentID] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [white, setWhite] = useState(false);
    const [blue, setBlue] = useState(false);
    const [green, setGreen] = useState(false);
    const [orange, setOrange] = useState(false);
    const [admin, setAdmin] = useState(false);
    const [supervisor, setSupervisor] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
  
    const [file, setFile] = useState<File | null>(null); // New state for file
    const [uploadMessage, setUploadMessage] = useState<string | null>(null); // Message after file upload

    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState<'register' | 'update'>('register');


    const baseApiUrl = process.env.API_URL_ROOT ?? "/s25-sis/api/";


    const register = async () => {
        if (formMode === 'register') {
            const res = await fetch(`${baseApiUrl}db`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    First_Name: firstName,
                    Last_Name: lastName,
                    StudentID: StudentID,
                    mode: 'register'
                }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Inserted User:', data.user);
            } else {
                console.error('Failed to insert user');
            }
        }

        let tags = 0
        if (white)      { tags |= 0b1 }
        if (blue)       { tags |= 0b10 }
        if (green)      { tags |= 0b100 }
        if (orange)     { tags |= 0b1000 }
        if (admin)      { tags |= 0b10000 }
        if (supervisor) { tags |= 0b100000 }

        const tagRes = await fetch(`${baseApiUrl}db`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ StudentID, Tags: tags, mode: 'edit_tags' }),
        });

        if (tagRes.ok) {
            console.log('Updated Tags To', tags);
            setShowModal(false);
        } else {
            console.error('Failed to update tags');
        }
    }


    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // Fetch the CSV export link from the API
            const response = await fetch(`${baseApiUrl}export`);
            const data = await response.json();

            if (response.ok && data.downloadUrl) {
                // Create a link and trigger download
                const link = document.createElement("a");
                link.href = data.downloadUrl;
                link.setAttribute("download", "logs.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            else {
                alert("Failed to download logs.");
            }
        }
        catch (error) {
            console.error("Error downloading logs:", error);
            alert("An error occurred while downloading logs.");
        }
        setIsDownloading(false);
    };

    // Handle the file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    // Handle file import
    const handleFileUpload = async () => {
        if (!file) {
            alert("Please select a file to import.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${baseApiUrl}import`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUploadMessage(
                  `CSV imported successfully!\nAdded: ${data.added} | Skipped: ${data.skipped} | Updated: ${data.updated}`
                );
                console.log(data); // Log the extracted data
            } else {
                setUploadMessage("Error importing file.");
                console.error("Error importing file.");
            }
        } catch (error) {
            setUploadMessage("Error uploading file.");
            console.error("Error uploading file:", error);
        }
    };

    useEffect(() => {
        // Make a fetch request to the API route
        async function fetchData() {
            const res = await fetch(`${baseApiUrl}db`);
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
                const res = await fetch(`${baseApiUrl}db`, { method: 'GET' });
                if (res.ok) {
                    const data = await res.json();
                    console.log('Database initialized:', data);
                } else {
                    console.error('Failed to initialize database');
                }
            } catch (error) {
                console.error('Error creating database:', error);
            }
        }

        createTable();
        fetchData();
    });


    const openRegister = () => {
        if (!StudentID) return alert("Enter a Student ID first!");
        clearForm(); // clears all fields
        setFormMode('register');
        setShowModal(true);
    };

    const openUpdate = async () => {
        if (!StudentID) return alert("Enter a Student ID first!");
        const params = new URLSearchParams({
            database: "database.db",
            mode: "user",
            StudentID: StudentID,
        });

        const res = await fetch(`${baseApiUrl}db?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (res.ok) {
            const data = await res.json();
            const user = data.user;

            if (!user) return alert("User not found!");

            setFirstName(user.First_Name);
            setLastName(user.Last_Name);

            const tags = user.Tags ?? 0;
            setWhite(!!(tags & 0b1));
            setBlue(!!(tags & 0b10));
            setGreen(!!(tags & 0b100));
            setOrange(!!(tags & 0b1000));
            setAdmin(!!(tags & 0b10000));
            setSupervisor(!!(tags & 0b100000));

            setFormMode('update');
            setShowModal(true);
        } else {
            alert("Failed to fetch user info.");
        }
    };

    const clearForm = () => {
        setFirstName("");
        setLastName("");
        setWhite(false);
        setBlue(false);
        setGreen(false);
        setOrange(false);
        setAdmin(false);
        setSupervisor(false);
    };


    return (
        <div className="flex min-h-screen flex-col">
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">{formMode === 'register' ? "Register User" : "Update User"}</h2>
                        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded" />
                        <div className="grid grid-cols-2 gap-2">
                            <label><input type="checkbox" checked={white} onChange={() => setWhite(!white)} /> White</label>
                            <label><input type="checkbox" checked={blue} onChange={() => setBlue(!blue)} /> Blue</label>
                            <label><input type="checkbox" checked={green} onChange={() => setGreen(!green)} /> Green</label>
                            <label><input type="checkbox" checked={orange} onChange={() => setOrange(!orange)} /> Orange</label>
                            <label><input type="checkbox" checked={admin} onChange={() => setAdmin(!admin)} /> Admin</label>
                            <label><input type="checkbox" checked={supervisor} onChange={() => setSupervisor(!supervisor)} /> Supervisor</label>
                        </div>
                        <div className="flex justify-between">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                            <button onClick={register} className="px-4 py-2 bg-blue-500 text-white rounded">
                                {formMode === 'register' ? "Register" : "Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <nav className="bg-blue-500 p-4 flex items-center">
                {/* Logo */}
                <img src="/s25-sis/logo.png" alt="EIS Logo" className="h-8 mr-4" /> {/* Adjust height and margin */}

                {/* Title and Navigation Link */}
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-white text-2xl font-bold">EIS Dashboard</h1>
                    <Link href="/login" className="text-white text-lg hover:underline">Back to Login</Link>
                </div>
            </nav>
            <div className="flex flex-col items-start justify-start min-h-screen p-8 sm:p-20 bg-gray-100 space-y-4">

                <input
                    type="text"
                    placeholder="Enter User ID"
                    value={StudentID}
                    onChange={(e) => setStudentID(e.target.value)}
                    className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        //className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={openRegister} className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Register User
                    </button>
                    <button
                        //className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={openUpdate} className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Update User
                    </button>
                </div>

                {/* File Upload Section */}
                <div className="mt-6">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        className="mt-3 px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={handleFileUpload}
                    >
                        Upload CSV
                    </button>
                    {uploadMessage && <p className="mt-2 text-sm">{uploadMessage}</p>}
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="mt-6 px-6 py-3 bg-green-500 text-white text-lg rounded-md hover:bg-green-600 transition disabled:opacity-50"
                >
                    {isDownloading ? "Downloading..." : "Download Logs"}
                </button>
            </div>

        </div>
    )
}
