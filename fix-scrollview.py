import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add keyboardShouldPersistTaps to ScrollView
content = content.replace(
    "<ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 40 }}>",
    "<ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 40 }} keyboardShouldPersistTaps=\"handled\">"
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added keyboardShouldPersistTaps")
