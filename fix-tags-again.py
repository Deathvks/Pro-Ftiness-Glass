import sys
import re

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'Verificar C' in lines[i] and '</TouchableOpacity>' in lines[i+2]:
        lines[i+2] = lines[i+2].replace('</TouchableOpacity>', '</GlassButton>')
    # Let's also check if there are any others
    if 'Registrarse' in lines[i] and '</TouchableOpacity>' in lines[i+2]:
        lines[i+2] = lines[i+2].replace('</TouchableOpacity>', '</GlassButton>')

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed JSX tags")
