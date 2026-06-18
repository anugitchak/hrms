const parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, 'src', 'pages'));
let errors = 0;

console.log(`Scanning ${files.length} JS/JSX files in src/pages for syntax errors...`);

files.forEach(f => {
    try {
        const code = fs.readFileSync(f, 'utf8');
        parser.parse(code, {
            sourceType: "module",
            plugins: ["jsx"]
        });
    } catch (e) {
        console.error(`Syntax Error in ${f}:`);
        console.error(e.message);
        errors++;
    }
});

console.log(`Total syntax errors across all source files: ${errors}`);
