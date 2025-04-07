"use client";

import React, { useEffect, useState } from "react";

interface Student {
    StudentID: string;
    First_Name: string;
    Tags: string;
    Logged_In: boolean;
}

export default function Dashboard() {
    const [loggedInStudents, setLoggedInStudents] = useState<Student[]>([]);

    const imagePath = `/blankimage.png`;

    // Helper function to render colored tag boxes
    const renderTags = (tags: number) => {
        const tagElements = [];
        if (tags & 1) {
            tagElements.push(
                <div key="white" className="w-6 h-6 bg-white border rounded mr-1" title="White" />
            );
        }
        if (tags & 2) {
            tagElements.push(
                <div key="blue" className="w-6 h-6 bg-blue-500 border rounded mr-1" title="Blue" />
            );
        }
        if (tags & 4) {
            tagElements.push(
                <div key="green" className="w-6 h-6 bg-green-500 border rounded mr-1" title="Green" />
            );
        }
        if (tags & 8) {
            tagElements.push(
                <div key="orange" className="w-6 h-6 bg-orange-500 border rounded mr-1" title="Orange" />
            );
        }
        return <div className="flex">{tagElements}</div>;
    };

    // Fetch logged-in students from the API
    const fetchStudents = async () => {
        const res = await fetch('/s25-sis/api/db');
        if (res.ok) {
            const data = await res.json();
            setLoggedInStudents(data.users || []);
        } else {
            console.error('Failed to fetch logged-in students');
        }
    };

    // Auto-update the list every 5 seconds
    useEffect(() => {
        fetchStudents();
        const interval = setInterval(fetchStudents, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
            <h2 className="text-2xl font-bold mb-4">Currently Logged In</h2>
            <ul className="w-full max-w-2xl">
                {loggedInStudents.filter(student => student.Logged_In).map(student => (
                    <li key={student.StudentID} className="flex items-center space-x-4 border p-4 rounded shadow-md mb-2">
                        <img
                            src={imagePath}
                            alt={`${student.First_Name}'s Profile`}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <strong>First Name:</strong> {student.First_Name}
                        </div>
                        <div>
                            <strong>Tags:</strong>
                            {renderTags(parseInt(student.Tags))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}