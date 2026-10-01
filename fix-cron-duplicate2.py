import sys

with open('backend/services/cronService.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """            // PREVENCIN DE DUPLICADOS PARA CRON
            const existingSameLevel = await Message.findOne({
              where: {
                receiver_id: prospect.id,
                bot_reminder_level: nextLevel
              }
            });
            if (existingSameLevel) {
              console.log(`[Cron] Prospecto ${prospect.id} ya tiene aviso de nivel ${nextLevel}, saltando...`);
              continue;
            }"""

replace_str = """            if (nextLevel === null) continue;

            // PREVENCIN DE DUPLICADOS PARA CRON
            const existingSameLevel = await Message.findOne({
              where: {
                receiver_id: prospect.id,
                bot_reminder_level: nextLevel
              }
            });
            if (existingSameLevel) {
              console.log(`[Cron] Prospecto ${prospect.id} ya tiene aviso de nivel ${nextLevel}, saltando...`);
              continue;
            }"""

content = content.replace(search_str, replace_str)

with open('backend/services/cronService.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed cronService.js logic")
