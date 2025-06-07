"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
    StudentID: string;
    First_Name: string;
    Last_Name: string;
    Tags: number;
    Logged_In: boolean;
    TotalHours?: number;
    PhotoBase64?: string;
}

export default function Dashboard() {
    const [admins, setAdmins] = useState<Student[]>([]);
    const [supervisors, setSupervisors] = useState<Student[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

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
            setAdmins(data.admins || []);
            setSupervisors(data.supervisors || []);
            setStudents(data.students || []);
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

    const renderCards = (list: Student[]) =>
        list
            .sort((a, b) => a.First_Name.localeCompare(b.First_Name))
            .map(student => {
                const isAdmin = (student.Tags & 0b10000) !== 0;
                const isSupervisor = (student.Tags & 0b100000) !== 0;

                let borderColor = "border border-gray-300 shadow-sm";
                if (isAdmin) borderColor = "border border-purple-500 shadow-purple-300";
                else if (isSupervisor) borderColor = "border border-yellow-400 shadow-yellow-300";
                return(
                    <div key={student.StudentID}
                         className={`flex flex-col items-center p-8 rounded bg-gray-50 transition-transform duration-300 hover:scale-105 ${borderColor}`}>
                        <img
                            src={student.PhotoBase64
                                ? `data:image/jpeg;base64,${student.PhotoBase64}`
                                : imagePath}
                            alt="Profile image"
                            className={`w-20 h-20 rounded-full object-cover border-4 ${
                                isAdmin ? "border-purple-500" : isSupervisor ? "border-yellow-400" : "border-gray-300"
                            }`}
                        />
                        <div className="flex flex-col items-center text-center mt-4 space-y-1">
                            <div className="text-xl font-bold">{student.First_Name} {student.Last_Name}</div>
                            {student.StudentID === "999999999" && (
                                <div className="text-xs font-semibold text-purple-600">Admin</div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">Tags:</span>
                                {renderTags(student.Tags)}
                            </div>
                            <div className="text-sm text-gray-600">
                                <strong>Hours:</strong> {student.TotalHours ?? "0.00"}
                            </div>
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
            <div className="flex flex-col items-center p-5 bg-white min-h-screen space-y-12">
                {(admins.length > 0 || supervisors.length > 0) && (
                    <div className="w-full max-w-[90vw]">
                        <h2 className="text-2xl font-bold mb-4 text-center">Supervisors</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                            {renderCards([...admins, ...supervisors])}
                        </div>
                    </div>
                )}

                {students.length > 0 && (
                    <div className="w-full max-w-[90vw]">
                        <h2 className="text-2xl font-bold mb-4 text-center">Students</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                            {renderCards(students)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}