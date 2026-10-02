const fs = require('fs');
let content = fs.readFileSync('frontend/src/store/dataSlice.js', 'utf8');

content = content.replace(
    /const createDataSlice = \(set, get\) => \(\{\\n/,
    const createDataSlice = (set, get) => ({\\n  initialDataError: false,\\n
);

content = content.replace(
    /set\(\{ isLoading: true \}\);\\n    try \{/,
    set({ isLoading: true, initialDataError: false });\\n    try {
);

content = content.replace(
    /    \} catch \(error\) \{\\n        console.error\("Error al cargar datos iniciales \(posiblemente de red\):", error\);\\n        \/\/ NO cerramos sesion automaticamente aqui, apiClient se encarga de los 401\.\\n      \} finally \{/,
        } catch (error) {\\n        console.error("Error al cargar datos iniciales (posiblemente de red):", error);\\n        // Si ocurre un error, avisamos a la UI para que muestre un botón de reintento en vez del esqueleto infinito\\n        set({ initialDataError: true });\\n      } finally {
);

fs.writeFileSync('frontend/src/store/dataSlice.js', content);
console.log('Done dataSlice');
