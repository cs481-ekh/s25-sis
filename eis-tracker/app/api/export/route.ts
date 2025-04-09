import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import path from "path";

/**
 * Converts a timestamp (milliseconds) to a human-readable format.
 * Wraps values in double quotes to prevent Excel from auto-formatting.
 */
const formatValue = (value: string | number | null | undefined) => `"${value !== null ? value : "N/A"}"`; 
const formatDate = (timestamp: number | null) => `"${timestamp ? new Date(timestamp).toLocaleString() : "N/A"}"`;

/**
 * Handles GET requests to export logs from the database as a CSV file.
 */
export async function GET() {
    try {
        // Connect to the SQLite database
        const db = new Database("database/database.db");

        // Fetch all logs from the database with correct type definition
        const logs = db.prepare("SELECT LogID, User AS StudentID, Time_In, Time_Out FROM logs").all() as Array<{
            LogID: number;
            StudentID: number;
            Time_In: number | null;
            Time_Out: number | null;
        }>;

        // Add BOM (Byte Order Mark) to fix Excel auto-formatting issues
        let csvContent = `\uFEFF"LogID","StudentID","Time_In","Time_Out"\n`; // CSV Header with BOM

        logs.forEach(log => {
            csvContent += `${formatValue(log.LogID)},${formatValue(log.StudentID)},${formatDate(log.Time_In)},${formatDate(log.Time_Out)}\n`;
        });

        // Define the file path to save the CSV
        const filePath = path.join(process.cwd(), "public", "logs.csv");

        // Save the CSV file with UTF-8 encoding
        writeFileSync(filePath, csvContent, { encoding: "utf-8" });

        // Close the database connection
        db.close();

        // Return a download link
        return NextResponse.json({ message: "Logs exported successfully!", downloadUrl: "/s25-sis/logs.csv" });

    } catch (error) {
        console.error("Error exporting logs:", error);
        return NextResponse.json({ message: "Failed to export logs" }, { status: 500 });
    }
}
