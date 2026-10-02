import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("padding: 0, margin: 0", "paddingHorizontal: 20, paddingVertical: 10, margin: 0")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added padding to giantInput")
