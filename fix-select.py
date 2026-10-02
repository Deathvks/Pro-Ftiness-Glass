import sys

with open('frontend/src/components/CustomSelect.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update click outside listener to include touchstart
old_click = '''    useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);'''

new_click = '''    useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);'''

content = content.replace(old_click, new_click)

# 2. Remove the scroll listener useEffect entirely
# We'll use regex or string replace. Let's find it manually.
import re

# Match the useEffect for scroll handling
scroll_effect_pattern = re.compile(r"useEffect\(\(\) => \{\s*// En iOS.*?\}, \[isOpen\]\);\s*", re.DOTALL)
content = scroll_effect_pattern.sub('', content)

# 3. Remove autoFocus from input
content = content.replace("autoFocus\n          />", "/>")
content = content.replace("autoFocus\r\n          />", "/>")
# Just in case:
content = content.replace("autoFocus", "")

with open('frontend/src/components/CustomSelect.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
