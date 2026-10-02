import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if missing
if "import { GlassButton } from '@/components/ui/GlassButton';" not in content:
    content = content.replace("import { GlassView } from 'expo-glass-effect';", "import { GlassView } from 'expo-glass-effect';\nimport { GlassButton } from '@/components/ui/GlassButton';")

# Replace back button
search_back = """          {step > 1 && (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.8} style={{ flex: 1 }}>
              <View style={[styles.footerBtnBack, { overflow: 'hidden' }]}>
                <GlassView glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Atrás</Text>
              </View>
            </TouchableOpacity>
          )}"""
# Wait, it might have Atrs (encoding issue). I'll use regex.
content = re.sub(
    r'\{step > 1 && \(\s*<TouchableOpacity onPress=\{handleBack\}.*?>\s*<View style=\{\[styles\.footerBtnBack.*?<GlassView.*?\/>\s*<Text style=\{\{ color: colors\.text.*?\)\}>(.*?)<\/Text>\s*<\/View>\s*<\/TouchableOpacity>\s*\)\}',
    r'{step > 1 && (\n            <GlassButton\n              theme={colorScheme}\n              onPress={handleBack}\n              style={[styles.footerBtnBack, { flex: 1 }]}\n            >\n              <Text style={{ color: colors.text, fontWeight: \'bold\', fontSize: 16 }}>Atrás</Text>\n            </GlassButton>\n          )}',
    content,
    flags=re.DOTALL
)

# Replace next button
content = re.sub(
    r'<TouchableOpacity\s+onPress=\{step === 5 \? handleSubmit : handleNext\}\s+disabled=\{isLoading\}\s+activeOpacity=\{0\.8\}\s+style=\{\{ flex: step > 1 \? 2 : 1 \}\}\s*>\s*<View style=\{\[styles\.footerBtnNext.*?<GlassView.*?\/>\s*<LinearGradient.*?\/>\s*<Text style=\{\{ color: \'#fff\'.*?\)\}>(.*?)<\/Text>\s*<\/View>\s*<\/TouchableOpacity>',
    r'<GlassButton\n            theme={colorScheme}\n            color={colors.tint}\n            onPress={step === 5 ? handleSubmit : handleNext}\n            style={[styles.footerBtnNext, { flex: step > 1 ? 2 : 1 }]}\n          >\n            <Text style={{ color: colors.textPrimary || colors.text, fontWeight: \'900\', fontSize: 16, letterSpacing: 1 }}>\n              {step === 5 ? (isLoading ? \'GUARDANDO...\' : \'COMENZAR\') : \'SIGUIENTE\'}\n            </Text>\n          </GlassButton>',
    content,
    flags=re.DOTALL
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated footer buttons in onboarding")
