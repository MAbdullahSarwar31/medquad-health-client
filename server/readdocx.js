const fs = require('fs');
const AdmZip = require('adm-zip');

try {
    const zip = new AdmZip('../WE A3.docx');
    const xml = zip.readAsText('word/document.xml');
    // Strip XML tags to get readable plain text
    const text = xml
        .replace(/<w:p[ >]/g, '\n')        // paragraph breaks
        .replace(/<w:br[^>]*\/>/g, '\n')    // line breaks
        .replace(/<w:tab\/>/g, '\t')        // tabs
        .replace(/<[^>]+>/g, '')            // strip all remaining tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#xA;/g, '\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n')  // compress multiple blank lines
        .trim();
    
    console.log(text);
} catch(e) {
    console.log('Error:', e.message);
}
