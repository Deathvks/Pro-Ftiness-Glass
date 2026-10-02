import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the forced dark theme logic
old_logic = """  const storeTheme = useAppStore(state => state.theme);
  const storeAccent = useAppStore(state => state.accent);
  const userProfile = useAppStore(state => state.userProfile);
  
  const isDefaultTheme = (storeTheme === 'system' || storeTheme === 'light' || !storeTheme);
  const activeThemeName = isDefaultTheme ? 'dark' : storeTheme;
  const baseColors = Colors[activeThemeName as keyof typeof Colors] || Colors.dark;
  
  const webExactColors = {
    background: '#0f172a',
    card: '#1e293b',
    text: '#e5e7eb',
    textSecondary: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
    tint: '#22c55e'
  };

  const colors = isDefaultTheme ? webExactColors : { ...baseColors, ...(storeAccent ? { tint: storeAccent } : {}) };
  const colorScheme = activeThemeName === 'light' ? 'light' : 'dark';
  const blurTint = colorScheme === 'light' ? 'light' : 'dark';"""

new_logic = """  const storeAccent = useAppStore(state => state.accent);
  const userProfile = useAppStore(state => state.userProfile);
  
  const baseColors = useTheme();
  const rawColorScheme = useDeviceColorScheme();
  
  const colors = { ...baseColors, ...(storeAccent ? { tint: storeAccent } : {}) };
  const colorScheme = rawColorScheme === 'light' ? 'light' : 'dark';
  const blurTint = colorScheme;"""

# Add imports for useTheme and useDeviceColorScheme
if "import { useTheme }" not in content:
    content = content.replace("import { Colors } from '@/constants/theme';", "import { Colors } from '@/constants/theme';\nimport { useTheme } from '@/hooks/use-theme';\nimport { useColorScheme as useDeviceColorScheme } from '@/hooks/use-color-scheme';")

content = content.replace(old_logic, new_logic)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed theme logic")
