import React, { useState } from 'react';
import { X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';

const UserCreateModal = ({ onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
            onClick={onCancel}
        >
            <GlassCard
                className="relative w-full max-w-md p-8 m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onCancel} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-center mb-6">Crear Nuevo Usuario</h3>

                <form onSubmit={handleSaveClick} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">Nombre</label>
                        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className={baseInputClasses} />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                        <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className={baseInputClasses} />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">Contraseña</label>
                        <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className={baseInputClasses} />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-2">Rol</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className={baseInputClasses}>
                            <option value="user">Usuario</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-md bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
                    >
                        {isLoading ? <Spinner /> : 'Crear Usuario'}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
};

export default UserCreateModal;
