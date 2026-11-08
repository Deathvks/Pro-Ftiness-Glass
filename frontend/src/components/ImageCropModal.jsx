/* frontend/src/components/ImageCropModal.jsx */
import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import Spinner from './Spinner';

/**
 * Helper para extraer la imagen recortada desde el canvas.
 * @param {string} imageSrc - URL de la imagen (blob o URL).
 * @param {object} pixelCrop - Coordenadas y dimensiones de recorte de react-easy-crop.
 * @returns {Promise<File>} Archivo File listo para subir.
 */
export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        file.name = 'cropped.jpg';
        resolve(new File([file], 'profile.jpg', { type: 'image/jpeg' }));
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.9);
  });
};

const ImageCropModal = ({
  imageSrc,
  onComplete,
  onCancel,
  title = "Ajustar foto",
  isSaving = false
}) => {
  useModalLock();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixelsCalculated) => {
    setCroppedAreaPixels(croppedAreaPixelsCalculated);
  };

  if (!imageSrc) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[99999] bg-bg-primary flex flex-col animate-[fade-in_0.2s_ease-out]">
        {/* Barra superior */}
        <div
          className="bg-bg-primary/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/10 shrink-0 z-10"
          style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Cerrar recorte"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Zona interactiva del Cropper */}
        <div className="relative flex-1 bg-black overflow-hidden select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controles de Zoom y Acciones */}
        <div
          className="bg-bg-primary px-4 sm:px-10 pt-4 pb-6 border-t border-black/5 dark:border-white/10 flex flex-col gap-4 shrink-0 z-10"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Slider de Zoom para mayor precision en movil y escritorio */}
          <div className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              className="text-text-secondary hover:text-text-primary p-1 active:scale-95"
              aria-label="Reducir zoom"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label="Nivel de zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              className="text-text-secondary hover:text-text-primary p-1 active:scale-95"
              aria-label="Aumentar zoom"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Botones de Cancelar y Confirmar Recorte */}
          <div className="flex justify-between items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="text-text-secondary font-bold px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-[16px] transition-colors active:scale-95 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onComplete(croppedAreaPixels)}
              disabled={isSaving}
              className="bg-accent text-accent-contrast font-bold px-8 py-3.5 rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSaving ? <Spinner className="w-5 h-5" /> : 'Recortar'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ImageCropModal;
