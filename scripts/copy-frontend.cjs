const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../build');
const destDir = path.resolve(__dirname, '../public_html');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyFolderRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Cleaning old React build files from Laravel public/ folder...');
// Clean react-specific files/folders
deleteFolderRecursive(path.join(destDir, 'static'));
const filesToDelete = ['index.html', 'asset-manifest.json'];
filesToDelete.forEach(file => {
  const filePath = path.join(destDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

console.log(`Copying built frontend from: ${srcDir}`);
console.log(`To destination folder: ${destDir}`);
if (fs.existsSync(srcDir)) {
  copyFolderRecursive(srcDir, destDir);
  console.log('Frontend merged successfully into backend public folder!');
} else {
  console.error(`Error: Source directory ${srcDir} does not exist. Please run npm run build in frontend-react first.`);
  process.exit(1);
}
