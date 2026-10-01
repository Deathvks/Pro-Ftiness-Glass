import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_wrapper = '''      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowPasswordModal(false)}
            hasPassword={hasPassword}
            updateUserAccount={updateUserAccount}
            handleLogout={handleLogout}
            addToast={addToast}
            baseInputClasses={baseInputClasses}
          />
        )}
      </AnimatePresence>'''

new_wrapper = '''      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          hasPassword={hasPassword}
          updateUserAccount={updateUserAccount}
          handleLogout={handleLogout}
          addToast={addToast}
          baseInputClasses={baseInputClasses}
        />
      )}'''

content = content.replace(old_wrapper, new_wrapper)

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done animate presence")
