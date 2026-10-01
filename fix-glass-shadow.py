import sys

with open('mobile/src/components/ui/GlassButton.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("shadowOffset: { width: 0, height: 2 },", "shadowOffset: { width: 0, height: 4 },")
content = content.replace("shadowOpacity: isLight ? 0.08 : 0,", "shadowOpacity: isLight ? 0.2 : 0,")
content = content.replace("elevation: isLight ? 2 : 0,", "elevation: isLight ? 4 : 0,")

with open('mobile/src/components/ui/GlassButton.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated GlassButton shadow opacity")
