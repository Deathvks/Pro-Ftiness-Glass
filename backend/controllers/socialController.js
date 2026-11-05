/* backend/controllers/socialController.js */
import models from '../models/index.js';
import { Op } from 'sequelize';
import { createNotification } from '../services/notificationService.js';
import jwt from 'jsonwebtoken';
import { sanitizePlainText } from '../utils/sanitizer.js';

const { 
    User, Friendship, WorkoutLog, Routine, RoutineExercise, ExerciseList, 
    WorkoutLike, WorkoutComment, WorkoutLogDetail, WorkoutLogSet 
} = models;

const publicUserData = (user) => {
    if (!user) return user;
    const data = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    if (data.role === 'admin') {
        data.role = 'user';
        data.trainer_id = null;
        delete data.isAdmin;
        delete data.is_admin;
    }
    return data;
};

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 3) return res.json([]);

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
                    { id: { [Op.ne]: req.user.userId } },
                    { [Op.or]: searchConditions },
                    { is_public_profile: true } 
                ]
            },
            attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp', 'role', 'trainer_id'],
            limit: 20 
        });

        const results = users.map(user => ({
            id: user.id,
            username: user.username,
            profile_image_url: user.profile_image_url,
            level: user.show_level_xp ? user.level : null,
            xp: user.show_level_xp ? user.xp : null,
            role: user.role === 'admin' ? 'user' : user.role,
            trainer_id: user.role === 'admin' ? null : user.trainer_id
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

        const io = req.app.get('io');
        if (io) {
            io.to(targetUserId.toString()).emit('new_friend_request');
        }

        res.json({ success: true, message: 'Solicitud enviada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.userId;

        const received = await Friendship.findAll({
            where: {
                addressee_id: userId,
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'Requester',
                attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp', 'role', 'trainer_id']
            }]
        });

        const sent = await Friendship.findAll({
            where: {
                requester_id: userId,
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'Addressee',
                attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp', 'role', 'trainer_id']
            }]
        });

        const sanitizeUser = (user) => ({
            id: user.id,
            username: user.username,
            profile_image_url: user.profile_image_url,
            level: user.show_level_xp ? user.level : null,
            xp: user.show_level_xp ? user.xp : null,
            role: user.role === 'admin' ? 'user' : user.role,
            trainer_id: user.role === 'admin' ? null : user.trainer_id
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
        const { requestId, action } = req.body; 
        const friendship = await Friendship.findOne({
            where: { id: requestId, addressee_id: req.user.userId, status: 'pending' }
        });

        if (!friendship) return res.status(404).json({ error: 'Solicitud no encontrada' });

        if (action === 'accept') {
            friendship.status = 'accepted';
            await friendship.save();

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

            const io = req.app.get('io');
            if (io) {
                io.to(friendship.requester_id.toString()).emit('friend_request_accepted');
            }

            // Gamification Challenges for friends
            try {
                const { trackChallenge } = await import('../services/challengeService.js');
                const checkFriendsChallenge = async (uId) => {
                    const count = await Friendship.count({
                        where: { status: 'accepted', [Op.or]: [{ requester_id: uId }, { addressee_id: uId }] }
                    });
                    await trackChallenge(uId, 'social_add_1_friend', 1);
                    await trackChallenge(uId, 'social_add_3_friends', 1);
                    await trackChallenge(uId, 'social_add_5_friends', 1);
                };
                await checkFriendsChallenge(req.user.userId);
                await checkFriendsChallenge(friendship.requester_id);
            } catch (err) {
                console.error("Error tracking friend challenges:", err);
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
                { model: User, as: 'Requester', attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp', 'role', 'trainer_id'] },
                { model: User, as: 'Addressee', attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'show_level_xp', 'role', 'trainer_id'] }
            ]
        });

        const friends = friendships.map(f => {
            const friend = f.requester_id === userId ? f.Addressee : f.Requester;
            return {
                id: friend.id,
                username: friend.username,
                profile_image_url: friend.profile_image_url,
                level: friend.show_level_xp ? friend.level : null,
                xp: friend.show_level_xp ? friend.xp : null,
                role: friend.role === 'admin' ? 'user' : friend.role,
                trainer_id: friend.role === 'admin' ? null : friend.trainer_id
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
        
        let viewerId = req.user ? (req.user.userId || req.user.id) : null;
        
        if (!viewerId && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
                viewerId = decoded.userId || decoded.id;
            } catch (e) {
            }
        }

        const user = await User.findByPk(userId, {
            include: [
                { 
                    model: Routine, 
                    as: 'Routines', 
                    required: false,
                    include: [
                        {
                            model: RoutineExercise,
                            as: 'RoutineExercises',
                            attributes: ['id', 'name', 'image_url_start', 'video_url', 'exercise_order'],
                            include: [
                                {
                                    model: ExerciseList,
                                    attributes: ['image_url_start', 'video_url', 'image_url_end', 'images']
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        let isFriend = false;
        let isMe = false;

        if (viewerId) {
            isMe = String(userId) === String(viewerId);

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
                isFriend = true; 
            }
        }

        if (!user.is_public_profile && !isFriend && !isMe) {
            return res.status(403).json({ error: 'Este perfil es privado' });
        }

        const visibleRoutines = (user.Routines || []).filter(routine => {
            if (isMe) return true;
            if (routine.visibility === 'public') return true;
            if (isFriend && routine.visibility === 'friends') return true;
            
            return false;
        }).map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            image_url: r.image_url,
            folder: r.folder,
            visibility: r.visibility,
            downloads_count: r.downloads_count,
            exercises: (r.RoutineExercises || [])
                .sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
                .map(ex => ({
                    name: ex.name,
                    image_url: ex.image_url_start || (ex.ExerciseList ? ex.ExerciseList.image_url_start : null),
                    image_url_end: ex.ExerciseList ? ex.ExerciseList.image_url_end : null,
                    images: ex.ExerciseList ? ex.ExerciseList.images : null,
                    video_url: ex.video_url || (ex.ExerciseList ? ex.ExerciseList.video_url : null)
                }))
        }));

        let parsedGym = null;
        if (user.gym_data) {
            try {
                parsedGym = typeof user.gym_data === 'string' ? JSON.parse(user.gym_data) : user.gym_data;
            } catch (e) {
                parsedGym = null;
            }
        }

        const isGymVisible = user.show_gym !== false;

        const data = {
            id: user.id,
            username: user.username,
            profile_image_url: user.profile_image_url,
            role: isMe || user.role !== 'admin' ? user.role : 'user',
            trainer_id: isMe || user.role !== 'admin' ? user.trainer_id : null,
            is_friend: isFriend && !isMe, 
            is_me: isMe,
            bio: user.bio,
            createdAt: user.created_at,
            lastSeen: user.updated_at,
            show_level_xp: !!(user.show_level_xp || isMe), 
            show_badges: !!(user.show_badges || isMe),
            show_gym: isGymVisible,
            gym: (isGymVisible || isMe) ? parsedGym : null,     
            level: null,
            xp: null,
            streak: null,
            workoutsCount: 0,
            unlocked_badges: [],
            routines: visibleRoutines
        };

        if (data.show_level_xp) {
            data.level = user.level;
            data.xp = user.xp;
            data.streak = user.streak || 0;

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
        const users = await User.findAll({
            where: {
                is_public_profile: true,
                show_level_xp: true
            },
            order: [['xp', 'DESC']],
            limit: 50,
            attributes: ['id', 'username', 'profile_image_url', 'level', 'xp', 'streak', 'role', 'trainer_id']
        });
        res.json(users.map(publicUserData));
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

        const io = req.app.get('io');
        if (io) {
            io.to(friendId.toString()).emit('friend_removed');
        }

        res.json({ success: true, message: 'Amigo eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// OPTIMIZACIÓN: NUEVA FUNCIÓN DEL FEED (GLOBAL / MI GIMNASIO / AMIGOS)
// ==========================================

const parseGymDataSafe = (raw) => {
    if (!raw) return null;
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === 'object' && (parsed.name || parsed.city) ? parsed : null;
    } catch {
        return null;
    }
};

const normalizeGymString = (str) =>
    String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const calculateGymDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const aLat = parseFloat(lat1);
    const aLon = parseFloat(lon1);
    const bLat = parseFloat(lat2);
    const bLon = parseFloat(lon2);
    if (!Number.isFinite(aLat) || !Number.isFinite(aLon) || !Number.isFinite(bLat) || !Number.isFinite(bLon)) {
        return null;
    }
    const R = 6371e3;
    const p1 = (aLat * Math.PI) / 180;
    const p2 = (bLat * Math.PI) / 180;
    const dp = ((bLat - aLat) * Math.PI) / 180;
    const dl = ((bLon - aLon) * Math.PI) / 180;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const classifyGymMatchType = (myGym, otherGym) => {
    if (!myGym || !otherGym) return null;

    if (myGym.id && otherGym.id && String(myGym.id) === String(otherGym.id)) {
        return 'same_gym';
    }

    const dist = calculateGymDistanceMeters(myGym.lat, myGym.lng, otherGym.lat, otherGym.lng);
    if (dist !== null && dist <= 320) {
        return 'same_gym';
    }

    const normMyName = normalizeGymString(myGym.name);
    const normOtherName = normalizeGymString(otherGym.name);
    const normMyCity = normalizeGymString(myGym.city);
    const normOtherCity = normalizeGymString(otherGym.city);

    if (normMyName && normOtherName && normMyName === normOtherName) {
        if (!normMyCity || !normOtherCity || normMyCity === normOtherCity || (dist !== null && dist <= 3000)) {
            return 'same_gym';
        }
    }

    if (
        normMyCity &&
        normOtherCity &&
        (normMyCity === normOtherCity ||
            (normMyCity.length >= 4 && normOtherCity.includes(normMyCity)) ||
            (normOtherCity.length >= 4 && normMyCity.includes(normOtherCity)))
    ) {
        return 'same_city';
    }

    if (dist !== null && dist <= 20000) {
        return 'same_city';
    }

    return null;
};

export const getFeed = async (req, res) => {
    try {
        const userId = req.user.userId;
        const requestedScope = String(req.query.scope || 'global').toLowerCase();
        const scope = ['global', 'gym', 'friends'].includes(requestedScope) ? requestedScope : 'global';
        const gymSubFilter = String(req.query.gymFilter || 'all').toLowerCase();
        const includeOlder = req.query.includeOlder === 'true' || req.query.all === 'true';

        // 1. Obtener relaciones de amistad (aceptadas y pendientes) y datos del propio usuario
        const [allFriendships, currentUser] = await Promise.all([
            Friendship.findAll({
                where: {
                    [Op.or]: [{ requester_id: userId }, { addressee_id: userId }]
                },
                attributes: ['requester_id', 'addressee_id', 'status']
            }),
            User.findByPk(userId, {
                attributes: ['id', 'username', 'gym_data', 'show_gym', 'is_public_profile']
            })
        ]);

        const friendIds = [];
        const pendingIdsSet = new Set();
        allFriendships.forEach(f => {
            const otherId = f.requester_id === userId ? f.addressee_id : f.requester_id;
            if (f.status === 'accepted') {
                friendIds.push(otherId);
            } else if (f.status === 'pending') {
                pendingIdsSet.add(otherId);
            }
        });
        const friendIdsSet = new Set(friendIds);
        const friendsAndSelfIds = Array.from(new Set([...friendIds, userId]));

        const myGym = parseGymDataSafe(currentUser?.gym_data);

        // 2. Resolver usuarios objetivo y metadatos de gimnasio según el filtro (scope)
        let targetUserIds = friendsAndSelfIds;
        let gymMeta = {
            hasGym: !!myGym,
            myGym: myGym
                ? {
                      id: myGym.id || null,
                      name: myGym.name || null,
                      city: myGym.city || null,
                      address: myGym.address || null,
                      isVerified: !!myGym.isVerified
                  }
                : null,
            sameGymCount: 0,
            sameCityCount: 0,
            gymMembers: []
        };

        const userGymMatchMap = new Map();

        if (myGym) {
            userGymMatchMap.set(userId, 'same_gym');
            const usersWithGym = await User.findAll({
                where: {
                    gym_data: { [Op.ne]: null }
                },
                attributes: [
                    'id',
                    'username',
                    'profile_image_url',
                    'level',
                    'xp',
                    'streak',
                    'show_level_xp',
                    'role',
                    'trainer_id',
                    'gym_data',
                    'show_gym',
                    'is_public_profile'
                ]
            });

            const sameGymUserIds = [userId];
            const sameCityUserIds = [];
            const gymMembersList = [];

            usersWithGym.forEach(u => {
                if (u.id === userId) return;
                const isFriend = friendIdsSet.has(u.id);
                if (!u.is_public_profile && !isFriend) return;
                if (u.show_gym === false && !isFriend) return;

                const uGym = parseGymDataSafe(u.gym_data);
                if (!uGym) return;

                const matchType = classifyGymMatchType(myGym, uGym);
                if (!matchType) return;

                userGymMatchMap.set(u.id, matchType);
                if (matchType === 'same_gym') {
                    sameGymUserIds.push(u.id);
                } else if (matchType === 'same_city') {
                    sameCityUserIds.push(u.id);
                }

                const cleanUser = publicUserData(u);
                gymMembersList.push({
                    id: cleanUser.id,
                    username: cleanUser.username,
                    profile_image_url: cleanUser.profile_image_url,
                    level: cleanUser.show_level_xp ? cleanUser.level : null,
                    xp: cleanUser.show_level_xp ? cleanUser.xp : null,
                    streak: cleanUser.streak || 0,
                    role: cleanUser.role,
                    trainer_id: cleanUser.trainer_id,
                    gymName: uGym.name || null,
                    gymCity: uGym.city || null,
                    matchType,
                    isFriend,
                    hasPendingRequest: pendingIdsSet.has(u.id)
                });
            });

            gymMembersList.sort((a, b) => {
                if (a.matchType === 'same_gym' && b.matchType !== 'same_gym') return -1;
                if (b.matchType === 'same_gym' && a.matchType !== 'same_gym') return 1;
                return (b.streak || 0) - (a.streak || 0) || (b.xp || 0) - (a.xp || 0);
            });

            gymMeta.sameGymCount = sameGymUserIds.length - 1;
            gymMeta.sameCityCount = sameCityUserIds.length;
            gymMeta.gymMembers = gymMembersList.slice(0, 24);

            if (scope === 'gym') {
                if (gymSubFilter === 'same_gym') {
                    targetUserIds = Array.from(new Set(sameGymUserIds));
                } else if (gymSubFilter === 'same_city') {
                    targetUserIds = Array.from(new Set([...sameCityUserIds, userId]));
                } else {
                    targetUserIds = Array.from(new Set([...sameGymUserIds, ...sameCityUserIds]));
                }
            }
        } else if (scope === 'gym') {
            targetUserIds = [];
        }

        if (scope === 'global') {
            const publicUsers = await User.findAll({
                where: { is_public_profile: true },
                attributes: ['id']
            });
            targetUserIds = Array.from(new Set([...publicUsers.map(u => u.id), userId]));
        }

        if (scope === 'gym' && !myGym) {
            res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
            return res.json({
                feed: [],
                hasOlder: false,
                scope,
                gymMeta
            });
        }

        // Ventana de 7 días hacia atrás para optimizar el rendimiento del muro
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Reglas estrictas de privacidad del muro:
        // - Global: SOLO entrenamientos en "Todo el mundo" (visibility === 'public')
        // - Mi Gimnasio: entrenamientos en "Todo el mundo" (visibility === 'public'), o en "Solo Amigos" si además ese compañero ya es tu amigo
        // - Amigos: entrenamientos de tus amigos y tuyos en "Solo Amigos" ('friends') o "Todo el mundo" ('public')
        const buildWhereClause = (withDateLimit, isOlderCheck = false) => {
            const safeTargetIds = targetUserIds.length > 0 ? targetUserIds : [-1];
            let clause;

            if (scope === 'friends') {
                clause = {
                    user_id: { [Op.in]: safeTargetIds },
                    [Op.or]: [{ visibility: 'friends' }, { visibility: 'public' }, { visibility: null }]
                };
            } else if (scope === 'gym') {
                const gymFriendIds = safeTargetIds.filter(id => friendIdsSet.has(id) || id === userId);
                if (gymFriendIds.length > 0) {
                    clause = {
                        [Op.or]: [
                            {
                                user_id: { [Op.in]: safeTargetIds },
                                visibility: 'public'
                            },
                            {
                                user_id: { [Op.in]: gymFriendIds },
                                [Op.or]: [{ visibility: 'friends' }, { visibility: 'public' }, { visibility: null }]
                            }
                        ]
                    };
                } else {
                    clause = {
                        user_id: { [Op.in]: safeTargetIds },
                        visibility: 'public'
                    };
                }
            } else {
                // scope === 'global' -> exclusivamente entrenamientos marcados como "Todo el mundo" ('public')
                clause = {
                    user_id: { [Op.in]: safeTargetIds },
                    visibility: 'public'
                };
            }

            if (isOlderCheck) {
                clause.workout_date = { [Op.lt]: sevenDaysAgo };
            } else if (withDateLimit) {
                clause.workout_date = { [Op.gte]: sevenDaysAgo };
            }
            return clause;
        };

        const queryLogs = async (withDateLimit, limitCount) =>
            WorkoutLog.findAll({
                where: buildWhereClause(withDateLimit),
                order: [
                    ['workout_date', 'DESC'],
                    [{ model: WorkoutComment, as: 'Comments' }, 'created_at', 'ASC']
                ],
                limit: limitCount,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: [
                            'id',
                            'username',
                            'profile_image_url',
                            'streak',
                            'level',
                            'xp',
                            'show_level_xp',
                            'role',
                            'trainer_id',
                            'gym_data',
                            'show_gym',
                            'is_public_profile'
                        ]
                    },
                    {
                        model: Routine,
                        as: 'routine',
                        attributes: ['id', 'name', 'image_url', 'folder'],
                        include: [
                            {
                                model: RoutineExercise,
                                as: 'RoutineExercises',
                                attributes: ['name', 'image_url_start'],
                                include: [
                                    {
                                        model: ExerciseList,
                                        attributes: ['image_url_start']
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: WorkoutLogDetail,
                        as: 'WorkoutLogDetails',
                        include: [
                            {
                                model: WorkoutLogSet,
                                as: 'WorkoutLogSets',
                                attributes: ['weight_kg', 'reps', 'set_number']
                            }
                        ]
                    },
                    {
                        model: WorkoutLike,
                        as: 'Likes',
                        attributes: ['id', 'user_id']
                    },
                    {
                        model: WorkoutComment,
                        as: 'Comments',
                        attributes: ['id', 'comment', 'created_at', 'user_id'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['id', 'username', 'profile_image_url', 'role', 'trainer_id']
                            }
                        ]
                    }
                ]
            });

        let effectiveIncludeOlder = includeOlder;
        let logs = await queryLogs(!effectiveIncludeOlder, effectiveIncludeOlder ? 50 : 25);

        // Si no hay entrenos en los últimos 7 días, traemos automáticamente los anteriores para evitar la sala vacía
        if (logs.length === 0 && !effectiveIncludeOlder && targetUserIds.length > 0) {
            const fallbackLogs = await queryLogs(false, 25);
            if (fallbackLogs.length > 0) {
                logs = fallbackLogs;
                effectiveIncludeOlder = true;
            }
        }

        // 3. OPTIMIZACIÓN MASIVA: Obtener SOLO los nombres de ejercicios presentes en ESTOS entrenamientos
        const uniqueExerciseNamesInFeed = new Set();
        logs.forEach(log => {
            if (log.WorkoutLogDetails) {
                log.WorkoutLogDetails.forEach(detail => {
                    if (detail.exercise_name) {
                        uniqueExerciseNamesInFeed.add(detail.exercise_name);
                    }
                });
            }
        });

        const relevantExercises =
            uniqueExerciseNamesInFeed.size > 0
                ? await ExerciseList.findAll({
                      where: {
                          name: { [Op.in]: Array.from(uniqueExerciseNamesInFeed) }
                      },
                      attributes: ['name', 'image_url_start', 'video_url']
                  })
                : [];

        const exerciseDictionary = {};
        relevantExercises.forEach(ex => {
            exerciseDictionary[ex.name.toLowerCase()] = ex;
        });

        const formattedFeed = logs.map(log => {
            const logData = log.toJSON();
            const likes = logData.Likes || [];
            const rawAuthor = logData.user || {};
            const isMe = logData.user_id === userId;
            const isFriend = friendIdsSet.has(logData.user_id);

            const parsedAuthorGym =
                rawAuthor.show_gym !== false || isMe ? parseGymDataSafe(rawAuthor.gym_data) : null;

            const gymMatchType =
                userGymMatchMap.get(logData.user_id) ||
                (myGym && parsedAuthorGym ? classifyGymMatchType(myGym, parsedAuthorGym) : null);

            const sanitizedAuthor = publicUserData(rawAuthor);
            if (sanitizedAuthor) {
                delete sanitizedAuthor.gym_data;
                sanitizedAuthor.level = sanitizedAuthor.show_level_xp ? sanitizedAuthor.level : null;
                sanitizedAuthor.xp = sanitizedAuthor.show_level_xp ? sanitizedAuthor.xp : null;
                sanitizedAuthor.gym_name = parsedAuthorGym?.name || null;
                sanitizedAuthor.gym_city = parsedAuthorGym?.city || null;
                sanitizedAuthor.gym_verified = !!parsedAuthorGym?.isVerified;
                sanitizedAuthor.gym_match_type = gymMatchType;
                sanitizedAuthor.is_friend = isFriend;
                sanitizedAuthor.has_pending_request = pendingIdsSet.has(logData.user_id);
            }

            logData.user = sanitizedAuthor;
            logData.Comments = (logData.Comments || []).map(comment => ({
                ...comment,
                user: publicUserData(comment.user)
            }));

            if (logData.WorkoutLogDetails) {
                logData.WorkoutLogDetails = logData.WorkoutLogDetails.map(detail => {
                    const matchingEx = exerciseDictionary[detail.exercise_name?.toLowerCase()];

                    let validSets = [];
                    if (detail.WorkoutLogSets) {
                        validSets = detail.WorkoutLogSets
                            .filter(s => parseFloat(s.weight_kg) > 0 || parseInt(s.reps) > 0)
                            .sort((a, b) => a.set_number - b.set_number);
                    }

                    return {
                        ...detail,
                        image_url: matchingEx ? matchingEx.image_url_start : null,
                        video_url: matchingEx ? matchingEx.video_url : null,
                        WorkoutLogSets: validSets
                    };
                });
            }

            return {
                ...logData,
                likesCount: likes.length,
                hasLiked: likes.some(like => like.user_id === userId)
            };
        });

        // Comprobar si existen publicaciones más antiguas de 7 días disponibles
        let hasOlderPosts = false;
        if (!effectiveIncludeOlder && targetUserIds.length > 0) {
            const olderLog = await WorkoutLog.findOne({
                where: buildWhereClause(false, true),
                attributes: ['id']
            });
            hasOlderPosts = !!olderLog;
        }

        res.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=45');
        res.json({
            feed: formattedFeed,
            hasOlder: hasOlderPosts,
            isShowingOlder: effectiveIncludeOlder,
            scope,
            gymMeta
        });
    } catch (error) {
        console.error("Error en getFeed:", error);
        res.status(500).json({ error: error.message });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const { workoutId } = req.params;
        const userId = req.user.userId;
        const io = req.app.get('io');

        const existingLike = await WorkoutLike.findOne({
            where: { user_id: userId, workout_id: workoutId }
        });

        if (existingLike) {
            await existingLike.destroy();
            // OPTIMIZACIÓN WEB SOCKET: Enviamos solo a los amigos que tengan el muro abierto, o a nadie si queremos silenciarlo.
            // Para simplificar y ahorrar CPU del servidor de websockets, lo quitamos, 
            // el usuario que le de a like lo verá en su pantalla igual por React state.
            return res.json({ success: true, liked: false });
        } else {
            await WorkoutLike.create({ user_id: userId, workout_id: workoutId });
            
            // Notificar al dueño del entrenamiento (si no soy yo mismo)
            const workout = await WorkoutLog.findByPk(workoutId);
            if (workout && workout.user_id !== userId) {
                const liker = await User.findByPk(userId, { attributes: ['username'] });
                await createNotification(workout.user_id, {
                    type: 'success',
                    title: '¡Nuevo Me gusta!',
                    message: `A ${liker.username} le ha gustado tu entrenamiento.`,
                    data: { url: `/social?tab=feed` }
                });
                
                // Si tienes io, avísale solo a ÉL para actualizar la campana.
                if (io) io.to(workout.user_id.toString()).emit('feed_update');
            }

            // Gamification
            try {
                const { trackChallenge } = await import('../services/challengeService.js');
                await trackChallenge(userId, 'social_like_post', 1);
            } catch (err) {}

            return res.json({ success: true, liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const { workoutId } = req.params;
        const { comment } = req.body;
        const userId = req.user.userId;
        const io = req.app.get('io');

        if (!comment || !sanitizePlainText(comment)) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío' });
        }

        const newComment = await WorkoutComment.create({
            user_id: userId,
            workout_id: workoutId,
            comment: sanitizePlainText(comment)
        });

        // Cargar usuario para devolver el comentario completo al frontend
        const commentWithUser = await WorkoutComment.findByPk(newComment.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'profile_image_url']
            }]
        });

        // Notificar al dueño
        const workout = await WorkoutLog.findByPk(workoutId);
        if (workout && workout.user_id !== userId) {
            const commenter = await User.findByPk(userId, { attributes: ['username'] });
            await createNotification(workout.user_id, {
                type: 'info',
                title: 'Nuevo comentario',
                message: `${commenter.username} ha comentado en tu entrenamiento.`,
                data: { url: `/social?tab=feed` }
            });
            if (io) io.to(workout.user_id.toString()).emit('feed_update');
        }

        // Gamification
        try {
            const { trackChallenge } = await import('../services/challengeService.js');
            await trackChallenge(userId, 'social_comment_post', 1);
        } catch (err) {}

        res.json(commentWithUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const comment = await WorkoutComment.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comentario no encontrado' });
        }

        // Permitir borrar si es el autor del comentario, o si es el dueño del entrenamiento
        const workout = await WorkoutLog.findByPk(comment.workout_id);
        const isWorkoutOwner = workout && workout.user_id === userId;

        // Comprobación de si el usuario es administrador
        const user = await User.findByPk(userId, { attributes: ['role'] });
        const isAdmin = user && user.role === 'admin';

        if (comment.user_id !== userId && !isWorkoutOwner && !isAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para borrar este comentario' });
        }

        await comment.destroy();
        
        res.json({ success: true, message: 'Comentario eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
