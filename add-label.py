import sys

with open('frontend/src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2">
              {reqs.map(r => ("""

new_block = """            <div className="mt-1 flex flex-col gap-2">
              <span className="text-xs font-bold text-text-muted px-2">Requisitos de la nueva contraseña:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-2">
                {reqs.map(r => ("""

content = content.replace(old_block, new_block)
content = content.replace('            </div>\n\n            <div className="flex flex-col gap-3 mt-4">', '              </div>\n            </div>\n\n            <div className="flex flex-col gap-3 mt-4">')

with open('frontend/src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
