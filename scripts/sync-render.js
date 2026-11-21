/* After editing public/assets/render.js, run `npm run sync-render` so the server uses the same code. */
const fs = require('fs');
const src = fs.readFileSync('public/assets/render.js', 'utf8');
if (!src.startsWith('window.LR = ')) throw new Error('public/assets/render.js must start with "window.LR = "');
fs.writeFileSync('lib/render.js', '/* Same code as public/assets/render.js, exported for the server. `npm run sync-render` copies it over after edits. */\nmodule.exports = ' + src.slice('window.LR = '.length));
console.log('lib/render.js updated');
