
const fs = require('fs');
let content = fs.readFileSync('scratch/ModalPortal_working.jsx', 'utf8');

// Just safely check classList and remove scrollHeight
content = content.replace(
  /const isScrollableClass = el\.classList\.contains\('overflow-y-auto'\) \|\|[\s\S]*?const hasScroll = isScrollableClass \|\| \(el\.scrollHeight > el\.clientHeight && \(el\.style\.overflowY === 'auto' \|\| el\.style\.overflowY === 'scroll'\)\);/,
  \const isScrollableClass = el.classList && (
                                el.classList.contains('overflow-y-auto') || 
                                el.classList.contains('overflow-auto') ||
                                el.classList.contains('scrollable') ||
                                el.classList.contains('no-scrollbar')
                              );
                              
        const hasScroll = isScrollableClass;\
);

fs.writeFileSync('frontend/src/components/ModalPortal.jsx', content);
console.log('Fixed ModalPortal');

