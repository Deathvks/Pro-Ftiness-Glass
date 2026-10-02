const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Profile.jsx', 'utf8');

// I will refactor the render function of Profile to be much sleeker.
// Because it's too large to regex blindly, I will use a custom script to replace the return statement of Profile.
