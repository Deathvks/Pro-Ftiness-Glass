/* backend/controllers/storyController.js */
import { Op } from 'sequelize';
import models from '../models/index.js';
import { processUploadedFile } from '../services/uploadService.js';
import { deleteFile } from '../services/imageService.js';

const { Story, User, StoryLike, StoryView, Friendship } = models;

/**
 * Helper para obtener IDs de amigos (Optimizado: solo devuelve array de enteros)
 */
const getFriendIds = async (userId) => {
    if (!userId) return [];
    
    const friendships = await Friendship.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [{ requester_id: userId }, { addressee_id: userId }]
        },
        attributes: ['requester_id', 'addressee_id'],
        raw: true // Ahorro de memoria
    });

    return friendships.map(f => 
        f.requester_id === userId ? f.addressee_id : f.requester_id
    );
};

export const createStory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { privacy = 'friends', isHDR } = req.body; 

        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }

        const isHDRBoolean = isHDR === 'true';

        // 1. Procesar archivo (Compresión y NSFW)
        let processedResult;
        try {
            processedResult = await processUploadedFile(req.file, isHDRBoolean);
        } catch (uploadError) {
            // Si falla el procesado (ej: NSFW), borramos el temporal si quedó
            if (req.file) await deleteFile(req.file.path).catch(() => {});
            
            if (uploadError.message && (uploadError.message.includes('rechazada') || uploadError.message.includes('inapropiado'))) {
                return res.status(400).json({ error: uploadError.message });
            }
            throw uploadError;
        }
        
        const isVideo = req.file.mimetype.startsWith('video/');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 2. Crear registro en BD
        const newStory = await Story.create({
            user_id: userId,
            url: processedResult.url,
            type: isVideo ? 'video' : 'image',
            privacy: privacy,
            is_hdr: processedResult.isHDR, 
            expires_at: expiresAt
        });

        // 3. Preparar respuesta optimizada
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'profile_image_url'],
            raw: true
        });

        const storyResponse = {
            id: newStory.id,
            url: newStory.url,
            type: newStory.type,
            privacy: newStory.privacy,
            isHDR: newStory.is_hdr,
            createdAt: newStory.created_at,
            expiresAt: newStory.expires_at,
            likes: [], 
            isLiked: false,
            viewed: false,
            userId: user.id,
            username: user.username,
            avatar: user.profile_image_url
        };

        // 4. Emitir evento Socket (Solo si hay clientes escuchando)
        const io = req.app.get('io');
        if (io) {
            io.emit('new_story', {
                story: storyResponse,
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.profile_image_url
                }
            });
        }

        res.status(201).json({ message: 'Historia creada', story: storyResponse });

    } catch (error) {
        console.error('Error creando historia:', error);
        res.status(500).json({ error: 'Error al subir la historia. Inténtalo de nuevo.' });
    }
};

