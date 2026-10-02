import sys
import re

# Update login.tsx
with open('mobile/src/app/login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("  loginButton: {\n    flexDirection: 'row',\n    height: 56,", 
                          "  loginButton: {\n    flexDirection: 'row',\n    width: '100%',\n    height: 56,")

with open('mobile/src/app/login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Update register.tsx
with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace("  loginButton: {\n    flexDirection: 'row',\n    height: 56,", 
                            "  loginButton: {\n    flexDirection: 'row',\n    width: '100%',\n    height: 56,")

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)

print("Added width: '100%' to loginButton style in both files")
