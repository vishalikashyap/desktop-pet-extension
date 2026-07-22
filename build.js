const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const root = __dirname;
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'app'), { recursive: true });

fs.cpSync(path.join(root, 'landing'), dist, { recursive: true });
fs.cpSync(path.join(root, 'mobile-app'), path.join(dist, 'app'), { recursive: true });

const EXTENSION_FILES = [
  'manifest.json',
  'background.js',
  'content-script.js',
  'content-style.css',
  'pet-rig.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'README.md'
];

const output = fs.createWriteStream(path.join(dist, 'desktop-pet-extension.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
EXTENSION_FILES.forEach((file) => archive.file(path.join(root, file), { name: file }));

output.on('close', () => {
  console.log(`Built dist/ (${archive.pointer()} bytes zipped)`);
});

archive.finalize();
