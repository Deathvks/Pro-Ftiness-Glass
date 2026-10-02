import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Orbs
content = content.replace("<View style={[styles.orb, { top: -100, right: -100", "<View pointerEvents=\"none\" style={[styles.orb, { top: -100, right: -100")
content = content.replace("<View style={[styles.orb, { bottom: -100, left: -100", "<View pointerEvents=\"none\" style={[styles.orb, { bottom: -100, left: -100")

# Fix align-items baseline for the inputs
content = content.replace("alignItems: 'baseline'", "alignItems: 'flex-end', justifyContent: 'center'")

# Increase minWidth of the inputs to make them easier to tap
content = content.replace("minWidth: 120", "minWidth: 160")

# Add cursorColor so it matches tint
content = content.replace('keyboardType="decimal-pad"', 'keyboardType="decimal-pad"\n                  cursorColor={colors.tint}')
content = content.replace('keyboardType="numeric"', 'keyboardType="numeric"\n                cursorColor={colors.tint}')

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied hitbox and cursor fixes")
