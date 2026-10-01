const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Profile.jsx', 'utf8');

c = c.replace(/<Helmet>[\s\S]*?<\/Helmet>/, '<Helmet>\\n        <title>{\Editar Perfil: \ - Pro Fitness Glass\}</title>\\n      </Helmet>');

fs.writeFileSync('frontend/src/pages/Profile.jsx', c);
console.log('Done');
