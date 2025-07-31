import React, { useState } from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const ProfileEditor = ({ onCancel }) => {
  const { userProfile, updateUserProfile } = useAppStore(state => ({
    userProfile: state.userProfile,
    updateUserProfile: state.updateUserProfile,
  }));
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    gender: userProfile.gender || 'male',
    age: userProfile.age || '',
    height: userProfile.height || '',
    activityLevel: userProfile.activity_level || 1.55,
    goal: userProfile.goal || 'maintain'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.age || !formData.height) {
        addToast("Por favor, completa todos los campos.", 'error');
        return;
    }
    setIsLoading(true);
    const result = await updateUserProfile(formData);
    
    if (result.success) {
        addToast(result.message, 'success');
        onCancel(); // Volver a la pantalla de ajustes
    } else {
        addToast(result.message, 'error');
    }
    setIsLoading(false);
  };

  const activityLabels = {
    1.2: 'Poco o nada',
    1.375: 'Ejercicio ligero (1-3 días)',
    1.55: 'Ejercicio moderado (3-5 días)',
    1.725: 'Ejercicio fuerte (6-7 días)',
    1.9: 'Ejercicio muy fuerte',
  };

  const goalLabels = {
    lose: 'Bajar peso',
    maintain: 'Mantener peso',
    gain: 'Subir peso',
  };

  const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";
  const choiceButtonClasses = "text-center p-4 rounded-md border-2 border-glass-border font-semibold transition-all duration-200";
  const activeChoiceButtonClasses = "border-accent bg-accent-transparent text-accent";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
        <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
            <ChevronLeft size={20} />
            Volver a Ajustes
        </button>
        <h1 className="text-4xl font-extrabold mb-8">Editar Perfil</h1>

        <GlassCard className="p-6">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna Izquierda */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Género</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setFormData({ ...formData, gender: 'male' })} className={`${choiceButtonClasses} ${formData.gender === 'male' ? activeChoiceButtonClasses : ''}`}>Hombre</button>
                                <button type="button" onClick={() => setFormData({ ...formData, gender: 'female' })} className={`${choiceButtonClasses} ${formData.gender === 'female' ? activeChoiceButtonClasses : ''}`}>Mujer</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="age" className="block text-sm font-medium text-text-secondary mb-2">Edad</label>
                            <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required className={baseInputClasses} placeholder="Años" />
                        </div>
                        <div>
                            <label htmlFor="height" className="block text-sm font-medium text-text-secondary mb-2">Altura (cm)</label>
                            <input id="height" name="height" type="number" value={formData.height} onChange={handleChange} required className={baseInputClasses} placeholder="Ej: 175" />
                        </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Nivel de Actividad</label>
                            <div className="flex flex-col gap-2">
                                {Object.entries(activityLabels).map(([value, label]) => (
                                <button 
                                    key={value} 
                                    type="button" 
                                    onClick={() => setFormData({ ...formData, activityLevel: parseFloat(value) })} 
                                    className={`w-full ${choiceButtonClasses} ${parseFloat(formData.activityLevel) === parseFloat(value) ? activeChoiceButtonClasses : ''}`}
                                >
                                    {label}
                                </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Objetivo</label>
                             {/* --- INICIO DE LA CORRECCIÓN --- */}
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                             {/* --- FIN DE LA CORRECCIÓN --- */}
                                {Object.entries(goalLabels).map(([value, label]) => (
                                    <button key={value} type="button" onClick={() => setFormData({ ...formData, goal: value })} className={`${choiceButtonClasses} ${formData.goal === value ? activeChoiceButtonClasses : ''}`}>{label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pt-6 border-t border-glass-border">
                     <button 
                        type="submit" 
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-3 w-40 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
                    >
                        {isLoading ? <Spinner size={18}/> : <><Save size={18} /><span>Guardar</span></>}
                    </button>
                </div>
            </form>
        </GlassCard>
    </div>
  );
};

export default ProfileEditor;