# Pro-Fitness-Glass

Una aplicación web full-stack diseñada para el seguimiento integral del progreso en el fitness. Permite a los usuarios registrar entrenamientos, nutrición y métricas corporales en una interfaz moderna y reactiva.

## Características Principales

* **Autenticación de Usuarios:** Sistema completo de registro, inicio de sesión (con JWT), verificación por correo electrónico y recuperación de contraseña.
* **Gestión de Perfil:** Los usuarios pueden actualizar su nombre de usuario, contraseña e imagen de perfil.
* **Registro de Entrenamientos:**
    * Creación, edición y eliminación de rutinas personalizadas.
    * Registro detallado de entrenamientos (ejercicios, series, repeticiones, peso).
    * Cálculo de 1RM (Máxima Repetición Estimada) para seguimiento de fuerza.
    * Soporte para técnicas avanzadas como **Superseries** y **Dropsets**.
* **Seguimiento de Nutrición:**
    * Diario de comidas detallado (calorías, proteínas, carbohidratos, grasas) por día.
    * Búsqueda de alimentos (integrada con API externa, p.ej., OpenFoodFacts).
    * Gestión de "Comidas Favoritas" para un registro rápido.
    * Registro de imágenes de comidas.
* **Monitor de Progreso:**
    * Gráficos visuales del historial de peso corporal.
    * Registro y visualización de Récords Personales (PRs) por ejercicio.
    * Calendario de actividad para ver los días de entrenamiento y nutrición registrados.
* **Seguimientos Adicionales:**
    * Tracker de toma de **Creatina**.
* **Panel de Administración:**
    * Gestión (CRUD) de usuarios y lista de ejercicios de la base de datos.

---

## Stack Tecnológico

El proyecto sigue una arquitectura monorepo con dos componentes principales: `backend` y `frontend`.

### Backend

* **Framework:** Node.js con Express.
* **Base de Datos:** PostgreSQL (gestionado con Sequelize ORM).
* **Autenticación:** JSON Web Tokens (JWT).
* **Migraciones:** Sequelize-CLI para la gestión del esquema de la BD.
* **Servicios:** Nodemailer para el envío de correos transaccionales (verificación, reseteo de contraseña).
* **Gestión de Ficheros:** Multer para la subida de imágenes (perfil, comidas).

### Frontend

* **Framework:** React (construido con Vite).
* **Estilos:** TailwindCSS para un diseño "utility-first" rápido y moderno.
* **Gestión de Estado:** Zustand (para un manejo de estado global simple y reactivo).
* **Enrutamiento:** React Router.
* **Gráficos:** Recharts.
* **Cliente API:** Axios (con interceptores para la gestión de tokens JWT).

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
3.  **Configuración de la Base de Datos:**
    * Asegúrate de tener PostgreSQL en ejecución.
    * El fichero `backend/config/config.cjs` gestiona la configuración de Sequelize. Se recomienda usar variables de entorno.
    * Crea un fichero `.env` en la raíz de `backend/` con las siguientes variables:
    ```env
    # Configuración de la Base de Datos (Ejemplo Development)
    DB_USER=postgres
    DB_PASS=tu_contraseña_de_postgres
    DB_NAME=pro_fitness_db
    DB_HOST=localhost
    DB_DIALECT=postgres

    # Secreto para JWT
    JWT_SECRET=tu_secreto_muy_seguro_para_jwt

    # Credenciales de Nodemailer (para envío de emails)
    EMAIL_HOST=smtp.tu_proveedor.com
    EMAIL_PORT=587
    EMAIL_USER=tu_email@dominio.com
    EMAIL_PASS=tu_contraseña_de_email
    ```
4.  Ejecuta las migraciones de la base de datos para crear las tablas:
    ```bash
    npx sequelize-cli db:migrate
    ```
5.  (Opcional) Ejecuta los "seeders" para poblar la base de datos con datos iniciales (ej. lista de ejercicios):
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
    * Define la variable de entorno que apunta a la URL de tu backend:
    ```env
    # URL donde se está ejecutando el backend
    VITE_API_URL=http://localhost:3001
    ```

---

## Ejecución del Proyecto

Debes iniciar ambos servidores (backend y frontend) en terminales separadas.

1.  **Iniciar el Servidor Backend:**
    * Desde la carpeta `backend`:
    ```bash
    npm start
    ```
    * El servidor se ejecutará en el puerto especificado (por defecto `3001`).

2.  **Iniciar la Aplicación Frontend:**
    * Desde la carpeta `frontend`:
    ```bash
    npm run dev
    ```
    * Vite iniciará la aplicación y estará disponible (por defecto en `http://localhost:5173`).