import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace BigOptionButton
content = re.sub(
    r'<TouchableOpacity onPress=\{onPress\}\s*activeOpacity=\{0\.7\}\s*style=\{\{ marginBottom: 16, width: \'100%\' \}\}>\s*<BlurView intensity=\{selected \? 50 : 25\} tint=\{blurTint\} style=\{\[styles\.bigOptionBtn, \{ borderColor: selected \? colors\.tint : colors\.border \+ \'60\' \}\]\}>',
    r'<GlassButton\n      theme={colorScheme}\n      color={selected ? colors.tint : undefined}\n      onPress={onPress}\n      style={[styles.bigOptionBtn, { marginBottom: 16, borderColor: selected ? colors.tint : colors.border + \'60\' }]}\n    >',
    content
)

content = content.replace("        </BlurView>\n    </TouchableOpacity>", "    </GlassButton>")

# Replace Gender Button
content = re.sub(
    r'<TouchableOpacity key=\{g\} onPress=\{\(\) => setFormData\(\{ \.\.\.formData, gender: g \}\)\} activeOpacity=\{0\.8\} style=\{\{ flex: 1 \}\}>\s*<BlurView intensity=\{formData\.gender === g \? 60 : 30\} tint=\{blurTint\} style=\{\[styles\.genderBtn, \{ borderColor: formData\.gender === g \? colors\.tint : colors\.border \+ \'60\' \}\]\}>',
    r'<GlassButton\n                key={g}\n                theme={colorScheme}\n                color={formData.gender === g ? colors.tint : undefined}\n                onPress={() => setFormData({ ...formData, gender: g })}\n                style={[styles.genderBtn, { flex: 1, borderColor: formData.gender === g ? colors.tint : colors.border + \'60\' }]}\n              >',
    content
)

content = content.replace("                  </BlurView>\n              </TouchableOpacity>", "              </GlassButton>")


with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied GlassButton to BigOptionButton and Gender buttons")
