const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Profile.jsx", "utf8");

const regex = /\/\/ --- Componente: Modal de Confirmacin de Borrado ---[\s\S]*?\}\);\s*\}\s*\}\s*<\/div>\s*\);\s*\};\s*export default Profile;/;
// wait, the component is at the end of the file. Let me check the exact end of Profile.jsx.

