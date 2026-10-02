const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Profile.jsx', 'utf8');
content = content.replace('<title>{Editar Perfil:  - Pro Fitness Glass}</title>', '<title>{Editar Perfil:  - Pro Fitness Glass}</title>');
fs.writeFileSync('frontend/src/pages/Profile.jsx', content);
console.log('Done');
