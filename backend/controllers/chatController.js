/* backend/controllers/chatController.js */
import models from '../models/index.js';
import { Op } from 'sequelize';
import { io } from '../server.js';
import { uploadVideoToCloudinary } from '../services/cloudinaryService.js';

const { User, Message } = models;

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
        attributes: ['id', 'username', 'name', 'profile_image_url']
      });
    }

    if (!trainer) {
      trainer = await User.findOne({
        where: { role: 'trainer' },
        attributes: ['id', 'username', 'name', 'profile_image_url']
      });
    }

    // Fallback a un admin si no hay entrenadores en el sistema
    if (!trainer) {
      trainer = await User.findOne({
        where: { role: 'admin' },
        attributes: ['id', 'username', 'name', 'profile_image_url']
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

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: userId }
        ]
      },
      order: [['created_at', 'ASC']],
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url'] }
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

    // Emitir el evento al receptor a través de Sockets
    if (io) {
      // El receptor está en la sala con su propio ID
      io.to(receiverId.toString()).emit('chat_message', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    next(error);
  }
};

export const getTrainerClientsChats = async (req, res, next) => {
  try {
    const { userId } = req.user;

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
    const clients = await User.findAll({
      where: {
        [Op.or]: [
          { trainer_id: userId, role: 'trainee' },
          { id: Array.from(prospectIds) }
        ]
      },
      attributes: ['id', 'username', 'name', 'profile_image_url', 'role', 'trainer_id']
    });

    // 2. Para cada cliente, obtener el último mensaje y el conteo de no leídos
    const clientsWithChatData = await Promise.all(clients.map(async (client) => {
      // Último mensaje de la conversación (ya sea del cliente al entrenador o del entrenador al cliente)
      const lastMessage = await Message.findOne({
        where: {
          [Op.or]: [
            { sender_id: client.id, receiver_id: userId },
            { sender_id: userId, receiver_id: client.id }
          ]
        },
        order: [['created_at', 'DESC']]
      });

      // Conteo de mensajes no leídos (que el cliente mandó al entrenador y el entrenador no ha leído)
      const unreadCount = await Message.count({
        where: {
          sender_id: client.id,
          receiver_id: userId,
          read_at: null
        }
      });

      return {
        ...client.toJSON(),
        lastMessage,
        unreadCount
      };
    }));

    // 3. Ordenar: los que tienen mensajes más recientes primero
    clientsWithChatData.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json(clientsWithChatData);
  } catch (error) {
    console.error('Error al obtener lista de chats del entrenador:', error);
    next(error);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { userId } = req.user; // Este es el que lee (entrenador o cliente)
    const { otherUserId } = req.params; // Este es el que envió los mensajes

    const [affectedRows] = await Message.update(
      { read_at: new Date() },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: userId,
          read_at: null
        }
      }
    );
    console.log(`markMessagesAsRead: sender=${otherUserId}, receiver=${userId}, affectedRows=${affectedRows}`);

    if (io) {
      io.to(otherUserId.toString()).emit('messages_read', { byUserId: userId });
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

    const uploadResult = await uploadVideoToCloudinary(file.buffer, fileName, file.mimetype, sender.username);

    const newMessage = await Message.create({
      sender_id: userId,
      receiver_id: receiverId,
      content: '📹 Vídeo enviado',
      attachment_url: uploadResult.webViewLink,
      attachment_type: file.mimetype,
    });

    const populatedMessage = await Message.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profile_image_url'] }
      ]
    });

    if (io) {
      io.to(receiverId.toString()).emit('chat_message', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error al subir adjunto de chat:', error);
    next(error);
  }
};

const chatController = {
  getTrainerInfo,
  getChatHistory,
  sendMessage,
  getTrainerClientsChats,
  markMessagesAsRead,
  uploadAttachment
};

export default chatController;
