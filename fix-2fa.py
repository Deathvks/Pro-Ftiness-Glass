import sys

with open('backend/controllers/twoFactorController.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """    const payload = { userId: user.id, role: user.role };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });"""

replace_str = """    const payload = { userId: user.id, role: user.role };
    const platform = req.headers['x-app-platform'] || 'web';
    const rememberMe = req.body.rememberMe === true || req.body.rememberMe === 'true';
    let expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';
    if (rememberMe) expiresIn = '3650d';
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });"""

content = content.replace(search_str, replace_str)

with open('backend/controllers/twoFactorController.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing twoFactorController.js")
