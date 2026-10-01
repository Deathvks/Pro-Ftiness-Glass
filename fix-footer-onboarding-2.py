import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '{/* FOOTER */}' in line:
        start_idx = i
    if start_idx != -1 and '</KeyboardAvoidingView>' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_footer = """        {/* FOOTER */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {step > 1 && (
            <GlassButton
              theme={colorScheme}
              onPress={handleBack}
              style={[styles.footerBtnBack, { flex: 1, backgroundColor: 'transparent' }]}
            >
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Atrás</Text>
            </GlassButton>
          )}
          
          <GlassButton
            theme={colorScheme}
            color={colors.tint}
            onPress={step === 5 ? handleSubmit : handleNext}
            style={[styles.footerBtnNext, { flex: step > 1 ? 2 : 1 }]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
                {step === 5 ? 'COMENZAR' : 'SIGUIENTE'}
              </Text>
            )}
          </GlassButton>
        </View>
"""
    # Replace lines between start_idx and end_idx (exclusive)
    lines = lines[:start_idx] + [new_footer] + lines[end_idx:]
    with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Replaced FOOTER lines")
else:
    print("Could not find FOOTER block lines")
