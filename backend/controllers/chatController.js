/* backend/controllers/chatController.js */
import models from '../models/index.js';
import { Op } from 'sequelize';
import { io } from '../server.js';
import { uploadVideoToCloudinary } from '../services/cloudinaryService.js';
import { sendChatReplyEmail, sendNewClientMessageEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

const { User, Message, UploadLog } = models;

const notifyUserIfNeeded = async (senderId, receiverId, content) => {
  try {
    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);

    if (!sender || !receiver) return;

    if (sender.role === 'trainer' || sender.role === 'admin') {
      // Enviar correo de notificación de respuesta (sin el contenido del mensaje)
      sendChatReplyEmail(receiver.email, sender.name || sender.username).catch(e => console.error('Error enviando email:', e));

      // Enviar notificación push (CON el contenido del mensaje)
      createNotification(receiver.id, {
        type: 'chat_message',
        title: `Nuevo mensaje de ${sender.name || sender.username}`,
        message: content,
        data: { url: '/asesoria' }
      }).catch(e => console.error('Error enviando push:', e));
    } else {
      // Es un cliente escribiendo al entrenador o admin
      sendNewClientMessageEmail(receiver.email, sender.name || sender.username).catch(e => console.error('Error enviando email:', e));
      
      createNotification(receiver.id, {
        type: 'chat_message',
        title: `Nuevo mensaje de cliente: ${sender.name || sender.username}`,
        message: content,
        data: { url: '/trainerPanel' }
      }).catch(e => console.error('Error enviando push:', e));

      // También notificamos a todos los admins
      const admins = await User.findAll({ where: { role: 'admin' } });
      admins.forEach(admin => {
        if (admin.id.toString() !== receiver.id.toString()) { // Si el receptor no es ya este admin
          sendNewClientMessageEmail(admin.email, sender.name || sender.username).catch(e => console.error('Error enviando email a admin:', e));
          
          createNotification(admin.id, {
            type: 'chat_message',
            title: `Mensaje de cliente: ${sender.name || sender.username}`,
            message: content,
            data: { url: '/trainerPanel' }
          }).catch(e => console.error('Error enviando push a admin:', e));
        }
      });
    }
  } catch (error) {
    console.error('Error en notifyUserIfNeeded:', error);
  }
};

