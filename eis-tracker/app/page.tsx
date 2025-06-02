"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";

export default function Home() {
    const [StudentID, setStudentID] = useState("");
    const [list, setlist] = useState<string[]>([]);
    const [notification, setNotification] = useState<string>(""); // New state for temporary notification

    //const [First_Name, setName] = useState("");
    const [idError, setIdError] = useState("");
    const [showSupervisorPrompt, setShowSupervisorPrompt] = useState(false);
    const [supervising, setSupervising] = useState(false);
    const [showMajorPrompt, setShowMajorPrompt] = useState(false);

    // List of majors
    const majors = [
        "Computer Science",
        "Civil Engineering",
        "Construction Management",
        "Electrical & Computer Engineering",
        "Materials Science & Engineering",
        "Mechanical & Biomedical Engineering",
        "Engineering Plus",
        "Other"
    ];

    // Use "null" as a string placeholder for no selection
    const [selectedMajor, setSelectedMajor] = useState<string>("null");
    const [otherMajor, setOtherMajor] = useState<string>("");

    // Path to default student image
    const imagePath = `/s25-sis/blankimage.png`;

    const baseApiUrl = process.env.API_URL_ROOT ?? "/s25-sis/api/";

    const router = useRouter();

    interface Student {
        StudentID: string;
        First_Name: string;
        Tags: number;
        Logged_In: boolean;
        TotalHours: number;
    }

    const [loggedInStudents, setLoggedInStudents] = useState<Student[]>([]);

    // Validate StudentID format
    const validateStudentID = (id: string) => {
        const regex = /^\d{9}$/;
        return regex.test(id);
    };

    // Function for fetching students from db
    async function fetchStudents() {
        const res = await fetch(`${baseApiUrl}db`);
        //console.log(loggedInStudents);

        if (res.ok) {
            const data = await res.json();
            setLoggedInStudents(data.users || []);
        } else {
            console.error("Failed to fetch logged-in students");
        }
    }

    const loginButton = async () => {
        if (!validateStudentID(StudentID)) {
            setIdError("Student ID must be exactly 9 digits (0-9)");
            return;
        }
        setIdError("");

        const params = new URLSearchParams({
            database: "database.db",
            mode: "user",
            StudentID: StudentID,
        });

        const tagRes = await fetch(`${baseApiUrl}db?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (tagRes.ok) {
            // Check if supervisor bit is set
            const data = await tagRes.json();
            const tags = parseInt(data.user.Tags, 10) || 0;
            const isSupervisor =
                (tags & 0b100000) !== 0;
            const isStudentLoggedIn = loggedInStudents
                .filter((student) => student.Logged_In)
                .some(
                    (student) => Number(student.StudentID) === Number(StudentID)
                );

            const studentMajor = data.user.Major || null;
            if (studentMajor === null && !showMajorPrompt) {
                setShowMajorPrompt(true); // Show major selection prompt
                return;
            }

            if (isSupervisor && !showSupervisorPrompt && !isStudentLoggedIn) {
                setShowSupervisorPrompt(true); // Show checkbox before proceeding
                return;
            }
        } else {
            console.error("Failed to fetch logged-in students");
        }

        const d = new Date().toLocaleString("en-US");
        let newList;
        // Using the list to check if a student is already logged in (your existing logic)
        if (!list.includes(StudentID)) {
            newList = list.concat(StudentID);

            let supervisor = 0;
            if (supervising){
                supervisor=1;
            }

            const res = await fetch(`${baseApiUrl}db`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({StudentID, mode: "login", Supervising: supervisor }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log("New log:", data.log);
            } else {
                console.error("Failed to insert log");
            }
            setSupervising(false);
        } else {
            newList = list.filter((item) => item !== StudentID);

            const res = await fetch(`${baseApiUrl}db`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({StudentID, mode: "logout" }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Completed log:", data.log);
            } else {
                console.error("Failed to finish log");
            }

        }

        //change to name
        setNotification(`${StudentID} logged out at ${d}`);
        setTimeout(() => setNotification(""), 6000);

        setlist(newList);

        // Fetch students
        await fetchStudents();


        setStudentID("");
    };

    useEffect(() => {
        // Fetch database and table initialization
        async function fetchData() {
            const res = await fetch(`${baseApiUrl}db`);
            if (res.ok) {
                // const data = await res.json();
                //console.log("User Database Content:", data.users);
                //console.log("Logs Database Content:", data.logs);
            } else {
                console.error("Failed to fetch data");
            }
        }
        async function createTable() {
            try {
                const res = await fetch(`${baseApiUrl}db`, { method: "GET" });
                if (res.ok) {
                    // const data = await res.json();
                    //console.log("Database initialized:", data);
                    await fetchStudents(); // Fetch users after database creation
                } else {
                    console.error("Failed to initialize database");
                }
            } catch (error) {
                console.error("Error creating database:", error);
            }
        }

        // Initialize database on mount
        createTable();
        fetchData();
    }, []);

    // Updates every time 'list' changes
    useEffect(() => {
        fetchStudents();
    }, [list]);
  

    useEffect(() => {
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='));

        if (!token) {
            router.push('/login');  // Redirect to /login if no authToken
        }
    }, [router]);


    // Helper function to render colored tag boxes
    const renderTags = (tags: number) => {
        const tagElements = [];
        // Bit 0 (1) - White
        if (tags & 1) {
            tagElements.push(
                <div
                    key="white"
                    className="w-6 h-6 bg-white border border-gray-400 rounded mr-1"
                    title="White"
                />
            );
        }
        // Bit 1 (2) - Blue
        if (tags & 2) {
            tagElements.push(
                <div
                    key="blue"
                    className="w-6 h-6 bg-blue-500 border border-gray-400 rounded mr-1"
                    title="Blue"
                />
            );
        }
        // Bit 2 (4) - Green
        if (tags & 4) {
            tagElements.push(
                <div
                    key="green"
                    className="w-6 h-6 bg-green-500 border border-gray-400 rounded mr-1"
                    title="Green"
                />
            );
        }
        // Bit 3 (8) - Orange
        if (tags & 8) {
            tagElements.push(
                <div
                    key="orange"
                    className="w-6 h-6 bg-orange-500 border border-gray-400 rounded mr-1"
                    title="Orange"
                />
            );
        }
        return <div className="flex">{tagElements}</div>;
    };

    const SetMajor = async () => {
        if (!validateStudentID(StudentID)) {
            setIdError("Student ID must be exactly 9 digits (0-9)");
            return;
        }
        setIdError("");

        const res = await fetch(`${baseApiUrl}db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                StudentID,
                mode: "set_major",
                Major: selectedMajor,
                Other: otherMajor,
            }),
        });

        if (res.ok) {
            console.log("Updated Major");
        } else {
            console.error("Failed to insert user");
        }
    };

    return (
        <div className="flex min-h-screen flex-col">


            {showSupervisorPrompt && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Supervisor Confirmation</h2>
                        <p className="mb-4">This account has supervisor privileges.</p>
                        <div className="flex justify-end gap-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={supervising}
                                    onChange={(e) => setSupervising(e.target.checked)}
                                />
                                <span>Are you supervising?</span>
                            </label>

                            <button
                                onClick={() => {
                                    setShowSupervisorPrompt(false); // Hide modal
                                }}
                                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setShowSupervisorPrompt(false);
                                    await loginButton(); // Retry login now that supervisor confirmed
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMajorPrompt && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Select Your Major</h2>
                        <p className="mb-4">Please select your major from the dropdown below:</p>
                        <div className="mb-4">
                            <select
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                    //console.log(`Selected Major: ${e.target.value}`);
                                    setSelectedMajor(e.target.value);
                                }}
                                value={selectedMajor}
                            >
                                <option value="null" disabled>
                                    Select your major
                                </option>
                                {majors.map((major, index) => (
                                    <option key={index} value={major}>
                                        {major}
                                    </option>
                                ))}
                            </select>
                            {selectedMajor === "Other" && (
                                <input
                                    type="text"
                                    placeholder="Enter your major"
                                    className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => setOtherMajor(e.target.value)}
                                />
                            )}
                            <button
                                onClick={async () => {
                                    if (selectedMajor === "null" || (selectedMajor=== "Other" && otherMajor.trim() === "")) {
                                        alert("Please select or enter a major.");
                                        return;
                                    }
                                    await SetMajor();
                                    setShowMajorPrompt(false);
                                    console.log(`Major selection confirmed: ${otherMajor? otherMajor : selectedMajor}`);
                                    setSelectedMajor("null"); // Reset selection
                                    setOtherMajor(""); // Reset other major input
                                    await loginButton();
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mt-4"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Bar */}
            <nav className="bg-blue-500 p-4 flex items-center">
                <img
                    src="/s25-sis/logo.png"
                    alt="EIS Logo"
                    className="h-8 mr-4"
                />
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-white text-2xl font-bold">EIS Dashboard</h1>
                    <Link href="/login" className="text-white text-lg hover:underline">
                        Back to Login
                    </Link>
                </div>
            </nav>
            <div className="flex min-h-screen flex-row">
                <div className="w-3/5 flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100">
                    <h1 className="text-2xl font-bold mb-4">Welcome to the EIS</h1>
                    <p className="mb-6 text-gray-700">
                        Please enter your Student ID to log in:
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex flex-col">
                            <input
                                type="text"
                                placeholder="Enter Student ID"
                                value={StudentID}
                                onChange={(e) => {
                                    setStudentID(e.target.value);
                                    if (!validateStudentID(e.target.value)) {
                                        setIdError(
                                            "Student ID must be exactly 9 digits (0-9)"
                                        );
                                    } else {
                                        setIdError("");
                                    }
                                }}
                                className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={9}
                            />
                            {idError && (
                                <span className="text-red-500 text-sm mt-1">{idError}</span>
                            )}
                        </div>
                        <button
                            className={`px-6 py-3 text-white text-lg rounded-md transition ${
                                validateStudentID(StudentID)
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                            onClick={() => loginButton()}
                            disabled={!validateStudentID(StudentID)}
                        >
                            Login
                        </button>
                    </div>
                    {/* Notification */}
                    {notification && (
                        <div className="mt-4 bg-blue-500 text-white px-4 py-2 rounded transition-opacity duration-1000">
                            {notification}
                        </div>
                    )}
                </div>
                <div className="w-2/5 flex flex-col items-center justify-center p-8 sm:p-20 bg-white border-l">
                    <h2 className="text-2xl font-bold mb-4">Currently Logged In</h2>
                    <div className="w-full max-h-[500px] overflow-y-auto space-y-4 pr-2">
                        {loggedInStudents
                            .filter((student) => student.Logged_In)
                            .map((student) => {
                                const studentImagePath = `/photos/${student.StudentID}.png`;
                                return (
                                    <li
                                        key={student.StudentID}
                                        className="flex items-center space-x-4 border p-4 rounded-lg shadow-md"
                                    >
                                        <img
                                            src={studentImagePath}
                                            alt={`${student.First_Name}'s profile`}
                                            className="w-12 h-12 rounded-full border object-cover"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = imagePath;
                                            }}
                                        />
                                        <div>
                                            <strong>First Name:</strong> {student.First_Name}
                                        </div>
                                        <div>
                                            <strong>Tags:</strong>
                                            {renderTags(student.Tags)}
                                        </div>
                                    </li>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
}
