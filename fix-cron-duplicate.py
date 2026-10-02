import sys

with open('backend/services/cronService.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """            if (nextLevel === 4) {
              console.log(`[Cron] Cerrando chat entre prospecto ${prospect.id} y entrenador ${trainerId}`);"""

replace_str = """            // PREVENCIN DE DUPLICADOS PARA CRON
            const existingSameLevel = await Message.findOne({
              where: {
                receiver_id: prospect.id,
                bot_reminder_level: nextLevel
              }
            });
            if (existingSameLevel) {
              console.log(`[Cron] Prospecto ${prospect.id} ya tiene aviso de nivel ${nextLevel}, saltando...`);
              continue;
            }

            if (nextLevel === 4) {
              console.log(`[Cron] Cerrando chat entre prospecto ${prospect.id} y entrenador ${trainerId}`);"""

content = content.replace(search_str, replace_str)

with open('backend/services/cronService.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done patching cronService.js")
