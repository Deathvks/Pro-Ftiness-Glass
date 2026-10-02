
const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/ModalPortal.jsx', 'utf8');

// Remove the whole useEffect that adds the passive: false listener
const useEffectRegex = /useEffect\(\(\) => \{\s*const el = overlayRef\.current;[\s\S]*?\}, \[mounted\]\);/;
let newContent = content.replace(useEffectRegex, '');

// We need a ref to hold the dynamic listener so we can remove it
const refInsert = '  const activeTouchMoveListener = useRef(null);';
newContent = newContent.replace('const overlayRef = useRef(null);', 'const overlayRef = useRef(null);\n' + refInsert);

// Now in handleTouchStart, if canSwipe is true, we attach it.
const touchStartReplace = \
    isValidSwipe.current = canSwipe;

    if (canSwipe) {
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      touchCurrentY.current = touch.clientY;
      touchStartTime.current = Date.now();

      const el = overlayRef.current;
      if (el) {
        activeTouchMoveListener.current = (ev) => {
          if (isValidSwipe.current && touchStartY.current !== null) {
            const currentY = ev.touches[0].clientY;
            if (currentY > touchStartY.current && ev.cancelable) {
              ev.preventDefault();
            }
          }
        };
        el.addEventListener('touchmove', activeTouchMoveListener.current, { passive: false });
      }
\;

newContent = newContent.replace(/isValidSwipe\.current = canSwipe;[\s\S]*?touchStartTime\.current = Date\.now\(\);/, touchStartReplace);

// In handleTouchEnd, we must remove it.
const touchEndReplace = \
  const handleTouchEnd = (e) => {
    if (activeTouchMoveListener.current && overlayRef.current) {
      overlayRef.current.removeEventListener('touchmove', activeTouchMoveListener.current);
      activeTouchMoveListener.current = null;
    }

    if (!isValidSwipe.current || touchStartY.current === null) {
\;

newContent = newContent.replace(/const handleTouchEnd = \(e\) => \{\s*if \(\!isValidSwipe\.current \|\| touchStartY\.current === null\) \{/, touchEndReplace);

fs.writeFileSync('frontend/src/components/ModalPortal.jsx', newContent);
console.log('Fixed ModalPortal');

