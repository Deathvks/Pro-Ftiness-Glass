/* frontend/src/utils/csvWorkoutParser.js */

/**
 * Parsea el texto CSV soportando comillas, saltos de línea dentro de campos
 * y delimitadores automáticos (coma, punto y coma o tabulación).
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return { headers: [], rows: [] };

  // Elimina UTF-8 BOM si está presente
  const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

  // Detección automática del delimitador analizando la primera fila
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // Omitir la comilla escapada doble
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return { headers: [], rawHeaders: [], rows: [], delimiter };

  const rawHeaders = rows[0];
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  const dataRows = rows.slice(1);

  return { headers, rawHeaders, rows: dataRows, delimiter };
}

const MONTHS_MAP = {
  jan: 0, ene: 0, enero: 0, january: 0,
  feb: 1, febrero: 1, february: 1,
  mar: 2, marzo: 2, march: 2,
  apr: 3, abr: 3, abril: 3, april: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5, june: 5,
  jul: 6, julio: 6, july: 6,
  aug: 7, ago: 7, agosto: 7, august: 7,
  sep: 8, set: 8, sept: 8, septiembre: 8, september: 8,
  oct: 9, octubre: 9, october: 9,
  nov: 10, noviembre: 10, november: 10,
  dec: 11, dic: 11, diciembre: 11, december: 11
};

export function parseCustomDate(dateStr) {
  if (!dateStr) return new Date();
  const cleaned = String(dateStr).trim().replace(/^["']|["']$/g, '');

  // 1. Patrón con nombre de mes: "18 Jan 2024, 18:30" o "18 Ene 2024 18:30"
  const textMonthMatch = cleaned.match(/^(\d{1,2})[\s\/-]([a-zA-ZáéíóúÁÉÍÓÚ]+)[\s\/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const mStr = textMonthMatch[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3);
    const year = parseInt(textMonthMatch[3], 10);
    const hour = textMonthMatch[4] ? parseInt(textMonthMatch[4], 10) : 12;
    const min = textMonthMatch[5] ? parseInt(textMonthMatch[5], 10) : 0;
    const sec = textMonthMatch[6] ? parseInt(textMonthMatch[6], 10) : 0;
    if (MONTHS_MAP[mStr] !== undefined) {
      return new Date(Date.UTC(year, MONTHS_MAP[mStr], day, hour, min, sec));
    }
  }

  // 2. Fecha estándar ISO o compatible
  const direct = new Date(cleaned);
  if (!isNaN(direct.getTime()) && direct.getFullYear() > 2000 && direct.getFullYear() < 2100) {
    return direct;
  }

  // 3. Patrón numérico DD/MM/YYYY HH:mm o DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }

  return new Date();
}

export function parseDurationSeconds(str) {
  if (!str) return 3600;
  const s = String(str).trim().toLowerCase();

  let total = 0;
  const hoursMatch = s.match(/(\d+)\s*h/);
  const minMatch = s.match(/(\d+)\s*m/);
  const secMatch = s.match(/(\d+)\s*s/);

  if (hoursMatch || minMatch || secMatch) {
    if (hoursMatch) total += parseInt(hoursMatch[1], 10) * 3600;
    if (minMatch) total += parseInt(minMatch[1], 10) * 60;
    if (secMatch) total += parseInt(secMatch[1], 10);
    return total > 0 ? total : 3600;
  }

  const num = parseFloat(s.replace(',', '.'));
  if (!isNaN(num) && num > 0) {
    return num > 300 ? Math.round(num) : Math.round(num * 60);
  }

  return 3600;
}

export function parseNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  const clean = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function detectPlatform(headers) {
  const h = headers.map(x => x.toLowerCase());
  if (h.includes('exercise_title') || (h.includes('set_type') && h.includes('start_time'))) {
    return 'hevy';
  }
  if (h.includes('set order') || (h.includes('workout name') && h.includes('exercise name'))) {
    return 'strong';
  }
  if (h.includes('rir') || (h.includes('tipo de serie') && h.includes('ejercicio'))) {
    return 'pfg';
  }
  return 'generic';
}

/**
 * Procesa un archivo CSV exportado desde Hevy, Strong o Pro Fitness Glass.
 * Devuelve la lista estructurada de entrenamientos listos para importar.
 */
