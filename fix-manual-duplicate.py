import sys

with open('backend/controllers/chatController.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """    const { User, Message } = models;
    const prospect = await User.findByPk(prospectId);
    if (!prospect) return res.status(404).json({ error: 'Cliente no encontrado' });"""

replace_str = """    const { User, Message, Sequelize } = models;
    const prospect = await User.findByPk(prospectId);
    if (!prospect) return res.status(404).json({ error: 'Cliente no encontrado' });

    // PREVENCIN DE DUPLICADOS (Evita doble click en UI o envos simultneos)
    const Op = Sequelize.Op;
    const lastMsg = await Message.findOne({
      where: {
        [Op.or]: [
          { sender_id: prospect.id, receiver_id: trainerId },
          { sender_id: trainerId, receiver_id: prospect.id }
        ]
      },
      order: [['created_at', 'DESC']]
    });

    if (lastMsg && (lastMsg.bot_reminder_level || 0) >= parsedLevel) {
      return res.status(400).json({ error: 'Ya se envi este aviso (posible doble click detectado).' });
    }
    if (lastMsg && lastMsg.is_closed) {
      return res.status(400).json({ error: 'El chat ya est cerrado.' });
    }"""

content = content.replace(search_str, replace_str)

with open('backend/controllers/chatController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done patching chatController.js")
