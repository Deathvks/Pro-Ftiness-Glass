import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("selectionColor={colors.tint}", "selectionColor={colors.tint}\n                  cursorColor={colors.tint}")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added cursorColor to text inputs")
