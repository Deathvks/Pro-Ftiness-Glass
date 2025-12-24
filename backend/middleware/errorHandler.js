/* backend/middleware/errorHandler.js */
/**
 * Middleware de manejo de errores para Express.
 * Captura todos los errores que ocurren en la aplicación.
 */
const errorHandler = (err, req, res, next) => {
    // Manejo específico para errores de Multer (ej: archivos demasiado grandes)
    if (err.name === 'MulterError') {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Una de las imágenes es demasiado grande (máximo 5MB por archivo).'
            : 'Error al procesar las imágenes subidas.';

        return res.status(400).json({ error: message });
    }

    console.error(err.stack);

    const errorResponse = {
        error: 'Error interno del servidor',
        details: err.message || 'Ha ocurrido un error inesperado.'
    };

    res.status(500).json(errorResponse);
};

export default errorHandler;