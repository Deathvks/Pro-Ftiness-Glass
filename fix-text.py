import sys

def fix_text_primary(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("theme.textPrimary", "theme.text")
    content = content.replace("colors.textPrimary", "colors.text")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_text_primary('mobile/src/app/login.tsx')
fix_text_primary('mobile/src/app/register.tsx')
fix_text_primary('mobile/src/app/onboarding.tsx')
print("Fixed text color references")
