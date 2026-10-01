import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the missing states to ChangePasswordModal
search_str = """  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);"""

replace_str = """  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');"""

content = content.replace(search_str, replace_str)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing Profile.jsx states")
