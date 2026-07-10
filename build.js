const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'public');
const output = path.join(__dirname, 'dist');
const serverOutput = path.join(output, 'server');
const metadataOutput = path.join(output, '.openai');

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });
fs.mkdirSync(serverOutput, { recursive: true });
fs.mkdirSync(metadataOutput, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'hosting-worker.js'), path.join(serverOutput, 'index.js'));
fs.copyFileSync(path.join(__dirname, '.openai', 'hosting.json'), path.join(metadataOutput, 'hosting.json'));

console.log('Yvi Fotografie: statischer Build in dist/ erstellt.');
