'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const articles = [
      // --- ENTRENAMIENTO ---
      {
        title: 'El Fallo Muscular Desmitificado: Por Qué Entrenar al Fallo en Cada Serie Frena Tus Ganancias',
        slug: 'fallo-muscular-mito-hipertrofia-rir-optimo',
        category: 'Entrenamiento',
        reading_time: 5,
        summary: 'Llevar cada serie hasta el colapso no genera el doble de músculo, pero sí multiplica por cuatro la fatiga del sistema nervioso central. Aprende a calibrar tu RIR para progresar de verdad.',
        image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
        tags: 'hipertrofia, fallo muscular, rir, fatiga snc, fuerza',
        author_name: 'Dr. Álvaro Rivas · Fisiología del Deporte',
        seo_title: 'Fallo Muscular vs RIR: ¿Es Necesario Llegar al Fallo en Cada Serie?',
        seo_description: 'Análisis científico del fallo concéntrico vs RIR 1-3. Descubre por qué la fatiga neuromuscular excesiva perjudica el volumen total de entrenamiento.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        content: `## El mantra de "no pain, no gain" bajo la lupa científica

Durante décadas, la cultura del culturismo tradicional ha predicado que si no llegas al colapso absoluto en cada serie, estás perdiendo el tiempo. Sin embargo, los metaanálisis modernos liderados por investigadores como Brad Schoenfeld y Chris Beardsley han demostrado que la relación entre el **fallo muscular concéntrico** y la **hipertrofia** no es lineal, sino que sigue una curva de rendimientos decrecientes.

### ¿Qué ocurre realmente en tu cuerpo al llegar al fallo?

Cuando una serie se lleva al fallo (RIR 0 o incapacidad de completar la fase concéntrica con técnica estricta):
1. **Reclutamiento de unidades motoras de alto umbral:** Se alcanza el 100% de reclutamiento de fibras tipo II (las más hipertrofiables).
2. **Disparo exponencial de la fatiga del Sistema Nervioso Central (SNC):** A diferencia de la fatiga metabólica periférica en el músculo, la fatiga central tarda entre 48 y 72 horas en disiparse.
3. **Pérdida de rendimiento en las series siguientes:** Si haces tu primera serie de sentadillas al fallo (10 reps con 100 kg), en la segunda serie probablemente bajes a 6 reps, desplomando tu volumen total acumulado de trabajo mecánico.

---

### La regla de oro: Entrena a RIR 1-2

La evidencia científica actual sugiere que dejar **1 a 2 repeticiones en reserva (RIR 1-2)** ofrece prácticamente el mismo estímulo de tensión mecánica que el fallo, pero con una fracción de la fatiga acumulada:

| Modalidad | Estimulo Hipertrófico | Fatiga SNC y Articular | Recuperación Requerida |
| :--- | :--- | :--- | :--- |
| **RIR 3-4** | Moderado (ideal calentamiento/técnica) | Mínima | < 24 horas |
| **RIR 1-2** | **Óptimo (Zona de máxima ganancia)** | Moderada y controlada | 24 - 48 horas |
| **Fallo Real (RIR 0)** | Máximo para esa serie | Extrema / Catabólica | 48 - 72 horas |

### Aplicación práctica en tu rutina
- **Ejercicios multiarticulares pesados** (Sentadilla, Peso Muerto, Press Banca): Mantén siempre un RIR 1-3. El riesgo lesivo y el coste neural de fallar una sentadilla no compensa el estímulo marginal.
- **Ejercicios analíticos o en máquina** (Extensiones de cuádriceps, elevaciones laterales, jalones): Puedes llevar la última serie de cada ejercicio al fallo técnico con total seguridad.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Sentadilla Profunda vs Paralela: Qué Dice la Biomecánica Sobre Tus Cuádriceps y Glúteos',
        slug: 'sentadilla-profunda-vs-paralela-hipertrofia-biomecanica',
        category: 'Entrenamiento',
        reading_time: 6,
        summary: '¿Es peligroso romper el paralelo? ¿Crece más el cuádriceps bajando hasta abajo o cargando más peso en 90 grados? Desmontamos los mitos con física y anatomía aplicada.',
        image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
        tags: 'sentadilla, biomecanica, cuadriceps, gluteos, hipertrofia',
        author_name: 'Carlos Méndez · Especialista en Fuerza',
        seo_title: 'Sentadilla Profunda vs Paralela: ¿Cuál Construye Más Músculo?',
        seo_description: 'Comparativa biomecánica entre sentadilla profunda y a 90 grados. Tensión mecánica, hipertrofia mediada por estiramiento y salud articular.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        content: `## El eterno debate de la sala de pesas

"No bajes de 90 grados porque te vas a destrozar las rodillas". Es una de las frases más repetidas por monitores desactualizados desde los años 80. Hoy sabemos exactamente lo contrario: la fuerza de cizalla sobre los ligamentos cruzados (LCA y LCP) es **máxima a los 90 grados de flexión** y disminuye a medida que la cadera desciende y las estructuras musculares absorben la carga por co-contracción.

---

### La hipertrofia mediada por estiramiento

La investigación reciente en fisiología muscular ha confirmado que el mayor factor predictivo de crecimiento muscular es someter al músculo a una **alta tensión mecánica cuando sus sarcómeros están en su longitud máxima (estiramiento)**.

En la sentadilla profunda:
- **Glúteo mayor:** Experimenta una elongación máxima cerca del fondo del movimiento. La activación es significativamente mayor que en sentadillas parciales.
- **Aductor mayor:** Actúa como el principal extensor de cadera en los primeros grados de ascenso desde la máxima flexión.
- **Vasto lateral e intermedio:** Reciben un estímulo masivo al estirarse completamente la cápsula articular de la rodilla.

> [!TIP]
> Si buscas maximizar el cuádriceps, una sentadilla hack profunda con elevación de talones o zapatillas de halterofilia te dará un vector de flexión de rodilla superior sin sobrecargar la zona lumbar.

### Conclusión práctica
1. **Si tu movilidad te lo permite:** Romper el paralelo con control (sin retroversión pélvica excesiva) genera mayor hipertrofia con menor peso en la barra.
2. **Si compites en Powerlifting:** Basta con romper la línea del pliegue de la cadera con respecto a la rodilla.
3. **No sacrifiques rango por ego:** 100 kg en sentadilla profunda construyen más cuádriceps que 140 kg en medias sentadillas.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Cardio en Ayunas: ¿Quema Más Grasa o Estás Perdiendo Músculo? La Verdad Científica',
        slug: 'cardio-en-ayunas-quema-grasa-evidencia-cientifica',
        category: 'Entrenamiento',
        reading_time: 4,
        summary: 'Hacer cardio antes de desayunar promete acelerar la lipólisis, pero ¿se traduce eso en una mayor pérdida de grasa corporal al final del día? Te explicamos el balance energético neto.',
        image_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
        tags: 'cardio, ayuno, oxidacion grasas, deficit calorico, masa muscular',
        author_name: 'Elena Garrido · Nutricionista Deportiva',
        seo_title: 'Cardio en Ayunas para Perder Grasa: Mito vs Realidad Científica',
        seo_description: 'Descubre qué dice la ciencia sobre el cardio en ayunas. Diferencia entre quemar grasa de forma aguda y el balance calórico diario.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        content: `## El mito del cardio al amanecer

La hipótesis original parecía impecable sobre el papel: tras 8 o 10 horas de ayuno nocturno, los niveles de insulina circulante son mínimos y los depósitos de glucógeno hepático están parcialmente deplecionados. Por tanto, si sales a correr o pedaleas en ayunas, tu organismo recurrirá de inmediato a los ácidos grasos como sustrato energético.

¿Es cierto esto? **Sí, de forma aguda durante el ejercicio. Pero irrelevante para perder grasa.**

---

### Lo que los estudios a 24 horas revelaron

El estudio pionero de Schoenfeld et al. (2014) comparó a dos grupos de personas siguiendo el mismo déficit calórico:
- **Grupo A:** 50 minutos de cardio aeróbico en ayunas.
- **Grupo B:** 50 minutos de cardio habiendo desayunado previamente.

**El resultado al cabo de 4 semanas:** No hubo absolutamente ninguna diferencia estadísticamente significativa en el porcentaje graso ni en el peso corporal perdido.

### ¿Por qué ocurre esto?
El cuerpo humano es una máquina homeostática. Si oxidas más grasa durante tu entrenamiento matutino en ayunas, el cuerpo compensará en las horas posteriores gastando prioritariamente glucógeno. Y a la inversa: si quemas carbohidratos en tu sesión, quemarás más grasa durante el resto de la jornada en reposo.

### Recomendaciones clave
- **Entrena cuando te sientas con más energía:** Si entrenar en ayunas te hace sentir ligero y motivado, hazlo.
- **Si vas a hacer HIIT intenso:** Come algo antes para rendir a máxima potencia y no perder rendimiento ni masa muscular.
- **Lo que manda siempre es el déficit calórico semanal:** Ningún horario de cardio puede compensar un superávit de calorías en tu dieta.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Tiempo de Descanso Entre Series: Por Qué Descansar 3 Minutos Duplica Tu Hipertrofia Frente a 60 Segundos',
        slug: 'tiempo-descanso-entre-series-hipertrofia-fuerza',
        category: 'Entrenamiento',
        reading_time: 5,
        summary: 'La vieja creencia de descansar un minuto para "sentir el ardor metabólico" limita drásticamente la tensión mecánica. Te mostramos cómo el descanso largo impulsa tus marcas.',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
        tags: 'descanso, hipertrofia, series, fuerza, sobrecarga progresiva',
        author_name: 'Carlos Méndez · Especialista en Fuerza',
        seo_title: '¿Cuánto Descansar Entre Series para Ganar Músculo? La Ciencia',
        seo_description: 'Por qué descansar de 2 a 3 minutos supera a los descansos cortos de 60 segundos para la fuerza y la síntesis muscular.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        content: `## El mito del "reloj de arena" en el gimnasio

Durante muchos años, revistas y entrenadores aconsejaban no descansar más de 45 a 60 segundos entre series. Se argumentaba que el estrés metabólico, el bombeo sanguíneo y el ardor por lactato eran los conductores directos del crecimiento.

Sin embargo, el ensayo clínico de Schoenfeld et al. (2016) titulado *"Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men"* sacudió por completo los cimientos del entrenamiento de fuerza.

---

### El experimento que lo cambió todo

Se dividió a levantadores experimentados en dos protocolos idénticos de volumen (3 series de 8 a 12 repeticiones):
- **Grupo Corto:** 1 minuto de descanso entre series.
- **Grupo Largo:** 3 minutos de descanso entre series.

**Resultados tras 8 semanas:**
El grupo de 3 minutos experimentó un incremento **significativamente mayor tanto en grosor muscular (hipertrofia en cuádriceps y tríceps) como en fuerza máxima en 1RM**.

### ¿Cuál es la razón biológica?
La regeneración de la **fosfocreatina muscular (PCr)** y la recuperación del sistema nervioso central necesitan tiempo:
- A los 60 segundos, solo has regenerado aproximadamente el 70-75% de tus reservas energéticas.
- A los 3 minutos, tus reservas de fosfocreatina superan el 95%.

Esto te permite mover **más repeticiones con la misma carga** en las series posteriores, acumulando un tonelaje total (peso × series × reps) mucho más elevado, lo cual estimula directamente la vía mTOR.

### Guía práctica de descanso según ejercicio
1. **Ejercicios básicos multiarticulares** (Sentadillas, Peso muerto, Press militar, Remos): 2.5 a 3.5 minutos.
2. **Ejercicios accesorios de aislamiento** (Curl bíceps, elevaciones laterales, tríceps en polea): 1.5 a 2 minutos.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // --- NUTRICIÓN ---
      {
        title: 'La Ventana Anabólica: El Gran Mito del Batido en los Primeros 30 Minutos',
        slug: 'ventana-anabolica-mito-batido-post-entreno',
        category: 'Nutrición',
        reading_time: 4,
        summary: 'Correr desesperado al vestuario para beberte el batido de proteína antes de media hora es innecesario. Descubre cuánto dura realmente la ventana de oportunidad anabólica.',
        image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
        tags: 'ventana anabolica, proteina, post entreno, sintesis proteica, nutricion',
        author_name: 'Elena Garrido · Nutricionista Deportiva',
        seo_title: 'Ventana Anabólica: ¿Hay que Tomar el Batido de Proteína Justo al Terminar?',
        seo_description: 'Desmontando el mito de los 30 minutos post-entreno. Cómo optimizar la ingesta proteica a lo largo de 24 horas según la evidencia.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        content: `## El pánico al catabolismo inmediato

Todos hemos visto a alguien en el vestuario agitando frenéticamente su shaker como si el músculo fuera a evaporarse si pasaban 31 minutos tras la última serie de dominadas. Esta paranoia nació de estudios antiguos con sujetos en ayuno estricto de más de 12 horas.

En la realidad de un atleta normal que ha comido 2 o 3 horas antes de entrenar, la digestión de aminoácidos sigue activa en el torrente sanguíneo durante y después de la sesión.

---

### ¿Cuánto dura la ventana anabólica real?

Las revisiones sistemáticas de Alan Aragon y Brad Schoenfeld han demostrado que la elevación de la síntesis proteica muscular (MPS) se mantiene elevada entre **24 y 48 horas** después de un entrenamiento de fuerza con sobrecarga progresiva.

La verdadera "ventana" no es de 30 minutos, sino un **marco de 4 a 6 horas** entre tu comida pre-entrenamiento y tu comida post-entrenamiento.

> [!NOTE]
> Lo que determina el 85% de tus resultados no es la puntualidad del minuto exacto, sino alcanzar tu **meta diaria total de proteínas** (entre 1.6 y 2.2 gramos por kilo de peso corporal).

### Puntos clave para maximizar la síntesis proteica
1. **Distribuye la proteína en 3 a 5 tomas:** Asegura entre 25 y 40 gramos de proteína de alto valor biológico por comida (aportando al menos 2.5 a 3 g de leucina).
2. **No te estreses al salir del gym:** Dúchate con calma, llega a casa y haz una comida sólida equilibrada con proteína, carbohidratos complejos e hidratación.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Carbohidratos por la Noche: El Mito de Que "Engordan el Doble al Dormir" Desmontado',
        slug: 'carbohidratos-por-la-noche-engordan-mitos-metabolismo',
        category: 'Nutrición',
        reading_time: 5,
        summary: 'Tu metabolismo no se apaga a las ocho de la tarde. De hecho, consumir carbohidratos en la cena puede mejorar tu sueño profundo y tu recuperación muscular. Te explicamos por qué.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
        tags: 'carbohidratos, metabolismo, glucogeno, perdida de grasa, sueno',
        author_name: 'Elena Garrido · Nutricionista Deportiva',
        seo_title: 'Comer Carbohidratos de Noche Engorda: La Evidencia Científica',
        seo_description: 'Por qué comer arroz, patata o pasta por la noche no frena la quema de grasa si mantienes tu balance calórico diario.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        content: `## El reloj biológico y las calorías

Existe una superstición arraigada de que a partir de las 18:00 o 20:00 horas, cualquier carbohidrato que entre en tu organismo se convertirá instantáneamente en grasa visceral porque "como te vas a dormir, no lo quemas".

Esta visión ignora cómo funciona la termodinámica del cuerpo humano.

---

### Tu metabolismo basal no se detiene al dormir

Durante las 7 u 8 horas de sueño, tu cerebro, corazón, pulmones, órganos vitales y procesos de síntesis muscular consumen una cantidad masiva de energía. La tasa metabólica durante el sueño REM es prácticamente idéntica a la tasa metabólica en reposo durante el día.

Además, si entrenaste por la tarde, tus depósitos de **glucógeno muscular y hepático** están parcialmente vacíos. Cualquier carbohidrato que consumas en la cena se destinará prioritariamente a recargar esos almacenes musculares, no a la lipogénesis.

### El beneficio secreto de los carbohidratos en la cena: El sueño
El consumo de carbohidratos complejos de índice glucémico moderado/alto estimula la liberación de insulina, la cual facilita el paso del **L-triptófano** a través de la barrera hematoencefálica. Una vez en el cerebro, el triptófano se convierte en **serotonina** y posteriormente en **melatonina** (la hormona del descanso).

### Recomendación final
- No le tengas miedo a incluir arroz, patatas cocidas, boniato o avena en tu cena.
- Ajusta tus cantidades a tus macros diarios totales calculados en tu plan nutricional de Pro Fitness Glass.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Dieta Flexible (IIFYM) vs Comer "100% Limpio": Por Qué la Adherencia Supera al Perfeccionismo',
        slug: 'dieta-flexible-iifym-vs-comer-limpio-adherencia-psicologia',
        category: 'Nutrición',
        reading_time: 6,
        summary: 'Dividir los alimentos en "buenos" y "malos" es el camino más directo al efecto rebote y la ansiedad. Aprende a aplicar la regla 80/20 para mantenerte en forma todo el año.',
        image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
        tags: 'dieta flexible, iifym, nutricion, adherencia, psicologia',
        author_name: 'Dr. Álvaro Rivas · Fisiología del Deporte',
        seo_title: 'Dieta Flexible (IIFYM) vs Dieta Limpia: Beneficios y Guía 80/20',
        seo_description: 'Cómo cuadrar tus macronutrientes sin obsesionarte con alimentos prohibidos. Sostenibilidad, adherencia y prevención de atracones.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        content: `## El ciclo destructivo del "pollo y arroz hervido"

Millones de personas inician el año comiendo exclusivamente pechuga de pollo seca, arroz blanco y brócoli al vapor. Durante tres semanas se sienten imparables; en la cuarta semana, asisten a una reunión familiar, prueban una porción de tarta, sienten culpa y acaban abandonando el plan por completo con un atracón incontrolable.

Este fenómeno se conoce en psicología como el **"Efecto de la Dicotomía del Todo o Nada"**.

---

### ¿Qué es la Dieta Flexible (If It Fits Your Macros)?

La dieta flexible no significa alimentarse de comida ultraprocesada justificándolo con las calorías. Su enfoque real es la **priorización de la densidad de micronutrientes con flexibilidad psicológica**:

1. **La base del 80-85%:** Alimentos enteros, densos en nutrientes, ricos en fibra, vitaminas y minerales (frutas, verduras, carnes magras, legumbres, huevos, frutos secos y cereales integrales).
2. **El margen del 15-20%:** Alimentos recreativos que disfrutes (un helado, un trozo de chocolate negro, una hamburguesa casera con amigos).

### Por qué la ciencia respalda la dieta flexible
- **Mayor adherencia a largo plazo:** El mayor estudio sobre dietas y longevidad concluyó que la mejor dieta del mundo es aquella que eres capaz de mantener durante 5 años sin sufrir.
- **Salud metabólica idéntica:** Siempre que la ingesta calórica total, el aporte de proteína y la fibra (mínimo 14g por cada 1000 kcal) sean idénticos, la composición corporal resultante es exactamente la misma.

> [!IMPORTANT]
> La sostenibilidad supera a la intensidad. Si un plan no te permite salir a cenar con tu pareja de vez en cuando, no es un estilo de vida, es una cárcel temporal.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Proteína Vegetal vs Animal: ¿Es Necesario Combinar Fuentes o Es Otro Mito Superado?',
        slug: 'proteina-vegetal-vs-animal-perfil-aminoacidos-leucina',
        category: 'Nutrición',
        reading_time: 5,
        summary: 'Lentejas con arroz en el mismo plato, digestibilidad y leucina. Qué dice la ciencia moderna sobre ganar músculo con fuentes proteicas de origen vegetal.',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
        tags: 'proteina vegetal, aminoacidos, leucina, hipertrofia, nutricion vegana',
        author_name: 'Elena Garrido · Nutricionista Deportiva',
        seo_title: 'Proteína Vegetal vs Animal: Ganar Músculo con Dieta Vegana',
        seo_description: 'Análisis de calidad biológica, umbral de leucina y cómo compensar la digestibilidad en proteínas de origen vegetal para la hipertrofia.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        content: `## El mito de la "proteína incompleta"

Durante décadas se enseñó que las proteínas vegetales eran "incompletas" y que era obligatorio combinar legumbres con cereales en la misma comida para no sufrir deficiencias de aminoácidos esenciales.

La ciencia contemporánea ha demostrado que el cuerpo humano cuenta con una reserva circulante de aminoácidos (*amino acid pool*) que se encarga de equilibrar los requerimientos a lo largo de un ciclo de 24 horas.

---

### La verdadera diferencia: El umbral de leucina

La **leucina** es el aminoácido desencadenante de la señalización celular de mTOR. Para activar al máximo la síntesis proteica muscular se necesitan aproximadamente **2.7 a 3.0 gramos de leucina** por comida.

- 30 g de proteína de suero de leche (Whey) aportan unos 3.3 g de leucina.
- Para alcanzar esa misma cifra con proteína de lentejas o guisante se necesitan unos 38 a 42 g de proteína vegetal debido a su menor concentración porcentual.

### Cómo optimizar tus ganancias con proteína vegetal
1. **Aumenta la dosis total diaria:** Si eres vegano o vegetariano, sube tu objetivo a **1.8 - 2.2 g de proteína por kg** de peso corporal al día.
2. **Utiliza aislados de proteína de soja o combinación guisante-arroz:** Los aislados tienen una digestibilidad (puntuación DIAAS) prácticamente idéntica a la carne o el huevo.
3. **Varía las fuentes:** Tofu, tempeh, edamame, seitán, levadura nutricional y legumbres aportan perfiles complementarios de metionina y lisina.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // --- SUPLEMENTACIÓN ---
      {
        title: 'Cafeína y Rendimiento Deportivo: Dosis Milimétrica, Tolerancia y el Efecto Sobre Tu 1RM',
        slug: 'cafeina-preentreno-dosis-milimetrica-rendimiento-fuerza',
        category: 'Suplementación',
        reading_time: 5,
        summary: 'El pre-entreno más consumido del planeta puede aumentar tu fuerza y resistencia o arruinarte el sueño si no calculas los miligramos según tu peso y la hora de entrenamiento.',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
        tags: 'cafeina, preentreno, suplementacion, fuerza, rendimiento',
        author_name: 'Equipo Científico Pro Fitness',
        seo_title: 'Cafeína como Suplemento Deportivo: Dosis, Beneficios y Ciclos',
        seo_description: 'Aprende a dosificar la cafeína anhidra para aumentar tu fuerza y resistencia sin crear dependencia ni perjudicar tu descanso.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        content: `## El estimulante con mayor respaldo de la ciencia

La cafeína (1,3,7-trimetilxantina) es el suplemento de ayuda ergogénica de acción rápida más eficaz y estudiado del mundo. Su mecanismo de acción principal consiste en **antagonizar competitivamente los receptores de adenosina** en el cerebro, reduciendo la percepción subjetiva del esfuerzo (RPE) y mejorando la transmisión neuromuscular.

---

### Dosis óptima calculada por la ciencia

Los consensos de la *International Olympic Committee (IOC)* establecen:
- **Dosis efectiva:** Entre **3 y 6 mg por kilogramo de peso corporal**.
  - Para una persona de 75 kg: entre 225 mg y 450 mg de cafeína.
- **Momento idóneo:** Entre **45 y 60 minutos antes** de iniciar la sesión de entrenamiento (pico de concentración plasmática máxima).

### El problema de la tolerancia crónica
El consumo diario ininterrumpido provoca una **upregulation de receptores de adenosina**. Tu cerebro crea nuevos receptores para adaptarse, lo que significa que pronto necesitarás 300 mg solo para sentirte despierto, perdiendo el beneficio ergogénico de fuerza.

### Cómo ciclar la cafeína con éxito
1. **Días de descarga de cafeína:** Reserva las dosis altas de 300-400 mg únicamente para tus sesiones más pesadas de la semana (día de pierna o peso muerto).
2. **Semana de reseteo:** Cada 6 a 8 semanas, reduce el consumo de cafeína a menos de 50 mg diarios durante 7 días para restaurar la sensibilidad de tus receptores.
3. **Respeta la vida media:** La vida media de la cafeína es de 5 a 7 horas. Evita consumirla en las 8 horas previas a acostarte para no destrozar la arquitectura del sueño profundo.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Omega 3 e Hipertrofia: El Suplemento Infravalorado Que Frena el Dolor Muscular y la Inflamación',
        slug: 'omega-3-hipertrofia-recuperacion-muscular-evidencia',
        category: 'Suplementación',
        reading_time: 4,
        summary: 'Más allá de la salud cardiovascular, los ácidos grasos EPA y DHA incrementan la sensibilidad anabólica a los aminoácidos y aceleran la recuperación articular.',
        image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
        tags: 'omega 3, epa, dha, recuperacion, hipertrofia, salud articular',
        author_name: 'Dr. Álvaro Rivas · Fisiología del Deporte',
        seo_title: 'Omega 3 para Ganar Músculo y Recuperación: Dosis y Beneficios',
        seo_description: 'Efecto de los ácidos grasos esenciales EPA y DHA sobre la síntesis de proteína muscular, dolor muscular tardío (DOMS) y longevidad articular.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11),
        content: `## Más que un suplemento para el corazón

Tendemos a clasificar los suplementos en dos cajas: los "deportivos" (creatina, cafeína, proteína) y los "de salud general" (multivitamínicos, omega 3). Sin embargo, la investigación moderna de la Universidad de Stirling en atletas de élite ha revelado que el **Omega 3 tiene un papel directo en la síntesis proteica**.

---

### El mecanismo: Fluidez de la membrana celular

Los ácidos grasos poliinsaturados de cadena larga **EPA (ácido eicosapentaenoico)** y **DHA (ácido docosahexaenoico)** se integran en la bicapa lipídica de las células musculares:
- Aumentan la permeabilidad y fluidez de la membrana.
- Mejoran la señalización de los receptores de insulina y de aminoácidos hacia la vía intracelular **mTORC1**.
- Reducen la producción de citocinas proinflamatorias excesivas como el TNF-alfa y la IL-6 tras entrenamientos excéntricos devastadores.

### Dosis recomendada para atletas
Para obtener beneficios a nivel de recuperación articular y anabolismo muscular:
- **Dosis combinada:** Asegura entre **1.5 y 2.5 gramos diarios de EPA + DHA puros** (revisa la etiqueta, no te fijes solo en los mg totales de aceite de pescado).
- **Certificación IFOS:** Elige marcas con sello IFOS (International Fish Oil Standards) que certifiquen la ausencia de metales pesados y oxidación (bajo índice TOTOX).`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'BCAAs: Por Qué Son el Suplemento Más Sobrevalorado si Ya Tomas Suficiente Proteína',
        slug: 'bcaas-aminoacidos-ramificados-mito-o-dinero-tirado',
        category: 'Suplementación',
        reading_time: 4,
        summary: 'Consumir solo leucina, isoleucina y valina sin el resto de aminoácidos esenciales es como tener los obreros en la obra pero sin ladrillos. La ciencia lo tiene claro.',
        image_url: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=1200&q=80',
        tags: 'bcaas, aminoacidos, suplementos innecesarios, sintesis proteica, proteina',
        author_name: 'Equipo Científico Pro Fitness',
        seo_title: 'BCAAs: ¿Sirven para Algo o Son un Gasto Innecesario?',
        seo_description: 'Revisión científica sobre los aminoácidos de cadena ramificada (BCAAs). Por qué los EAAs o la proteína de suero son enormemente superiores.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
        content: `## El suplemento favorito del marketing fitness

Durante años, las marcas de suplementación vendían los BCAAs (aminoácidos de cadena ramificada) con sabores llamativos como el secreto indispensable para "entrenar en ayunas sin perder ni un gramo de masa muscular".

Hoy en día, la evidencia acumulada es contundente: **los BCAAs aislados no estimulan la síntesis proteica muscular neta.**

---

### La analogía de los obreros y los ladrillos

Para sintetizar nuevo tejido muscular se requieren **los 9 aminoácidos esenciales (EAAs)**. Los BCAAs contienen únicamente tres: Leucina, Isoleucina y Valina.

Imagina que la leucina es el capataz que da la orden de comenzar a construir (enciende el interruptor de mTOR). Pero si en el torrente sanguíneo no están presentes los otros 6 aminoácidos esenciales (los ladrillos), la construcción se detiene en seco. Peor aún: el cuerpo puede verse obligado a degradar otras fibras musculares para obtener los aminoácidos que le faltan.

> [!CAUTION]
> Si consumes 1.6 - 2.0 g de proteína al día procedente de alimentos reales o proteína de suero (la cual es naturalmente rica en BCAAs), gastar dinero en BCAAs es completamente redundante.

### ¿Cuándo podrían tener sentido?
Solo en casos muy específicos de personas que practican deportes de resistencia extrema (ultramaratones de más de 4 horas) para atenuar la fatiga central mediante la competencia con el triptófano, o como bebida saborizada con electrolitos si te ayuda a beber más agua.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Magnesio y Sueño Profundo: Por Qué el Bisglicinato Transforma Tu Recuperación Nocturna',
        slug: 'magnesio-bisglicinato-recuperacion-sueno-profundo',
        category: 'Suplementación',
        reading_time: 5,
        summary: 'El 70% de la población no alcanza los requerimientos mínimos de magnesio. Conoce qué forma molecular elegir y cómo potencia el descanso reparador y previene los calambres.',
        image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
        tags: 'magnesio, bisglicinato, sueno profundo, recuperacion, gaba',
        author_name: 'Elena Garrido · Nutricionista Deportiva',
        seo_title: 'Magnesio Bisglicinato: Beneficios para el Sueño y Músculos',
        seo_description: 'Guía de formas de magnesio (bisglicinato, citrato, óxido) y cómo activa los receptores GABA para un descanso muscular reparador.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        content: `## El mineral maestro de la relajación neuromuscular

El magnesio participa como cofactor enzimático en más de **300 reacciones bioquímicas esenciales**, incluyendo la producción de ATP, la síntesis de ADN y la modulación de los neurotransmisores relajantes del sistema nervioso central.

Sin embargo, los deportistas pierden cantidades significativas de magnesio a través del sudor durante sesiones intensas de entrenamiento, y la dieta occidental promedio suele ser deficitaria debido al empobrecimiento mineral de los suelos agrícolas.

---

### No todos los magnesios son iguales

Uno de los errores más frecuentes es comprar "Óxido de Magnesio" en el supermercado por ser el más barato. Su biodisponibilidad es inferior al 4% y actúa principalmente como laxante osmótico.

Las mejores formas para deportistas son:
- **Bisglicinato de Magnesio (Quelado con dos moléculas de glicina):** Biodisponibilidad superior al 80%, no causa molestias intestinales y la glicina actúa de forma sinérgica como neurotransmisor inhibitorio que induce relajación profunda.
- **Citrato de Magnesio:** Buena biodisponibilidad, ideal si también buscas regular el tránsito intestinal.
- **L-Treonato de Magnesio:** Es la única forma capaz de cruzar eficientemente la barrera hematoencefálica, optimizando la plasticidad sináptica y la claridad cognitiva.

### Protocolo de toma recomendado
- **Dosis:** Entre **200 y 400 mg de magnesio elemental**.
- **Momento:** Tomar entre **30 y 60 minutos antes de acostarte** con un vaso de agua templada.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // --- SALUD ---
      {
        title: 'Dolor Lumbar en Peso Muerto y Sentadilla: Cómo Blindar Tu Espalda y Corregir el "Butt Wink"',
        slug: 'dolor-lumbar-peso-muerto-sentadilla-butt-wink-solucion',
        category: 'Salud',
        reading_time: 6,
        summary: 'El dolor de espalda baja tras levantar pesado rara vez se debe a levantar mucho, sino a no saber crear presión intraabdominal con la maniobra de Valsalva. Corrige tu técnica hoy.',
        image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
        tags: 'dolor lumbar, peso muerto, valsalva, butt wink, salud articular',
        author_name: 'Dr. Álvaro Rivas · Fisiología del Deporte',
        seo_title: 'Cómo Evitar el Dolor Lumbar en Sentadilla y Peso Muerto',
        seo_description: 'Aprende la técnica del bracing abdominal, la maniobra de Valsalva y la corrección del butt wink para levantar pesado con seguridad.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13),
        content: `## Tu columna no es de cristal, pero exige respeto mecánico

Sentir una molestia punzante o una rigidez incapacitante en la zona lumbar al día siguiente de hacer sentadillas o peso muerto es la razón número uno de abandono en los gimnasios. La buena noticia es que la columna vertebral es una de las estructuras biomecánicas más fuertes del reino animal cuando se mantiene en **posición neutral bajo compresión axial**.

El problema surge cuando la compresión se combina con **flexión o torsión lumbar bajo carga**.

---

### El "Bracing" y la Maniobra de Valsalva: Tu cinturón natural

Muchos levantadores creen erróneamente que "meter la tripa hacia dentro" protege la espalda. Eso es falso. Lo que debes hacer es el **Bracing (empuje 360 grados)**:

1. Inhala profundamente llevando el aire hacia la parte baja de tu abdomen, costados y zona lumbar.
2. Contrae tu pared abdominal como si fueras a recibir un golpe de boxeo.
3. Esto genera una tremenda **presión intraabdominal (PIA)** que convierte tu torso en una columna de hormigón rígido, descargando la presión sobre los discos intervertebrales L4-L5 y L5-S1.

### ¿Qué es el "Butt Wink" y cómo solucionarlo?
El *butt wink* (o retroversión pélvica al fondo de la sentadilla) ocurre cuando la cadera llega al límite de su anatomía femoral y, para seguir bajando, la pelvis bascula hacia atrás, curvando la zona lumbar:
- **Abre ligeramente la anchura de tus pies:** Esto permite que la cabeza del fémur tenga espacio libre en el acetábulo.
- **Orienta las puntas de los pies hacia fuera 20-30 grados.**
- **No fuerces mayor profundidad de la que tu cadera permite con la espalda completamente neutra.**`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'El Cortisol y el Músculo: Cómo el Estrés Crónico Sabotea Tu Testosterona y Tus Ganancias',
        slug: 'cortisol-estres-cronico-testosterona-ganancia-muscular',
        category: 'Salud',
        reading_time: 5,
        summary: 'Puedes tener la rutina perfecta y la dieta al milímetro, pero si vives con estrés laboral y ansiedad continua, tu cuerpo priorizará la supervivencia frente al crecimiento muscular.',
        image_url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
        tags: 'cortisol, estres, testosterona, recuperacion, hipertrofia, salud',
        author_name: 'Dr. Álvaro Rivas · Fisiología del Deporte',
        seo_title: 'Cortisol vs Masa Muscular: Efectos del Estrés en el Gimnasio',
        seo_description: 'Cómo el cortisol crónico bloquea la síntesis proteica, disminuye la testosterona y provoca acumulación de grasa visceral.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        content: `## El enemigo invisible de tu progreso

El cortisol no es intrínsecamente malo; es una hormona glucocorticoide indispensable para la vida que nos ayuda a despertar por la mañana, movilizar glucosa en situaciones de emergencia y desinflamar tejidos de forma aguda.

El problema catastrófico para cualquier atleta es el **cortisol crónicamente elevado**.

---

### La batalla hormonal: Eje HPA vs Eje Gonadal

Cuando tu cerebro percibe estrés psicológico constante (plazos de entrega, problemas financieros, falta de descanso):
1. **La producción de testosterona se desploma:** Ambas hormonas comparten rutas de síntesis esteroidea comunes mediadas por el colesterol. Tu cuerpo prioriza el cortisol (supervivencia) sobre la testosterona (reproducción y anabolismo).
2. **Activación de la proteólisis:** El cortisol estimula la degradación de proteínas musculares para convertirlas en glucosa mediante gluconeogénesis hepática.
3. **Resistencia temporal a la insulina:** Facilita el depósito de grasa en la zona visceral y el tejido adiposo periumbilical.

### 4 Estrategias con base científica para reducir el cortisol
- **Caminatas al aire libre (NEAT regenerativo):** 20 minutos de luz solar directa reducen los niveles de cortisol salival en más de un 25%.
- **Respiración fisiológica:** Dos inhalaciones rápidas por la nariz seguidas de una exhalación lenta por la boca (el *physiological sigh*) reactiva el sistema parasimpático en menos de 90 segundos.
- **Modula el volumen de entrenamiento:** Si estás atravesando una semana de altísimo estrés en tu trabajo, no intentes batir un récord en el gimnasio. Baja el volumen a la mitad y mantén la intensidad técnica.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'Hormonas del Hambre: Cómo Dominar a la Grelina y la Leptina Durante una Definición Severa',
        slug: 'grelina-leptina-hormonas-hambre-estrategias-definicion',
        category: 'Salud',
        reading_time: 5,
        summary: 'El hambre feroz durante una etapa de definición no es falta de voluntad; es un mecanismo biológico milenario diseñado para evitar que mueras de inanición. Aprende a hackearlo.',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
        tags: 'grelina, leptina, hambre, definicion, perdida de grasa, saciedad',
        author_name: 'Elena Garrido · Nutricionista Deportiva',
        seo_title: 'Grelina y Leptina: Cómo Controlar el Hambre en Definición',
        seo_description: 'Estrategias nutricionales y de saciedad (Índice de Holt) para mantener a raya las hormonas del apetito durante el déficit calórico.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        content: `## No es falta de fuerza de voluntad, es pura biología

Cuando una persona entra en déficit calórico prolongado y desciende por debajo de cierto porcentaje de grasa corporal (especialmente por debajo del 12% en hombres y 20% en mujeres), el organismo no entiende de abdominales visibles; interpreta que hay una hambruna en su hábitat.

Para defenderse, el cuerpo orquesta una respuesta hormonal coordinada:
- **La Leptina (hormona de la saciedad producida por los adipocitos) cae en picado.**
- **La Grelina (hormona del apetito sintetizada en el estómago) se dispara a niveles máximos.**

---

### Alimentos con mayor puntuación en el Índice de Saciedad de Holt

No todas las 200 calorías sacian igual. El estudio de la Dra. Susanna Holt clasificó los alimentos según su capacidad de mantener a los sujetos saciados durante 120 minutos:

1. **Patata cocida / hervida:** Puntuación de **323%** (el alimento más saciante de la historia del índice, más del triple que el pan blanco).
2. **Pescado blanco (bacalao, merluza):** Puntuación del **225%** gracias a su altísimo volumen y péptidos bioactivos.
3. **Copos de avena integral:** Puntuación del **209%** por su contenido en betaglucanos que forman un gel viscoso en el estómago.
4. **Manzanas y naranjas enteras:** La pectina y la fibra soluble retrasan el vaciamiento gástrico.

> [!TIP]
> Nunca bebas tus calorías en definición. Un zumo de 3 naranjas aporta 150 kcal y no te sacia ni 15 minutos; comer 3 naranjas enteras requiere 10 minutos de masticación y te mantiene saciado durante 2 horas.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // --- NOVEDADES ---
      {
        title: 'Pro Fitness Glass v7.8: Inteligencia en Cada Repetición y el Nuevo Motor Liquid Glass',
        slug: 'pro-fitness-glass-v7-8-novedades-motor-liquid-glass',
        category: 'Novedades',
        reading_time: 4,
        summary: 'Descubre todas las mejoras de la versión más avanzada de nuestra plataforma: analítica predictiva de sobrecarga, interfaz ultrafluida y personalización sin límites.',
        image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
        tags: 'pro fitness glass, actualizacion, liquid glass, novedades, entrenamiento',
        author_name: 'Equipo Pro Fitness Glass',
        seo_title: 'Novedades de Pro Fitness Glass v7.8: Motor Liquid Glass e IA',
        seo_description: 'Explora las nuevas funcionalidades de Pro Fitness Glass: sugerencias automáticas de peso, tracking de volumen y nuevo diseño.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        content: `## La evolución del software deportivo más avanzado

Hoy damos un salto generacional en Pro Fitness Glass con el lanzamiento global de nuestra versión **v7.8**, diseñada bajo las directrices estéticas de *Liquid Glass* y respaldada por algoritmos de análisis biomecánico en tiempo real.

---

### Las 4 grandes novedades de esta versión

1. **Coach de Sobrecarga Progresiva Automatizado:**
   Olvídate de calcular mentalmente cuánto peso deberías poner en tu próxima serie. Nuestro algoritmo analiza tu RIR percibido en la última sesión y te recomienda exactamente si debes incrementar 1 kg, añadir una repetición o mantener la carga para consolidar la técnica.

2. **Nuevo Motor Visual Liquid Glass:**
   Efectos de desenfoque dinámico, tarjetas traslúcidas que se adaptan a tus temas favoritos (Galaxia, Desierto, Océano y Carbón) y transiciones a 120 FPS sin consumo excesivo de batería.

3. **Portal de Noticias Científicas y Guías de Élite:**
   Acceso ilimitado a artículos contrastados por especialistas en nutrición, suplementación y entrenamiento de fuerza, integrados directamente en tu aplicación sin anuncios molestos.

4. **Sincronización Inmediata y Modo Offline Completo:**
   ¿Entrenas en un sótano sin cobertura? La aplicación guarda cada serie y peso en almacenamiento local seguro y se sincroniza automáticamente con la nube en cuanto recuperas conexión.`,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        title: 'El Futuro del Fitness: Cómo la IA Predictiva y los Biosensores Están Sustituyendo a las Rutinas Genéricas',
        slug: 'futuro-del-fitness-inteligencia-artificial-biosensores',
        category: 'Novedades',
        reading_time: 5,
        summary: 'Las tablas de ejercicios impresas en papel y las dietas fotocopiadas han muerto. Descubre cómo los algoritmos de autorregulación y el HRV están transformando el deporte de élite.',
        image_url: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1200&q=80',
        tags: 'ia fitness, biosensores, hrv, vbt, futuro entrenamiento, tecnologia',
        author_name: 'Equipo Pro Fitness Glass',
        seo_title: 'El Futuro del Entrenamiento: Inteligencia Artificial y Wearables',
        seo_description: 'Análisis de las tendencias tecnológicas en el fitness moderno: entrenamiento basado en velocidad (VBT), HRV matutino y autorregulación predictiva.',
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        content: `## Del entrenamiento intuitivo al entrenamiento de precisión

Hasta hace muy poco tiempo, la única forma de saber si un entrenamiento estaba funcionando era esperar 12 semanas, pesarse en la báscula y mirarse al espejo. Si estabas sobreentrenado o lesionándote la articulación, solías enterarte demasiado tarde.

La convergencia entre **biosensores ópticos de muñeca** y **modelos de lenguaje e inferencia predictiva** está inaugurando la era del *Smart Fitness*.

---

### Las tres tecnologías que están cambiando las reglas del juego

1. **Variabilidad de la Frecuencia Cardíaca (HRV):**
   La métrica reina de la recuperación del sistema nervioso autónomo. Si tu HRV matutino cae un 20% respecto a tu media basal, tu capacidad de asimilar volumen pesado ese día está severamente mermada. La app puede autorregular tu volumen reduciendo una serie antes de que te sobreentrenes.

2. **Entrenamiento Basado en Velocidad (VBT):**
   Medir la velocidad concéntrica media (m/s) con la que asciende la barra permite estimar el 1RM diario sin necesidad de llegar al fallo, evitando días malos donde forzar la carga habitual solo aumentaría el riesgo lesivo.

3. **Periodización no lineal adaptativa:**
   En lugar de seguir una rutina fija de 4 semanas que ignora tu falta de sueño o tus niveles de estrés, el software ajusta los estímulos para maximizar la curva de supercompensación.

En Pro Fitness Glass estamos liderando esta transición para poner en la palma de tu mano la misma tecnología de la que antes solo disfrutaban los atletas olímpicos.`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const art of articles) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM news WHERE slug = :slug',
        { replacements: { slug: art.slug }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!existing) {
        await queryInterface.bulkInsert('news', [art]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const slugs = [
      'fallo-muscular-mito-hipertrofia-rir-optimo',
      'sentadilla-profunda-vs-paralela-hipertrofia-biomecanica',
      'cardio-en-ayunas-quema-grasa-evidencia-cientifica',
      'tiempo-descanso-entre-series-hipertrofia-fuerza',
      'ventana-anabolica-mito-batido-post-entreno',
      'carbohidratos-por-la-noche-engordan-mitos-metabolismo',
      'dieta-flexible-iifym-vs-comer-limpio-adherencia-psicologia',
      'proteina-vegetal-vs-animal-perfil-aminoacidos-leucina',
      'cafeina-preentreno-dosis-milimetrica-rendimiento-fuerza',
      'omega-3-hipertrofia-recuperacion-muscular-evidencia',
      'bcaas-aminoacidos-ramificados-mito-o-dinero-tirado',
      'magnesio-bisglicinato-recuperacion-sueno-profundo',
      'dolor-lumbar-peso-muerto-sentadilla-butt-wink-solucion',
      'cortisol-estres-cronico-testosterona-ganancia-muscular',
      'grelina-leptina-hormonas-hambre-estrategias-definicion',
      'pro-fitness-glass-v7-8-novedades-motor-liquid-glass',
      'futuro-del-fitness-inteligencia-artificial-biosensores'
    ];

    await queryInterface.bulkDelete('news', {
      slug: slugs
    });
  }
};
