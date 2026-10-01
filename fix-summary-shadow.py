import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the light mode glass button background more opaque (e.g. 0.6 instead of 0.4)
# and add shadow to summaryCard

content = content.replace(
    "backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.4)' : 'transparent'",
    "backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.6)' : 'transparent'"
)

# Add shadow to summaryCard in styles
content = content.replace(
    "summaryCard: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', width: '100%' },",
    "summaryCard: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },"
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Onboarding BlurView shadow")
