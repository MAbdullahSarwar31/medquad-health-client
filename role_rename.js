const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules')) return;
        if (dirPath.includes('.git')) return;

        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) walkDir(dirPath, callback);
        else callback(path.join(dir, f));
    });
}

function replaceInFile(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && !filePath.endsWith('.md')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Core replacements (Title Case and lowercase)
    content = content.replace(/technician/g, 'employee');
    content = content.replace(/Technician/g, 'Employee');

    // Constant replacements
    content = content.replace(/TECH_LINKS/g, 'EMPLOYEE_LINKS');
    content = content.replace(/Tech@2026/g, 'Emp@2026');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated:', filePath);
    }
}

console.log('Starting refactor...');
walkDir('d:/Medquad Health Solutions/client/src', replaceInFile);
walkDir('d:/Medquad Health Solutions/server', replaceInFile);
console.log('Refactor complete.');
