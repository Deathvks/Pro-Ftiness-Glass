import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "<BlurView intensity={40} tint={blurTint} style={[styles.summaryCard, { borderColor: colors.border + '60' }]}>",
    "<BlurView intensity={colorScheme === 'light' ? 80 : 40} tint={blurTint} style={[styles.summaryCard, { borderColor: colors.border + '60', backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.4)' : 'transparent' }]}>"
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Summary BlurView for light mode")
