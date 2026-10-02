import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)'",
    "backgroundColor: colors.tint + '1a', borderColor: colors.tint + '33'"
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed avatar background color")
