// Prints every narrator line as JSON. Usage: node tools/dump-lines.cjs [ChildName]
global.window = global;
require('../js/save.js'); require('../js/data.js'); require('../js/songs.js'); require('../js/voicelines.js');
const lines = FL.Lines.all(process.argv[2] || '');
console.log(JSON.stringify(lines.map((l) => ({ id: FL.Lines.id(l.text), text: l.text, speak: l.speak || l.text }))));
