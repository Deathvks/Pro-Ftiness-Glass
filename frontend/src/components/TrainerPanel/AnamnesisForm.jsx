import React, { useState } from 'react';
import { ChevronLeftIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import apiClient from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';
import CustomSelect from '../CustomSelect';

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
      setFormData({ ...formData, [name]: value });
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
        className="flex items-start gap-3 cursor-pointer group"
      >
        <div className={`w-5 h-5 shrink-0 mt-0.5 rounded flex items-center justify-center transition-all ${isChecked ? 'bg-accent border-accent text-bg-primary' : 'border-2 border-text-secondary/50 group-hover:border-accent'}`}>
          {isChecked && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="group-hover:text-accent transition-colors select-none">{label}</span>
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
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+90px)] animate-fade-in overflow-y-auto">
      <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-3xl mx-auto space-y-6 relative">
        {/* Header Options */}
        <div className="flex items-center justify-between mb-2">
          {onBack ? (
            <button
              onClick={() => {
                sessionStorage.removeItem(`trainer_anamnesis_form_${client.id}`);
                onBack();
              }}
              className="w-10 h-10 shrink-0 -ml-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
          <button 
            type="button" 
            onClick={fillRandomData}
            className="text-xs px-3 py-1.5 bg-accent/20 text-accent rounded-lg font-bold hover:bg-accent/30 transition-colors"
          >
            Rellenar Datos
          </button>
        </div>
        {!isEditing && (
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
            <p className="text-sm font-bold text-accent mb-1">Cliente guardado con éxito.</p>
            <p className="text-sm">Usuario: <strong>{client.username}</strong></p>
            <p className="text-sm">Contraseña temporal: <strong>123456</strong></p>
          </div>
        )}

        {/* I. Datos Personales */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">I. Datos Personales</h2>
          
          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Nombre Completo</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Edad</label>
              <input type="number" name="edad" value={formData.edad || ''} onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono || ''} onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">Profesión u ocupación principal</label>
            <input type="text" name="profesion" value={formData.profesion || ''} onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
        </section>

        {/* II. Sobre Usted */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">II. Contexto Actual</h2>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">¿Quién es, ritmo de vida y qué le ha animado?</label>
            <textarea name="contexto" value={formData.contexto || ''} rows="3" onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"></textarea>
          </div>
        </section>

        {/* III. Historial de la Lesión */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">III. Historial de la Lesión</h2>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">¿Cuándo y cómo empezó?</label>
            <textarea name="lesion_inicio" value={formData.lesion_inicio || ''} rows="2" onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none"></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">¿Diagnóstico médico oficial?</label>
            <input type="text" name="lesion_diagnostico" value={formData.lesion_diagnostico || ''} placeholder="Sí / No / Cuál" onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">Tratamientos previos</label>
            <textarea name="lesion_tratamientos" value={formData.lesion_tratamientos || ''} rows="2" onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none"></textarea>
          </div>
        </section>

        {/* IV. Características del Dolor */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">IV. Características del Dolor</h2>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">¿En qué zona exacta siente la molestia?</label>
            <input type="text" name="dolor_zona" value={formData.dolor_zona || ''} onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary" />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col justify-end h-full">
              <label className="block text-[10px] sm:text-xs font-bold text-text-secondary mb-1 text-center sm:text-left leading-tight">Dolor Reposo (0-10)</label>
              <input type="number" name="dolor_reposo" value={formData.dolor_reposo || ''} onChange={handleChange} className="w-full p-2 sm:p-3 text-center sm:text-left bg-bg-secondary border border-glass-border rounded-xl text-text-primary" />
            </div>
            <div className="flex flex-col justify-end h-full">
              <label className="block text-[10px] sm:text-xs font-bold text-text-secondary mb-1 text-center sm:text-left leading-tight">Dolor Diario (0-10)</label>
              <input type="number" name="dolor_diario" value={formData.dolor_diario || ''} onChange={handleChange} className="w-full p-2 sm:p-3 text-center sm:text-left bg-bg-secondary border border-glass-border rounded-xl text-text-primary" />
            </div>
            <div className="flex flex-col justify-end h-full">
              <label className="block text-[10px] sm:text-xs font-bold text-text-secondary mb-1 text-center sm:text-left leading-tight">Dolor Ejercicio (0-10)</label>
              <input type="number" name="dolor_ejercicio" value={formData.dolor_ejercicio || ''} onChange={handleChange} className="w-full p-2 sm:p-3 text-center sm:text-left bg-bg-secondary border border-glass-border rounded-xl text-text-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">Comportamiento del dolor</label>
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
            <label className="block text-xs font-bold text-text-secondary mb-1">Movimientos que alivian / provocan dolor</label>
            <textarea name="dolor_movimientos" value={formData.dolor_movimientos || ''} rows="2" onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none"></textarea>
          </div>
        </section>

        {/* V. Señales de Alerta */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-red-500 border-b border-red-500/30 pb-2">V. Señales de Alerta</h2>
          <div className="space-y-3 text-sm">
            <CheckboxItem name="alertas" value="fuerza" label="Pérdida de fuerza repentina en un brazo o pierna." />
            <CheckboxItem name="alertas" value="hormigueo" label="Hormigueo constante o pérdida de sensibilidad." />
            <CheckboxItem name="alertas" value="nocturno" label="Dolor nocturno que impide dormir." />
            <CheckboxItem name="alertas" value="inflamacion" label="Inflamación grande, calor o enrojecimiento." />
          </div>
        </section>

        {/* VI. Objetivos */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">VI. Objetivos y Entrenamiento</h2>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">Objetivo secundario</label>
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
            <label className="block text-xs font-bold text-text-secondary mb-2">Experiencia previa en fuerza</label>
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
            <label className="block text-xs font-bold text-text-secondary mb-2">Días disponibles</label>
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
        </section>

        {/* VII. Estilo de vida */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">VII. Estilo de Vida y Descanso</h2>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">Jornada laboral</label>
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
            <label className="block text-xs font-bold text-text-secondary mb-2">Descanso</label>
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
            <label className="block text-xs font-bold text-text-secondary mb-2">Estrés</label>
            <CustomSelect 
              value={formData.estres || ''} 
              onChange={(val) => handleSelectChange('estres', val)}
              options={[
                { value: "bajo", label: "Bajo" },
                { value: "medio", label: "Medio" },
                { value: "alto", label: "Alto" }
              ]}
              placeholder="Selecciona..."
            />
          </div>
        </section>

        {/* VIII. Alimentación */}
        <section className="space-y-4">
          <h2 className="text-xl font-black border-b border-glass-border pb-2">VIII. Alimentación y Suplementación</h2>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">Alimentación</label>
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
            <label className="block text-xs font-bold text-text-secondary mb-1">Suplementos / Medicación</label>
            <textarea name="suplementos" value={formData.suplementos || ''} rows="2" onChange={handleChange} className="w-full p-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary resize-none"></textarea>
          </div>
        </section>

        {/* Botones */}
        <div className="pt-6 space-y-3 flex flex-col md:flex-row md:space-y-0 gap-4">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(`trainer_anamnesis_form_${client.id}`);
              if (onBack) onBack();
              else onFinish();
            }}
            disabled={saving}
            className="w-full md:flex-1 flex items-center justify-center gap-2 p-4 bg-transparent border-2 border-glass-border text-text-primary font-bold rounded-2xl active:scale-95 transition-transform hover:bg-bg-secondary/50 disabled:opacity-50"
          >
            <span>Dejar para más tarde</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:flex-[2] flex items-center justify-center gap-2 p-4 bg-accent text-bg-primary font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            <DocumentCheckIcon className="w-6 h-6" />
            <span>{saving ? 'Guardando...' : 'Guardar Anamnesis'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
