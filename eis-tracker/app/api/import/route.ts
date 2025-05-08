import {NextRequest, NextResponse} from 'next/server';
import csv from 'csv-parser';
import Database from 'better-sqlite3';
import { Readable } from 'stream';

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

// Disable Next.js's default body parsing for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

const extractDataFromBuffer = async (buffer: ArrayBuffer): Promise<StudentData[]> => {
    const results: StudentData[] = [];
    let firstRowProcessed = false;

    return new Promise((resolve, reject) => {
        const stream = Readable.from(Buffer.from(buffer)).pipe(csv());

        stream
            .on('headers', (headers) => {
                console.log("📝 CSV Headers:", headers);
            })
            .on('data', (row: { [key: string]: string }) => {
                console.log("🔎 Raw CSV row:", row);

                if (!firstRowProcessed) {
                    firstRowProcessed = true;
                    return;
                }

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

// ✅ Add this type guard below your CSV parser function:
function isFile(value: unknown): value is File {
    return value instanceof File;
}

// Handle the POST request for file upload and CSV processing
export async function POST(req: Request) {
    console.log("📥 Received POST /api/import request");

    let formData: FormData;
    try {
        formData = await req.formData();
    } catch (e) {
        console.error("❌ Failed to parse FormData from request");
        console.error("Error:", e);
        return new Response(JSON.stringify({message: 'Failed to parse upload'}), {status: 400});
    }

    const file = formData.get('file');
    console.log("📥 FormData received. file field type:", typeof file);

    if (!isFile(file)) {
        console.error("❌ Uploaded entry is not a File object:", file);
        return new Response(JSON.stringify({message: 'Invalid file upload'}), {status: 400});
    }

    console.log("📁 Uploaded file name:", file.name);
    console.log("📁 File MIME type:", file.type);
    console.log("📁 File size:", file.size, "bytes");

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        console.error("❌ File is not a valid CSV. Detected type:", file.type);
        return new Response(JSON.stringify({message: 'Only CSV files are accepted'}), {status: 415});
    }

    let buffer: ArrayBuffer;
    try {
        buffer = await file.arrayBuffer();
        console.log("📦 Converted file to ArrayBuffer, size:", buffer.byteLength);
        const textPreview = Buffer.from(buffer).toString('utf-8').slice(0, 500);
        console.log("📄 File content preview (first 500 chars):", textPreview);
    } catch (e) {
        console.error("❌ Failed to convert uploaded file to buffer");
        console.error("Error:", e);
        return new Response(JSON.stringify({message: 'Failed to read file buffer'}), {status: 500});
    }

    try {
        const data = await extractDataFromBuffer(buffer);
        console.log("✅ Extracted", data.length, "students from CSV");

        let db;
        try {
            db = new Database('database/database.db');
            console.log("📂 Connected to database");
        } catch (dbErr: unknown) {
            if (dbErr instanceof Error) {
                console.error("❌ Failed to connect to database");
                console.error("Error message:", dbErr.message);
                console.error("Stack trace:", dbErr.stack);
            } else {
                console.error("❌ DB error (non-standard):", dbErr);
            }
            return new Response(JSON.stringify({message: 'Database connection error'}), {status: 500});
        }

        let added = 0, skipped = 0, updated = 0;

        for (const student of data) {
            try {
                console.log(`🔍 Checking student ${student.StudentID} (${student.firstName} ${student.lastName})`);
                if (!student.StudentID || !student.firstName || !student.lastName) {
                    console.warn("⚠️ Skipping invalid row:", student);
                    skipped++;
                    continue;
                }

                const existing = db.prepare('SELECT * FROM users WHERE StudentID = ?').get(student.StudentID) as {
                    WhiteTag: number;
                    BlueTag: number;
                    GreenTag: number;
                    OrangeTag: number;
                } | undefined;

                const newWhite = student.whiteTag ? 1 : 0;
                const newBlue = student.blueTag ? 1 : 0;
                const newGreen = student.greenTag ? 1 : 0;
                const newOrange = student.orangeTag ? 1 : 0;

                if (!existing) {
                    db.prepare(`
                        INSERT INTO users (StudentID, First_Name, Last_Name, WhiteTag, BlueTag, GreenTag, OrangeTag)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        student.StudentID,
                        student.firstName,
                        student.lastName,
                        newWhite,
                        newBlue,
                        newGreen,
                        newOrange
                    );
                    added++;
                    console.log("🆕 Inserted new student:", student.StudentID);
                } else {
                    if (
                        existing.WhiteTag !== newWhite ||
                        existing.BlueTag !== newBlue ||
                        existing.GreenTag !== newGreen ||
                        existing.OrangeTag !== newOrange
                    ) {
                        db.prepare(`
                            UPDATE users
                            SET WhiteTag  = ?,
                                BlueTag   = ?,
                                GreenTag  = ?,
                                OrangeTag = ?
                            WHERE StudentID = ?
                        `).run(newWhite, newBlue, newGreen, newOrange, student.StudentID);
                        updated++;
                        console.log("♻️ Updated student:", student.StudentID);
                    } else {
                        skipped++;
                        console.log("⏭️ Skipped student (no changes):", student.StudentID);
                    }
                }
            } catch (rowErr) {
                console.error("❌ Error processing individual student row:", student, rowErr);
                skipped++;
            }
        }

        console.log(`📊 Import Summary — Total rows: ${data.length}, Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
        return new Response(JSON.stringify({message: 'Import complete', added, updated, skipped}), {status: 200});

    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error("❌ [IMPORT] Unexpected failure during CSV processing");
            console.error("Error message:", e.message);
            console.error("Stack trace:", e.stack);
            return new Response(JSON.stringify({
                message: 'Server error during CSV import',
                error: e.message
            }), {status: 500});
        } else {
            console.error("❌ Unknown error during CSV import:", e);
            return new Response(JSON.stringify({
                message: 'Server error during CSV import',
                error: 'Unknown error'
            }), {status: 500});
        }
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