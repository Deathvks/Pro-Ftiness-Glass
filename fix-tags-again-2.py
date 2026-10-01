import sys

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'Registrarse' in lines[i]:
        # Search ahead a few lines for </TouchableOpacity>
        for j in range(1, 6):
            if i + j < len(lines) and '</TouchableOpacity>' in lines[i+j]:
                lines[i+j] = lines[i+j].replace('</TouchableOpacity>', '</GlassButton>')
                break

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed JSX tags for Registrarse")