export function parseWorkoutCSV(csvText) {
  const { headers, rows, delimiter } = parseCSV(csvText);
  if (headers.length === 0 || rows.length === 0) {
    throw new Error('El archivo CSV está vacío o no contiene filas de datos válidas.');
  }

  const platform = detectPlatform(headers);
  const colIndex = {};
  headers.forEach((h, idx) => {
    colIndex[h] = idx;
  });

  const getCol = (row, candidates) => {
    for (const c of candidates) {
      const idx = colIndex[c.toLowerCase()];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx];
      }
    }
    return '';
  };

  const workoutsMap = new Map();

  for (const row of rows) {
    let routineName = getCol(row, ['workout_title', 'workout name', 'title', 'nombre del entrenamiento', 'rutina', 'routine']) || 'Entrenamiento Importado';
    routineName = routineName.trim();

    const dateRaw = getCol(row, ['start_time', 'date', 'fecha', 'workout_date', 'datetime']);
    const workoutDate = parseCustomDate(dateRaw);
    const dateKey = workoutDate.toISOString().slice(0, 16);
    const sessionKey = `${dateKey}___${routineName}`;

    const exerciseName = getCol(row, ['exercise_title', 'exercise name', 'exercise', 'ejercicio']) || 'Ejercicio General';

    const durationRaw = getCol(row, ['duration_seconds', 'duration', 'duración (min)', 'duracion']);
    const duration = parseDurationSeconds(durationRaw);

    const notes = getCol(row, ['description', 'workout notes', 'notas del entrenamiento', 'notes', 'notas']);

    const setIdxRaw = getCol(row, ['set_index', 'set order', 'nº serie', 'serie', 'set']);
    let setNumber = parseInt(setIdxRaw, 10);
    if (isNaN(setNumber)) setNumber = 1;
    if (platform === 'hevy' && setIdxRaw === '0') setNumber = 1;
    else if (platform === 'hevy' && !isNaN(parseInt(setIdxRaw, 10))) setNumber = parseInt(setIdxRaw, 10) + 1;

    const setTypeRaw = getCol(row, ['set_type', 'tipo de serie', 'tipo', 'type']).toLowerCase();
    const isWarmup = setTypeRaw.includes('warm') || setTypeRaw.includes('calent') || String(setIdxRaw).toLowerCase().startsWith('w');
    const isDropset = setTypeRaw.includes('drop') || setTypeRaw.includes('descendente');

    let weight = 0;
    const weightKgRaw = getCol(row, ['weight_kg', 'peso (kg)', 'peso']);
    const weightLbsRaw = getCol(row, ['weight_lbs', 'weight']);

    if (weightKgRaw) {
      weight = parseNumber(weightKgRaw);
    } else if (weightLbsRaw) {
      const val = parseNumber(weightLbsRaw);
      const isLbs = String(weightLbsRaw).toLowerCase().includes('lbs') || headers.some(h => h.includes('lbs'));
      weight = isLbs ? Math.round(val * 0.45359237 * 100) / 100 : val;
    }

    const reps = Math.round(parseNumber(getCol(row, ['reps', 'repeticiones', 'reps done'])));

    const rpeRaw = getCol(row, ['rpe']);
    const rirRaw = getCol(row, ['rir']);
    let rir = null;
    if (rirRaw !== '') {
      rir = parseNumber(rirRaw);
    } else if (rpeRaw !== '') {
      const rpe = parseNumber(rpeRaw);
      if (rpe > 0 && rpe <= 10) {
        rir = Math.round((10 - rpe) * 10) / 10;
      }
    }

    const supersetId = getCol(row, ['superset_id', 'grupo superserie', 'superset']);

    if (!workoutsMap.has(sessionKey)) {
      workoutsMap.set(sessionKey, {
        routine_name: routineName,
        workout_date: workoutDate.toISOString(),
        duration_seconds: duration,
        notes: notes || null,
        exercisesMap: new Map()
      });
    }

    const currentWorkout = workoutsMap.get(sessionKey);
    if (duration > 0 && currentWorkout.duration_seconds === 3600) {
      currentWorkout.duration_seconds = duration;
    }
    if (!currentWorkout.notes && notes) {
      currentWorkout.notes = notes;
    }

    if (!currentWorkout.exercisesMap.has(exerciseName)) {
      currentWorkout.exercisesMap.set(exerciseName, {
        exercise_name: exerciseName,
        superset_group_id: supersetId || null,
        setsDone: []
      });
    }

    const currentExercise = currentWorkout.exercisesMap.get(exerciseName);
    currentExercise.setsDone.push({
      set_number: currentExercise.setsDone.length + 1,
      weight_kg: weight,
      reps: reps,
      is_warmup: isWarmup,
      is_dropset: isDropset,
      rir: rir
    });
  }

  const workouts = [];
  let totalSets = 0;
  const uniqueExercises = new Set();
  let minDate = null;
  let maxDate = null;

  for (const w of workoutsMap.values()) {
    const exercisesList = Array.from(w.exercisesMap.values());
    exercisesList.forEach(ex => {
      uniqueExercises.add(ex.exercise_name);
      totalSets += ex.setsDone.length;
    });

    const wDate = new Date(w.workout_date);
    if (!minDate || wDate < minDate) minDate = wDate;
    if (!maxDate || wDate > maxDate) maxDate = wDate;

    workouts.push({
      routine_name: w.routine_name,
      workout_date: w.workout_date,
      duration_seconds: w.duration_seconds,
      notes: w.notes,
      details: exercisesList
    });
  }

  // Ordenar cronológicamente (los más antiguos primero para un historial coherente)
  workouts.sort((a, b) => new Date(a.workout_date) - new Date(b.workout_date));

  return {
    platform,
    workouts,
    summary: {
      totalWorkouts: workouts.length,
      totalExercises: uniqueExercises.size,
      totalSets,
      minDate: minDate ? minDate.toISOString() : null,
      maxDate: maxDate ? maxDate.toISOString() : null
    }
  };
}

