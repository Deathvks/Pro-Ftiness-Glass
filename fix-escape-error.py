import sys

with open('mobile/src/app/register.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r"code.some(d => d === \'\')", "code.some(d => d === '')")

with open('mobile/src/app/register.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed backslash escaping error in register.tsx")
