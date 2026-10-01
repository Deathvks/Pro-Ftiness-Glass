import sys

with open('frontend/src/pages/Progress.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_start = '''    const handleTouchStartCapture = (e) => {
        if (e.target.closest('.no-swipe-tabs')) {'''

new_start = '''    const handleTouchStartCapture = (e) => {
        if (e.target.closest('.no-swipe-tabs') || e.target.closest('.no-swipe') || e.target.closest('[role="dialog"]') || e.target.closest('.glass-modal')) {'''

content = content.replace(old_start, new_start)

with open('frontend/src/pages/Progress.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done progress update")
