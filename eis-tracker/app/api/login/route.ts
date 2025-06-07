import { NextResponse } from "next/server";
import { serialize } from "cookie";
//import Database from "better-sqlite3";

export async function POST(req: Request) {
    const baseApiUrl = `${process.env.REACT_APP_API_ROOT ??  'http://localhost:3000/s25-sis/api/'}`;

    const { id, pass } = await req.json();

    const init = await fetch(`${baseApiUrl}db`, { method: "GET" });
    if (init.ok) {
            const data = await init.json();
        } else {
            console.error("Failed to initialize database");
        }



    const params = new URLSearchParams({
        database: "database.db",
        mode: "password",
        ID: id,
        password: pass
    });
    const res = await fetch(`${baseApiUrl}db?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!res.ok){
        return res;
    }




    // Simple authentication check (Replace with real logic)
    
        const headers = new Headers();
        headers.append(
            "Set-Cookie",
            serialize("authToken", "logged-in", {
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60*60*24,
            })
        );

        const newParams = new URLSearchParams({
            database: "database.db",
            mode: "user",
            StudentID: id,
        });

        const tagRes = await fetch(`${baseApiUrl}db?${newParams.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!tagRes.ok) {
            return NextResponse.json({ message: "User not found" }, { status: 401 });
        }
        const data = await tagRes.json();
        const tags = parseInt(data.user.Tags, 10) || 0;

        //const isSupervisor = (tags & 0b100000) !== 0;
        const isAdmin = (tags & 0b10000) !== 0;

        let role = "supervisor";
        if (isAdmin) {
            role = "admin";
        }
        // if (isSupervisor) {
        //     role = "supervisor";
        // }

        headers.append(
            "Set-Cookie",
            serialize("role", role, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60*60*24,
            })
        );

        return new NextResponse(JSON.stringify({ message: "Logged in" }), { status: 200, headers });


    return new NextResponse(JSON.stringify({ message: "Invalid credentials" }), { status: 401 });
}
