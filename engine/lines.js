// Narrator line ids shared by every game. Each game's voicelines.js defines FL.Lines.all(name).
(function () {
  const Lines = {
    all() { return []; },
    article(w) { return /^[aeiou]/i.test(w) ? 'an' : 'a'; },
    normalize(text) { return String(text).toLowerCase().replace(/[\u2019\u2018]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); },
    id(text) { const s = Lines.normalize(text); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); },
  };
  window.FL = window.FL || {};
  FL.Lines = Lines;
})();