export const getTrainerInfo = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const client = await User.findByPk(userId);

    if (!client) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    let trainer = null;

    if (client.trainer_id) {
      trainer = await User.findByPk(client.trainer_id, {
        attributes: ['id', 'username', 'name', 'profile_image_url', 'lastSeen']
      });
    }

    if (!trainer) {
      trainer = await User.findOne({
        where: { role: 'trainer' },
        attributes: ['id', 'username', 'name', 'profile_image_url', 'lastSeen']
      });
    }

    // Fallback a un admin si no hay entrenadores en el sistema
    if (!trainer) {
      trainer = await User.findOne({
        where: { role: 'admin' },
        attributes: ['id', 'username', 'name', 'profile_image_url', 'lastSeen']
      });
    }

    if (!trainer) {
      return res.status(404).json({ message: 'Entrenador no encontrado.' });
    }

    res.status(200).json(trainer);
  } catch (error) {
    console.error('Error al obtener info del entrenador:', error);
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { otherUserId } = req.params;

    const requestor = await User.findByPk(userId);
    const isAdmin = requestor && requestor.role === 'admin';

    let whereCondition;

    if (isAdmin) {
      // If admin, we want to see all messages this user has sent/received to/from ANY trainer or admin
      // But typically, just fetching all messages where otherUserId is involved, excluding themselves.
      // Or to be safe, fetch messages between otherUserId and ANY user who is admin or trainer.
      const trainersAndAdmins = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'trainer'] } },
        attributes: ['id']
      });
      const trainerAdminIds = trainersAndAdmins.map(u => u.id);

      whereCondition = {
        [Op.or]: [
          { sender_id: otherUserId, receiver_id: { [Op.in]: trainerAdminIds } },
          { sender_id: { [Op.in]: trainerAdminIds }, receiver_id: otherUserId }
        ]
      };
    } else {
      // If user is fetching their chat with a trainer, we show them messages 
      // they sent to ANY trainer/admin, and messages ANY trainer/admin sent to them,
      // so that admin replies appear in the same thread.
      const trainersAndAdmins = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'trainer'] } },
        attributes: ['id']
      });
      const trainerAdminIds = trainersAndAdmins.map(u => u.id);

      // Check if otherUserId is a trainer/admin. If so, it's the support thread.
      if (trainerAdminIds.includes(parseInt(otherUserId))) {
        whereCondition = {
          [Op.or]: [
            { sender_id: userId, receiver_id: { [Op.in]: trainerAdminIds } },
            { sender_id: { [Op.in]: trainerAdminIds }, receiver_id: userId }
          ]
        };
      } else {
        whereCondition = {
          [Op.or]: [
            { sender_id: userId, receiver_id: otherUserId },
            { sender_id: otherUserId, receiver_id: userId }
          ]
        };
      }
    }

    if (requestor && requestor.role === 'user') {
      whereCondition = {
        [Op.and]: [
          whereCondition,
          { [Op.or]: [{ is_closed: false }, { is_closed: null }] }
        ]
      };
    }

    const messages = await Message.findAll({
      where: whereCondition,
      order: [['created_at', 'ASC']],
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url', 'role'] }
      ]
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error al obtener historial de chat:', error);
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { receiverId, content } = req.body;

    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Faltan datos para enviar el mensaje.' });
    }

    const newMessage = await Message.create({
      sender_id: userId,
      receiver_id: receiverId,
      content: content.trim()
    });

    const populatedMessage = await Message.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url'] }
      ]
    });

    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });

    if (io) {
      io.to(receiverId.toString()).emit('chat_message', populatedMessage);
      admins.forEach(admin => {
        if (admin.id.toString() !== receiverId.toString() && admin.id.toString() !== userId.toString()) {
          io.to(admin.id.toString()).emit('chat_message', populatedMessage);
        }
      });
    }

    notifyUserIfNeeded(userId, receiverId, content.trim());

    // --- LOGICA DEL BOT RESPONDEDOR ---
    console.log('[BOT] Checking bot reply for userId:', userId, 'content:', content.trim().substring(0, 50));
    const requestor = await User.findByPk(userId);
    if (requestor && requestor.role === 'trainee') {
      const isRequestInfoMessage = content.trim().toLowerCase().includes('sin compromiso');
      console.log('[BOT] Is trainee:', true, 'isRequestInfoMessage:', isRequestInfoMessage);
      
      if (isRequestInfoMessage) {
        // Asegurar que solo se envíe una vez por usuario
        const hasReceivedBotReply = await Message.count({
          where: { receiver_id: userId, attachment_type: 'bot_reply' }
        });
        console.log('[BOT] hasReceivedBotReply:', hasReceivedBotReply);
        
        if (hasReceivedBotReply === 0) {
          // Es la solicitud de información sin compromiso, crear respuesta automática del bot
          const botContent = "Hola, tus mensajes son totalmente privados. Recibirás respuesta de tu entrenador en un máximo de 2 horas por lo general. Se te avisará por correo o [notificaciones push] cuando esto suceda.";
          const botMessage = await Message.create({
            sender_id: receiverId, // Lo envía nominalmente el entrenador
            receiver_id: userId,
            content: botContent,
            attachment_type: 'bot_reply'
          });
          console.log('[BOT] Bot message created with id:', botMessage.id);

          const populatedBotMessage = await Message.findByPk(botMessage.id, {
            include: [
              { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url'] }
            ]
          });

          // Enviar por socket
          if (io) {
            io.to(userId.toString()).emit('chat_message', populatedBotMessage);
            admins.forEach(admin => {
              if (admin.id.toString() !== userId.toString()) {
                io.to(admin.id.toString()).emit('chat_message', populatedBotMessage);
              }
            });
          }

          // Notificar al usuario (Push, Email, In-app) - como si fuera mensaje del trainer
          notifyUserIfNeeded(receiverId, userId, "Hola, tus mensajes son totalmente privados. Recibirás respuesta...");
        }
      }
    } else {
      console.log('[BOT] Skipped: user is not trainee or not found. role:', requestor?.role);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;
    const { content } = req.body;

    const requestor = await User.findByPk(userId);
    if (!requestor || (requestor.role !== 'admin' && requestor.role !== 'trainer')) {
      return res.status(403).json({ message: 'No tienes permiso para editar mensajes.' });
    }

    const message = await Message.findByPk(messageId, {
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url'] }
      ]
    });

    if (!message) return res.status(404).json({ message: 'Mensaje no encontrado.' });

    message.content = content.trim();
    await message.save();

    if (io) {
      io.to(message.sender_id.toString()).emit('message_edited', message);
      io.to(message.receiver_id.toString()).emit('message_edited', message);
      const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
      admins.forEach(admin => {
        io.to(admin.id.toString()).emit('message_edited', message);
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('Error al editar mensaje:', error);
    next(error);
  }
};

export const getTrainerClientsChats = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const requestor = await User.findByPk(userId);
    const isAdmin = requestor && requestor.role === 'admin';

    let clients = [];

    if (isAdmin) {
      const trainersAndAdmins = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'trainer'] } },
        attributes: ['id']
      });
      const trainerAdminIds = trainersAndAdmins.map(u => u.id);

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { sender_id: { [Op.in]: trainerAdminIds } },
            { receiver_id: { [Op.in]: trainerAdminIds } }
          ]
        },
        attributes: ['sender_id', 'receiver_id']
      });

      const prospectIds = new Set();
      messages.forEach(m => {
        if (!trainerAdminIds.includes(m.sender_id)) prospectIds.add(m.sender_id);
        if (!trainerAdminIds.includes(m.receiver_id)) prospectIds.add(m.receiver_id);
      });

      clients = await User.findAll({
        where: {
          [Op.or]: [
            { trainer_id: { [Op.not]: null } },
            { id: Array.from(prospectIds) }
          ],
          id: { [Op.ne]: userId },
          role: { [Op.not]: 'admin' } // Opcional, para no ver otros admins
        },
        attributes: ['id', 'username', 'name', 'profile_image_url', 'role', 'trainer_id', 'lastSeen']
      });
    } else {
      // 1. Obtener todos los IDs de usuarios con los que hay mensajes (prospects)
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ]
        },
        attributes: ['sender_id', 'receiver_id']
      });

      const prospectIds = new Set();
      messages.forEach(m => {
        if (String(m.sender_id) !== String(userId)) prospectIds.add(String(m.sender_id));
        if (String(m.receiver_id) !== String(userId)) prospectIds.add(String(m.receiver_id));
      });

      // 2. Obtener clientes asignados (trainees) y prospects (cualquier usuario que haya hablado)
      clients = await User.findAll({
        where: {
          [Op.or]: [
            { trainer_id: userId, role: 'trainee' },
            { id: Array.from(prospectIds) }
          ]
        },
        attributes: ['id', 'username', 'name', 'profile_image_url', 'role', 'trainer_id', 'lastSeen']
      });
    }

    // Load trainers to attach trainer name
    const trainerIds = [...new Set(clients.map(c => c.trainer_id).filter(Boolean))];
    const trainers = await User.findAll({
      where: { id: trainerIds },
      attributes: ['id', 'name']
    });
    const trainerMap = {};
    trainers.forEach(t => { trainerMap[t.id] = t.name; });

    // 2. Para cada cliente, obtener el último mensaje y el conteo de no leídos
    const trainersAndAdmins = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'trainer'] } },
      attributes: ['id']
    });
    const trainerAdminIds = trainersAndAdmins.map(u => u.id);

    const clientsWithChatData = await Promise.all(clients.map(async (client) => {
      let lastMessage;
      let unreadCount;

      if (isAdmin) {
        lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender_id: client.id, receiver_id: { [Op.in]: trainerAdminIds } },
              { sender_id: { [Op.in]: trainerAdminIds }, receiver_id: client.id }
            ]
          },
          order: [['created_at', 'DESC']]
        });

        unreadCount = await Message.count({
          where: {
            sender_id: client.id,
            receiver_id: { [Op.in]: trainerAdminIds },
            read_at: null
          }
        });
      } else {
        lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender_id: client.id, receiver_id: userId },
              { sender_id: userId, receiver_id: client.id }
            ]
          },
          order: [['created_at', 'DESC']]
        });

        unreadCount = await Message.count({
          where: {
            sender_id: client.id,
            receiver_id: userId,
            read_at: null
          }
        });
      }

      return {
        ...client.toJSON(),
        trainer_name: trainerMap[client.trainer_id] || null,
        lastMessage: lastMessage ? lastMessage.toJSON() : null,
        unreadCount
      };
    }));

    // Ordenar por mensajes no leídos primero, luego por la fecha del último mensaje
    clientsWithChatData.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });

    res.status(200).json(clientsWithChatData);
  } catch (error) {
    console.error('Error al obtener clientes y chats del entrenador:', error);
    next(error);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { otherUserId } = req.params;

    const requestor = await User.findByPk(userId);
    const isAdmin = requestor && requestor.role === 'admin';

    let whereCondition;

    if (isAdmin) {
      const trainersAndAdmins = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'trainer'] } },
        attributes: ['id']
      });
      const trainerAdminIds = trainersAndAdmins.map(u => u.id);

      whereCondition = {
        sender_id: otherUserId,
        receiver_id: { [Op.in]: trainerAdminIds },
        read_at: null
      };
    } else {
      whereCondition = {
        sender_id: otherUserId,
        receiver_id: userId,
        read_at: null
      };
    }

    const [affectedRows] = await Message.update(
      { read_at: new Date() },
      { where: whereCondition }
    );
    console.log(`markMessagesAsRead: sender=${otherUserId}, receiver=${userId}, affectedRows=${affectedRows}`);

    if (io) {
      io.to(otherUserId.toString()).emit('messages_read', { byUserId: userId });
      // Emit to all admins to sync the UI
      if (isAdmin) {
        const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
        admins.forEach(admin => {
          if (admin.id.toString() !== otherUserId.toString()) {
            io.to(admin.id.toString()).emit('messages_read', { byUserId: userId });
          }
        });
      }
    }

    res.status(200).json({ message: 'Mensajes marcados como leídos', affectedRows });
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    next(error);
  }
};

