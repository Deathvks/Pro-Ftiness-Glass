const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync('c:/proyectos/Pro-Ftiness-Glass/mobile/src', function(filePath, stat) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Reemplazar color={colors.tint} y variaciones
        const regex1 = /color=\{colors\.tint\}/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, "color={getContrastColor(colors.tint, theme)}");
            modified = true;
        }

        const regex2 = /color:\s*colors\.tint(?!\s*\+)/g;
        if (regex2.test(content)) {
            content = content.replace(regex2, "color: getContrastColor(colors.tint, theme)");
            modified = true;
        }

        if (modified) {
            // Add import if missing
            if (!content.includes('getContrastColor')) {
                // Find last import
                const lastImport = content.lastIndexOf('import ');
                const endOfLastImport = content.indexOf('\n', lastImport) + 1;
                content = content.slice(0, endOfLastImport) + "import { getContrastColor } from '@/utils/colorUtils';\n" + content.slice(endOfLastImport);
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Patched', filePath);
        }
    }
});
