import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAppStore from '../store/useAppStore';
import { APP_TUTORIALS } from '../data/tutorials';

const PageTutorialPlayback = ({ view, navParams, setView }) => {
  const driverRef = useRef(null);
  const setViewRef = useRef(setView);
  setViewRef.current = setView;

  const tutorialId = navParams?.tutorialId;
  const returnToHub = navParams?.returnToHub;

  useEffect(() => {
    const tutorial = APP_TUTORIALS.find(item => item.id === tutorialId && item.view === view);
    if (!tutorial) return undefined;

    let cancelled = false;
    let completed = false;
    let timeoutId;
    let attempts = 0;

    const finishTutorial = () => {
      if (cancelled || completed) return;
      completed = true;
      driverRef.current = null;
      useAppStore.getState().setTourActive(false);
      setViewRef.current(returnToHub ? 'hub' : view);
    };

    const startWhenReady = () => {
      if (cancelled) return;
      const steps = tutorial.steps.map(step => {
        const selector = typeof step.element === 'function' ? step.element() : step.element;
        if (selector && !document.querySelector(selector)) return null;
        return {
          ...(selector ? { element: selector } : {}),
          popover: {
            title: step.title,
            description: step.description,
            ...(step.side ? { side: step.side } : {})
          }
        };
      }).filter(Boolean);

      if (steps.length < 2 && attempts < 12) {
        attempts += 1;
        timeoutId = window.setTimeout(startWhenReady, 500);
        return;
      }

      driverRef.current = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        smoothScroll: true,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Atrás',
        doneBtnText: 'Terminar tutorial',
        progressText: '{{current}} de {{total}}',
        steps,
        onHighlightStarted: element => {
          const node = element?.node || (element?.element && document.querySelector(element.element));
          node?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        },
        onPopoverRender: (popover, { config, state }) => {
          const handleAction = (button, action) => {
            if (!button) return;
            const fire = event => {
              event.preventDefault();
              event.stopPropagation();
              action();
            };
            button.ontouchend = fire;
            button.onclick = fire;
          };
          handleAction(popover.nextButton, () => {
            if (state.activeIndex === config.steps.length - 1) driverRef.current?.destroy();
            else driverRef.current?.moveNext();
          });
          handleAction(popover.previousButton, () => driverRef.current?.movePrevious());
          handleAction(popover.closeButton, () => driverRef.current?.destroy());
        },
        onDestroyed: finishTutorial
      });

      useAppStore.getState().setTourActive(true);
      driverRef.current.drive();
    };

    timeoutId = window.setTimeout(startWhenReady, 650);
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (driverRef.current) {
        const activeDriver = driverRef.current;
        driverRef.current = null;
        activeDriver.destroy();
      }
      useAppStore.getState().setTourActive(false);
    };
  }, [view, tutorialId, returnToHub]);

  return null;
};

export default PageTutorialPlayback;
