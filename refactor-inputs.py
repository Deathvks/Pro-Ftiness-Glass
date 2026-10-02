import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

giant_input_component = """
const GiantInput = ({ value, onChangeText, keyboardType, placeholder, unit, colors, autoFocus = false }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
      <View style={{ 
        borderBottomWidth: 3, 
        borderBottomColor: isFocused ? colors.tint : 'transparent',
        paddingBottom: 4,
        shadowColor: colors.tint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isFocused ? 0.3 : 0,
        shadowRadius: 8,
      }}>
        <TextInput 
          style={[styles.giantInput, { color: colors.text, minWidth: 160 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary + '25'}
          selectionColor={colors.tint}
          cursorColor={colors.tint}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
        />
      </View>
      <Text style={[styles.unit, { color: isFocused ? colors.tint : colors.textSecondary, marginBottom: 12, marginLeft: 12, transition: 'color 0.3s' }]}>{unit}</Text>
    </View>
  );
};
"""

# Insert GiantInput component after BigOptionButton
content = content.replace(
    "const BigOptionButton = ",
    giant_input_component + "\nconst BigOptionButton = "
)

# Replace Edad
old_edad = """<View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <TextInput 
                style={[styles.giantInput, { color: colors.text }]}
                value={formData.age}
                onChangeText={t => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={colors.textSecondary + '20'}
                selectionColor={colors.tint}
                  cursorColor={colors.tint}
              />
              <Text style={[styles.unit, { color: colors.textSecondary }]}>a\u00f1os</Text>
            </View>"""
# Using regex to replace flexibly because of possible whitespace differences
edad_pattern = re.compile(r"<View style=\{\{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' \}\}>\s*<TextInput\s*style=\{\[styles\.giantInput, \{ color: colors\.text \}\]\}\s*value=\{formData\.age\}\s*onChangeText=\{t => setFormData\(\{ \.\.\.formData, age: t\.replace\(\/\[\^0-9\]\/g, ''\) \}\)\}\s*keyboardType=\"numeric\"\s*placeholder=\"25\"\s*placeholderTextColor=\{colors\.textSecondary \+ '20'\}\s*selectionColor=\{colors\.tint\}\s*cursorColor=\{colors\.tint\}\s*\/>\s*<Text style=\{\[styles\.unit, \{ color: colors\.textSecondary \}\]\}>a\u00f1os<\/Text>\s*<\/View>", re.MULTILINE | re.DOTALL)
new_edad = """<GiantInput
              value={formData.age}
              onChangeText={(t: string) => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              placeholder="25"
              unit="a\u00f1os"
              colors={colors}
            />"""

# Replace Altura
altura_pattern = re.compile(r"<View style=\{\{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' \}\}>\s*<TextInput\s*style=\{\[styles\.giantInput, \{ color: colors\.text, minWidth: 160 \}\]\}\s*value=\{formData\.height\}\s*onChangeText=\{t => setFormData\(\{ \.\.\.formData, height: t\.replace\(\/\[\^0-9\]\/g, ''\) \}\)\}\s*keyboardType=\"numeric\"\s*placeholder=\"175\"\s*placeholderTextColor=\{colors\.textSecondary \+ '20'\}\s*selectionColor=\{colors\.tint\}\s*cursorColor=\{colors\.tint\}\s*\/>\s*<Text style=\{\[styles\.unit, \{ color: colors\.textSecondary \}\]\}>cm<\/Text>\s*<\/View>", re.MULTILINE | re.DOTALL)
new_altura = """<GiantInput
                  value={formData.height}
                  onChangeText={(t: string) => setFormData({ ...formData, height: t.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholder="175"
                  unit="cm"
                  colors={colors}
                  autoFocus
                />"""

# Replace Peso
peso_pattern = re.compile(r"<View style=\{\{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' \}\}>\s*<TextInput\s*style=\{\[styles\.giantInput, \{ color: colors\.text, minWidth: 160 \}\]\}\s*value=\{formData\.weight\}\s*onChangeText=\{t => setFormData\(\{ \.\.\.formData, weight: t\.replace\(\',', '\.'\)\.replace\(\/\[\^0-9\.\]\/g, ''\) \}\)\}\s*keyboardType=\"decimal-pad\"\s*placeholder=\"70\.5\"\s*placeholderTextColor=\{colors\.textSecondary \+ '20'\}\s*selectionColor=\{colors\.tint\}\s*cursorColor=\{colors\.tint\}\s*\/>\s*<Text style=\{\[styles\.unit, \{ color: colors\.textSecondary \}\]\}>kg<\/Text>\s*<\/View>", re.MULTILINE | re.DOTALL)
new_peso = """<GiantInput
                  value={formData.weight}
                  onChangeText={(t: string) => setFormData({ ...formData, weight: t.replace(',', '.').replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="70.5"
                  unit="kg"
                  colors={colors}
                />"""

content = edad_pattern.sub(new_edad, content)
content = altura_pattern.sub(new_altura, content)
content = peso_pattern.sub(new_peso, content)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Extracted GiantInput component and added focus state")
