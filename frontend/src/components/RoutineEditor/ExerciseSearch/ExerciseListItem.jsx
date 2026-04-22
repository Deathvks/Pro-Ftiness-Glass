/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListItem.jsx */
import React, { useState } from 'react';
import { Plus, Check, Repeat, Image as ImageIcon } from 'lucide-react';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { normalizeText } from '../../../utils/helpers';

// Base URL para construir las rutas de imágenes
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const ExerciseListItem = ({
  exercise,
  onAdd,
  onView,
  isStaged,
  t,
  isReplacing = false,
}) => {
  const { theme } = useAppTheme();
  const [imageError, setImageError] = useState(false);

  const handleAddClick = (e) => {
    e.stopPropagation();
    onAdd(exercise);
  };

  // 1. Traducir el nombre
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir músculos
  const rawMuscleGroup = exercise.muscle_group || exercise.category || 'Other';
  const translatedMuscle = rawMuscleGroup
    .split(',')
    .map((m) => {
      const trimmed = m.trim();
      return t(trimmed, {
        ns: 'exercise_muscles',
        defaultValue: trimmed,
      });
    })
    .join(', ');

  // 3. Traducir la descripción
  const defaultDescription = exercise.description || t('exercise_ui:no_description', 'Sin descripción');
  const descriptionKey = normalizeText(exercise.description);

  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
    nsSeparator: false,
    keySeparator: false
  });

  const cleanDescription = translatedDescription.replace(/<[^>]*>?/gm, '');

  // --- LÓGICA INTELIGENTE DE IMÁGENES (Sin 404s en consola) ---
  const rawImageUrl = exercise.image_url_start || exercise.image_url || exercise.image;
  
  const getBestImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url; 
    
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const filename = cleanUrl.split('/').pop(); 
    
    // Detectamos si es un UUID típico de wger (ej: 7cea006d-04a1-478f-94ce-b1082dede01c.png)
    const isWgerUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.[a-zA-Z0-9]+$/.test(filename);
    
    // Si tiene pinta de ser de wger, disparamos directo al servidor original sin pasar por el local
    if (isWgerUuid || cleanUrl.includes('exercise-images')) {
      return `https://wger.de/media/exercise-images/${filename}`;
    }

    // Si es una imagen normal (ej. 'press_banca.png'), va al backend local
    return `${BACKEND_BASE_URL}/${cleanUrl}`;
  };

  const finalImageUrl = getBestImageUrl(rawImageUrl);

  const isOled = theme === 'oled';
  const imageBgClass = isOled ? 'bg-gray-200' : 'bg-bg-primary';

  return (
    <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg border border-glass-border">
      <button
        onClick={() => onView(exercise)}
        className={`shrink-0 rounded-md overflow-hidden w-16 h-16 ${imageBgClass} border border-glass-border flex items-center justify-center`}
      >
        {finalImageUrl && !imageError ? (
          <img
            src={finalImageUrl}
            alt={`Imagen de ${translatedName}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)} // Solo falla si el server online de Wger tampoco la tiene
          />
        ) : (
          <ImageIcon size={24} className="opacity-40 text-text-muted" />
        )}
      </button>
      
      <div className="flex-1 min-w-0" onClick={() => onView(exercise)}>
        <p className="font-semibold truncate">{translatedName}</p>
        <p className="text-sm text-text-muted truncate capitalize">
          {translatedMuscle}
        </p>
        <p className="text-sm text-text-secondary truncate">
          {cleanDescription}
        </p>
      </div>

      {isReplacing ? (
        <button
          onClick={handleAddClick}
          className="p-3 rounded-full transition bg-accent/10 text-accent hover:bg-accent/20"
          title={t('exercise_ui:replace_with_this', 'Reemplazar con este')}
        >
          <Repeat size={20} />
        </button>
      ) : (
        <button
          onClick={handleAddClick}
          disabled={isStaged}
          className={`p-3 rounded-full transition ${isStaged
            ? 'bg-green/20 text-green'
            : 'bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          title={isStaged ? t('exercise_ui:added', 'Añadido') : t('exercise_ui:add_to_cart', 'Añadir al carrito')}
        >
          {isStaged ? <Check size={20} /> : <Plus size={20} />}
        </button>
      )}
    </div>
  );
};

export default ExerciseListItem;