import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';

const UserEditModal = ({ user, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
  });

  // --- INICIO DE LA CORRECCIÓN ---
  const [isDarkTheme, setIsDarkTheme] = useState(() =>
    typeof document !== 'undefined' && !document.body.classList.contains('light-theme')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(!document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  // --- FIN DE LA CORRECCIÓN ---

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    onSave(user.id, formData);
  };
  
  const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";
  
  const roleOptions = [
    { value: 'user', label: 'Usuario' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onCancel}
    >
      <GlassCard
        // --- INICIO DE LA CORRECCIÓN ---
        className={`relative w-full max-w-md p-8 m-4 ${!isDarkTheme ? '!bg-white/95 !border-black/10' : ''}`}
        // --- FIN DE LA CORRECCIÓN ---
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCancel} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-center mb-6">Editar Usuario</h3>

        <form onSubmit={handleSaveClick} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">Nombre</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={baseInputClasses} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={baseInputClasses} />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-2">Rol</label>
            <CustomSelect
              value={formData.role}
              onChange={(value) => handleChange('role', value)}
              options={roleOptions}
              placeholder="Seleccionar rol"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-md bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
          >
            {isLoading ? <Spinner /> : 'Guardar Cambios'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default UserEditModal;