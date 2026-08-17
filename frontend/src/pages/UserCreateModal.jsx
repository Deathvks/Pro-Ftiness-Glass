import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus } from 'lucide-react';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';

const UserCreateModal = ({ onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const baseInputClasses = "w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-muted";

    const roleOptions = [
        { value: 'user', label: 'Usuario' },
        { value: 'trainer', label: 'Entrenador' },
        { value: 'admin', label: 'Admin' },
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out] p-4 sm:p-6"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md bg-bg-primary rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative animate-[scale-in_0.3s_ease-out] max-h-full border border-black/5 dark:border-white/5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 pb-2 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
                            <UserPlus className="text-accent" size={20} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-text-primary">Añadir Usuario</h3>
                    </div>
                    <button onClick={onCancel} className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="createUserForm" onSubmit={handleSaveClick} className="flex flex-col gap-5">
                        <div>
                            <label htmlFor="name" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
                            <input id="name" name="name" type="text" placeholder="Ej. Juan Pérez" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required className={baseInputClasses} />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                            <input id="email" name="email" type="email" placeholder="juan@ejemplo.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required className={baseInputClasses} />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Contraseña Inicial</label>
                            <input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required minLength={6} className={baseInputClasses} />
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
                        form="createUserForm"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-[20px] bg-accent text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {isLoading ? <Spinner className="w-6 h-6" /> : 'Crear Usuario'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserCreateModal;