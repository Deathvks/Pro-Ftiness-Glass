import models from './models/index.js';
import { Op } from 'sequelize';

async function run() {
  const { Message, User } = models;
  console.log('Buscando usuarios pendientes...');
  
  // Encontrar mensajes de "sin compromiso"
  const requestMessages = await Message.findAll({
    where: {
      content: {
        [Op.like]: '%sin compromiso%'
      }
    }
  });

  console.log('Encontrados ' + requestMessages.length + ' mensajes de solicitud.');

  let sentCount = 0;
  for (const msg of requestMessages) {
    const senderId = msg.sender_id; // the trainee
    const receiverId = msg.receiver_id; // the trainer

    // Comprobar si el usuario ya ha recibido un bot reply
    const hasBotReply = await Message.count({
      where: {
        receiver_id: senderId,
        attachment_type: 'bot_reply'
      }
    });

    if (hasBotReply === 0) {
      // Comprobar si NO HAY NINGUNA respuesta del entrenador (donde trainer = sender y trainee = receiver)
      const trainerReplies = await Message.count({
        where: {
          sender_id: receiverId,
          receiver_id: senderId
        }
      });

      if (trainerReplies === 0) {
        console.log('Enviando bot reply retroactivo a usuario ' + senderId);
        const botContent = "Hola, tus mensajes son totalmente privados. Recibirás respuesta de tu entrenador en un máximo de 2 horas por lo general. Se te avisará por correo o [notificaciones push] cuando esto suceda.";
        
        await Message.create({
          sender_id: receiverId,
          receiver_id: senderId,
          content: botContent,
          attachment_type: 'bot_reply',
          created_at: new Date(),
        });
        sentCount++;
      }
    }
  }

  console.log('Completado. Se enviaron ' + sentCount + ' mensajes retroactivos.');
  process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
