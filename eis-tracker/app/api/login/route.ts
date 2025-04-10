import { NextResponse } from "next/server";
import { serialize } from "cookie";
import Database from "better-sqlite3";

export async function POST(req: Request) {
    const { id, pass } = await req.json();

    const db = new Database("database/database.db");

    const record = db.prepare("SELECT Password FROM passwords WHERE ID = ?").get(id);

    if (!record) {
        return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // Simple authentication check (Replace with real logic)
    // @ts-expect-error
    if (record.Password === pass) {
        const headers = new Headers();
        headers.append(
            "Set-Cookie",
            serialize("authToken", "logged-in", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60*60*24,
            })
        );

        return new NextResponse(JSON.stringify({ message: "Logged in" }), { status: 200, headers });
    }

    return new NextResponse(JSON.stringify({ message: "Invalid credentials" }), { status: 401 });
}
