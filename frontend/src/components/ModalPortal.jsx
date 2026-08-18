import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const ModalPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const touchStartY = useRef(null);
  const touchCurrentY = useRef(null);
  const touchStartTime = useRef(null);
  const isValidSwipe = useRef(false);
  const cardElementRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const child = React.isValidElement(children) ? children : React.Children.only(children);

  const handleTouchStart = (e) => {
    let canSwipe = window.innerWidth < 640;
    
    if (canSwipe) {
      let el = e.target;
      while (el && el !== document.body && el !== e.currentTarget) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          if (el.scrollTop > 2) {
            canSwipe = false;
            break;
          }
        }
        el = el.parentElement;
      }
    }

    isValidSwipe.current = canSwipe;

    if (canSwipe) {
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      touchCurrentY.current = touch.clientY;
      touchStartTime.current = Date.now();
      
      // Encontrar el contenedor del modal (la tarjeta) para animarla
      const overlay = e.currentTarget;
      // Buscamos el elemento que tiene mt-auto (típico de bottom sheets) o usamos el último hijo
      cardElementRef.current = Array.from(overlay.children).find(el => el.classList.contains('mt-auto')) || overlay.lastElementChild;
      
      if (cardElementRef.current) {
        // Desactivamos la transición para que siga al dedo instantáneamente
        cardElementRef.current.style.transition = 'none';
      }
    }
    
    if (child.props.onTouchStart) {
      child.props.onTouchStart(e);
    }
  };

  const handleTouchMove = (e) => {
    if (isValidSwipe.current && touchStartY.current !== null) {
      touchCurrentY.current = e.touches[0].clientY;
      const deltaY = Math.max(0, touchCurrentY.current - touchStartY.current); // Solo permitir drag hacia abajo
      
      if (cardElementRef.current) {
        cardElementRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
    
    if (child.props.onTouchMove) {
      child.props.onTouchMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    if (isValidSwipe.current && touchStartY.current !== null && touchCurrentY.current !== null) {
      const deltaY = touchCurrentY.current - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const velocity = deltaY / deltaTime;
      
      if ((deltaY > 120) || (deltaY > 40 && velocity > 0.5)) {
        // Swipe exitoso, animamos la salida completa antes de desmontar
        if (cardElementRef.current) {
          cardElementRef.current.style.transition = 'transform 0.2s ease-out';
          cardElementRef.current.style.transform = `translateY(100%)`;
        }
        
        // Guardar referencias del DOM antes del setTimeout porque e.currentTarget se vuelve null
        const currentTarget = e.currentTarget;
        
        // Damos un pequeño retraso para que se vea la animación
        setTimeout(() => {
          let closed = false;
          
          if (child.props.onClick) {
            child.props.onClick({ 
              target: currentTarget, 
              currentTarget: currentTarget, 
              preventDefault: () => {}, 
              stopPropagation: () => {} 
            });
            closed = true;
          } else {
            // Fallback: Si el overlay no tiene onClick (ej: BugReportModal), buscamos un botón de cierre
            const buttons = currentTarget.querySelectorAll('button');
            for (const btn of buttons) {
              if (
                btn.querySelector('svg.lucide-x') || 
                btn.textContent.toLowerCase().includes('cancelar') || 
                btn.textContent.toLowerCase().includes('cerrar')
              ) {
                btn.click();
                closed = true;
                break;
              }
            }
          }

          // Si por algún motivo no logramos cerrarlo, revertimos la animación para no dejar la pantalla oscura
          if (!closed && cardElementRef.current) {
            cardElementRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
            cardElementRef.current.style.transform = `translateY(0px)`;
          }
        }, 150);
      } else {
        // Cancelar swipe, volver a la posición original
        if (cardElementRef.current) {
          cardElementRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
          cardElementRef.current.style.transform = `translateY(0px)`;
          
          // Limpiar el estilo inline después de la animación
          setTimeout(() => {
            if (cardElementRef.current) {
              cardElementRef.current.style.transform = '';
              cardElementRef.current.style.transition = '';
            }
          }, 300);
        }
      }
    }
    
    touchStartY.current = null;
    touchCurrentY.current = null;
    touchStartTime.current = null;
    isValidSwipe.current = false;
    
    if (child.props.onTouchEnd) {
      child.props.onTouchEnd(e);
    }
  };

  const overlayRef = useRef(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    
    const onNativeTouchMove = (e) => {
      if (isValidSwipe.current && touchStartY.current !== null) {
        const currentY = e.touches[0].clientY;
        if (currentY > touchStartY.current && e.cancelable) {
          e.preventDefault(); // Stop native scroll / pull-to-refresh
        }
      }
    };
    
    el.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onNativeTouchMove);
  }, [mounted]);

  const clonedChild = React.cloneElement(child, {
    ref: (node) => {
      overlayRef.current = node;
      if (child.ref) {
        if (typeof child.ref === 'function') child.ref(node);
        else child.ref.current = node;
      }
    },
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  });

  return createPortal(clonedChild, document.body);
};

export default ModalPortal;
