/* frontend/src/i18n.js */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- INICIO DE LA MODIFICACIÓN ---
// Importa los nuevos archivos de traducción modularizados
import exerciseNamesES from './locales/es/exercise_names.json';
import exerciseMusclesES from './locales/es/exercise_muscles.json';
import exerciseEquipmentES from './locales/es/exercise_equipment.json';
import exerciseUiES from './locales/es/exercise_ui.json';
// --- FIN DE LA MODIFICACIÓN ---

i18n
  // Detecta el idioma del navegador
  .use(LanguageDetector)
  // Pasa la instancia de i18n a react-i18next.
  .use(initReactI18next)
  // Inicializa i18next
  .init({
    debug: false, // Desactiva logs en consola
    fallbackLng: 'es', // Idioma por defecto si no se detecta o falta traducción
    interpolation: {
      escapeValue: false, // React ya se encarga de escapar
    },
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // Define los 'namespaces' (grupos de traducciones)
    ns: [
      'translation',
      'exercise_names',
      'exercise_muscles',
      'exercise_equipment',
      'exercise_ui',
      'exercise_descriptions',
    ],
    defaultNS: 'translation',
    // --- FIN DE LA MODIFICACIÓN ---

    resources: {
      es: {
        // Namespace por defecto 'translation'
        translation: {
          exerciseDefaults: {
            name: "Ejercicio sin nombre",
            description: "Sin descripción disponible.",
            category: "General",
            equipment: "Desconocido",
          }
        },
        // --- INICIO DE LA MODIFICACIÓN ---
        // Mapea cada import a su namespace correspondiente
        exercise_names: exerciseNamesES,
        exercise_muscles: exerciseMusclesES,
        exercise_equipment: exerciseEquipmentES,
        exercise_ui: exerciseUiES,
        exercise_descriptions: {},
        // --- FIN DE LA MODIFICACIÓN ---
      },
      // Puedes añadir más idiomas aquí
      // en: {
      //   translation: { ... }
      // }
    },
    // Opciones del detector de idioma
    detection: {
      // Orden y desde dónde detectar el idioma
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Clave para guardar en localStorage
      lookupLocalStorage: 'i18nextLng',
      // Caché a usar
      caches: ['localStorage'],
    }
  });

// Cargar las descripciones largas de ejercicios de forma diferida para no bloquear el arranque inicial
const loadExerciseDescriptions = () => {
  import('./locales/es/exercises.json')
    .then((mod) => {
      const data = mod?.default || mod;
      if (data) {
        i18n.addResourceBundle('es', 'exercise_descriptions', data, true, true);
      }
    })
    .catch(() => {});
};

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadExerciseDescriptions, { timeout: 2000 });
  } else {
    setTimeout(loadExerciseDescriptions, 400);
  }
}

export default i18n;