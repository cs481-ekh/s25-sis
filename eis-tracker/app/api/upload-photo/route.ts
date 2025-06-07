import AdmZip from 'adm-zip';

export async function POST(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const formData = await req.formData();
        // pull from either key
        const file = formData.get('file') ?? formData.get('image');

        if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
            return new Response(JSON.stringify({
                error: 'No file uploaded or invalid file type'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }


        const fileName = file.name.toLowerCase();
        // write into your public folder
        //const uploadDir = path.join(process.cwd(), 'public', 'photos');
        //const uploadPath = path.join(uploadDir, fileName);

        // ensure base upload directory
        //await fs.promises.mkdir(uploadDir, { recursive: true });
        // save the raw file
        const buffer = await file.arrayBuffer();
        //await fs.promises.writeFile(uploadPath, Buffer.from(buffer));

        if (fileName.endsWith('.zip')) {
            const inserted: string[] = [];

            const zip = new AdmZip(Buffer.from(buffer));
            const entries = zip.getEntries();

            const Database = (await import('better-sqlite3')).default;
            const db = new Database('database/database.db');
            const stmt = db.prepare(`UPDATE users
                                     SET Photo = ?
                                     WHERE StudentID = ?`);

            const checkStmt = db.prepare('SELECT 1 FROM users WHERE StudentID = ?');
            for (const entry of entries) {
                if (entry.isDirectory) {
                    console.log(`Skipping directory: ${entry.entryName}`);
                    continue;
                }

                console.log(`Processing file: ${entry.entryName}`);

                const match = entry.entryName.match(/^(\d+)\.(jpg|jpeg|png)$/i);
                if (!match) {
                    console.log(`Filename did not match pattern: ${entry.entryName}`);
                    continue;
                }

                const studentId = match[1];
                const imageData = entry.getData(); // buffer

                const exists = checkStmt.get(studentId);
                if (!exists) {
                    console.log(`StudentID ${studentId} not found in DB — skipping.`);
                    continue;
                }

                console.log(`Inserting image for StudentID ${studentId}`);
                stmt.run(imageData, studentId);
                inserted.push(studentId);
            }

            db.close();

            return new Response(JSON.stringify({
                message: `Photos added to database for ${inserted.length} students.`,
                inserted
            }), {
                status: 200,
                headers: {'Content-Type': 'application/json'}
            });
        }
        } catch (err) {
        console.error('Error in upload-photo:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
