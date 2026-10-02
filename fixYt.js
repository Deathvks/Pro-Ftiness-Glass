const fs = require('fs');
const p = 'frontend/src/components/ExerciseMedia.jsx';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(
  /\https:\/\/www\.youtube\.com\/embed\/\$\{youtubeId\}\?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0\/,
  "https://www.youtube.com/embed/?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&loop=1&playlist="
);
fs.writeFileSync(p, content);
