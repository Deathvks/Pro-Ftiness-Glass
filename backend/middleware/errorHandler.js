/**
 * Middleware de manejo de errores para Express.
 * Captura todos los errores que ocurren en la aplicación.
 */
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Loguea el error completo para depuración

    // Define un objeto de respuesta de error por defecto
    const errorResponse = {
        error: 'Error interno del servidor',
        details: err.message || 'Ha ocurrido un error inesperado.'
    };

    // Puedes personalizar la respuesta basada en el tipo de error
    // (Por ahora, mantenemos una respuesta genérica para todos los errores 500)
    
    res.status(500).json(errorResponse);
};

export default errorHandler;