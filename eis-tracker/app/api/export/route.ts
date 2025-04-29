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
export async function GET(req: Request) {
    try {
        const db = new Database("database/database.db");

        // Check if the query string includes ?major=true
        const url = new URL(req.url);
        const isMajorExport = url.searchParams.get("major") === "true";

        let csvContent = `\uFEFF`; // Add BOM for Excel

        if (isMajorExport) {
            // Export lab usage stats grouped by major
            const stats = db.prepare(`
                    SELECT 
                        u.Major,
                        COUNT(l.LogID) AS Total_Visits,
                        SUM((l.Time_Out - l.Time_In) / 1000) AS Total_Seconds
                    FROM logs l
                    JOIN users u ON l.User = u.StudentID
                    WHERE u.Major IS NOT NULL
                    GROUP BY u.Major
                    ORDER BY Total_Visits DESC
                `).all() as Array<{
                Major: string | null;
                Total_Visits: number;
                Total_Seconds: number | null;
            }>;

            // Define the CSV header for major stats
            csvContent += `"Major","Total Visits","Total Time (Seconds)"\n`;

            // Iterate over the stats and add them to the CSV
            stats.forEach((stat) => {
                csvContent += `${formatValue(stat.Major)},${formatValue(stat.Total_Visits)},${formatValue(stat.Total_Seconds ?? 0)}\n`;
            });

        } else {
            // Default: export all logs
            const logs = db.prepare(`
                SELECT 
                    l.LogID, 
                    l.User AS StudentID, 
                    l.Time_In, 
                    l.Time_Out, 
                    u.Major,
                    u.Other
                FROM logs l
                JOIN users u ON l.User = u.StudentID
            `).all() as Array<{
                LogID: number;
                StudentID: number;
                Time_In: number | null;
                Time_Out: number | null;
                Major: string | null;
                Other: string | null;
            }>;

            csvContent += `"LogID","StudentID","Time_In","Time_Out","Major","Other"\n`;

            logs.forEach(log => {
                csvContent += `${formatValue(log.LogID)},${formatValue(log.StudentID)},${formatDate(log.Time_In)},${formatDate(log.Time_Out)},${formatValue(log.Major)},${formatValue(log.Other)}\n`;
            });
        }

        // File name based on export type
        const fileName = isMajorExport ? "major_stats.csv" : "logs.csv";
        const filePath = path.join(process.cwd(), "public", fileName);

        writeFileSync(filePath, csvContent, { encoding: "utf-8" });
        db.close();

        return NextResponse.json({
            message: "CSV export successful!",
            downloadUrl: `/s25-sis/${fileName}`
        });

    } catch (error) {
        console.error("Error exporting logs:", error);
        return NextResponse.json({ message: "Failed to export logs" }, { status: 500 });
    }
}
