const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../mobile/src/app/(tabs)/index.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('import { Colors }')) {
    content = content.replace(
        "import { useMemo } from 'react';", 
        "import { useMemo } from 'react';\nimport { Colors } from '@/constants/theme';"
    );
}

// 2. Refactor StyleSheet
content = content.replace(/const styles = StyleSheet\.create\(\{/g, 'const createStyles = (colors) => StyleSheet.create({');

// Replace colors in styles
content = content.replace(/backgroundColor: '#000'/g, 'backgroundColor: colors.background');
content = content.replace(/backgroundColor: '#111'/g, 'backgroundColor: colors.card');
content = content.replace(/backgroundColor: '#222'/g, 'backgroundColor: colors.border');
content = content.replace(/borderColor: '#333'/g, 'borderColor: colors.border');
content = content.replace(/borderTopColor: '#333'/g, 'borderTopColor: colors.border');
content = content.replace(/color: '#fff'/g, 'color: colors.text');
content = content.replace(/color: '#888'/g, 'color: colors.textSecondary');

// Custom tints
content = content.replace(/color: '#f97316'/g, "color: '#f97316'"); // streak color
content = content.replace(/color: '#3b82f6'/g, 'color: colors.tint');
content = content.replace(/backgroundColor: '#3b82f6'/g, 'backgroundColor: colors.tint');
content = content.replace(/borderColor: '#3b82f6'/g, 'borderColor: colors.tint');
content = content.replace(/backgroundColor: '#22c55e'/g, 'backgroundColor: colors.success');
content = content.replace(/backgroundColor: '#22c55e22'/g, "backgroundColor: colors.success + '22'");
content = content.replace(/backgroundColor: '#3b82f622'/g, "backgroundColor: colors.tint + '22'");
content = content.replace(/backgroundColor: '#1e3a8a11'/g, "backgroundColor: colors.tint + '11'");

// 3. Inject hook in Dashboard
content = content.replace(
    /const router = useRouter\(\);/g,
    "const router = useRouter();\n  const theme = useAppStore(state => state.theme) || 'oled';\n  const colors = Colors[theme] || Colors.oled;\n  const styles = useMemo(() => createStyles(colors), [colors]);"
);

// Fix inner color passes in JSX (Lucide icons)
content = content.replace(/color="#fff"/g, 'color={colors.text}');
content = content.replace(/color="#888"/g, 'color={colors.textSecondary}');
content = content.replace(/color="#3b82f6"/g, 'color={colors.tint}');
content = content.replace(/color="#fbbf24"/g, 'color={colors.warning}');

fs.writeFileSync(file, content, 'utf8');