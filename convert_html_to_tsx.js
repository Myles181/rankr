const fs = require('fs');
const path = require('path');

function htmlToJsx(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/onclick=/g, 'onClick=')
    .replace(/<!--[\s\S]*?-->/g, '') // remove comments
    .replace(/<img(.*?)>/g, '<img$1 />')
    .replace(/<br>/g, '<br />')
    .replace(/<hr(.*?)>/g, '<hr$1 />')
    .replace(/<input(.*?)>/g, '<input$1 />')
    .replace(/style="(.*?)"/g, (match, p1) => {
      const styles = p1.split(';').filter(s => s.trim());
      let styleObj = '';
      styles.forEach(s => {
        const [key, value] = s.split(':').map(str => str.trim());
        if(key && value) {
            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
            styleObj += `${camelKey}: '${value}', `;
        }
      });
      return `style={{ ${styleObj} }}`;
    });
}

const files = [
  { name: 'index.html', dest: 'client/src/pages/LandingPage.tsx', compName: 'LandingPage' },
  { name: 'artist-dashboard.html', dest: 'client/src/pages/ArtistDashboard.tsx', compName: 'ArtistDashboard' },
  { name: 'fan-dashboard.html', dest: 'client/src/pages/FanDashboard.tsx', compName: 'FanDashboard' }
];

if (!fs.existsSync(path.join(__dirname, 'client/src/pages'))) {
  fs.mkdirSync(path.join(__dirname, 'client/src/pages'), { recursive: true });
}

files.forEach(f => {
  const content = fs.readFileSync(path.join(__dirname, f.name), 'utf8');
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (bodyMatch) {
    let body = bodyMatch[1];
    body = body.replace(/<script>[\s\S]*?<\/script>/g, ''); // remove scripts
    const jsx = htmlToJsx(body);
    const tsxContent = `
import React from 'react';
import { Link } from 'react-router-dom';

export default function ${f.compName}() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;
    fs.writeFileSync(path.join(__dirname, f.dest), tsxContent);
    console.log(`Generated ${f.dest}`);
  }
});
