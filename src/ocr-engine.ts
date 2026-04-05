import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class OCREngine {
    private tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
    private magickPath = '"C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe"';

    async performOCR(pdfPath: string, outputTextPath: string): Promise<string> {
        const tempDir = path.join(process.cwd(), 'tmp_ocr');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const baseName = path.basename(pdfPath, '.pdf');
        const imgPrefix = path.join(tempDir, `${baseName}_page`);
        
        console.error(`Status: Converting PDF to images for OCR: ${pdfPath}`);
        // 1. Convert first 3 pages to high-res images for metadata extraction
        // Use density 300 for better OCR
        try {
            execSync(`${this.magickPath} -density 300 "${pdfPath}"[0-2] -depth 8 -strip -background white -alpha off "${imgPrefix}-%d.png"`);
        } catch (e: any) {
            console.error(`Magick error: ${e.message}`);
            // Fallback: try without explicit density or path
            execSync(`magick -density 150 "${pdfPath}"[0-1] "${imgPrefix}-%d.png"`);
        }

        // 2. OCR each image
        let fullText = "";
        const files = fs.readdirSync(tempDir).filter(f => f.startsWith(baseName) && f.endsWith('.png'));
        
        for (const file of files) {
            const imgPath = path.join(tempDir, file);
            const outPath = path.join(tempDir, `${file}_out`);
            console.error(`Status: OCR processing ${file}...`);
            execSync(`${this.tesseractPath} "${imgPath}" "${outPath}" -l eng+spa+fra`);
            fullText += fs.readFileSync(`${outPath}.txt`, 'utf8') + "\n--- PAGE BREAK ---\n";
            
            // Cleanup
            fs.unlinkSync(imgPath);
            fs.unlinkSync(`${outPath}.txt`);
        }

        fs.writeFileSync(outputTextPath, fullText);
        return fullText;
    }
}
