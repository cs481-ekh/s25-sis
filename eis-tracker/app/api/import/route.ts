import { NextRequest, NextResponse } from 'next/server';
import formidable, { Fields, Files } from 'formidable';
import * as fs from 'fs';
import csv from 'csv-parser';
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
export async function POST(req: NextRequest) {
  // Create an incoming stream using req.body
  const form = formidable({
    keepExtensions: true,  // Keep original file extensions
    uploadDir: './tmp',    // Temporary directory for file upload
  });

  // Handle incoming request body as a stream
  const body = await req.arrayBuffer(); // Get the body as an array buffer (which is a stream)
  const bufferStream = Readable.from([body]); // Convert array buffer to a readable stream

  // Create a mock IncomingMessage object
  const mockReq = new Readable() as any;
  mockReq.headers = req.headers;
  mockReq.method = req.method;
  mockReq.url = req.url;
  mockReq._read = () => {}; // No-op _read implementation
  mockReq.push(body);
  mockReq.push(null); // Signal end of stream

  return new Promise<NextResponse>((resolve, reject) => {
    form.parse(mockReq, async (err, fields, files) => {
      if (err) {
        return reject(new Response(JSON.stringify({ message: 'Error reading the file' }), { status: 501 }));
      }

      // Check if file exists in the form data
      if (!files.file || !files.file[0]) {
        return reject(new Response(JSON.stringify({ message: 'No file uploaded' }), { status: 400 }));
      }

      const file = files.file[0];
      const filePath = file.filepath;

      try {
        const data = await extractDataFromCSV(filePath);
        return resolve(new NextResponse(JSON.stringify(data), { status: 200 }));
      } catch (error) {
        return reject(new Response(JSON.stringify({ message: 'Error processing the file' }), { status: 502 }));

      }
    });
  });
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
