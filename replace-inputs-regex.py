import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Edad
edad_pattern = re.compile(r"<View style=\{\{\s*flexDirection:\s*'row',\s*alignItems:\s*'flex-end',\s*justifyContent:\s*'center'\s*\}\}>\s*<TextInput.*?value=\{formData\.age\}.*?/>\s*<Text.*?>a.os</Text>\s*</View>", re.DOTALL)
content = edad_pattern.sub("""<GiantInput
                value={formData.age}
                onChangeText={(t: string) => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                placeholder="25"
                unit="a\u00f1os"
                colors={colors}
              />""", content)

# Replace Altura
altura_pattern = re.compile(r"<View style=\{\{\s*flexDirection:\s*'row',\s*alignItems:\s*'flex-end',\s*justifyContent:\s*'center'\s*\}\}>\s*<TextInput.*?value=\{formData\.height\}.*?/>\s*<Text.*?>cm</Text>\s*</View>", re.DOTALL)
content = altura_pattern.sub("""<GiantInput
                value={formData.height}
                onChangeText={(t: string) => setFormData({ ...formData, height: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                placeholder="175"
                unit="cm"
                colors={colors}
                autoFocus
              />""", content)

# Replace Peso
peso_pattern = re.compile(r"<View style=\{\{\s*flexDirection:\s*'row',\s*alignItems:\s*'flex-end',\s*justifyContent:\s*'center'\s*\}\}>\s*<TextInput.*?value=\{formData\.weight\}.*?/>\s*<Text.*?>kg</Text>\s*</View>", re.DOTALL)
content = peso_pattern.sub("""<GiantInput
                value={formData.weight}
                onChangeText={(t: string) => setFormData({ ...formData, weight: t.replace(',', '.').replace(/[^0-9.]/g, '') })}
                keyboardType="decimal-pad"
                placeholder="70.5"
                unit="kg"
                colors={colors}
              />""", content)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("TextInputs replaced successfully using regex")
