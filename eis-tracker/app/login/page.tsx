'use client';

import React from "react";

export default function Page() {
    const [id, setId] = React.useState<string>("");
    const [pass, setPass] = React.useState<string>("");
    const baseApiUrl = process.env.API_URL_ROOT ?? "/s25-sis/api/";



    const handleLogin = async (e: React.FormEvent, link: string) => {
        e.preventDefault();

        console.log(id);

        const response = await fetch(`${baseApiUrl}login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, pass }),
        });

        if (response.ok) {
            window.location.href = link; // Redirect after login
        } else {
            console.error("Invalid credentials");
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Enter Admin ID and Password to Login</h1>
            <div className="flex flex-col gap-4 items-center">
                <input
                    type="text"
                    placeholder="Enter Admin ID"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <h3 className="text-2xl font-bold mb-4">Log in to:</h3>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={(e) => handleLogin(e, "/s25-sis")}
                    >
                        Home
                    </button>

                    <button
                        className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={(e) => handleLogin(e, 'admin')}

                    >
                        Admin
                    </button>

                    <button
                        className="px-6 py-3 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600 transition"
                        onClick={(e) => handleLogin(e, "display")}
                    >
                        Display
                    </button>
                </div>
            </div>
        </div>

    );
}