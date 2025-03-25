import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req: Request) {
    const { id, pass } = await req.json();

    // Simple authentication check (Replace with real logic)
    if (id === "999999999" && pass === "admin123") {
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
