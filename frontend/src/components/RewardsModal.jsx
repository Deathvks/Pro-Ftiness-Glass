import ModalPortal from './ModalPortal';
import React from 'react';
import { Trophy, Gift, Check, Lock, Palette, X } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useAppTheme } from '../hooks/useAppTheme';
import useModalLock from '../hooks/useModalLock';

const REWARDS = [
{
  id: 'galaxy',
  name: 'Tema Galaxia',
  description: 'Un viaje al espacio con tonos púrpuras oscuros y un fondo estelar.',
  requiredReferrals: 5,
  icon: Palette,
  colorClass: 'text-[#a855f7]',
  bgClass: 'bg-[#a855f7]/10'
},
{
  id: 'desert',
  name: 'Tema Desierto',
  description: 'Tonos cálidos de arena y atardecer con un fondo de desierto inmersivo.',
  requiredReferrals: 8,
  icon: Palette,
  colorClass: 'text-orange-500',
  bgClass: 'bg-orange-500/10'
},
{
  id: 'ocean',
  name: 'Tema Océano',
  description: 'Tonos profundos de agua y azules vibrantes con un fondo inmersivo de playa.',
  requiredReferrals: 11,
  icon: Palette,
  colorClass: 'text-blue-500',
  bgClass: 'bg-blue-500/10'
}];


export default function RewardsModal({ isOpen, onClose }) {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock(isOpen);

  const { userProfile } = useAppStore((state) => ({ userProfile: state.userProfile }));
  const { theme, setTheme } = useAppTheme();

  if (!isOpen) return null;

  const referralCount = userProfile?.referralCount || 0;
  const isAdmin = userProfile?.role === 'admin';

  const handleApplyTheme = (themeId) => {
    setTheme(themeId, false);
    onClose();
  };

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose} />
      
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg-secondary border border-glass-border rounded-[32px] shadow-2xl p-6 md:p-8 animate-[slide-up_0.3s_ease-out] overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Gift size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary">Recompensas</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
            
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-text-secondary text-sm mb-4">
            Invita a amigos a registrarse con tu código y desbloquea temas exclusivos para personalizar tu experiencia.
          </p>
          
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-4 rounded-[20px]">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Amigos Invitados</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-text-primary">{referralCount}</span>
                {isAdmin && <span className="text-xs text-accent font-bold mb-1.5">(Admin Unlocked)</span>}
              </div>
            </div>
            <Trophy size={32} className="text-yellow-500 opacity-80" />
          </div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto hide-scrollbar pb-2">
          {REWARDS.map((reward) => {
            const isUnlocked = isAdmin || referralCount >= reward.requiredReferrals;
            const isActive = theme === reward.id;

            return (
              <div
                key={reward.id}
                className={`relative p-5 rounded-[24px] border transition-all duration-300 overflow-hidden ${
                isUnlocked ?
                isActive ? 'bg-accent/10 border-accent/30' : 'bg-black/5 dark:bg-white/5 border-glass-border hover:border-text-muted/30' :
                'bg-black/2 dark:bg-white/2 border-black/5 dark:border-white/5 opacity-70 grayscale-[0.5]'}`
                }>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${reward.bgClass} ${reward.colorClass}`}>
                    <reward.icon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-text-primary">{reward.name}</h3>
                      <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2 py-1 rounded-full">
                        {isUnlocked ?
                        <Check size={14} className="text-green-500" /> :

                        <Lock size={14} className="text-text-muted" />
                        }
                        <span className="text-xs font-bold text-text-secondary">
                          {isUnlocked ? 'Desbloqueado' : `${referralCount}/${reward.requiredReferrals}`}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                      {reward.description}
                    </p>
                    
                    {isUnlocked &&
                    <button
                      onClick={() => handleApplyTheme(reward.id)}
                      disabled={isActive}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isActive ?
                      'bg-accent text-white shadow-md cursor-default' :
                      'bg-black/5 dark:bg-white/5 text-text-primary hover:bg-black/10 dark:hover:bg-white/10'}`
                      }>
                      
                        {isActive ? 'Tema Activo' : 'Usar Tema'}
                      </button>
                    }
                  </div>
                </div>
              </div>);

          })}
        </div>
      </div>
    </div></ModalPortal>;

}