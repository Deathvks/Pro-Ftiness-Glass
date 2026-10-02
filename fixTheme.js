const fs = require('fs');
const p = 'mobile/src/constants/theme.ts';
let content = fs.readFileSync(p, 'utf8');

const newConstants = 
export const MaxContentWidth = 960;

export const Spacing = {
  zero: 0,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
};

export const Fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  heavy: 'System',
};
;

content += newConstants;
fs.writeFileSync(p, content);
