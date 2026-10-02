
const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/XPGuideModal.jsx', 'utf8');

const guideStartStr = '<div className=\"animate-[fade-in_0.3s_ease-out]\">';
const histStartStr = '{/* --- SECCIÓN HISTORIAL --- */}';

const guideStartIdx = content.indexOf(guideStartStr);
const histStartIdx = content.indexOf(histStartStr);
const histEndIdx = content.lastIndexOf('</section>');

if (guideStartIdx === -1 || histStartIdx === -1 || histEndIdx === -1) {
    console.log('Could not find markers');
    process.exit(1);
}

const beforeGuide = content.substring(0, guideStartIdx + guideStartStr.length);
const guideContent = content.substring(guideStartIdx + guideStartStr.length, histStartIdx);
const histContent = content.substring(histStartIdx, histEndIdx + '</section>'.length);
const afterHist = content.substring(histEndIdx + '</section>'.length);

let newHistContent = histContent.replace('mt-8 pt-8 border-t border-black/5 dark:border-white/10', 'mb-8');
let newGuideContent = '\n                            {/* --- SECCIÓN GUÍA --- */}\n                            <section className=\"mt-8 pt-8 border-t border-black/5 dark:border-white/10\">\n' + guideContent + '\n                            </section>\n';

const newContent = beforeGuide + '\n' + newHistContent + newGuideContent + afterHist;

fs.writeFileSync('frontend/src/components/XPGuideModal.jsx', newContent);
console.log('Swapped successfully');

