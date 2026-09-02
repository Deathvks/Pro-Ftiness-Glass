import React, { useState } from 'react';
import { 
  ChevronLeftIcon, 
  DocumentCheckIcon, 
  UserIcon, 
  InformationCircleIcon, 
  HeartIcon, 
  FireIcon, 
  ExclamationTriangleIcon, 
  TrophyIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import apiClient from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';
import CustomSelect from '../CustomSelect';

const SectionCard = ({ title, icon: Icon, children, isAlert = false }) => (
  <div className="bg-bg-primary/50 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-glass-border shadow-2xl shadow-black/5 dark:shadow-white/5 relative overflow-hidden group hover:border-glass-border/80 transition-colors">
    <div className={`absolute -top-20 -right-20 w-40 h-40 ${isAlert ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-accent/10 group-hover:bg-accent/20'} rounded-full blur-[50px] pointer-events-none transition-colors`}></div>
    <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-glass-border pb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isAlert ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-accent/10 border-accent/20 text-accent'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isAlert ? 'text-red-500' : 'text-text-primary'}`}>{title}</h2>
    </div>
    <div className="space-y-5 relative z-10">
      {children}
    </div>
  </div>
);

export default function AnamnesisForm({ client, onFinish, onBack, isEditing = false }) {
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem(`trainer_anamnesis_form_${client.id}`);
    if (saved) return JSON.parse(saved);
    return isEditing && client.anamnesisData ? client.anamnesisData : {};
  });
  const [clientName, setClientName] = useState(client.name || '');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  React.useEffect(() => {
    sessionStorage.setItem(`trainer_anamnesis_form_${client.id}`, JSON.stringify(formData));
  }, [formData, client.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      let current = formData[name] || [];
      if (checked) {
        current = [...current, value];
      } else {
        current = current.filter(v => v !== value);
      }
      setFormData({ ...formData, [name]: current });
    } else {
      let finalValue = value;
      // Campos estrictamente numéricos (edad, teléfono, dolores)
      if (['edad', 'telefono', 'dolor_reposo', 'dolor_diario', 'dolor_ejercicio'].includes(name)) {
        finalValue = value.replace(/\D/g, ''); // Solo dígitos
      }
      setFormData({ ...formData, [name]: finalValue });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxToggle = (name, value) => {
    let current = formData[name] || [];
    if (current.includes(value)) {
      current = current.filter(v => v !== value);
    } else {
      current = [...current, value];
    }
    setFormData(prev => ({ ...prev, [name]: current }));
  };

  const CheckboxItem = ({ label, name, value }) => {
    const isChecked = formData[name]?.includes(value) || false;
    return (
      <div 
        onClick={() => handleCheckboxToggle(name, value)}
        className="flex items-center gap-3 cursor-pointer group/checkbox"
      >
        <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center transition-all ${isChecked ? 'bg-accent border-accent text-bg-primary' : 'border-2 border-text-secondary/50 group-hover/checkbox:border-accent'}`}>
          {isChecked && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="group-hover/checkbox:text-accent transition-colors select-none text-sm">{label}</span>
      </div>
    );
  };

  const handleSave = async () => {
    if (isEditing && !clientName.trim()) {
      addToast('El nombre no puede estar vacío.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await apiClient(`/trainer/clients/${client.id}`, { 
          method: 'PUT', 
          body: { name: clientName }
        });
      }

      await apiClient(`/trainer/clients/${client.id}/anamnesis`, { 
        method: 'POST', 
        body: { anamnesisData: formData } 
      });
      addToast('Cuestionario guardado con éxito', 'success');
      sessionStorage.removeItem(`trainer_anamnesis_form_${client.id}`);
      onFinish();
    } catch (err) {
      console.error(err);
      addToast('Error al guardar la anamnesis', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fillRandomData = () => {
    setFormData({
      edad: Math.floor(Math.random() * 40) + 18,
      telefono: '600' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
      profesion: 'Oficinista',
      contexto: 'Trabajo sedentario 8h al día, quiero empezar a moverme.',
      lesion_inicio: 'Hace 6 meses en el hombro derecho jugando a pádel.',
      lesion_diagnostico: 'Tendinitis leve confirmada por ecografía.',
      lesion_tratamientos: 'Fisioterapia durante 2 meses sin mucho éxito.',
      dolor_zona: 'Cara anterior del hombro derecho.',
      dolor_reposo: '2',
      dolor_diario: '5',
      dolor_ejercicio: '7',
      dolor_comportamiento: 'calentar',
      dolor_movimientos: 'Press militar y elevaciones frontales.',
      alertas: ['nocturno'],
      objetivo: 'masa_muscular',
      experiencia: 'pasado',
      dias: '3',
      jornada: 'sedentaria',
      descanso: '6-7',
      estres: 'medio',
      alimentacion: 'intento_sano',
      suplementos: 'Proteína whey y creatina.'
    });
  };

  return (
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+90px)] md:pb-0 animate-fade-in overflow-y-auto flex flex-col">
      <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-3xl w-full mx-auto flex flex-col flex-1 space-y-6 md:space-y-8">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {onBack ? (
            <button 
              onClick={() => {
                sessionStorage.removeItem(`trainer_anamnesis_form_${client.id}`);
                onBack();
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{isEditing ? 'Cancelar' : 'Volver Atrás'}</span>
              <span className="sm:hidden">{isEditing ? 'Cancelar' : 'Atrás'}</span>
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
          
          <button 
            type="button" 
            onClick={fillRandomData}
            className="text-xs md:text-sm px-3 md:px-4 py-2 bg-accent text-bg-primary rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 shrink-0 w-fit"
          >
            Datos de Prueba
          </button>
        </div>

        {!isEditing && (
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0 text-accent">
              <DocumentCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-accent mb-1">Cliente guardado con éxito.</p>
              <p className="text-sm text-text-secondary">Usuario: <strong className="text-text-primary">{client.username}</strong></p>
              <p className="text-sm text-text-secondary">Contraseña temporal: <strong className="text-text-primary">123456</strong></p>
            </div>
          </div>
        )}

        <div className="space-y-8">
        <SectionCard title="I. Datos Personales" icon={UserIcon}>
          {isEditing && (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Nombre Completo</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Edad</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="edad" value={formData.edad || ''} onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Teléfono</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="telefono" value={formData.telefono || ''} onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Profesión u ocupación principal</label>
            <input type="text" name="profesion" value={formData.profesion || ''} onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
          </div>
        </SectionCard>

        <SectionCard title="II. Contexto Actual" icon={InformationCircleIcon}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">¿Quién es, ritmo de vida y qué le ha animado?</label>
            <textarea name="contexto" value={formData.contexto || ''} rows="4" onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all"></textarea>
          </div>
        </SectionCard>

        <SectionCard title="III. Historial de la Lesión" icon={HeartIcon}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">¿Cuándo y cómo empezó?</label>
            <textarea name="lesion_inicio" value={formData.lesion_inicio || ''} rows="3" onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all"></textarea>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">¿Diagnóstico médico oficial?</label>
            <input type="text" name="lesion_diagnostico" value={formData.lesion_diagnostico || ''} placeholder="Sí / No / Cuál" onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Tratamientos previos</label>
            <textarea name="lesion_tratamientos" value={formData.lesion_tratamientos || ''} rows="3" onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all"></textarea>
          </div>
        </SectionCard>

        <SectionCard title="IV. Características del Dolor" icon={FireIcon}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">¿En qué zona exacta siente la molestia?</label>
            <input type="text" name="dolor_zona" value={formData.dolor_zona || ''} onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="flex flex-col justify-end h-full">
              <label className="block text-[10px] sm:text-xs font-bold text-text-secondary mb-1.5 text-center sm:text-left leading-tight">Reposo (0-10)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="dolor_reposo" value={formData.dolor_reposo || ''} onChange={handleChange} className="w-full p-3 sm:p-3.5 text-center sm:text-left bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
            </div>
            <div className="flex flex-col justify-end h-full">
              <label className="block text-[10px] sm:text-xs font-bold text-text-secondary mb-1.5 text-center sm:text-left leading-tight">Diario (0-10)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="dolor_diario" value={formData.dolor_diario || ''} onChange={handleChange} className="w-full p-3 sm:p-3.5 text-center sm:text-left bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
            </div>
            <div className="flex flex-col justify-end h-full">
              <label className="block text-[10px] sm:text-xs font-bold text-text-secondary mb-1.5 text-center sm:text-left leading-tight">Ejercicio (0-10)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="dolor_ejercicio" value={formData.dolor_ejercicio || ''} onChange={handleChange} className="w-full p-3 sm:p-3.5 text-center sm:text-left bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Comportamiento del dolor</label>
            <CustomSelect 
              value={formData.dolor_comportamiento || ''} 
              onChange={(val) => handleSelectChange('dolor_comportamiento', val)}
              options={[
                { value: "calentar", label: "Al principio duele un poco, al calentar se alivia." },
                { value: "aumenta", label: "Va aumentando a medida que me muevo." },
                { value: "siguiente_dia", label: "Aparece o empeora al día siguiente." },
                { value: "variable", label: "Muy variable, sin patrón claro." }
              ]}
              placeholder="Selecciona..."
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Movimientos que alivian / provocan dolor</label>
            <textarea name="dolor_movimientos" value={formData.dolor_movimientos || ''} rows="3" onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all"></textarea>
          </div>
        </SectionCard>

        <SectionCard title="V. Señales de Alerta" icon={ExclamationTriangleIcon} isAlert={true}>
          <div className="space-y-4 text-sm bg-bg-secondary p-4 rounded-xl border border-glass-border">
            <CheckboxItem name="alertas" value="fuerza" label="Pérdida de fuerza repentina en un brazo o pierna." />
            <CheckboxItem name="alertas" value="hormigueo" label="Hormigueo constante o pérdida de sensibilidad." />
            <CheckboxItem name="alertas" value="nocturno" label="Dolor nocturno que impide dormir." />
            <CheckboxItem name="alertas" value="inflamacion" label="Inflamación grande, calor o enrojecimiento." />
          </div>
        </SectionCard>

        <SectionCard title="VI. Objetivos y Entrenamiento" icon={TrophyIcon}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Objetivo secundario</label>
            <CustomSelect 
              value={formData.objetivo || ''} 
              onChange={(val) => handleSelectChange('objetivo', val)}
              options={[
                { value: "perder_grasa", label: "Perder grasa / Mejorar forma" },
                { value: "masa_muscular", label: "Ganar masa muscular y fuerza" },
                { value: "postura", label: "Mejorar postura corporal" },
                { value: "otro", label: "Otro..." }
              ]}
              placeholder="Selecciona..."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Experiencia previa en fuerza</label>
            <CustomSelect 
              value={formData.experiencia || ''} 
              onChange={(val) => handleSelectChange('experiencia', val)}
              options={[
                { value: "nunca", label: "Nunca he entrenado en gimnasio." },
                { value: "pasado", label: "Entrené en el pasado, pero lo dejé." },
                { value: "habitual", label: "Entreno actualmente de forma habitual." }
              ]}
              placeholder="Selecciona..."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Días disponibles</label>
            <CustomSelect 
              value={formData.dias || ''} 
              onChange={(val) => handleSelectChange('dias', val)}
              options={[
                { value: "1-2", label: "1-2 días" },
                { value: "3", label: "3 días" },
                { value: "4+", label: "4 o más días" }
              ]}
              placeholder="Selecciona..."
            />
          </div>
        </SectionCard>

        <SectionCard title="VII. Estilo de Vida y Descanso" icon={ClockIcon}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Jornada laboral</label>
            <CustomSelect 
              value={formData.jornada || ''} 
              onChange={(val) => handleSelectChange('jornada', val)}
              options={[
                { value: "sedentaria", label: "Sedentaria" },
                { value: "activa", label: "Activa" },
                { value: "exigente", label: "Muy exigente físicamente" }
              ]}
              placeholder="Selecciona..."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Descanso</label>
            <CustomSelect 
              value={formData.descanso || ''} 
              onChange={(val) => handleSelectChange('descanso', val)}
              options={[
                { value: "menos_6", label: "Menos de 6h / Me levanto cansado" },
                { value: "6-7", label: "6-7 horas / Aceptable" },
                { value: "mas_7", label: "7-8+ horas / Con energía" }
              ]}
              placeholder="Selecciona..."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Estrés</label>
            <CustomSelect 
              value={formData.estres || ''} 
              onChange={(val) => handleSelectChange('estres', val)}
              options={[
                { value: "bajo", label: "Bajo / Tranquilo" },
                { value: "medio", label: "Medio / Épocas puntuales" },
                { value: "alto", label: "Alto / Constante" }
              ]}
              placeholder="Selecciona..."
            />
          </div>
        </SectionCard>

        <SectionCard title="VIII. Alimentación y Suplementación" icon={DocumentCheckIcon}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-2 ml-1">Alimentación</label>
            <CustomSelect 
              value={formData.alimentacion || ''} 
              onChange={(val) => handleSelectChange('alimentacion', val)}
              options={[
                { value: "sin_control", label: "No sigo un control específico." },
                { value: "intento_sano", label: "Intento comer sano, cuesta constancia." },
                { value: "saludable", label: "Saludable y controlada." },
                { value: "pautas", label: "Sigo pautas de profesional." }
              ]}
              placeholder="Selecciona..."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-text-secondary mb-1.5 ml-1">Suplementos / Medicación</label>
            <textarea name="suplementos" value={formData.suplementos || ''} rows="3" onChange={handleChange} className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-inner transition-all"></textarea>
          </div>
        </SectionCard>
        </div>

        {/* Botones */}
        <div className="pt-8 space-y-4 sm:space-y-0 sm:flex sm:flex-row-reverse sm:gap-4 relative z-10 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:flex-[2] flex items-center justify-center gap-2 p-4 sm:p-5 bg-accent text-bg-primary font-extrabold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Finalizar Registro')}
            {!saving && <DocumentCheckIcon className="w-6 h-6 stroke-2" />}
          </button>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(`trainer_anamnesis_form_${client.id}`);
              if (onBack) onBack();
              else onFinish();
            }}
            disabled={saving}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 p-4 sm:p-5 bg-bg-secondary border border-glass-border text-text-secondary hover:text-text-primary font-bold rounded-2xl active:scale-95 transition-all hover:bg-glass-border/30 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
