import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to wrap BlurView in a shadow container
old_blur = "<BlurView intensity={colorScheme === 'light' ? 80 : 40} tint={blurTint} style={[styles.summaryCard, { borderColor: colors.border + '60', backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.6)' : 'transparent' }]}>"
new_blur = """
          <View style={{ width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: colorScheme === 'light' ? 0.15 : 0, shadowRadius: 20, elevation: colorScheme === 'light' ? 5 : 0 }}>
            <BlurView intensity={colorScheme === 'light' ? 80 : 40} tint={blurTint} style={[styles.summaryCard, { borderColor: colors.border + '60', backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.6)' : 'transparent' }]}>
"""

content = content.replace(old_blur, new_blur.strip())
content = content.replace("</BlurView>\n          </StepWrapper>", "</BlurView>\n          </View>\n          </StepWrapper>")

# Remove shadow from styles.summaryCard
content = content.replace(
    "summaryCard: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },",
    "summaryCard: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', width: '100%' },"
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Summary shadow wrapper")
