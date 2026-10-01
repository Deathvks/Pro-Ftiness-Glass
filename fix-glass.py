import sys

with open('mobile/src/components/ui/GlassButton.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const baseOpacity = isLight ? 0.25 : 0.15;", "const baseOpacity = isLight ? 0.5 : 0.15;")
content = content.replace("const pressedOpacity = isLight ? 0.4 : 0.3;", "const pressedOpacity = isLight ? 0.7 : 0.3;")

# In light mode, adding a subtle border often helps a lot for glass effect
content = content.replace(
    "shadowRadius: 8,",
    "shadowRadius: 8,\n                borderWidth: isLight ? 1 : 0,\n                borderColor: isLight ? 'rgba(255,255,255,0.7)' : 'transparent',"
)

with open('mobile/src/components/ui/GlassButton.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated GlassButton light mode contrast")
