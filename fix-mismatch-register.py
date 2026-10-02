import sys
import re

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
glass_button_open = False
for i, line in enumerate(lines):
    if '<GlassButton' in line:
        glass_button_open = True
    if glass_button_open and '</TouchableOpacity>' in line:
        lines[i] = line.replace('</TouchableOpacity>', '</GlassButton>')
        glass_button_open = False
    if glass_button_open and '</GlassButton>' in line:
        glass_button_open = False

content = '\n'.join(lines)

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed register.tsx mismatched tags")
