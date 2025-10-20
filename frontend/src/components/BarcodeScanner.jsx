import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [scannerState, setScannerState] = useState('idle'); // 'idle', 'loading', 'scanning'
  const { addToast } = useToast();
  const scannerRef = useRef(null);
  const scannerContainerId = 'barcode-scanner-container';

  const handleScanSuccess = useCallback((decodedText) => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => console.error("Error al detener el escáner:", err));
      scannerRef.current = null;
    }
    onScanSuccess(decodedText);
  }, [onScanSuccess]);

  const handleScanError = useCallback((error) => {
    if (typeof error === 'string' && error.includes('NotFoundException')) {
      return;
    }
    console.warn("Error del escáner:", error);
  }, []);

  const handleActivateScanner = async () => {
    setScannerState('loading');
    try {
      // 1. Pedir permisos y obtener la lista de cámaras. Esto muestra el prompt nativo.
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length) {
        setScannerState('scanning');
      } else {
        addToast('No se encontraron cámaras en este dispositivo.', 'error');
        setScannerState('idle');
      }
    } catch (err) {
      console.error("Error al solicitar permiso de cámara:", err);
      addToast('Permiso de cámara denegado. Revisa la configuración de tu navegador.', 'error');
      setScannerState('idle');
      onClose(); // Cerramos si el permiso es denegado
    }
  };
  
  useEffect(() => {
    if (scannerState !== 'scanning' || scannerRef.current) {
      return;
    }

    const startScanner = async () => {
        const scannerElement = document.getElementById(scannerContainerId);
        if (!scannerElement) return;

        const html5Qrcode = new Html5Qrcode(scannerContainerId, false);
        scannerRef.current = html5Qrcode;

        try {
            const cameras = await Html5Qrcode.getCameras();
            const rearCamera = cameras.find(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('trasera'));
            const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

            await html5Qrcode.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleScanSuccess,
                handleScanError
            );
        } catch (err) {
            console.error("Error al iniciar el escáner:", err);
            addToast("No se pudo iniciar la cámara seleccionada.", "error");
            onClose();
        }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error al limpiar el escáner:", err));
        scannerRef.current = null;
      }
    };
  }, [scannerState, handleScanSuccess, handleScanError, addToast, onClose]);

  const renderContent = () => {
    switch (scannerState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size={32} />
            <p className="text-text-secondary">Esperando permiso...</p>
          </div>
        );
      case 'scanning':
        return (
          <div className="relative w-full h-full scanner-wrapper">
            <div id={scannerContainerId} className="w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[250px] h-[250px]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg" />
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <div className="scan-line absolute top-0 left-4 right-4 h-1 bg-accent shadow-[0_0_10px_theme(colors.accent)] rounded-full" />
                {/* --- FIN DE LA MODIFICACIÓN --- */}
              </div>
            </div>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-4">
            <Camera size={48} className="text-text-muted" />
            <p className="text-text-secondary text-center">Necesitamos acceso a tu cámara para escanear.</p>
            <button
              onClick={handleActivateScanner}
              className="px-6 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105"
            >
              Activar Cámara
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md p-6 bg-bg-secondary rounded-2xl border border-glass-border">
        <h3 className="text-xl font-bold text-center mb-4">Escanear Código de Barras</h3>
        <div className="h-[280px] w-full flex items-center justify-center rounded-lg overflow-hidden bg-bg-primary">
          {renderContent()}
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-bg-primary text-text-secondary hover:text-text-primary transition"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;