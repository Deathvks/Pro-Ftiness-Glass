import sys

with open('frontend/src/components/TrainerChats.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'Push Manual V' : 'Push V'", "'Push Manual ✓' : 'Push ✓'")
content = content.replace("'Email Manual V' : 'Email V'", "'Email Manual ✓' : 'Email ✓'")

with open('frontend/src/components/TrainerChats.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing V to Checkmark")
