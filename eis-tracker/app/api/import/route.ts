import { IncomingMessage, ServerResponse } from 'http';
import formidable from 'formidable';
import * as fs from 'fs';
import csv from 'csv-parser';

// Define the structure of the data we're interested in
interface StudentData {
    firstName: string;
    lastName: string;
    StudentID: string;  // Renamed from SISUserID to StudentID
    blueTag: boolean;
    greenTag: boolean;
    orangeTag: boolean;
    whiteTag: boolean;  // This represents the Training Affirmation (Required) (228040)
}

// Disable Next.js's default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to extract relevant data from CSV
const extractDataFromCSV = (filePath: string): Promise<StudentData[]> => {
  return new Promise((resolve, reject) => {
    const results: StudentData[] = [];
    let firstRowProcessed = false;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        // Skip the first row (possible points row)
        if (!firstRowProcessed) {
          firstRowProcessed = true;
          return;  // Skip the first row
        }

        // Skip the row for the test student where the 'Student' column equals 'Student, Test'
        if (row['Student'] === 'Student, Test') {
          return;  // Skip the test student row
        }

        const fullName = row['Student'];
        const [lastName, firstName] = fullName.split(',').map((name: string) => name.trim());

        const studentData: StudentData = {
          firstName: firstName || '',
          lastName: lastName || '',
          StudentID: row['SIS User ID'] || '',  // Renamed field
          blueTag: row['BLUE TAG  (228139)'] === '1',
          greenTag: !!row['GREEN TAG (293966)'] && !isNaN(Number(row['GREEN TAG (293966)'])),
          orangeTag: !!row['ORANGE TAG (294239)'] && !isNaN(Number(row['ORANGE TAG (294239)'])),
          whiteTag: row['Training Affirmation (Required)  (228040)'] === '100'
        };

        results.push(studentData);
      })
      .on('end', () => {
        // Remove the last row after processing all rows
        results.pop();  // This removes the last element (test student)
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const handler = (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error parsing the file' }));
        return;
      }

      // Assuming the file input is named 'file' in the form
      if (!files.file || !files.file[0]) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file uploaded' }));
        return;
      }
      const file = files.file[0];
      const filePath = file.filepath;

      try {
        const data = await extractDataFromCSV(filePath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));  // Return the extracted data
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error processing the file' }));
      }
    });
  } else {
    // Handle other methods or invalid requests
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }
};

export default handler;
