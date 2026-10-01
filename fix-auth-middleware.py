import sys

with open('backend/middleware/authenticateToken.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "return res.status(403).json({ error: 'Sesión no válida o expirada (revocada).' });",
    "return res.status(401).json({ error: 'Sesión no válida o expirada (revocada).' });"
)
content = content.replace(
    "return res.status(403).json({ error: 'Sesin no vlida o expirada (revocada).' });",
    "return res.status(401).json({ error: 'Sesión no válida o expirada (revocada).' });"
)

content = content.replace(
    "return res.status(403).json({ error: 'Token no válido o expirado.' });",
    "return res.status(401).json({ error: 'Token no válido o expirado.' });"
)
content = content.replace(
    "return res.status(403).json({ error: 'Token no vlido o expirado.' });",
    "return res.status(401).json({ error: 'Token no válido o expirado.' });"
)

with open('backend/middleware/authenticateToken.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done authenticateToken")
