import ModalPortal from './ModalPortal';
import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Zap, Activity } from 'lucide-react';
import GlassCard from './GlassCard';
import Spinner from './Spinner';
import apiClient from '../services/apiClient';
import useModalLock from '../hooks/useModalLock';

const FoodScannerModal = ({ onClose, onScanComplete }) => {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona una imagen válida.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      scanImage(reader.result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const scanImage = async (base64String, mimeType) => {
    setIsScanning(true);
    setError('');
    try {
      // Remove data URI prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];

      // Llama al endpoint a través del cliente configurado
      const response = await apiClient.post('/ai/scan-food', {
        imageBase64: base64Data,
        mimeType
      });

      if (response.data.success) {
        onScanComplete(response.data.data);
        onClose();
      } else {
        setError('Hubo un problema al analizar la imagen.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo conectar con la IA.');
    } finally {
      setIsScanning(false);
    }
  };

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
            <div className="absolute inset-0" onClick={!isScanning ? onClose : null} />
            <GlassCard className="glass w-full max-w-md p-6 mt-auto sm:mt-0 pb-[calc(2rem+var(--safe-bottom))] sm:pb-6 relative z-10 rounded-t-[32px] rounded-b-none sm:rounded-[32px] border border-glass-border shadow-2xl flex flex-col items-center animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]">
                {/* Drag handle for mobile */}
                <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto -mt-2 mb-4 sm:hidden shrink-0" />
                
                <button
          onClick={onClose}
          disabled={isScanning}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-glass-bg transition-colors disabled:opacity-50">
                    <X size={20} className="text-text-secondary hover:text-text-primary" />
                </button>

                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]">
                    <Zap size={32} className="text-white" />
                </div>
                
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary text-center mb-2">Escáner Nutricional IA</h2>
                <p className="text-center text-text-muted text-sm mb-6">Sube o toma una foto de tu comida y la IA extraerá los macros mágicamente.</p>

                {error &&
        <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-semibold p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
        }

                <div className="w-full aspect-square max-h-[300px] border-2 border-dashed border-glass-border rounded-3xl overflow-hidden relative flex flex-col items-center justify-center bg-bg-secondary/50 hover:bg-bg-secondary transition-colors group">
                    {imagePreview ?
          <>
                            <img src={imagePreview} alt="Preview" className={`w-full h-full object-cover transition-all ${isScanning ? 'opacity-50 grayscale blur-sm' : ''}`} />
                            {isScanning &&
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="w-full h-1 bg-accent/30 absolute top-0 animate-[scan-line_2s_ease-in-out_infinite] shadow-[0_0_10px_var(--accent)]" />
                                    <Spinner size={40} className="text-accent mb-3" />
                                    <span className="font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Analizando...</span>
                                </div>
            }
                        </> :

          <div
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6"
            onClick={() => fileInputRef.current?.click()}>
            
                            <Camera size={48} className="text-text-muted mb-4 group-hover:text-accent transition-colors group-hover:scale-110" />
                            <span className="font-bold text-text-secondary text-center">Toca para tomar una foto<br />o subir desde la galería</span>
                        </div>
          }

                    <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            disabled={isScanning} />
          
                </div>

                {imagePreview && !isScanning &&
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 px-6 py-2 rounded-full bg-glass-bg border border-glass-border font-semibold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
          
                        <Upload size={16} /> Elegir otra foto
                    </button>
        }
            </GlassCard>
            <style jsx>{`
                @keyframes scan-line {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div></ModalPortal>;

};

export default FoodScannerModal;