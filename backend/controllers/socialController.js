/* backend/controllers/socialController.js */
import models from '../models/index.js';
import { Op } from 'sequelize';
import { createNotification } from '../services/notificationService.js';

const { User, Friendship, WorkoutLog } = models;

export const searchUsers = async (req, res) => {
    try {
        // Esta ruta está protegida, req.user existe
        const { query } = req.query;
        if (!query || query.length < 3) return res.json([]);

        // Permitir búsqueda flexible (con y sin espacios)
        const cleanQuery = query.replace(/\s+/g, '');

        const searchConditions = [
            { username: { [Op.like]: `%${query}%` } }
        ];

        if (cleanQuery !== query && cleanQuery.length >= 3) {
            searchConditions.push({ username: { [Op.like]: `%${cleanQuery}%` } });
        }

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: req.user.userId } }, // No mostrarse a sí mismo
                    { [Op.or]: searchConditions },
                    { is_public_profile: true } // Solo buscar usuarios que sean públicos (Opcional, según preferencia)
                ]
            },
            attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp'],
            limit: 20 // Limitar resultados por seguridad/rendimiento
        });

        const results = users.map(user => ({
            id: user.id,
            username: user.username,
            profile_image_url: user.profile_image_url,
            level: user.show_level_xp ? user.level : null,
            xp: user.show_level_xp ? user.xp : null
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const requesterId = req.user.userId;

        if (requesterId == targetUserId) return res.status(400).json({ error: 'No puedes añadirte a ti mismo' });

        const existing = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { requester_id: requesterId, addressee_id: targetUserId },
                    { requester_id: targetUserId, addressee_id: requesterId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'accepted') return res.status(400).json({ error: 'Ya sois amigos' });
            return res.status(400).json({ error: 'Solicitud ya pendiente' });
        }

        await Friendship.create({
            requester_id: requesterId,
            addressee_id: targetUserId,
            status: 'pending'
        });

        // Notificación al destinatario
        const requester = await User.findByPk(requesterId, { attributes: ['username'] });
        if (requester) {
            await createNotification(targetUserId, {
                type: 'info',
                title: 'Solicitud de amistad',
                message: `${requester.username} quiere ser tu amigo.`,
                data: {
                    type: 'friend_request',
                    senderId: requesterId,
                    url: `/social?tab=requests&highlight=${requesterId}`
                }
            });
        }

        res.json({ success: true, message: 'Solicitud enviada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Obtener solicitudes RECIBIDAS (Alguien me añadió a mí)
        const received = await Friendship.findAll({
            where: {
                addressee_id: userId,
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'Requester',
                attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp']
            }]
        });

        // 2. Obtener solicitudes ENVIADAS (Yo añadí a alguien)
        const sent = await Friendship.findAll({
            where: {
                requester_id: userId,
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'Addressee',
                attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp']
            }]
        });

        // Helper para sanitizar usuario
        const sanitizeUser = (user) => ({
            id: user.id,
            username: user.username,
            profile_image_url: user.profile_image_url,
            level: user.show_level_xp ? user.level : null,
            xp: user.show_level_xp ? user.xp : null
        });

        const formattedReceived = received.map(req => ({
            id: req.id,
            status: req.status,
            createdAt: req.createdAt,
            Requester: sanitizeUser(req.Requester),
            requester_id: req.requester_id,
            addressee_id: req.addressee_id
        }));

        const formattedSent = sent.map(req => ({
            id: req.id,
            status: req.status,
            createdAt: req.createdAt,
            Addressee: sanitizeUser(req.Addressee),
            requester_id: req.requester_id,
            addressee_id: req.addressee_id
        }));

        res.json({
            received: formattedReceived,
            sent: formattedSent
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const respondFriendRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body; // 'accept' | 'reject'
        const friendship = await Friendship.findOne({
            where: { id: requestId, addressee_id: req.user.userId, status: 'pending' }
        });

        if (!friendship) return res.status(404).json({ error: 'Solicitud no encontrada' });

        if (action === 'accept') {
            friendship.status = 'accepted';
            await friendship.save();

            // Notificación al solicitante original
            const acceptor = await User.findByPk(req.user.userId, { attributes: ['username'] });
            if (acceptor) {
                await createNotification(friendship.requester_id, {
                    type: 'success',
                    title: 'Solicitud aceptada',
                    message: `${acceptor.username} aceptó tu solicitud de amistad.`,
                    data: {
                        type: 'friend_request_accepted',
                        userId: req.user.userId,
                        url: `/social?tab=friends&highlight=${req.user.userId}`
                    }
                });
            }

            res.json({ success: true, message: 'Amigo añadido' });
        } else {
            await friendship.destroy();
            res.json({ success: true, message: 'Solicitud eliminada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFriends = async (req, res) => {
    try {
        const userId = req.user.userId;
        const friendships = await Friendship.findAll({
            where: {
                [Op.or]: [{ requester_id: userId }, { addressee_id: userId }],
                status: 'accepted'
            },
            include: [
                { model: User, as: 'Requester', attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp'] },
                { model: User, as: 'Addressee', attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp'] }
            ]
        });

        const friends = friendships.map(f => {
            const friend = f.requester_id === userId ? f.Addressee : f.Requester;
            return {
                id: friend.id,
                username: friend.username,
                profile_image_url: friend.profile_image_url,
                level: friend.show_level_xp ? friend.level : null,
                xp: friend.show_level_xp ? friend.xp : null
            };
        });

        res.json(friends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Manejo seguro de viewerId (puede ser null si es acceso público)
        const viewerId = req.user ? req.user.userId : null;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        let isFriend = false;
        let isMe = false;

        // Solo verificamos amistad si hay un usuario logueado
        if (viewerId) {
            isMe = parseInt(userId) === viewerId;

            if (!isMe) {
                const friendship = await Friendship.findOne({
                    where: {
                        [Op.or]: [
                            { requester_id: viewerId, addressee_id: userId },
                            { requester_id: userId, addressee_id: viewerId }
                        ],
                        status: 'accepted'
                    }
                });
                isFriend = !!friendship;
            } else {
                // Si soy yo, técnicamente no soy mi "amigo", pero tengo acceso total
                isFriend = true; 
            }
        }

        // Reglas de acceso:
        // 1. Si el perfil es público -> Acceso permitido
        // 2. Si soy yo -> Acceso permitido
        // 3. Si somos amigos -> Acceso permitido
        // Si no se cumple ninguna -> Acceso denegado
        if (!user.is_public_profile && !isFriend && !isMe) {
            return res.status(403).json({ error: 'Este perfil es privado' });
        }

        const data = {
            id: user.id,
            username: user.username,
            profile_image_url: user.profile_image_url,
            is_friend: isFriend && !isMe, // Para mostrar botón "Amigo" o no
            is_me: isMe,
            bio: user.bio,
            createdAt: user.created_at,
            lastSeen: user.updated_at,
            show_level_xp: !!(user.show_level_xp || isMe), // Yo siempre veo mi XP
            show_badges: !!(user.show_badges || isMe),     // Yo siempre veo mis insignias
            
            // Datos condicionales
            level: null,
            xp: null,
            streak: null,
            workoutsCount: 0,
            unlocked_badges: []
        };

        if (data.show_level_xp) {
            data.level = user.level;
            data.xp = user.xp;
            data.streak = user.streak || 0;

            // Contamos los entrenamientos de forma segura
            data.workoutsCount = await WorkoutLog.count({
                where: { user_id: user.id }
            });
        }

        if (data.show_badges) {
            try {
                data.unlocked_badges = typeof user.unlocked_badges === 'string' 
                    ? JSON.parse(user.unlocked_badges) 
                    : (user.unlocked_badges || []);
            } catch (e) {
                data.unlocked_badges = [];
            }
        }

        res.json(data);
    } catch (error) {
        console.error("Error en getPublicProfile:", error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        // Solo usuarios públicos que muestren su nivel explícitamente
        const users = await User.findAll({
            where: {
                is_public_profile: true,
                show_level_xp: true
            },
            order: [['xp', 'DESC']],
            limit: 50,
            attributes: ['id', 'username', 'profile_image_url', 'level', 'xp']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.userId;

        await Friendship.destroy({
            where: {
                [Op.or]: [
                    { requester_id: userId, addressee_id: friendId },
                    { requester_id: friendId, addressee_id: userId }
                ],
                status: 'accepted'
            }
        });
        res.json({ success: true, message: 'Amigo eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};