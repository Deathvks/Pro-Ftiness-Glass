import models from '../models/index.js';
import { Op } from 'sequelize';
import { processUploadedFile } from '../services/uploadService.js';

const { ExerciseList } = models;

// Obtener ejercicios, con opción de búsqueda y filtro por grupo muscular
export const getExercises = async (req, res, next) => {
    try {
        const { search, muscle_group } = req.query;

        const options = {
            where: {},
            order: [['name', 'ASC']]
        };

        // Si se proporciona un término de búsqueda, se añade al filtro
        if (search) {
            options.where.name = {
                [Op.like]: `%${search}%`
            };
        }

        // Si se proporciona un grupo muscular (y no es 'Todos'), se añade al filtro
        if (muscle_group && muscle_group !== 'Todos') {
            // Mapear categorías genéricas a categorías específicas
            if (muscle_group === 'Brazos') {
                options.where.muscle_group = {
                    [Op.in]: ['Bíceps', 'Tríceps']
                };
            } else if (muscle_group === 'Piernas') {
                options.where.muscle_group = {
                    [Op.in]: ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas']
                };
            } else {
                options.where.muscle_group = muscle_group;
            }
        }

        const exercises = await ExerciseList.findAll(options);
        res.json(exercises);
    } catch (error) {
        next(error);
    }
};

export const importYouTubePlaylist = async (req, res, next) => {
    try {
        let { playlistId } = req.body;
        if (!playlistId) return res.status(400).json({ message: 'Se requiere un playlistId.' });

        // Si el usuario pega una URL completa, extraemos el ID de la lista
        if (playlistId.includes('list=')) {
            try {
                // Aseguramos que sea parseable como URL
                const urlString = playlistId.startsWith('http') ? playlistId : `https://${playlistId}`;
                const urlObj = new URL(urlString);
                playlistId = urlObj.searchParams.get('list') || playlistId;
            } catch (e) {
                console.error("Error parseando URL:", e);
            }
        }
        
        // Limpiamos espacios y posibles parámetros adicionales pegados
        playlistId = playlistId.trim().split('&')[0];

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return res.status(500).json({ message: 'Falta YOUTUBE_API_KEY en .env' });

        let nextPageToken = '';
        let totalImported = 0;

        do {
            const url = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("====== YOUTUBE API ERROR ======");
                console.error("Status:", response.status);
                console.error("Error Data:", JSON.stringify(errorData, null, 2));
                console.error("===============================");
                
                let details = "Error desconocido de YouTube";
                if (errorData.error && errorData.error.message) {
                    details = errorData.error.message;
                }
                
                return res.status(400).json({ 
                    message: `Error de YouTube: ${details}`, 
                    fullError: errorData 
                });
            }

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    const title = item.snippet.title;
                    const videoId = item.snippet.resourceId?.videoId;

                    if (title && videoId && title !== 'Private video' && title !== 'Deleted video') {
                        // Autodetectar si el vídeo es un Short
                        let finalVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                        try {
                            const shortCheck = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
                                method: 'HEAD',
                                redirect: 'manual'
                            });
                            if (shortCheck.status === 200) {
                                finalVideoUrl = `https://www.youtube.com/shorts/${videoId}`;
                            }
                        } catch (err) {
                            console.error("Error comprobando si es short:", err);
                        }

                        // Comprobar si ya existe por nombre o URL
                        const existing = await ExerciseList.findOne({
                            where: {
                                [Op.or]: [
                                    { video_url: finalVideoUrl },
                                    { video_url: `https://www.youtube.com/watch?v=${videoId}` }, // Por compatibilidad si ya existía
                                    { name: title }
                                ]
                            }
                        });

                        if (!existing) {
                            await ExerciseList.create({
                                name: title,
                                muscle_group: 'Otro', // Por defecto
                                video_url: finalVideoUrl,
                                description: item.snippet.description || null
                            });
                            totalImported++;
                        }
                    }
                }
            }
            nextPageToken = data.nextPageToken || null;
        } while (nextPageToken);

        res.json({ message: `Importación completada. ${totalImported} ejercicios nuevos creados.`, count: totalImported });
    } catch (error) {
        next(error);
    }
};

export const updateExercise = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, muscle_group, category, equipment, video_url, existing_images, image_order } = req.body;

        const exercise = await ExerciseList.findByPk(id);
        if (!exercise) return res.status(404).json({ message: 'Ejercicio no encontrado.' });

        let parsedExistingImages = [];
        if (existing_images) {
            try {
                parsedExistingImages = JSON.parse(existing_images);
            } catch (e) {
                if (typeof existing_images === 'string') {
                    parsedExistingImages = [existing_images];
                }
            }
        } else if (req.body.existing_images === undefined) {
            if (exercise.images && Array.isArray(exercise.images)) {
                parsedExistingImages = [...exercise.images];
            } else {
                if (exercise.image_url_start) parsedExistingImages.push(exercise.image_url_start);
                if (exercise.image_url_end) parsedExistingImages.push(exercise.image_url_end);
            }
        }

        let processedNewImages = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const processed = await processUploadedFile(file);
                processedNewImages.push(processed.url);
            }
        } else if (req.file) {
            const processedImage = await processUploadedFile(req.file);
            processedNewImages.push(processedImage.url);
        }

        let finalImages = [];
        if (image_order) {
            try {
                const orderArray = JSON.parse(image_order);
                for (const item of orderArray) {
                    if (item.startsWith('existing:')) {
                        const idx = parseInt(item.split(':')[1], 10);
                        if (parsedExistingImages[idx]) finalImages.push(parsedExistingImages[idx]);
                    } else if (item.startsWith('new:')) {
                        const idx = parseInt(item.split(':')[1], 10);
                        if (processedNewImages[idx]) finalImages.push(processedNewImages[idx]);
                    }
                }
            } catch (e) {
                console.error("Error al procesar image_order:", e);
                finalImages = [...parsedExistingImages, ...processedNewImages];
            }
        } else {
            // Fallback si no hay image_order explícito
            finalImages = [...parsedExistingImages, ...processedNewImages];
        }

        await exercise.update({
            name: name !== undefined ? name : exercise.name,
            muscle_group: muscle_group !== undefined ? muscle_group : exercise.muscle_group,
            category: category !== undefined ? category : exercise.category,
            equipment: equipment !== undefined ? equipment : exercise.equipment,
            video_url: video_url !== undefined ? video_url : exercise.video_url,
            images: finalImages,
            // Retrocompatibilidad con sistemas que busquen estas columnas
            image_url_start: finalImages[0] || null,
            image_url_end: finalImages[1] || null
        });

        res.json(exercise);
    } catch (error) {
        next(error);
    }
};

export const deleteExercise = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exercise = await ExerciseList.findByPk(id);
        if (!exercise) return res.status(404).json({ message: 'Ejercicio no encontrado.' });

        await exercise.destroy();
        res.json({ message: 'Ejercicio eliminado correctamente.' });
    } catch (error) {
        next(error);
    }
};

const exerciseListController = {
    getExercises,
    importYouTubePlaylist,
    updateExercise,
    deleteExercise
};

export default exerciseListController;