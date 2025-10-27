/* frontend/src/i18n.js */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importa aquí tus archivos de traducción
import exercisesES from './locales/es/exercises.json'; // <-- Añadido

i18n
  // Detecta el idioma del navegador
  .use(LanguageDetector)
  // Pasa la instancia de i18n a react-i18next.
  .use(initReactI18next)
  // Inicializa i18next
  .init({
    debug: import.meta.env.DEV, // Activa logs en desarrollo
    fallbackLng: 'es', // Idioma por defecto si no se detecta o falta traducción
    interpolation: {
      escapeValue: false, // React ya se encarga de escapar
    },
    
    // --- Añadido ---
    // Define los 'namespaces' (grupos de traducciones)
    ns: ['translation', 'exercises'],
    defaultNS: 'translation',
    // --- Fin Añadido ---

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
        // --- Añadido ---
        // Namespace específico para ejercicios
        exercises: exercisesES
        // --- Fin Añadido ---
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