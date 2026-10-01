const fs = require('fs');
let content = fs.readFileSync('frontend/src/index.css', 'utf8');

const regex = /\/\* Correcciones de contraste para temas pastel en Light Mode \*\/[\s\S]*?html\.light-theme\.accent-cherry-blossom \{ --text-accent: #f43f5e; \} \/\* rose-500 \*\//;

content = content.replace(regex, ':root { --text-accent: var(--color-accent); }');
fs.writeFileSync('frontend/src/index.css', content);
console.log('Done');
