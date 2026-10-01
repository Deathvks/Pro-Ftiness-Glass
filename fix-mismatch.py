import sys
import re

with open('mobile/src/app/login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix unmatched </TouchableOpacity> for Verify Code button
content = content.replace("                      <Text style={[styles.loginButtonText, { color: theme.textPrimary }]}>Verificar Cdigo</Text>\n                    )}\n                  </TouchableOpacity>", 
                          "                      <Text style={[styles.loginButtonText, { color: theme.textPrimary }]}>Verificar Código</Text>\n                    )}\n                  </GlassButton>")

# Let's just do a regex replace to catch any </TouchableOpacity> right after </Text> \n )} that should be GlassButton
# Actually, I can just search for `<GlassButton` and match up the tags.
# Let's inspect line 352 to 360 directly by finding `<GlassButton` and the next `</TouchableOpacity>`

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

with open('mobile/src/app/login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed login.tsx mismatched tags")
