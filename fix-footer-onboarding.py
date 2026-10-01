import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{/* FOOTER */}"
end_marker = "      </KeyboardAvoidingView>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_footer = """{/* FOOTER */}
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
    content = content[:start_idx] + new_footer + content[end_idx:]
    with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced FOOTER completely")
else:
    print("Could not find FOOTER block")
