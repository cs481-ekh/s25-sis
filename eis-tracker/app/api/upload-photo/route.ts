import fs from 'fs';
import path from 'path';

// Named export for POST request
export async function POST(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        // Check if file is uploaded
        if (!file) {
            return new Response('No file uploaded', { status: 400 });
        }

        if (!(file instanceof File)) {
            return new Response('Invalid file', { status: 400 });
        }

        const filePath = `./.tmp/${file.name}`;
        const dirPath = path.dirname(filePath);

        // Ensure the directory exists
        try {
            await fs.promises.access(dirPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                await fs.promises.mkdir(dirPath, { recursive: true });
            } else {
                // Log the error and return a response
                console.error("Error ensuring directory exists:", error);
                return new Response('Internal Server Error: Unable to ensure directory existence', { status: 500 });
            }
        }

        // Proceed to write file or other logic here
        const buffer = await file.arrayBuffer();
        await fs.promises.writeFile(filePath, Buffer.from(buffer));

        return new Response('File uploaded successfully', { status: 200 });
    } catch (error) {
        // Log the error and return a response
        console.error("Error handling the POST request:", error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
