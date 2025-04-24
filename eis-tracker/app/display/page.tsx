"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
    StudentID: string;
    First_Name: string;
    Tags: string;
    Logged_In: boolean;
}

export default function Dashboard() {
    const [loggedInStudents, setLoggedInStudents] = useState<Student[]>([]);

    const imagePath = `/s25-sis/blankimage.png`;
    const baseApiUrl = process.env.API_URL_ROOT ?? "/s25-sis/api/";

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

    // Auto-update the list every 5 seconds
    useEffect(() => {
        fetchStudents();
        const interval = setInterval(fetchStudents, 5000);
        return () => clearInterval(interval);
    }, []);
    const supervisors = loggedInStudents.filter(
        s => s.Logged_In && (parseInt(s.Tags, 10) & 0b100000)
    );

    const students = loggedInStudents.filter(
        s => s.Logged_In && !(parseInt(s.Tags, 10) & 0b100000)
    );

    const renderCards = (list: Student[]) =>
        list
            .sort((a, b) => a.First_Name.localeCompare(b.First_Name))
            .map(student => {
                const tags = parseInt(student.Tags, 10);
                console.log(`StudentID: ${student.StudentID}, Name: ${student.First_Name}, Tags (decimal): ${tags}, Tags (binary): ${tags.toString(2)}`
                );
                return(
                <div key={student.StudentID}
                     className="flex flex-col items-center border p-8 rounded shadow-md bg-gray-50 transition-transform duration-300 hover:scale-105">
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
                        <div className="text-xl font-bold">{student.First_Name}</div>
                        <div className="mt-2 scale-125">{renderTags(parseInt(student.Tags))}</div>
                    </div>
                </div>
                )});

    return (
        <div className="flex min-h-screen flex-col">
            <nav className="bg-blue-500 p-4 flex items-center">
                <img src="/s25-sis/logo.png" alt="EIS Logo" className="h-8 mr-4" />
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-white text-2xl font-bold">EIS Dashboard</h1>
                    <Link href="/login" className="text-white text-lg hover:underline">Back to Login</Link>
                </div>
            </nav>
            <div className="flex flex-col items-center justify-center p-12 bg-white min-h-screen space-y-12">
                <div className="w-full max-w-[90vw]">
                    <h2 className="text-2xl font-bold mb-4 text-center">Current Supervisors</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                        {renderCards(supervisors)}
                    </div>
                </div>
                <div className="w-full max-w-[90vw]">
                    <h2 className="text-2xl font-bold mb-4 text-center">Currently Logged In Students</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                        {renderCards(students)}
                    </div>
                </div>
            </div>
        </div>
    );
}