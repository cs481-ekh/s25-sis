import fs from 'fs';
import path from 'path';
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
        const uploadDir = path.join(process.cwd(), 'public', 'photos');
        const uploadPath = path.join(uploadDir, fileName);

        // ensure base upload directory
        await fs.promises.mkdir(uploadDir, { recursive: true });
        // save the raw file
        const buffer = await file.arrayBuffer();
        await fs.promises.writeFile(uploadPath, Buffer.from(buffer));

        if (fileName.endsWith('.zip')) {
            // 1) unzip *into* the photos directory
            const zip = new AdmZip(uploadPath);
            zip.extractAllTo(uploadDir, /* overwrite */ true);

            // 2) optionally delete the original ZIP
            await fs.promises.unlink(uploadPath);

            // 3) count only image files in the photos folder
            const allFiles = await fs.promises.readdir(uploadDir);
            const imageFiles = allFiles.filter(f =>
                /\.(jpe?g|png|gif|bmp|svg)$/i.test(f)
            );

            return new Response(JSON.stringify({
                message: `Zip uploaded and unpacked! ${imageFiles.length} images now in photos.`,
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // single image → return its URL
            const imageUrl = `/s25-sis/photos/${fileName}`;
            return new Response(JSON.stringify({
                message: 'Single photo uploaded successfully!',
                imageUrl
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (err) {
        console.error('Error in upload-photo:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
