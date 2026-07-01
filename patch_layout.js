const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'client/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace body{background:var(--black)...display:flex;min-height:100vh;}
// With body{background:var(--black)...} and add .dashboard-layout
css = css.replace(/body\{background:var\(--black\);color:var\(--white\);font-family:var\(--font-body\);display:flex;min-height:100vh;\}/g, 'body{background:var(--black);color:var(--white);font-family:var(--font-body);}');

// Add .dashboard-layout if it doesn't exist
if (!css.includes('.dashboard-layout')) {
    css += '\n.dashboard-layout { display: flex; min-height: 100vh; width: 100%; }\n';
}

fs.writeFileSync(cssPath, css);

const patchDash = (filename) => {
    const p = path.join(__dirname, 'client/src/pages', filename);
    let code = fs.readFileSync(p, 'utf8');
    if (!code.includes('<div className="dashboard-layout">')) {
        code = code.replace(/return \(\s*<>\s*<aside/, 'return (\n    <div className="dashboard-layout">\n      <aside');
        code = code.replace(/<\/main>\s*<\/>/, '</main>\n    </div>');
        // also handle any modals outside main but we can put modal inside dashboard-layout or outside, doesn't matter much if it's fixed/absolute
        // Wait, artist dashboard has modal after main.
        code = code.replace(/<\/main>\s*\{?\/\* CREATE POOL MODAL \*\//, '</main>\n    </div>\n      {/* CREATE POOL MODAL */');
        
        // for fan dashboard, it's just </main> \n </>
        if (filename === 'FanDashboard.tsx') {
            code = code.replace(/<\/main>\s*<\/>/, '</main>\n    </div>\n    </>');
        } else if (filename === 'ArtistDashboard.tsx') {
             // fix the modal wrapper so the div closes main, and modal stays outside
            code = code.replace(/return \(\s*<>\s*<aside/, 'return (\n    <>\n    <div className="dashboard-layout">\n      <aside');
            code = code.replace(/<\/main>\s*\{?\/\* CREATE POOL MODAL \*\/?\}?/, '</main>\n    </div>\n\n      {/* CREATE POOL MODAL */}');
        }
    }
    fs.writeFileSync(p, code);
};

patchDash('ArtistDashboard.tsx');
patchDash('FanDashboard.tsx');

console.log('Patched layout');
