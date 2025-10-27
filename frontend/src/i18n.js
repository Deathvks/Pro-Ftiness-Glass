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
import exerciseDescriptionsES from './locales/es/exercises.json'; // Este ahora solo tiene descripciones
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
        exercise_descriptions: exerciseDescriptionsES,
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

export default i18n;