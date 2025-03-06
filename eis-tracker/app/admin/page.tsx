'use client';

import React, {useState} from "react";

export default function Page() {
    const [StudentID, setStudentID] = useState("");
    const [name, setName] = useState("");
    const [white, setWhite] = useState(false);
    const [blue, setBlue] = useState(false);
    const [green, setGreen] = useState(false);
    const [orange, setOrange] = useState(false);
    const [admin, setAdmin] = useState(false);

    const register = async () => {
        let res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name , StudentID, mode: 'register' }),
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Inserted User:', data.user);
        } else {
            console.error('Failed to insert user');
        }
        let tags = 0
        if (white) {tags |= 0b1}
        if (blue) {tags |= 0b10}
        if (green) {tags |= 0b100}
        if (orange) {tags |= 0b1000}
        if (admin) {tags |= 0b10000}

        res = await fetch('/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags, mode: 'edit_tags' }),
        });

        if (res.ok) {
            console.log('Updated Tags To', tags);
        } else {
            console.error('Failed to update tags');
        }
    }

    return (
        <div className="flex flex-col items-start justify-start min-h-screen p-8 sm:p-20 bg-gray-100 space-y-4">

            <input
                type="text"
                placeholder="Enter User ID"
                value={StudentID}
                onChange={(e) => setStudentID(e.target.value)}
                className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none"
            />
            <label>
                <input
                    type="checkbox"
                    checked={white}
                    onChange={() => setWhite(!white)}
                /> White Tag
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={blue}
                    onChange={() => setBlue(!blue)}
                /> Blue Tag
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={green}
                    onChange={() => setGreen(!green)}
                /> Green Tag
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={orange}
                    onChange={() => setOrange(!orange)}
                /> Orange Tag
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={admin}
                    onChange={() => setAdmin(!admin)}
                /> Admin User
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <button
                    className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                    onClick={() => register()}
                >
                    Register User
                </button>
                <button
                    className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                    onClick={() => register()}
                >
                    Update User
                </button>
            </div>

        </div>

    )
}