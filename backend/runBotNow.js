import db from './models/index.js';
import { Op } from 'sequelize';
import { createNotification } from './services/notificationService.js';
import { sendBotReminderEmail } from './services/emailService.js';

const runBot = async () => {
    console.log('[Script] Ejecutando bot manualmente...');
    try {
        const { User, Message } = db;
        const now = new Date();
        const prospects = await User.findAll({ where: { role: 'user' } });
        const trainers = await User.findAll({ where: { role: { [Op.in]: ['admin', 'trainer'] } } });
        const trainerIds = trainers.map(t => t.id);

        let sentCount = 0;

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
            
            const level = lastMsg.bot_reminder_level || 0;
            let nextLevel = null;
            let title = '';
            let text = '';
  
            if (level === 0 && diffDays >= 3) {
              nextLevel = 1;
              title = '¿Continuamos con tu cambio?';
              text = 'Hola, he visto que dejaste el chat abierto. Si tienes cualquier duda sobre la asesoría o quieres empezar, ¡escríbeme por aquí y nos ponemos a ello!';
            } else if (level === 1 && diffDays >= 2) {
              nextLevel = 2;
              title = 'Aún estás a tiempo de empezar 💪🏽';
              text = 'Solo te escribo para recordarte que sigo por aquí si necesitas ayuda para dar el primer paso. Si no estás interesado, no te preocupes.';
            } else if (level === 2 && diffDays >= 1) {
              nextLevel = 3;
              title = 'Último aviso antes de cerrar el chat ⏳';
              text = 'Si no recibo respuesta en 1 día, cerraré esta conversación para mantener el buzón limpio. Siempre podrás volver a solicitar asesoría más adelante.';
            } else if (level === 3 && diffDays >= 1) {
              nextLevel = 4;
            }
  
            if (nextLevel) {
              if (nextLevel === 4) {
                lastMsg.is_closed = true;
                await lastMsg.save();
                console.log(`[Script] Chat cerrado para ${prospect.email}`);
                continue;
              }

              const newMsg = await Message.create({
                sender_id: trainerId,
                receiver_id: prospect.id,
                content: text,
                bot_reminder_level: nextLevel, attachment_type: 'bot_reply', created_at: new Date(),
                bot_push_status: 'pending', bot_email_status: 'pending'
              });
  
              let pushStat = 'error';
              let emailStat = 'error';
  
              try {
                await createNotification(prospect.id, {
                  type: 'chat_message', title: title, message: text, action_url: '/social'
                });
                pushStat = 'ok';
              } catch(e) {}
  
              try {
                await sendBotReminderEmail(prospect.email, prospect.name || prospect.username, nextLevel);
                emailStat = 'ok';
              } catch(e) { console.error('[Script] Error email bot', e); }
  
              newMsg.bot_push_status = pushStat;
              newMsg.bot_email_status = emailStat;
              await newMsg.save();
              
              sentCount++;
              console.log(`[Script] Flujo ${nextLevel} enviado a ${prospect.email}`);
            }
          }
        }
        console.log(`[Script] Completado. Se enviaron ${sentCount} recordatorios.`);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
runBot();
