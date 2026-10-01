import db from './models/index.js';
import { Op } from 'sequelize';

const debugBot = async () => {
    try {
        const { User, Message } = db;
        const now = new Date();
        const prospects = await User.findAll({ where: { role: 'user' } });
        const trainers = await User.findAll({ where: { role: { [Op.in]: ['admin', 'trainer'] } } });
        const trainerIds = trainers.map(t => t.id);

        for (const prospect of prospects) {
          for (const trainerId of trainerIds) {
            const lastMsg = await Message.findOne({
              where: {
                [Op.or]: [
                  { sender_id: prospect.id, receiver_id: trainerId },
                  { sender_id: trainerId, receiver_id: prospect.id }
                ]
              },
              order: [['created_at', 'DESC']]
            });
  
            if (!lastMsg || lastMsg.is_closed) continue;
  
            const lastDate = new Date(lastMsg.created_at);
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            const diffHours = (now - lastDate) / (1000 * 60 * 60);
            
            const level = lastMsg.bot_reminder_level || 0;
            console.log(`[Chat ${trainerId}-${prospect.id}] Level: ${level}, LastDate: ${lastDate.toISOString()}, diffHours: ${diffHours.toFixed(2)}, diffDays: ${diffDays}`);
          }
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
debugBot();
