import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the closing tags
content = re.sub(r'</BlurView>\s*</StepWrapper>', '</BlurView>\n          </View>\n        </StepWrapper>', content)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed closing tag")