export const getStories = async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        // Obtener IDs de amigos y añadir al propio usuario para ver sus historias
        const friendIds = await getFriendIds(userId);
        
        // Optimización: Traer solo historias válidas con eager loading controlado
        const stories = await Story.findAll({
            where: {
                expires_at: { [Op.gt]: now },
                [Op.or]: [
                    { user_id: userId }, // Mis historias
                    { privacy: 'public' }, // Públicas de todos
                    { 
                        privacy: 'friends', 
                        user_id: { [Op.in]: friendIds } // De amigos
                    }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'profile_image_url']
                },
                {
                    model: StoryLike,
                    as: 'likes',
                    attributes: ['user_id'], // Solo necesitamos IDs para contar y ver si di like
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'profile_image_url']
                    }]
                },
                {
                    model: StoryView,
                    as: 'views',
                    attributes: ['user_id'],
                    where: { user_id: userId },
                    required: false 
                }
            ],
            order: [['created_at', 'ASC']]
        });

        // Agrupación en memoria (CPU bound, rápido en Node)
        const groupedStories = {};

        for (const story of stories) {
            const u = story.user;
            if (!u) continue; // Skip si usuario borrado

            if (!groupedStories[u.id]) {
                groupedStories[u.id] = {
                    userId: u.id,
                    username: u.username,
                    avatar: u.profile_image_url,
                    hasUnseen: false,
                    items: []
                };
            }

            const isLiked = story.likes.some(like => like.user_id === userId);
            const isViewed = story.views.length > 0 || u.id === userId; 

            if (!isViewed) {
                groupedStories[u.id].hasUnseen = true;
            }

            const likesList = story.likes.map(like => ({
                userId: like.user_id,
                username: like.user?.username || 'Usuario',
                avatar: like.user?.profile_image_url
            }));

            groupedStories[u.id].items.push({
                id: story.id,
                url: story.url,
                type: story.type,
                createdAt: story.created_at,
                expiresAt: story.expires_at,
                privacy: story.privacy,
                isHDR: story.is_hdr,
                likes: likesList, 
                isLiked: isLiked,
                viewed: isViewed
            });
        }

        const responseData = Object.values(groupedStories);

        // Ordenar: Yo primero -> Con no vistas -> Resto
        responseData.sort((a, b) => {
            if (a.userId === userId) return -1;
            if (b.userId === userId) return 1;
            if (a.hasUnseen === b.hasUnseen) return 0;
            return a.hasUnseen ? -1 : 1;
        });

        res.json(responseData);

    } catch (error) {
        console.error('Error obteniendo historias:', error);
        res.status(500).json({ error: 'Error al obtener historias' });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const story = await Story.findOne({ where: { id, user_id: userId } });

        if (!story) {
            return res.status(404).json({ error: 'Historia no encontrada' });
        }

        // 1. Borrado físico (Asíncrono)
        await deleteFile(story.url);
        
        // 2. Borrado lógico
        await story.destroy();

        const io = req.app.get('io');
        if (io) {
            io.emit('delete_story', { storyId: id, userId });
        }

        res.json({ message: 'Historia eliminada' });

    } catch (error) {
        console.error('Error eliminando historia:', error);
        res.status(500).json({ error: 'Error al eliminar la historia' });
    }
};

export const toggleLikeStory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Comprobar existencia (ligero)
        const storyExists = await Story.count({ where: { id } });
        if (!storyExists) return res.status(404).json({ error: 'Historia no encontrada' });

        const existingLike = await StoryLike.findOne({
            where: { story_id: id, user_id: userId }
        });

        let isLiked = false;

        if (existingLike) {
            await existingLike.destroy();
            isLiked = false;
        } else {
            await StoryLike.create({ story_id: id, user_id: userId });
            isLiked = true;
        }

        // Devolver lista actualizada optimizada
        const updatedLikes = await StoryLike.findAll({
            where: { story_id: id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'profile_image_url']
            }]
        });

        const likesList = updatedLikes.map(l => ({
            userId: l.user_id,
            username: l.user?.username || 'Usuario',
            avatar: l.user?.profile_image_url
        }));

        res.json({ 
            message: isLiked ? 'Like añadido' : 'Like eliminado', 
            isLiked,
            likes: likesList 
        });

    } catch (error) {
        console.error('Error dando like:', error);
        res.status(500).json({ error: 'Error al procesar like' });
    }
};

export const viewStory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Validación rápida: si es mi historia, no cuenta como vista nueva
        // Pero verificamos si existe para no llenar DB de basura
        const story = await Story.findByPk(id, { attributes: ['user_id'] });
        
        if (!story || story.user_id === userId) {
            return res.status(200).end();
        }

        // findOrCreate es atómico y seguro
        await StoryView.findOrCreate({
            where: { story_id: id, user_id: userId }
        });

        res.status(200).end();

    } catch (error) {
        console.error('Error marcando vista:', error);
        res.status(500).json({ error: 'Error al registrar vista' });
    }
};