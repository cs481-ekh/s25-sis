import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

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
      .on('data', (row: any) => {
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
          blueTag: row['BLUE TAG  (228139)'] === '1',
          greenTag: !!row['GREEN TAG (293966)'] && !isNaN(Number(row['GREEN TAG (293966)'])),
          orangeTag: !!row['ORANGE TAG (294239)'] && !isNaN(Number(row['ORANGE TAG (294239)'])),
          whiteTag: row['Training Affirmation (Required)  (228040)'] === '100',
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
    return new Response(JSON.stringify({message: 'Bad upload'}), { status: 500 });
  }

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ message: 'Invalid file upload' }), { status: 400 });
  }

  const filePath = `./.tmp/${file.name}`;
  const buffer = await file.arrayBuffer();
  // await fs.promises.writeFile(filePath, Buffer.from(buffer));

  const dirPath = path.dirname(filePath);
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
  await fs.promises.writeFile(filePath, Buffer.from(buffer));

  try {
    const data = await extractDataFromCSV(filePath);
    try {
      if(true) { // Set to true to delete the file after processing
        await fs.promises.unlink(filePath); // Delete the file after processing
        await fs.promises.rmdir(dirPath, { recursive: true }); // Remove the directory if empty
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
    return new Response(JSON.stringify({data}), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({message: 'Error processing the file'}), { status: 500 });

  }
}

// Handle other HTTP methods (e.g., GET)
export async function GET(req: NextRequest) {
  try {
    const defaultData = { message: 'This is a GET request, no file uploaded yet.' };
    return new NextResponse(JSON.stringify(defaultData), { status: 200 });
  } catch (error) {
    return new NextResponse('Failed to handle GET request', { status: 500 });
  }
}
