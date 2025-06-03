'use client';

import React from "react";

export default function Page() {
    const [id, setId] = React.useState<string>("");
    const [pass, setPass] = React.useState<string>("");
    const [errorMsg, setErrorMsg] = React.useState<string>("");
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
            setErrorMsg(""); // Clear any previous error
            window.location.href = link;
        } else {
            setErrorMsg("Invalid credentials");
            setPass(""); // clear the password field
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100">
            {errorMsg && (
                <div className="mb-4 text-red-600 bg-red-100 border border-red-400 px-4 py-2 rounded">
                    {errorMsg}
                </div>
            )}
            <h1 className="text-2xl font-bold mb-4">Enter Admin ID and Password to Login</h1>
            <div className="flex flex-col gap-4 items-center">
                <input
                    type="text"
                    placeholder="Enter Admin ID"
                    value={id}
                    onChange={(e) => {
                        setId(e.target.value);
                        setErrorMsg(""); // clear the red error when typing again
                    }}
                    className="p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={pass}
                    onChange={(e) => {
                        setPass(e.target.value);
                        setErrorMsg(""); // clear the red error when typing again
                    }}
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