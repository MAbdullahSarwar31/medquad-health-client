import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';

const buf = fs.readFileSync('../AI-CEP-28042026-124348pm.pdf');
const data = await pdfParse(buf);
const lines = data.text.split('\n').filter(l => l.trim().length > 3);
console.log(lines.join('\n'));
