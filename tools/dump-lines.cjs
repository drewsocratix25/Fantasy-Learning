// Prints every narrator line of a game as JSON. Usage: node tools/dump-lines.cjs <gameId> [ChildName]
const path = require('path'); const game = process.argv[2] || 'melody'; const root = path.join(__dirname, '..');
global.window = global;
require(path.join(root, 'games', game, 'js', 'config.js'));
require(path.join(root, 'engine', 'save.js')); require(path.join(root, 'engine', 'lines.js'));
(FL.config.lineFiles || []).forEach((f) => require(path.join(root, 'games', game, f)));
const lines = FL.Lines.all(process.argv[3] || '');
console.log(JSON.stringify(lines.map((l) => ({ id: FL.Lines.id(l.text), text: l.text, speak: l.speak || l.text }))));
