import ModalPortal from './ModalPortal';
import React from 'react';
import { Settings, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import useModalLock from '../hooks/useModalLock';

export default function PermissionModal({ isOpen, onClose, permissionName, onRetry }) {
  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock(isOpen);

  if (!isOpen) return null;

  const isNative = Capacitor.isNativePlatform();

  const handleOpenSettings = async () => {
    if (isNative) {
      try {
        if (Capacitor.getPlatform() === 'android') {
          await NativeSettings.openAndroid({
            option: AndroidSettings.ApplicationDetails
          });
        } else {
          await NativeSettings.openIOS({
            option: IOSSettings.App
          });
        }
      } catch (error) {
        console.error('Error abriendo ajustes:', error);
      }
    } else if (onRetry) {
      await onRetry();
    } else {
      onClose();
    }
  };

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 p-4 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="w-full max-w-sm rounded-2xl bg-bg-primary p-6 text-text-primary shadow-2xl border border-glass-border relative">
        
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Permiso requerido</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 transition-colors text-text-secondary">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-accent/20 p-4 text-accent animate-pulse-slow">
            <Settings size={40} />
          </div>
          <p className="mb-2 text-lg">Activa: <strong>{permissionName}</strong></p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {isNative
              ? 'Necesitamos este permiso para que la app funcione correctamente. Puedes activarlo directamente desde los ajustes de tu dispositivo.'
              : 'Necesitamos este permiso en tu navegador y en tu equipo. Si ya lo activaste (o quieres volver a solicitarlo), pulsa «Solicitar / Reintentar». Si está bloqueado, actívalo en el icono junto a la barra de direcciones.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
            {isNative ? (
              <>
                <button
                  onClick={handleOpenSettings}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-contrast transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20">
                  <ExternalLink size={18} />
                  Ir a Ajustes
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-bg-secondary border border-glass-border py-3 font-semibold text-text-primary transition-all hover:bg-white/5 active:scale-95">
                    <RefreshCw size={18} />
                    Ya lo activé, reintentar
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleOpenSettings}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-contrast transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20">
                <RefreshCw size={18} />
                Solicitar / Reintentar
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-bg-secondary border border-glass-border py-3 font-semibold text-text-primary transition-all hover:bg-white/5 active:scale-95">
              Cancelar
            </button>
        </div>
        
      </div>
    </div></ModalPortal>;

}