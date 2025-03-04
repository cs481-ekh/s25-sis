'use client';

import React, {useState} from "react";

export default function Page() {
    const [StudentID, setStudentID] = useState("");
    const [name, setName] = useState("");
    const [white, setWhite] = useState(false);
    const [blue, setBlue] = useState(false);
    const [green, setGreen] = useState(false);
    const [orange, setOrange] = useState(false);
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
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <button
                    className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                >
                    Register User
                </button>
                <button
                    className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                >
                    Update User
                </button>
            </div>

        </div>

    )
}