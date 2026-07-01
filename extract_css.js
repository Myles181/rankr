const fs = require('fs');
const path = require('path');

const files = ['index.html', 'artist-dashboard.html', 'fan-dashboard.html'];
let combinedCSS = '';

files.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    combinedCSS += `/* --- Styles from ${file} --- */\n` + styleMatch[1] + '\n\n';
  }
});

fs.writeFileSync(path.join(__dirname, 'client/src/index.css'), combinedCSS);
console.log('CSS extracted and merged into client/src/index.css');