export const uploadAttachment = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { receiverId } = req.body;
    const file = req.file;

    if (!receiverId || !file) {
      return res.status(400).json({ message: 'Faltan datos para subir el archivo.' });
    }

    const sender = await User.findByPk(userId);
    if (!sender) {
      return res.status(404).json({ message: 'Usuario remitente no encontrado.' });
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${sender.username}_${dateStr}.mp4`;

    let uploadResult;
    try {
      uploadResult = await uploadVideoToCloudinary(file.buffer, fileName, file.mimetype, sender.username);
      
      // Log successful upload
      await UploadLog.create({
        uploader_id: userId,
        file_name: fileName,
        file_type: file.mimetype,
        status: 'success',
        cloudinary_url: uploadResult.webViewLink
      });

    } catch (uploadError) {
      // Log failed upload
      await UploadLog.create({
        uploader_id: userId,
        file_name: fileName,
        file_type: file.mimetype,
        status: 'error',
        error_message: uploadError.message || String(uploadError)
      });
      console.error('Error uploading to Cloudinary:', uploadError);
      return res.status(500).json({ message: 'Error al subir el archivo a Cloudinary.' });
    }

    const newMessage = await Message.create({
      sender_id: userId,
      receiver_id: receiverId,
      content: '🎥 Vídeo enviado',
      attachment_url: uploadResult.webViewLink,
      attachment_type: file.mimetype,
    });

    const populatedMessage = await Message.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url'] }
      ]
    });

    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });

    if (io) {
      io.to(receiverId.toString()).emit('chat_message', populatedMessage);
      admins.forEach(admin => {
        if (admin.id.toString() !== receiverId.toString() && admin.id.toString() !== userId.toString()) {
          io.to(admin.id.toString()).emit('chat_message', populatedMessage);
        }
      });
    }

    notifyUserIfNeeded(userId, receiverId, '🎥 Vídeo enviado');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error al subir adjunto de chat:', error);
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const requestor = await models.User.findByPk(userId);
    if (!requestor) return res.status(404).json({ message: 'Usuario no encontrado' });

    let unreadCount = 0;

    if (requestor.role === 'admin') {
      const trainersAndAdmins = await models.User.findAll({
        where: { role: { [Op.in]: ['admin', 'trainer'] } },
        attributes: ['id']
      });
      const trainerAdminIds = trainersAndAdmins.map(u => u.id);

      unreadCount = await models.Message.count({
        where: {
          receiver_id: { [Op.in]: trainerAdminIds },
          read_at: null
        }
      });
    } else {
      unreadCount = await models.Message.count({
        where: {
          receiver_id: userId,
          read_at: null
        }
      });
    }

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error al obtener contador de mensajes no leídos:', error);
    next(error);
  }
};


export const resendBotReminder = async (req, res) => {
  try {
    const { prospectId, level } = req.params;
    const parsedLevel = parseInt(level, 10);
    const models = (await import('../models/index.js')).default;
    const { User } = models;
    const prospect = await User.findByPk(prospectId);
    if (!prospect) return res.status(404).json({ error: 'Cliente no encontrado' });

    let title = '';
    let text = '';
    if (parsedLevel === 1) {
      title = '¿Continuamos con tu cambio?';
      text = 'Hola, he visto que dejaste el chat abierto. Si tienes cualquier duda sobre la asesoría o quieres empezar, ¡escríbeme por aquí y nos ponemos a ello!';
    } else if (parsedLevel === 2) {
      title = 'Aún estás a tiempo de empezar 💪';
      text = 'Solo te escribo para recordarte que sigo por aquí si necesitas ayuda para dar el primer paso. Si no estás interesado, no te preocupes.';
    } else if (parsedLevel === 3) {
      title = 'Último aviso antes de cerrar el chat ⏳';
      text = 'Si no recibo respuesta en 1 día, cerraré esta conversación para mantener el buzón limpio. Siempre podrás volver a solicitar asesoría más adelante.';
    } else {
      return res.status(400).json({ error: 'Nivel inválido' });
    }

    const status = { push: 'error', notification: 'error', email: 'error' };

    try {
      const { createNotification } = await import('../services/notificationService.js');
      await createNotification(prospect.id, {
        type: 'chat_message',
        title: title,
        message: text,
        data: { url: '/social' }
      });
      status.notification = 'ok';
      status.push = 'ok';
    } catch (e) {
      console.error('Error push/notif:', e);
    }

    try {
      const { sendBotReminderEmail } = await import('../services/emailService.js');
      await sendBotReminderEmail(prospect.email, prospect.name || prospect.username, parsedLevel);
      status.email = 'ok';
    } catch (e) {
      console.error('Error email:', e);
    }

    res.json({ message: 'Recordatorio reenviado', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
};

export const sendManualBotReminder = async (req, res) => {
  try {
    const { prospectId, level } = req.params;
    const trainerId = req.user.userId;
    const parsedLevel = parseInt(level, 10);

    const { User, Message } = models;
    const prospect = await User.findByPk(prospectId);
    if (!prospect) return res.status(404).json({ error: 'Cliente no encontrado' });

    let title = '';
    let text = '';
    if (parsedLevel === 1) {
      title = '¿Continuamos con tu cambio?';
      text = 'Hola, he visto que dejaste el chat abierto. Si tienes cualquier duda sobre la asesoría o quieres empezar, ¡escríbeme por aquí y nos ponemos a ello!';
    } else if (parsedLevel === 2) {
      title = 'Aún estás a tiempo de empezar 💪';
      text = 'Solo te escribo para recordarte que sigo por aquí si necesitas ayuda para dar el primer paso. Si no estás interesado, no te preocupes.';
    } else if (parsedLevel === 3) {
      title = 'Último aviso antes de cerrar el chat 🧹';
      text = 'Si no recibo respuesta en 1 día, cerraré esta conversación para mantener el buzón limpio. Siempre podrás volver a solicitar asesoría más adelante.';
    } else {
      return res.status(400).json({ error: 'Nivel invlido' });
    }

    const newMessage = await Message.create({
      sender_id: trainerId,
      receiver_id: prospect.id,
      content: text,
      bot_reminder_level: parsedLevel,
      attachment_type: 'bot_reply',
      created_at: new Date()
    });

    const status = { push: 'error', notification: 'error', email: 'error' };

    try {
      // In-app notification and push
      await createNotification(prospect.id, {
        type: 'chat_message',
        title: title,
        message: text,
        data: { url: '/social' } // Adjust URL if needed
      });
      status.notification = 'ok';
      status.push = 'ok';
    } catch (e) {
      console.error('Error push/notif:', e);
    }

    try {
      const { sendBotReminderEmail } = await import('../services/emailService.js');
      await sendBotReminderEmail(prospect.email, prospect.name || prospect.username, parsedLevel);
      status.email = 'ok';
    } catch (e) {
      console.error('Error email:', e);
    }

    if (io) {
      io.to(prospect.id.toString()).emit('chat_message', { type: 'refresh' });
      io.to(trainerId.toString()).emit('chat_message', { type: 'refresh' });
    }

    res.json({ message: 'Recordatorio enviado', status, newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};


export const runRetroactiveBotReplies = async () => {
  try {
    const requestMessages = await Message.findAll({
      where: {
        content: { [Op.like]: '%sin compromiso%' }
      }
    });

    console.log('[BOT-RETRO] Found', requestMessages.length, 'messages with "sin compromiso"');

    let sentCount = 0;
    for (const msg of requestMessages) {
      const senderId = msg.sender_id;
      const receiverId = msg.receiver_id;

      const hasBotReply = await Message.count({
        where: {
          receiver_id: senderId,
          attachment_type: 'bot_reply'
        }
      });

      if (hasBotReply === 0) {
        const botContent = "Hola, tus mensajes son totalmente privados. Recibirás respuesta de tu entrenador en un máximo de 2 horas por lo general. Se te avisará por correo o [notificaciones push] cuando esto suceda.";
        
        await Message.create({
          sender_id: receiverId,
          receiver_id: senderId,
          content: botContent,
          attachment_type: 'bot_reply'
        });

        // Notificar
        await notifyUserIfNeeded(receiverId, senderId, "Hola, tus mensajes son totalmente privados. Recibirás respuesta...");
        
        if (io) {
          io.to(senderId.toString()).emit('chat_message', { type: 'refresh' });
        }
        sentCount++;
        console.log('[BOT-RETRO] Sent bot reply to user', senderId);
      }
    }
    console.log('[BOT-RETRO] Completed. Sent', sentCount, 'retroactive bot replies.');
  } catch (error) {
    console.error('[BOT-RETRO] Error running retroactive bot replies:', error);
  }
};

const chatController = {
  getTrainerInfo,
  getChatHistory,
  sendMessage,
  getTrainerClientsChats,
  markMessagesAsRead,
  uploadAttachment,
  getUnreadCount,
  editMessage,
  runRetroactiveBotReplies,
sendManualBotReminder,
  resendBotReminder
};

export default chatController;



