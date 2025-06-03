'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { parseCookies } from "nookies";

interface Student {
    StudentID: string;
    First_Name: string;
    Last_Name: string;
    Tags: number;
    Logged_In: boolean;
    TotalHours?: number;
}


export default function Page() {
    const baseApiUrl = process.env.API_URL_ROOT ?? "/s25-sis/api/";
    const imagePath = `/s25-sis/blankimage.png`;
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
    const [loggedInStudents, setLoggedInStudents] = useState<Student[]>([]);
    const [viewStudents, setViewStudents] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false); // 🔒 Prevent rapid re-submits


    const [activeTab, setActiveTab] = useState<'dashboard' | 'search'>('dashboard'); // State for active tab

    const handleTabChange = (tab: 'dashboard' | 'search') => {
        setActiveTab(tab);
    };

    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const handleSearch = async () => {
        const params = new URLSearchParams({
            database: "database.db",
            mode: "search",
            search: searchQuery,
        });
        const res = await fetch(`${baseApiUrl}db?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (res.ok) {
            const data = await res.json();
            const users = data.users || [];

            setSearchResults(users);
        } else {
            console.error('Failed to fetch search results');
        }
    }

    const [currentPage, setCurrentPage] = useState(1);
    const [studentsPerPage, setStudentsPerPage] = useState(10);

    const handleStudentsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStudentsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1); // Reset to the first page when changing the number of students per page
    };

    const renderTags = (tags: number) => {
        const tagElements = [];
        if (tags & 1) {
            tagElements.push(<div key="white" className="w-6 h-6 bg-white border rounded mr-1" title="White" />);
        }
        if (tags & 2) {
            tagElements.push(<div key="blue" className="w-6 h-6 bg-blue-500 border rounded mr-1" title="Blue" />);
        }
        if (tags & 4) {
            tagElements.push(<div key="green" className="w-6 h-6 bg-green-500 border rounded mr-1" title="Green" />);
        }
        if (tags & 8) {
            tagElements.push(<div key="orange" className="w-6 h-6 bg-orange-500 border rounded mr-1" title="Orange" />);
        }
        return <div className="flex justify-center mt-2">{tagElements}</div>;
    };

    const renderCards = (list: Student[]) => {
        
        const totalPages = Math.ceil(list.length / studentsPerPage);

        const handlePageChange = (page: number) => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
            }
        };

        const startIndex = (currentPage - 1) * studentsPerPage;
        const endIndex = startIndex + studentsPerPage;
        const paginatedList = list.slice(startIndex, endIndex);

        if (!list || list.length === 0) {
            return <div className="text-center text-gray-500">No students found.</div>;
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <label htmlFor="studentsPerPage" className="mr-2">Students per page:</label>
                        <select
                            id="studentsPerPage"
                            value={studentsPerPage}
                            onChange={handleStudentsPerPageChange}
                            className="p-2 border rounded"
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-300 rounded mr-2 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-300 rounded ml-2 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
                        {paginatedList
                            .sort((a, b) => {
                                const nameA = a.First_Name || ""; // Fallback to an empty string if null/undefined
                                const nameB = b.First_Name || ""; // Fallback to an empty string if null/undefined
                                return nameA.localeCompare(nameB);
                            })
                            .map(student => {
                                return (
                                    <div
                                        key={student.StudentID}
                                        className="flex flex-col items-center border p-2 rounded shadow-md bg-gray-50 transition-transform duration-300 hover:scale-105"
                                        onClick={() => {
                                            setStudentID(student.StudentID);
                                            openUpdate(student.StudentID);
                                        }}
                                    >
                                        <img
                                            src={`/photos/${student.StudentID}.png`}
                                            alt="Profile image"
                                            className="w-20 h-20 rounded-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = imagePath;
                                            }}
                                        />
                                        <div className="text-center mt-4">
                                            <div className="text-xl font-bold">{`${student.First_Name} ${student.Last_Name}`}</div>
                                            <div className="mt-2">{renderTags(Number(student.Tags))}</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                <strong>Hours:</strong> {student.TotalHours?.toFixed(2) ?? "0.00"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        );
    };


    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const cookies = parseCookies();
        setRole(cookies.role);  // Get the role from the cookie
    }, []);



    const router = useRouter();
    useEffect(() => {
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='));

        if (!token) {
            router.push('/login');  // Redirect to /login if no authToken
        }
    }, [router]);

    const register = async () => {
        if (admin || supervisor) {
            if (!password || !confirmPassword) {
                alert("Both password fields are required for Admin or Supervisor!");
                return;
            } else if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
        }
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

        if (admin || supervisor) {
            const passRes = await fetch(`${baseApiUrl}db`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({StudentID, Password: password, mode: 'registerPwd'}),
            });

            if (passRes.ok) {
                console.log('Added Password', tags);
                setShowModal(false);
            } else {
                const data = await passRes.json();
                console.error('Failed to add password: ' + (data.message || 'Unknown error'));
            }
        }
        
        clearForm(); // Clear the form fields after registration or update
        setStudentID(""); // Clear the StudentID field
    }

    const fetchStudents = async () => {
        const params = new URLSearchParams({
            database: "database.db",
            mode: "all_logged_in",
        });

        const res = await fetch(`${baseApiUrl}db?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (res.ok) {
            const data = await res.json();
            setLoggedInStudents(data.users || []);
        } else {
            console.error('Failed to fetch logged-in students');
        }
    };

    const handleLogout = async (studentID: string, studentName: string) => {
        const confirmLogout = window.confirm(`Are you sure you want to log out ${studentName}?`);
        if (!confirmLogout) return;

        const res = await fetch(`${baseApiUrl}db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ StudentID: Number(studentID), mode: "logout" }),
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Completed log:", data.log);
        } else {
            console.error("Failed to finish log");
        }

        fetchStudents();
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhoto(e.target.files[0]);
        }
    };

    const handlePhotoUpload = async () => {
        if (!photo) {
            alert("Please select a file first.");
            return;
        }

        const isZipFile = photo.name.endsWith(".zip");
        const formData = new FormData();
        formData.append(isZipFile ? 'file' : 'image', photo); // Adjust field name based on file type

        try {
            const res = await fetch(`${baseApiUrl}upload-photo`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (isZipFile) {
                    alert(`Zip file uploaded successfully! Extracted ${data.imagesUploaded} images.`);
                } else {
                    alert(`Photo uploaded successfully! URL: ${data.imageUrl}`);
                }
            } else {
                const data = await res.json();
                alert(`Failed to upload file: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error uploading file');
        }
    };


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

    const handleDownloadMajor = async () => {
        setIsDownloading(true);
        try {
            // Fetch the CSV export link from the API
            const response = await fetch(`${baseApiUrl}export?major=true`);
            const data = await response.json();

            if (response.ok && data.downloadUrl) {
                // Create a link and trigger download
                const link = document.createElement("a");
                link.href = data.downloadUrl;
                link.setAttribute("download", "major_stats.csv");
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

        setIsUploading(true); // 🔒 Disable upload button

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
            } else {
                setUploadMessage("Error importing file.");
                console.error("Error importing file.");
            }
        } catch (error) {
            setUploadMessage("Error uploading file.");
            console.error("Error uploading file:", error);
        } finally {
            setIsUploading(false); // 🔓 Re-enable after completion
        }
    };

    useEffect(() => {
        // Make a fetch request to the API route
        async function fetchData() {
            const res = await fetch(`${baseApiUrl}db`);
            if (res.ok) {
                // const data = await res.json();
                //console.log('User Database Content:', data.users); // Logs the users data to the console
                //console.log('Logs Database Content:', data.logs); // Logs the logs data to the console
            } else {
                console.error('Failed to fetch data');
            }
        }

        async function createTable() {
            try {
                const res = await fetch(`${baseApiUrl}db`, { method: 'GET' });
                if (res.ok) {
                    // const data = await res.json();
                    //console.log('Database initialized:', data);
                } else {
                    console.error('Failed to initialize database');
                }
            } catch (error) {
                console.error('Error creating database:', error);
            }
        }

        createTable();
        fetchData();
    }, []); // ✅ Prevents infinite re-renders



    const openRegister = () => {
        if (!StudentID) return alert("Enter a Student ID first!");
        clearForm(); // clears all fields
        setFormMode('register');
        setShowModal(true);
    };

    const openUpdateClick = async () => {
        if (!StudentID) return alert("Enter a Student ID first!");
        openUpdate(StudentID);
    };

    const openUpdate = async (StudentID: string) => {
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

            const tags = Number(user.Tags ?? 0);  // Ensure it's a number
            setWhite((tags & 0b1) !== 0);
            setBlue((tags & 0b10) !== 0);
            setGreen((tags & 0b100) !== 0);
            setOrange((tags & 0b1000) !== 0);
            setAdmin((tags & 0b10000) !== 0);
            setSupervisor((tags & 0b100000) !== 0);

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
        setPassword("");
        setConfirmPassword("");
    };

    useEffect(() => {
        if (viewStudents) {
            (async () => {
                await fetchStudents();
            })();
        }
    }, [viewStudents, fetchStudents]);

    return (
        <div className="flex min-h-screen flex-col">
            {viewStudents && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    {/* Modal content */}
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
                        {/* Exit button inside the modal */}
                        <button
                            onClick={() => setViewStudents(false)}
                            className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded z-10">
                            Exit
                        </button>
                        <h2 className="text-xl font-bold">{"Logged in Students"}</h2>
                        <div className="overflow-y-auto max-h-96">
                            {loggedInStudents.length === 0 ? (
                                <p>No students currently logged in.</p>
                            ) : (
                                loggedInStudents.map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border-b">
                                        <div>
                                            <strong>{student.First_Name} {student.Last_Name}</strong>
                                        </div>
                                        <div>
                                            <strong>Student ID:</strong> {student.StudentID}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => handleLogout(student.StudentID, student.First_Name)}
                                                className="px-4 py-2 bg-red-500 text-white rounded">
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">{formMode === 'register' ? "Register User" : "Update User"}</h2>
                        <input type="text" placeholder="First Name" value={firstName}
                               onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded"/>
                        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded" />
                        {(admin || supervisor) && (
                            <>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <label><input type="checkbox" checked={white} onChange={() => setWhite(!white)} /> White</label>
                            <label><input type="checkbox" checked={blue} onChange={() => setBlue(!blue)} /> Blue</label>
                            <label><input type="checkbox" checked={green} onChange={() => setGreen(!green)} /> Green</label>
                            <label><input type="checkbox" checked={orange} onChange={() => setOrange(!orange)} /> Orange</label>
                            <label><input type="checkbox" checked={admin} onChange={() => setAdmin(!admin)} /> Admin</label>
                            <label><input type="checkbox" checked={supervisor} onChange={() => setSupervisor(!supervisor)} /> Supervisor</label>
                        </div>
                        <div className="flex justify-between">
                            <button onClick={() => {setShowModal(false);clearForm();setStudentID("");}} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
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

            {/* Tab Navigation */}
            <div className="flex justify-left bg-gray-200 p-1">
                <button
                    onClick={() => handleTabChange('dashboard')}
                    className={`px-6 py-2 rounded-t-lg ${activeTab === 'dashboard' ? 'bg-white font-bold' : 'bg-gray-300'}`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => handleTabChange('search')}
                    className={`px-6 py-2 rounded-t-lg ${activeTab === 'search' ? 'bg-white font-bold' : 'bg-gray-300'}`}
                >
                    Student Search
                </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex flex-col items-start justify-start min-h-screen p-8 sm:p-10 bg-gray-100 space-y-4">
                {activeTab === 'dashboard' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Dashboard</h2>
                        <p>Welcome to the EIS Dashboard! Here you can manage users.</p>
                <input
                    type="text"
                    placeholder="Enter User ID"
                    value={StudentID}
                    onChange={(e) => setStudentID(e.target.value)}
                    className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {role === 'admin' && <button
                        //className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={openRegister} className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Register User
                    </button>}
                    <button
                        //className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={openUpdateClick} className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Update User
                    </button>
                    <button onClick={() => setViewStudents(true)} className="bg-blue-500 text-white px-4 py-2 rounded">
                        View Logged in Students
                    </button>

                </div>

                {/* File Upload Section */}
                {role === "admin" && (<div className="mt-6">
                    <input
                            type="file"
                            onChange={handleFileChange}
                            className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                        <button
                            className="mt-3 px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition disabled:opacity-50"
                            onClick={handleFileUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Upload CSV"}
                        </button>
                        {uploadMessage && <p className="mt-2 text-sm">{uploadMessage}</p>}
                </div>
                )}
                {/* Photo Upload Section */}
                {role==="admin" && (<div className="mt-6">
                        <input
                            type="file"
                            onChange={handlePhotoChange}
                            className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            className="mt-3 px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                            onClick={handlePhotoUpload}
                        >
                            Upload Photos
                        </button>
                        {uploadMessage && <p className="mt-2 text-sm">{uploadMessage}</p>}
                    </div>
                )}
                {role === "admin" && (<button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="mt-6 px-6 py-3 bg-green-500 text-white text-lg rounded-md hover:bg-green-600 transition disabled:opacity-50"
                >
                    {isDownloading ? "Downloading..." : "Download Logs"}
                </button>)}
                <button
                    onClick={handleDownloadMajor}
                    disabled={isDownloading}
                    className="mt-6 px-6 py-3 bg-green-500 text-white text-lg rounded-md hover:bg-green-600 transition disabled:opacity-50"
                >
                    {isDownloading ? "Downloading..." : "Download Major Report"}
                    </button>
                </div>
                )}

                {/* Search Tab Content */}
                {activeTab === 'search' && (
                    <div className="w-full max-w-[90vw]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch();
                                setCurrentPage(1); // Reset to the first page on search
                            }}
                            className="flex items-center w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 mb-4"
                        >
                            <input
                                type="text"
                                placeholder="Search for Student"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-grow p-3 text-lg focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition"
                            >
                                Search
                            </button>
                        </form>
                        <div>
                            {renderCards(searchResults)}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
