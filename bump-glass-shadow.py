import sys

with open('mobile/src/components/ui/GlassButton.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("shadowOpacity: isLight ? 0.2 : 0,", "shadowOpacity: isLight ? 0.35 : 0,")
content = content.replace("shadowRadius: 8,", "shadowRadius: 15,")

with open('mobile/src/components/ui/GlassButton.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Bumped GlassButton shadow again")
