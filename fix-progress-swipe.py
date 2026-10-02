import sys

with open('frontend/src/pages/Progress.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_touch = '''    const handleTouchStartCapture = (e) => {
        if (e.target.closest('.no-swipe-tabs')) {
            return;
        }
        setTouchStartX(e.touches[0].clientX);'''

new_touch = '''    const handleTouchStartCapture = (e) => {
        if (e.target.closest('.no-swipe-tabs') || e.target.closest('.no-swipe') || e.target.closest('[role="dialog"]') || e.target.closest('.glass-modal')) {
            return;
        }
        setTouchStartX(e.touches[0].clientX);'''

content = content.replace(old_touch, new_touch)

with open('frontend/src/pages/Progress.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
