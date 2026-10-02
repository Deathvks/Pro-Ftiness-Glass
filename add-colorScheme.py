import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("  const blurTint = 'dark';", "  const blurTint = 'dark';\n  const colorScheme = activeThemeName === 'light' ? 'light' : 'dark';")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added colorScheme to onboarding")
