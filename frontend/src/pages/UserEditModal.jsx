import React, { useState } from 'react';
import ModalPortal from '../components/ModalPortal';
import { X, UserCog } from 'lucide-react';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';

const UserEditModal = ({ user, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
    level: user.level || 1,
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    console.log("[DEBUG MODAL] handleSaveClick triggered in UserEditModal", { formData, userId: user?.id });
    const dataToSave = { ...formData, level: parseInt(formData.level) || 1 };
    onSave(user.id, dataToSave);
  };
  
  const baseInputClasses = "w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-muted";
  
  const roleOptions = [
    { value: 'user', label: 'Usuario' },
    { value: 'trainer', label: 'Entrenador' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
        <ModalPortal>
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-bg-primary rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative mt-auto sm:mt-0 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:pb-0 max-h-[90vh] sm:max-h-full border border-black/5 dark:border-white/5 animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col p-6 pt-4 pb-2 border-b border-black/5 dark:border-white/5 shrink-0">
                    <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
                    <UserCog className="text-accent" size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-text-primary">Editar Usuario</h3>
            </div>
            <button onClick={onCancel} className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <X size={20} strokeWidth={2.5} />
            </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="editUserForm" onSubmit={handleSaveClick} className="flex flex-col gap-5">
                <div>
                    <label htmlFor="name" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
                    <input id="name" name="name" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={baseInputClasses} />
                </div>
                <div>
                    <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                    <input id="email" name="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={baseInputClasses} />
                </div>
                <div>
                    <label htmlFor="level" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Nivel</label>
                    <input id="level" name="level" type="number" min="1" value={formData.level} onChange={(e) => handleChange('level', e.target.value)} className={baseInputClasses} />
                    <p className="text-[10px] text-text-muted mt-2 ml-1 font-medium">Si cambias el nivel, la experiencia se ajustará automáticamente.</p>
                </div>
                <div>
                    <label htmlFor="role" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Rol en el Sistema</label>
                    <CustomSelect
                        value={formData.role}
                        onChange={(value) => handleChange('role', value)}
                        options={roleOptions}
                        placeholder="Seleccionar rol"
                    />
                </div>
            </form>
        </div>
        
        <div className="p-6 pt-2 bg-bg-primary border-t border-black/5 dark:border-white/5">
            <button
                type="submit"
                form="editUserForm"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-[20px] bg-accent text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 disabled:opacity-70 disabled:hover:scale-100"
            >
                {isLoading ? <Spinner className="w-6 h-6" /> : 'Guardar Cambios'}
            </button>
        </div>
      </div>
    </div>
        </ModalPortal>
    );
};

export default UserEditModal;