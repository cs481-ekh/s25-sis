import {NextRequest, NextResponse} from 'next/server';
import * as fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
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

// Function to extract relevant data from CSV
const extractDataFromCSV = async (filePath: string): Promise<StudentData[]> => {
    const results: StudentData[] = [];
    let firstRowProcessed = false;

    // Using a Promise wrapper around the stream process
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath).pipe(csv());

        stream
            .on('data', (row: { [key: string]: string }) => {
                if (!firstRowProcessed) {
                    firstRowProcessed = true;
                    return; // Skip the first row
                }

                if (row['Student'] === 'Student, Test') {
                    return; // Skip the test student row
                }

                const fullName = row['Student'];
                const [lastName, firstName] = fullName.split(',').map((name: string) => name.trim());

                const studentData: StudentData = {
                    firstName: firstName || '',
                    lastName: lastName || '',
                    StudentID: row['SIS User ID'] || '',
                    blueTag: Number(row['BLUE TAG  (228139)']) === 1,
                    greenTag: Number(row['GREEN TAG (293966)']) === 100,
                    orangeTag: Number(row['ORANGE TAG (294239)']) === 100,
                    whiteTag: Number(row['Training Affirmation (Required)  (228040)']) === 100,
                };

                results.push(studentData);
            })
            .on('end', () => {
                results.pop(); // Remove the last test student
                resolve(results); // Resolve the promise with the final results
            })
            .on('error', (err) => {
                reject(err); // Reject the promise in case of error
            });
    });
};

const extractDataFromBuffer = async (buffer: ArrayBuffer): Promise<StudentData[]> => {
    const results: StudentData[] = [];
    let firstRowProcessed = false;

    return new Promise((resolve, reject) => {
        const stream = Readable.from(Buffer.from(buffer)).pipe(csv());

        stream
            .on('data', (row: { [key: string]: string }) => {
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

// Handle the POST request for file upload and CSV processing
export async function POST(req: Request) {

    const formData = await req.formData();
    const file = formData.get('file');
    console.log("form data", formData, file);
    if (!file) {
        return new Response(JSON.stringify({message: 'Bad upload'}), {status: 500});
    }

    if (!(file instanceof File)) {
        return new Response(JSON.stringify({message: 'Invalid file upload'}), {status: 400});
    }

    const buffer = await file.arrayBuffer();

    try {
        const data = await extractDataFromBuffer(buffer);
        // Open the database connection
        const db = new Database('database/database.db');

        // Counters for success summary
        let added = 0;
        let skipped = 0;
        let updated = 0; // Count students whose training data was updated

        for (const student of data) {
            if (!student.StudentID || !student.firstName || !student.lastName) {
                console.warn(`Skipping invalid student entry:`, student);
                skipped++;
                continue;
            }

            const newWhite = student.whiteTag ? 1 : 0;
            const newBlue = student.blueTag ? 1 : 0;
            const newGreen = student.greenTag ? 1 : 0;
            const newOrange = student.orangeTag ? 1 : 0;

// Check if student already exists
            const existing = db.prepare('SELECT * FROM users WHERE StudentID = ?').get(student.StudentID) as {
                WhiteTag: number;
                BlueTag: number;
                GreenTag: number;
                OrangeTag: number;
            } | undefined;

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
            } else {
                const currentWhite = existing.WhiteTag ? 1 : 0;
                const currentBlue = existing.BlueTag ? 1 : 0;
                const currentGreen = existing.GreenTag ? 1 : 0;
                const currentOrange = existing.OrangeTag ? 1 : 0;

                if (
                    currentWhite !== newWhite ||
                    currentBlue !== newBlue ||
                    currentGreen !== newGreen ||
                    currentOrange !== newOrange
                ) {
                    db.prepare(`
            UPDATE users
            SET WhiteTag = ?, BlueTag = ?, GreenTag = ?, OrangeTag = ?
            WHERE StudentID = ?
        `).run(
                        newWhite,
                        newBlue,
                        newGreen,
                        newOrange,
                        student.StudentID
                    );
                    updated++;
                } else {
                    skipped++;
                }
            }
        }

        return new Response(JSON.stringify({
            message: 'CSV imported successfully',
            added,
            skipped,
            updated,
        }), {status: 200});
    } catch (error) {
        return new Response(JSON.stringify({message: 'Error processing the file', error}), {status: 500});

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
