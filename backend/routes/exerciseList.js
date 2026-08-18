import express from 'express';
import exerciseListController from '../controllers/exerciseListController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import { upload } from '../services/uploadService.js';

import sequelize from '../db.js';

const router = express.Router();

// ENDPOINT TEMPORAL PARA FORZAR LIMPIEZA
router.get('/force-cleanup', async (req, res) => {
    try {
        const [oldExercises] = await sequelize.query(`SELECT id, name FROM exercise_list WHERE wger_id IS NULL`);
        const [newExercises] = await sequelize.query(`SELECT id, name FROM exercise_list WHERE wger_id IS NOT NULL`);
        
        const newMap = {};
        for (const ex of newExercises) {
            newMap[ex.name.toLowerCase().trim()] = ex.id;
        }

        let mappedCount = 0;
        let updateErrors = [];
        
        for (const oldEx of oldExercises) {
            const matchingNewId = newMap[oldEx.name.toLowerCase().trim()];
            if (matchingNewId) {
                try {
                    await sequelize.query(
                        `UPDATE routine_exercises SET exercise_list_id = :newId WHERE exercise_list_id = :oldId`,
                        { replacements: { newId: matchingNewId, oldId: oldEx.id } }
                    );
                    mappedCount++;
                } catch (e) {
                    updateErrors.push({ id: oldEx.id, name: oldEx.name, error: e.message });
                }
            }
        }

        // Ahora intentar eliminar
        let deleteResult = null;
        try {
            await sequelize.query(`DELETE FROM exercise_list WHERE wger_id IS NULL`);
            deleteResult = "Exito eliminando ejercicios antiguos.";
        } catch (e) {
            deleteResult = `Error al eliminar: ${e.message}`;
        }

        res.json({
            status: "ok",
            oldExercisesFound: oldExercises.length,
            mappedRoutines: mappedCount,
            updateErrors,
            deleteResult
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// GET /api/exercises -> Devuelve una lista de ejercicios (permite búsqueda)
router.get('/exercises', exerciseListController.getExercises);

// Funciones de administrador
router.post('/exercises/import-youtube', exerciseListController.importYouTubePlaylist);
router.put('/exercises/:id', upload.array('images', 10), exerciseListController.updateExercise);
router.delete('/exercises/:id', exerciseListController.deleteExercise);

export default router;