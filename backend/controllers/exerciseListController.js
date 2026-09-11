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


export const getManualExercises = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = `
            SELECT DISTINCT name FROM (
                SELECT wld.exercise_name as name
                FROM workout_log_details wld
                JOIN workout_logs wl ON wl.id = wld.workout_log_id
                LEFT JOIN exercise_list el ON el.name = wld.exercise_name
                WHERE wl.user_id = :userId AND el.id IS NULL

                UNION

                SELECT re.name
                FROM routine_exercises re
                JOIN routines r ON r.id = re.routine_id
                WHERE r.user_id = :userId AND re.exercise_list_id IS NULL

                UNION

                SELECT tre.name
                FROM template_routine_exercises tre
                JOIN template_routines tr ON tr.id = tre.template_routine_id
                WHERE tr.user_id = :userId AND tre.exercise_list_id IS NULL
            ) AS manual_exercises
            WHERE name IS NOT NULL AND name != ''
            ORDER BY name ASC;
        `;
        
        
        const [results] = await models.sequelize.query(query, {
            replacements: { userId }
        });

        res.json(results.map(row => row.name));
    } catch (error) {
        console.error('Error fetching manual exercises:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar ejercicios manuales.' });
    }
};

export const transferManualExercise = async (req, res) => {
    
    const transaction = await models.sequelize.transaction();
    try {
        const userId = req.user.userId;
        const { sourceName, targetName, targetExerciseListId, deleteSource, replaceInRoutines } = req.body;

        if (!sourceName || !targetName) {
            return res.status(400).json({ error: "Se requiere nombre de origen y destino." });
        }

        if (deleteSource) {
            await models.sequelize.query(`
                UPDATE workout_log_details 
                SET exercise_name = :targetName 
                WHERE exercise_name = :sourceName 
                  AND workout_log_id IN (SELECT id FROM workout_logs WHERE user_id = :userId)
            `, { replacements: { targetName, sourceName, userId }, transaction });
        } else {
            const [logsToCopy] = await models.sequelize.query(`
                SELECT wld.* 
                FROM workout_log_details wld
                JOIN workout_logs wl ON wl.id = wld.workout_log_id
                WHERE wl.user_id = :userId AND wld.exercise_name = :sourceName
            `, { replacements: { userId, sourceName }, transaction });

            for (const oldLog of logsToCopy) {
                const [newLogResult] = await models.sequelize.query(`
                    INSERT INTO workout_log_details (workout_log_id, exercise_name, total_volume, best_set_weight, superset_group_id, estimated_1rm)
                    VALUES (:workout_log_id, :targetName, :total_volume, :best_set_weight, :superset_group_id, :estimated_1rm)
                `, { 
                    replacements: { 
                        workout_log_id: oldLog.workout_log_id,
                        targetName: targetName,
                        total_volume: oldLog.total_volume,
                        best_set_weight: oldLog.best_set_weight,
                        superset_group_id: oldLog.superset_group_id,
                        estimated_1rm: oldLog.estimated_1rm
                    },
                    transaction
                });

                const newLogId = newLogResult; 

                await models.sequelize.query(`
                    INSERT INTO workout_log_sets (log_detail_id, set_number, reps, weight_kg, is_dropset, is_warmup, rir)
                    SELECT :newLogId, set_number, reps, weight_kg, is_dropset, is_warmup, rir
                    FROM workout_log_sets
                    WHERE log_detail_id = :oldLogId
                `, {
                    replacements: { newLogId, oldLogId: oldLog.id },
                    transaction
                });
            }
        }

        if (replaceInRoutines) {
            await models.sequelize.query(`
                UPDATE routine_exercises 
                SET name = :targetName, exercise_list_id = :targetExerciseListId
                WHERE name = :sourceName 
                  AND routine_id IN (SELECT id FROM routines WHERE user_id = :userId)
            `, { replacements: { targetName, targetExerciseListId: targetExerciseListId || null, sourceName, userId }, transaction });

            await models.sequelize.query(`
                UPDATE template_routine_exercises 
                SET name = :targetName, exercise_list_id = :targetExerciseListId
                WHERE name = :sourceName 
                  AND template_routine_id IN (SELECT id FROM template_routines WHERE user_id = :userId)
            `, { replacements: { targetName, targetExerciseListId: targetExerciseListId || null, sourceName, userId }, transaction });
        }

        if (deleteSource) {
            await models.sequelize.query(`
                UPDATE personal_records 
                SET exercise_name = :targetName
                WHERE user_id = :userId AND exercise_name = :sourceName
            `, { replacements: { targetName, sourceName, userId }, transaction });
        }

        await transaction.commit();
        res.json({ success: true, message: "Transferencia completada correctamente." });
    } catch (error) {
        await transaction.rollback();
        console.error('Error transfering manual exercises:', error);
        res.status(500).json({ error: 'Error interno al transferir datos.' });
    }
};

const exerciseListController = {
    getExercises,
    importYouTubePlaylist,
    updateExercise,
    deleteExercise,
    getManualExercises,
    transferManualExercise
};

export default exerciseListController;




