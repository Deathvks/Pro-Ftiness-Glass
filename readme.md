# Pro-Fitness-Glass

Una aplicación web y móvil (PWA/Capacitor) full-stack diseñada para el seguimiento integral del progreso en el fitness. Permite a los usuarios registrar entrenamientos, nutrición, métricas corporales y conectar con la comunidad en una interfaz moderna y reactiva.

## Características Principales

* **Autenticación y Seguridad:** * Sistema de registro, inicio de sesión (JWT) y recuperación de contraseña.
    * Verificación en dos pasos (**2FA**).
    * Inicios de sesión sociales (**OAuth**: Google, GitHub, Discord, Spotify).
* **Gestión de Perfil:** Actualización de datos, imagen de perfil y preferencias de privacidad.
* **Registro de Entrenamientos:**
    * Creación, edición y eliminación de rutinas personalizadas o mediante **Generación con Inteligencia Artificial (IA)**.
    * Registro detallado de entrenamientos (ejercicios, series, repeticiones, peso).
    * Cálculo de 1RM (Máxima Repetición Estimada) para seguimiento de fuerza.
    * Soporte para técnicas avanzadas como **Superseries** y **Dropsets**.
    * Opciones para compartir rutinas mediante enlaces y configurar la privacidad del muro.
* **Seguimiento de Nutrición y Salud:**
    * Diario de comidas detallado (calorías, proteínas, carbohidratos, grasas y **azúcares**) por día.
    * Búsqueda de alimentos (integrada con API de OpenFoodFacts).
    * Gestión de "Comidas Favoritas" para un registro rápido.
    * Registro de **Agua** diaria.
    * Tracker específico para tomas de **Creatina**.
    * Subida de imágenes de comidas con soporte y corrección para formatos **HDR**.
* **Comunidad y Social:**
    * **Muro de Actividad (Feed):** Comparte y visualiza los entrenamientos de tus amigos.
    * **Historias Efímeras:** Sube fotos o vídeos de tu entrenamiento que desaparecen a las 24 horas.
    * **Sistema de Amigos:** Envía, acepta o rechaza solicitudes de amistad.
    * **Grupos (Squads):** Crea o únete a grupos privados mediante código para competir en equipo.
    * **Ranking Global (Leaderboard):** Compite por los primeros puestos según tu experiencia (XP).
* **Gamificación:**
    * Sistema de recompensas basado en **XP y Niveles** por registrar comidas, agua y entrenamientos.
    * Sistema de **Rachas (Streaks)** de días consecutivos entrenando o cumpliendo objetivos.
* **Monitor de Progreso:**
    * Gráficos visuales del historial de peso corporal y medidas.
    * Registro y visualización de Récords Personales (PRs) por ejercicio.
    * Calendario de actividad.
* **Experiencia de Usuario (UX) y Móvil:**
    * Adaptación a aplicación móvil nativa usando **Capacitor** (uso de cámara y galería del dispositivo).
    * **Tours Guiados** interactivos en las secciones principales para nuevos usuarios.
    * Soporte para notificaciones **Push** y sistema de notificaciones in-app.
* **Panel de Administración:**
    * Gestión (CRUD) de usuarios, reportes de bugs y lista de ejercicios de la base de datos.

---

## Stack Tecnológico

El proyecto sigue una arquitectura monorepo con dos componentes principales: `backend` y `frontend`.

### Backend

* **Framework:** Node.js con Express.
* **Base de Datos:** PostgreSQL (gestionado con Sequelize ORM).
* **Autenticación:** JSON Web Tokens (JWT), Passport.js (para OAuth), Speakeasy (para 2FA).
* **Servicios API:** Integración con IA (OpenAI/Gemini) para rutinas.
* **Gestión de Ficheros e Imágenes:** Multer y **Sharp** (para optimización y conversión a WebP).
* **Notificaciones:** Nodemailer (emails transaccionales) y Web-Push (notificaciones push).

### Frontend

* **Framework:** React (construido con Vite).
* **Adaptación Móvil:** Capacitor (acceso a hardware nativo como Cámara).
* **Estilos:** TailwindCSS (diseño "utility-first", soporte para modo oscuro/OLED).
* **Gestión de Estado:** Zustand (estado global modular y reactivo).
* **Enrutamiento:** React Router.
* **UX/UI Adicional:** Lucide React (iconos), Driver.js (tours guiados interactivos), Recharts (gráficos).
* **Cliente API:** Axios (con interceptores para la gestión de tokens).
* **Internacionalización:** i18next (soporte multi-idioma).

---

## Instalación y Configuración

Es necesario configurar ambas partes del proyecto (backend y frontend) para un funcionamiento completo.

### 1. Backend

1.  Navega a la carpeta `backend`:
    ```bash
    cd backend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  **Configuración de la Base de Datos y Entorno:**
    * Asegúrate de tener PostgreSQL en ejecución.
    * Crea un fichero `.env` en la raíz de `backend/` con las siguientes variables (ajusta según tus credenciales):
    ```env
    # Configuración de BD
    DB_USER=postgres
    DB_PASS=tu_contraseña_de_postgres
    DB_NAME=pro_fitness_db
    DB_HOST=localhost
    DB_DIALECT=postgres

    # Seguridad
    JWT_SECRET=tu_secreto_muy_seguro_para_jwt
    
    # Nodemailer
    EMAIL_HOST=smtp.tu_proveedor.com
    EMAIL_PORT=587
    EMAIL_USER=tu_email@dominio.com
    EMAIL_PASS=tu_contraseña_de_email

    # Claves OAuth (Google, Github, Discord, Spotify) - Opcionales
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    
    # Claves IA (Para generación de rutinas)
    AI_API_KEY=...
    
    # Notificaciones Push (VAPID Keys)
    VAPID_PUBLIC_KEY=...
    VAPID_PRIVATE_KEY=...
    ```
4.  Ejecuta las migraciones de la base de datos:
    ```bash
    npx sequelize-cli db:migrate
    ```
5.  (Opcional) Ejecuta los "seeders" para poblar la base de datos con datos iniciales:
    ```bash
    npx sequelize-cli db:seed:all
    ```

### 2. Frontend

1.  Navega a la carpeta `frontend`:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  **Configuración de la API:**
    * Crea un fichero `.env` en la raíz de `frontend/`.
    * Define la variable de entorno que apunta a tu backend:
    ```env
    VITE_API_BASE_URL=http://localhost:3001/api
    ```

---

## Ejecución del Proyecto

1.  **Iniciar el Servidor Backend:**
    * Desde la carpeta `backend`:
    ```bash
    npm run dev
    ```

2.  **Iniciar la Aplicación Frontend:**
    * Desde la carpeta `frontend`:
    ```bash
    npm run dev
    ```

3.  **Compilar para Móvil (Capacitor):**
    * Para Android, desde la carpeta `frontend`:
    ```bash
    npx cap sync android
    npx cap open android
    ```