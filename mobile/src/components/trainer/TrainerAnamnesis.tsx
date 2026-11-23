import { useState } from 'react';
import { View } from 'react-native';
import { AdminSelect } from '@/components/admin/AdminControls';
import { AdminButton, AdminCard, AdminInput, AdminText, AdminToggle, styles, useAdminAction } from '@/components/admin/AdminUI';
import { saveTrainerAnamnesis, updateTrainerClient, type Anamnesis, type TrainerPerson } from '@/services/trainerService';

type Options = readonly (readonly [string, string])[];
type Field = readonly [key: string, label: string, input?: 'multiline' | 'numeric' | Options];
const SECTIONS: readonly (readonly [string, readonly Field[]])[] = [
  ['Datos personales', [['edad', 'Edad', 'numeric'], ['telefono', 'Teléfono', 'numeric'], ['profesion', 'Profesión u ocupación principal']]],
  ['Contexto actual', [['contexto', '¿Quién es, ritmo de vida y qué le ha animado?', 'multiline']]],
  ['Historial de la lesión', [
    ['lesion_inicio', '¿Cuándo y cómo empezó?', 'multiline'], ['lesion_diagnostico', '¿Diagnóstico médico oficial?'],
    ['lesion_tratamientos', 'Tratamientos previos', 'multiline'],
  ]],
  ['Características del dolor', [
    ['dolor_zona', '¿En qué zona exacta siente la molestia?'], ['dolor_reposo', 'Reposo (0–10)', 'numeric'],
    ['dolor_diario', 'Diario (0–10)', 'numeric'], ['dolor_ejercicio', 'Ejercicio (0–10)', 'numeric'],
    ['dolor_comportamiento', 'Comportamiento del dolor', [
      ['calentar', 'Al calentar se alivia'], ['aumenta', 'Va aumentando con el movimiento'],
      ['siguiente_dia', 'Aparece o empeora al día siguiente'], ['variable', 'Variable, sin patrón claro'],
    ]],
    ['dolor_movimientos', 'Movimientos que alivian o provocan dolor', 'multiline'],
  ]],
  ['Señales de alerta', []],
  ['Objetivos y entrenamiento', [
    ['objetivo', 'Objetivo secundario', [['perder_grasa', 'Perder grasa / mejorar forma'], ['masa_muscular', 'Ganar masa muscular y fuerza'], ['postura', 'Mejorar postura corporal'], ['otro', 'Otro']]],
    ['experiencia', 'Experiencia previa en fuerza', [['nunca', 'Nunca he entrenado'], ['pasado', 'Entrené en el pasado'], ['habitual', 'Entreno habitualmente']]],
    ['dias', 'Días disponibles', [['1-2', '1–2 días'], ['3', '3 días'], ['4+', '4 o más días']]],
  ]],
  ['Estilo de vida y descanso', [
    ['jornada', 'Jornada laboral', [['sedentaria', 'Sedentaria'], ['activa', 'Activa'], ['exigente', 'Muy exigente físicamente']]],
    ['descanso', 'Descanso', [['menos_6', 'Menos de 6 h'], ['6-7', '6–7 horas'], ['mas_7', '7–8 horas o más']]],
    ['estres', 'Estrés', [['bajo', 'Bajo'], ['medio', 'Medio'], ['alto', 'Alto']]],
  ]],
  ['Alimentación y suplementación', [
    ['alimentacion', 'Alimentación', [['sin_control', 'Sin control específico'], ['intento_sano', 'Intento comer sano'], ['saludable', 'Saludable y controlada'], ['pautas', 'Sigo pautas de un profesional']]],
    ['suplementos', 'Suplementos / medicación', 'multiline'],
  ]],
];
const ALERTS = [
  ['fuerza', 'Pérdida de fuerza repentina en un brazo o pierna.'],
  ['hormigueo', 'Hormigueo constante o pérdida de sensibilidad.'],
  ['nocturno', 'Dolor nocturno que impide dormir.'],
  ['inflamacion', 'Inflamación grande, calor o enrojecimiento.'],
];

export function TrainerAnamnesis({ client, editing, onFinish }: {
  client: TrainerPerson & { anamnesisData?: Anamnesis }; editing: boolean; onFinish: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [form, setForm] = useState<Anamnesis>(client.anamnesisData ?? {});
  const { busy, run } = useAdminAction();
  const alerts = Array.isArray(form.alertas) ? form.alertas : [];
  const filled = Object.entries(form).some(([key, value]) => key !== 'trainingDays' &&
    (Array.isArray(value) ? value.length > 0 : value != null && String(value).trim() !== ''));
  const setField = (key: string, value: string | string[]) => setForm(previous => ({ ...previous, [key]: value }));

  function save() {
    const { trainingDays: _trainingDays, ...anamnesis } = form;
    void run(() => editing
      ? updateTrainerClient(client.id, name.trim(), anamnesis)
      : saveTrainerAnamnesis(client.id, anamnesis), 'Cuestionario guardado.', onFinish);
  }

  return <View style={styles.stack}>
    <AdminCard title={client.name}>
      <AdminText secondary>@{client.username}</AdminText>
      {editing && <AdminInput label="Nombre del cliente" value={name} onChangeText={setName} editable={!busy} />}
    </AdminCard>
    {SECTIONS.map(([title, fields]) => <AdminCard key={title} title={title}>
      {fields.length === 0 && ALERTS.map(([key, label]) => <AdminToggle key={key} label={label} value={alerts.includes(key)}
        onChange={selected => setField('alertas', selected ? [...alerts, key] : alerts.filter(item => item !== key))} />)}
      {fields.map(([key, label, input]) => {
        const value = String(form[key] ?? '');
        return input && typeof input !== 'string'
          ? <AdminSelect key={key} label={label} value={value} options={[[ '', 'Sin seleccionar'], ...input]} onChange={next => setField(key, next)} />
          : <AdminInput key={key} label={label} value={value} editable={!busy} multiline={input === 'multiline'}
            keyboardType={input === 'numeric' ? 'number-pad' : 'default'}
            onChangeText={next => setField(key, input === 'numeric' ? next.replace(/\D/g, '') : next)} />;
      })}
    </AdminCard>)}
    <AdminButton label={busy ? 'Guardando…' : 'Guardar cuestionario'} variant="primary" disabled={busy || !filled || !name.trim()} onPress={save} />
    {!editing && <AdminButton label="Completar más tarde" disabled={busy} onPress={onFinish} />}
  </View>;
}
