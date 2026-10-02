const fs = require("fs");
let content = fs.readFileSync("frontend/src/store/dataSlice.js", "utf8");

content = content.replace(/catch \(error\) \{\s*console\.error\("Error de autenticaci.n o carga de datos:", error\);\s*get\(\)\.handleLogout\(\);\s*\}/g, 
`catch (error) {
        console.error("Error al cargar datos iniciales (posiblemente de red):", error);
        // NO cerramos sesion automaticamente aqui, apiClient se encarga de los 401.
      }`);

fs.writeFileSync("frontend/src/store/dataSlice.js", content);
console.log("Done");
