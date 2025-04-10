import {NextRequest, NextResponse} from 'next/server';
import * as fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import Database from 'better-sqlite3';

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

interface TrainingDataRow {
    StudentID: string;
    BlueTag: number;
    GreenTag: number;
    OrangeTag: number;
    WhiteTag: number;
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

// Handle the POST request for file upload and CSV processing
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

    const filePath = `./.tmp/${file.name}`;
    const buffer = await file.arrayBuffer();
    // await fs.promises.writeFile(filePath, Buffer.from(buffer));

    const dirPath = path.dirname(filePath);
    try {
        await fs.promises.access(dirPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            await fs.promises.mkdir(dirPath, {recursive: true});
        } else {
            throw error;
        }
    }
    await fs.promises.writeFile(filePath, Buffer.from(buffer));

    try {
        const data = await extractDataFromCSV(filePath);
        // Open the database connection
        const db = new Database('database/database.db');

        // Counters for success summary
        let added = 0;
        let skipped = 0;
        let updated = 0; // Count students whose training data was updated
        let insertedTraining = 0; // Count new training_data inserts separately

        for (const student of data) {
            if (!student.StudentID || !student.firstName || !student.lastName) {
                console.warn(`Skipping invalid student entry:`, student);
                skipped++;
                continue;
            }

            // Check if student already exists
            const existing = db.prepare('SELECT * FROM users WHERE StudentID = ?').get(student.StudentID);

            if (!existing) {
                db.prepare('INSERT INTO users (StudentID, First_Name, Last_Name) VALUES (?, ?, ?)').run(
                    student.StudentID,
                    student.firstName,
                    student.lastName
                );
                added++;
            } else {
                skipped++;
            }


            // First, calculate the new tag values from the CSV — do this BEFORE checking trainingExists
            const newBlue = student.blueTag ? 1 : 0;
            const newGreen = student.greenTag ? 1 : 0;
            const newOrange = student.orangeTag ? 1 : 0;
            const newWhite = student.whiteTag ? 1 : 0;
            // Now check if this student already has a training_data entry
            const trainingExists = db.prepare('SELECT * FROM training_data WHERE StudentID = ?').get(student.StudentID) as TrainingDataRow | undefined;

            if (!trainingExists) {
                db.prepare(`
                    INSERT INTO training_data (StudentID, BlueTag, GreenTag, OrangeTag, WhiteTag)
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    student.StudentID,
                    newBlue,
                    newGreen,
                    newOrange,
                    newWhite
                );
                insertedTraining++; // ✅ new training entry

            } else {
                const currentBlue = trainingExists.BlueTag == null ? 0 : Number(trainingExists.BlueTag);
                const currentGreen = trainingExists.GreenTag == null ? 0 : Number(trainingExists.GreenTag);
                const currentOrange = trainingExists.OrangeTag == null ? 0 : Number(trainingExists.OrangeTag);
                const currentWhite = trainingExists.WhiteTag == null ? 0 : Number(trainingExists.WhiteTag);

                if (
                    currentBlue !== newBlue ||
                    currentGreen !== newGreen ||
                    currentOrange !== newOrange ||
                    currentWhite !== newWhite
                ) {
                    db.prepare(`
                        UPDATE training_data
                        SET BlueTag   = ?,
                            GreenTag  = ?,
                            OrangeTag = ?,
                            WhiteTag  = ?
                        WHERE StudentID = ?
                    `).run(
                        newBlue,
                        newGreen,
                        newOrange,
                        newWhite,
                        student.StudentID
                    );
                    updated++; // ✅ only if values changed
                }
            }
        }
        try {
            if (true) { // Set to true to delete the file after processing
                await fs.promises.unlink(filePath); // Delete the file after processing
                await fs.promises.rm(dirPath, {recursive: true, force: true}); // Remove the directory if empty
            }
        } catch (err) {
            console.error('Error deleting file:', err);
        }
        return new Response(JSON.stringify({
            message: 'CSV imported successfully',
            added,
            skipped,
            updated,
            insertedTraining
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
