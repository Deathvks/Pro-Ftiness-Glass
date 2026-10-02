import sys
import re

with open('frontend/src/pages/Social.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<div className="flex items-center gap-4">\s*<UserAvatar user=\{fixedUser\} size=\{12\} className="w-12 h-12 shadow-sm transition-transform group-hover:scale-105" />\s*<div>\s*<p className=\{`font-bold text-base transition-colors line-clamp-1 \$\{isHighlighted \? \'text-accent\' : \'text-text-primary group-hover:text-accent\'\}`\}>\s*\{user\.username \|\| user\.name \|\| \'Usuario\'\}\s*</p>\s*<p className="text-xs font-medium text-text-secondary mt-0\.5 line-clamp-1">\s*(.*?)\s*</p>\s*</div>\s*</div>', re.DOTALL)

def repl(match):
    inner = match.group(1)
    return f'''<div className="flex items-center gap-4 flex-1 min-w-0 pr-3">
                <UserAvatar user={{fixedUser}} size={{12}} className="w-12 h-12 shadow-sm transition-transform group-hover:scale-105 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className={{`font-bold text-base transition-colors truncate ${{isHighlighted ? 'text-accent' : 'text-text-primary group-hover:text-accent'}}`}}>
                        {{user.username || user.name || 'Usuario'}}
                    </p>
                    <p className="text-xs font-medium text-text-secondary mt-0.5 truncate">
                        {inner}
                    </p>
                </div>
            </div>'''

content = pattern.sub(repl, content)

with open('frontend/src/pages/Social.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
