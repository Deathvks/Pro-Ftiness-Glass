import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Se simplifica el estado a 'idle' y 'scanning'. 'loading' se gestionará visualmente dentro de 'scanning'.
  const [scannerState, setScannerState] = useState('idle'); // idle | scanning
  // --- FIN DE LA MODIFICACIÓN ---
  const { addToast } = useToast();
  const scannerRef = useRef(null);

  const handleScanSuccess = useCallback((decodedText) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => {});
      scannerRef.current = null;
    }
    onScanSuccess(decodedText);
  }, [onScanSuccess]);

  const handleScanError = (error) => {
    // Ignorar errores que no son fatales, como 'NotFoundException' que se dispara constantemente.
    if (error && typeof error === 'string' && error.includes('NotFoundException')) {
      return;
    }
    // Para otros errores, podríamos querer registrarlos o manejarlos.
    console.warn("Error del escáner:", error);
  };

  // --- INICIO DE LA MODIFICACIÓN ---
  // Ahora esta función solo cambia el estado para que el useEffect inicie el escáner.
  const handleActivateScanner = () => {
    setScannerState('scanning');
  };
  // --- FIN DE LA MODIFICACIÓN ---
  
  useEffect(() => {
    if (scannerState !== 'scanning') {
      return;
    }

    const scannerContainer = document.getElementById('barcode-scanner-container');
    if (!scannerContainer) return;
    
    // Mostramos un spinner mientras la librería pide permiso y carga la cámara.
    scannerContainer.innerHTML = '<div class="flex flex-col items-center justify-center h-full gap-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div><p class="text-text-secondary">Iniciando cámara...</p></div>';

    // La librería ahora se encarga de pedir el permiso.
    const scanner = new Html5QrcodeScanner('barcode-scanner-container', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scannerRef.current = scanner;
    
    const observer = new MutationObserver((mutationsList) => {
      for(const mutation of mutationsList) {
        if (mutation.type === 'childList' && scannerContainer.querySelector('video')) {
            scannerContainer.style.opacity = '1';
            observer.disconnect();
            return;
        }
      }
    });

    observer.observe(scannerContainer, { childList: true, subtree: true });
    
    // 'render' ahora solicitará el permiso de cámara.
    scanner.render(handleScanSuccess, (error) => {
        // Manejo de error mejorado: si el usuario deniega el permiso, lo notificamos y cerramos.
        if (error.name === 'NotAllowedError' || (error.message && error.message.includes('Permission denied'))) {
            addToast('El permiso de la cámara fue denegado.', 'error');
            onClose();
        } else {
            handleScanError(error);
        }
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {});
      }
      observer.disconnect();
    };
  }, [scannerState, handleScanSuccess, addToast, onClose]);


  const renderContent = () => {
    switch (scannerState) {
      // --- INICIO DE LA MODIFICACIÓN ---
      // El estado 'loading' se elimina, ahora 'scanning' maneja la carga inicial.
      case 'scanning':
        return (
          <div className="relative w-full h-full scanner-wrapper">
            <div id="barcode-scanner-container" className="w-full h-full opacity-0 transition-opacity duration-300"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[250px] h-[250px]">
                {/* Esquinas */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>
                {/* Línea de escaneo animada */}
                <div className="scan-line absolute top-0 left-0 right-0 h-1 bg-accent shadow-[0_0_10px_theme(colors.accent)] rounded-full"></div>
              </div>
            </div>
          </div>
        );
      // --- FIN DE LA MODIFICACIÓN ---
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