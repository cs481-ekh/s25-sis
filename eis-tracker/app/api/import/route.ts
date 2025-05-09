import {NextRequest, NextResponse} from 'next/server';
import csv from 'csv-parser';
import Database from 'better-sqlite3';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

// Define the structure of the data we're interested in
interface StudentData {
    firstName: string;
    lastName: string;
    StudentID: string;
    blueTag: boolean;
    greenTag: boolean;
    orangeTag: boolean;
    whiteTag: boolean;
}

export const runtime = 'nodejs';

// Disable Next.js's default body parsing for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

const extractDataFromBuffer = async (buffer: Buffer): Promise<StudentData[]> => {
    const results: StudentData[] = [];

    return new Promise((resolve, reject) => {
        const stream = Readable.from(buffer).pipe(csv({
            mapValues: ({ value }) => value.trim()
        }));
        stream
            .on('data', (row: { [key: string]: string }) => {
                if (row['Student'] === 'Student, Test') return;

                const fullName = row['Student'];
                const [lastName, firstName] = fullName.split(',').map((n: string) => n.trim());

                results.push({
                    firstName: firstName || '',
                    lastName: lastName || '',
                    StudentID: row['SIS User ID'] || '',
                    blueTag: Number(row['BLUE TAG  (228139)']) === 1,
                    greenTag: Number(row['GREEN TAG (293966)']) === 100,
                    orangeTag: Number(row['ORANGE TAG (294239)']) === 100,
                    whiteTag: Number(row['Training Affirmation (Required)  (228040)']) === 100,
                });
            })
            .on('end', () => {
                results.pop(); // Remove test student
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
};

// Handle the POST request for file upload and CSV processing
export async function POST(req: Request) {
    console.log("📥 Received POST /api/import request");
    const formData = await (req as NextRequest).formData();
    const file = formData.get('file');

    if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
        return new NextResponse(JSON.stringify({ message: 'No valid file uploaded' }), { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if ((file as Blob).size > MAX_FILE_SIZE) {
        return new NextResponse(JSON.stringify({
            message: `CSV file is too large. Max allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB`
        }), { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        const data = await extractDataFromBuffer(buffer);
        console.log("✅ Extracted", data.length, "students from CSV");

        const db = new Database('database/database.db');
        db.pragma('journal_mode = WAL');
        db.exec(`CREATE INDEX IF NOT EXISTS idx_student_id ON users(StudentID);`);
        console.log("📂 Connected to database");

        // Fetch all existing users into memory for faster lookup
        const existingUsers = new Map<string, {
            WhiteTag: number;
            BlueTag: number;
            GreenTag: number;
            OrangeTag: number;
        }>();

        for (const row of db.prepare("SELECT StudentID, WhiteTag, BlueTag, GreenTag, OrangeTag FROM users").all() as {
            StudentID: string;
            WhiteTag: number;
            BlueTag: number;
            GreenTag: number;
            OrangeTag: number;
        }[]) {
            existingUsers.set(String(row.StudentID).trim(), row);
        }

        let added = 0, skipped = 0, updated = 0;

        const insertStmt = db.prepare(`
    INSERT INTO users (StudentID, First_Name, Last_Name, WhiteTag, BlueTag, GreenTag, OrangeTag)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);
        const updateStmt = db.prepare(`
    UPDATE users
    SET WhiteTag = ?, BlueTag = ?, GreenTag = ?, OrangeTag = ?
    WHERE StudentID = ?
`);
        const selectStmt = db.prepare(`SELECT * FROM users WHERE StudentID = ?`);

        const processBatch = db.transaction((batch: StudentData[]) => {
            for (const student of batch) {
                try {
                    if (!student.StudentID || !student.firstName || !student.lastName) {
                        console.warn("⚠️ Skipping invalid row:", student);
                        skipped++;
                        continue;
                    }

                    const existing = existingUsers.get(String(student.StudentID).trim());
                    const newWhite = student.whiteTag ? 1 : 0;
                    const newBlue = student.blueTag ? 1 : 0;
                    const newGreen = student.greenTag ? 1 : 0;
                    const newOrange = student.orangeTag ? 1 : 0;

                    if (!existing) {
                        insertStmt.run(
                            String(student.StudentID).trim(),
                            student.firstName,
                            student.lastName,
                            newWhite,
                            newBlue,
                            newGreen,
                            newOrange
                        );
                        existingUsers.set(String(student.StudentID).trim(), {
                            WhiteTag: newWhite,
                            BlueTag: newBlue,
                            GreenTag: newGreen,
                            OrangeTag: newOrange,
                        });
                        added++;
                        //console.log("🆕 Inserted new student:", student.StudentID);
                    } else if (
                        existing.WhiteTag !== newWhite ||
                        existing.BlueTag !== newBlue ||
                        existing.GreenTag !== newGreen ||
                        existing.OrangeTag !== newOrange
                    ) {
                        updateStmt.run(
                            newWhite,
                            newBlue,
                            newGreen,
                            newOrange,
                            student.StudentID
                        );
                        updated++;
                        //console.log("♻️ Updated student:", student.StudentID);
                    } else {
                        skipped++;
                        //console.log("⏭️ Skipped student (no changes):", student.StudentID);
                    }
                } catch (rowErr) {
                    console.error("❌ Error processing student:", student, rowErr);
                    skipped++;
                }
            }
        });

        const BATCH_SIZE = 500;
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            processBatch(batch);
        }

        db.close();
        console.log("🛑 Closed database connection");
        console.log(`📊 Import Summary — Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);

        return new NextResponse(JSON.stringify({ message: 'Import complete', added, updated, skipped }), { status: 200 });

    } catch (err: any) {
        console.error("❌ [IMPORT] Error during CSV handling");
        console.error(err);
        return new NextResponse(JSON.stringify({ message: 'Failed to process CSV', error: err.message }), { status: 500 });
    }
}

// Handle other HTTP methods (e.g., GET)
export async function GET(req: NextRequest) {
    try {
        const defaultData = {message: 'This is a GET request, no file uploaded yet.', request: req};
        return new NextResponse(JSON.stringify(defaultData), {status: 200});
    } catch (error) {
        return new NextResponse(JSON.stringify({message: 'Failed to handle GET request', error}), {status: 500});
    }
}