/**
 * Exporta un array de entrenamientos de Pro Fitness Glass a un archivo CSV
 * con codificación UTF-8 con BOM compatible con Excel y re-importable.
 */
export function exportWorkoutsToCSV(workouts) {
  const headers = [
    'Date',
    'Workout Name',
    'Duration (min)',
    'Exercise Name',
    'Set Order',
    'Set Type',
    'Weight (kg)',
    'Reps',
    'RIR',
    'Notes'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [];
  rows.push(headers.join(','));

  for (const log of (workouts || [])) {
    const rawDate = log.workout_date ? new Date(log.workout_date) : new Date();
    const dateStr = !isNaN(rawDate.getTime()) ? rawDate.toISOString().replace('T', ' ').slice(0, 19) : '';
    const routineName = log.routine_name || (log.routine && log.routine.name) || 'Entrenamiento';
    const durationMin = log.duration_seconds ? Math.round(log.duration_seconds / 60) : 0;
    const workoutNotes = log.notes || '';

    const details = log.WorkoutLogDetails || log.details || [];
    for (const detail of details) {
      const exerciseName = detail.exercise_name || detail.name || 'Ejercicio';
      const sets = detail.WorkoutLogSets || detail.setsDone || [];

      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        let setType = 'Normal';
        if (set.is_warmup) setType = 'Calentamiento';
        else if (set.is_dropset) setType = 'Dropset';

        const row = [
          escapeCSV(dateStr),
          escapeCSV(routineName),
          escapeCSV(durationMin),
          escapeCSV(exerciseName),
          escapeCSV(set.set_number || i + 1),
          escapeCSV(setType),
          escapeCSV(set.weight_kg !== undefined ? set.weight_kg : 0),
          escapeCSV(set.reps !== undefined ? set.reps : 0),
          escapeCSV(set.rir !== null && set.rir !== undefined ? set.rir : ''),
          escapeCSV(workoutNotes)
        ];
        rows.push(row.join(','));
      }
    }
  }

  // Anteponemos el Byte Order Mark UTF-8 para que Excel reconozca tildes y caracteres especiales
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Dispara la descarga de un blob o string en el navegador.
 */
export function downloadCSVFile(content, filename) {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: 'text/csv;charset=utf-8;' });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `pro_fitness_glass_historial_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
