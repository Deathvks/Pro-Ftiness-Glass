import ModalPortal from "./ModalPortal";
import React, { useState } from "react";
import { X, IceCream, AlertTriangle, Info } from "lucide-react";
import useModalLock from "../hooks/useModalLock";

const SugarTargetModal = ({ isOpen, onClose, currentSugar, maxSugar }) => {
  useModalLock(isOpen);
  const [dragY, setDragY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);

  if (!isOpen) return null;

  const percentage = Math.min(100, Math.max(0, currentSugar / maxSugar * 100));
  const isOverLimit = currentSugar >= maxSugar;

  const themeColor = isOverLimit ? "text-red-500" : "text-pink-500";
  const themeBg = isOverLimit ? "bg-red-600" : "bg-pink-500";
  const themeShadow = isOverLimit ? "shadow-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]" : "shadow-pink-500/20";
  const cardBg = isOverLimit ? "bg-red-500/5 dark:bg-red-500/10" : "";

  const radius = 65;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - percentage / 100 * circumference;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-[fade-in_0.2s_ease-out]" onClick={onClose} />
        
        <div 
          className={`relative w-full max-w-sm bg-bg-secondary sm:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col animate-[scale-in_0.2s_ease-out] ${themeShadow} ${cardBg}`}
          style={{ transform: "translateY(" + dragY + "px)", transition: touchStartY !== null ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
          onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
          onTouchMove={(e) => {
            if (touchStartY === null) return;
            const diff = e.touches[0].clientY - touchStartY;
            if (diff > 0) setDragY(diff);
          }}
          onTouchEnd={() => {
            if (dragY > 100) onClose();
            setDragY(0);
            setTouchStartY(null);
          }}
        >
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
          
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-black flex items-center gap-2 ${themeColor}`}>
              {isOverLimit ? <AlertTriangle size={24} className="animate-pulse" /> : <IceCream size={24} />}
              Objetivo de Azúcar
            </h3>
            <button onClick={onClose} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary transition-colors hidden sm:block">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center relative mb-6">
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 ${themeBg} ${isOverLimit ? "opacity-20 blur-[60px]" : "opacity-10 blur-[50px]"} rounded-full pointer-events-none`}></div>

            <div className="relative w-40 h-40 mb-6 flex items-center justify-center z-10">
              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 160 160">
                <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-black/5 dark:text-white/10" />
                <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={percentage >= 100 ? "none" : circumference} strokeDashoffset={percentage >= 100 ? 0 : offset} strokeLinecap={percentage >= 100 ? "butt" : "round"} className={`transition-all duration-1000 ease-out ${themeColor} ${isOverLimit ? "drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" : "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"}`} />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-black ${themeColor}`}>{Math.round(percentage)}%</span>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Del Límite</span>
              </div>
            </div>

            <div className={`w-full rounded-[16px] p-4 border border-black/5 dark:border-white/5 flex justify-between items-center relative z-10 ${isOverLimit ? "bg-red-500/10" : "bg-black/5 dark:bg-white/5"}`}>
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary">Consumido</span>
                <span className={`text-xl font-bold ${themeColor}`}>{currentSugar.toFixed(1)}g</span>
              </div>
              <div className="h-8 w-px bg-black/10 dark:bg-white/10"></div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-text-secondary">Límite Diario</span>
                <span className="text-xl font-bold text-text-primary">{maxSugar}g</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 text-left bg-blue-500/5 p-4 rounded-[16px] border border-blue-500/10 mb-6 shrink-0">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-text-secondary leading-relaxed">
              La <strong className="text-text-primary">OMS</strong> recomienda reducir el consumo de azúcares libres a menos del <strong className="text-text-primary">10%</strong> de la ingesta calórica total. Reducirlo por debajo del <strong className="text-text-primary">5%</strong> proporciona beneficios adicionales para la salud.
            </p>
          </div>

          <button onClick={onClose} className={`w-full py-4 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 font-bold text-sm transition-all ${themeColor} ${isOverLimit ? "ring-2 ring-red-500/20" : ""} shrink-0`}>
            Entendido
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default SugarTargetModal;