// Public-domain nursery songs. Notation: "NOTE:beats" tokens, "R:beats" = rest, "|" = new lyric line.
// words: one syllable per non-rest note, lines separated by "|".
(function () {
  const SONGS = [
    {
      id: 'twinkle', title: 'Twinkle Twinkle', emoji: '⭐', bpm: 104, color: '#facc15',
      notes: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 | F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 | G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 | G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 | C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 | F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
      words: 'Twin-kle twin-kle lit-tle star | How I won-der what you are | Up a-bove the world so high | Like a dia-mond in the sky | Twin-kle twin-kle lit-tle star | How I won-der what you are',
    },
    {
      id: 'abc', title: 'The ABC Song', emoji: '🔤', bpm: 104, color: '#60a5fa',
      notes: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 | F4:1 F4:1 E4:1 E4:1 D4:0.5 D4:0.5 D4:0.5 D4:0.5 C4:2 | G4:1 G4:1 F4:2 E4:1 E4:1 D4:2 | G4:0.5 G4:0.5 G4:1 F4:2 E4:1 E4:1 D4:2 | C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 | F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
      words: 'A B C D E F G | H I J K L M N O P | Q R S T U V | dou-ble-U X Y and Z | Now I know my A B Cs | Next time won\'t you sing with me',
    },
    {
      id: 'mary', title: 'Mary Had a Little Lamb', emoji: '🐑', bpm: 112, color: '#f9a8d4',
      notes: 'E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:2 | D4:1 D4:1 D4:2 E4:1 G4:1 G4:2 | E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:1 E4:1 | D4:1 D4:1 E4:1 D4:1 C4:4',
      words: 'Ma-ry had a lit-tle lamb | lit-tle lamb lit-tle lamb | Ma-ry had a lit-tle lamb its | fleece was white as snow',
    },
    {
      id: 'macdonald', title: 'Old MacDonald', emoji: '🐮', bpm: 116, color: '#86efac',
      notes: 'G4:1 G4:1 G4:1 D4:1 E4:1 E4:1 D4:2 | B4:1 B4:1 A4:1 A4:1 G4:2 R:1 | D4:1 G4:1 G4:1 G4:1 D4:1 E4:1 E4:1 D4:2 | B4:1 B4:1 A4:1 A4:1 G4:2 R:1 | D4:0.5 D4:0.5 G4:1 G4:1 G4:1 D4:0.5 D4:0.5 G4:1 G4:1 G4:1 | G4:0.5 G4:0.5 G4:1 G4:0.5 G4:0.5 G4:1 G4:0.5 G4:0.5 G4:0.5 G4:0.5 G4:1 G4:1 | G4:1 G4:1 G4:1 D4:1 E4:1 E4:1 D4:2 | B4:1 B4:1 A4:1 A4:1 G4:3',
      words: 'Old Mac-Don-ald had a farm | E I E I O | And on that farm he had a cow | E I E I O | With a moo moo here and a moo moo there | Here a moo there a moo ev-ery-where a moo moo | Old Mac-Don-ald had a farm | E I E I O',
    },
    {
      id: 'row', unlock: 6, title: 'Row Your Boat', emoji: '🚣', bpm: 120, color: '#7dd3fc',
      notes: 'C4:1.5 C4:1.5 C4:1 D4:0.5 E4:1.5 | E4:1 D4:0.5 E4:1 F4:0.5 G4:3 | C5:0.5 C5:0.5 C5:0.5 G4:0.5 G4:0.5 G4:0.5 E4:0.5 E4:0.5 E4:0.5 C4:0.5 C4:0.5 C4:0.5 | G4:1 F4:0.5 E4:1 D4:0.5 C4:3',
      words: 'Row row row your boat | gent-ly down the stream | mer-ri-ly mer-ri-ly mer-ri-ly mer-ri-ly | life is but a dream',
    },
    {
      id: 'london', unlock: 14, title: 'London Bridge', emoji: '🌉', bpm: 112, color: '#c4b5fd',
      notes: 'G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 | D4:1 E4:1 F4:2 | E4:1 F4:1 G4:2 | G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 | D4:2 G4:2 E4:1 C4:3',
      words: 'Lon-don Bridge is fall-ing down | fall-ing down | fall-ing down | Lon-don Bridge is fall-ing down | my fair la-dy',
    },
    {
      id: 'spider', unlock: 24, title: 'Itsy Bitsy Spider', emoji: '🕷️', bpm: 116, color: '#fdba74',
      notes: 'G4:0.5 C4:1 C4:0.5 C4:1 D4:0.5 E4:1.5 E4:1 | E4:1 D4:0.5 C4:1 D4:0.5 E4:1.5 C4:1.5 | E4:1 E4:1 F4:1 G4:3 | G4:1 F4:0.5 E4:1 F4:0.5 G4:1.5 E4:1.5 | C4:1 C4:1 D4:1 E4:3 | E4:1 D4:0.5 C4:1 D4:0.5 E4:1.5 C4:1.5 | G4:0.5 G4:0.5 C4:1 C4:0.5 C4:1 D4:0.5 E4:1.5 E4:1 | E4:1 D4:0.5 C4:1 D4:0.5 E4:1.5 C4:2',
      words: 'The it-sy bit-sy spi-der | went up the wa-ter spout | Down came the rain | and washed the spi-der out | Out came the sun | and dried up all the rain | and the it-sy bit-sy spi-der | went up the spout a-gain',
    },
    {
      id: 'hotcross', title: 'Hot Cross Buns', emoji: '🥐', bpm: 100, color: '#fcd34d', unlock: 78,
      notes: 'E4:1 D4:1 C4:2 | E4:1 D4:1 C4:2 | C4:0.5 C4:0.5 C4:0.5 C4:0.5 D4:0.5 D4:0.5 D4:0.5 D4:0.5 | E4:1 D4:1 C4:2',
      words: 'Hot cross buns | Hot cross buns | One a pen-ny two a pen-ny | Hot cross buns',
    },
    {
      id: 'baabaa', title: 'Baa Baa Black Sheep', emoji: '🐑', bpm: 104, color: '#e2e8f0', unlock: 95,
      notes: 'C4:1 C4:1 G4:1 G4:1 A4:0.5 A4:0.5 A4:0.5 A4:0.5 G4:2 | F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 | G4:0.5 G4:0.5 G4:0.5 G4:0.5 F4:1 F4:1 E4:0.5 E4:0.5 E4:1 D4:2 | G4:0.5 G4:0.5 G4:0.5 G4:0.5 F4:0.5 F4:0.5 F4:1 E4:0.5 E4:0.5 E4:1 D4:2 | C4:1 C4:1 G4:1 G4:1 A4:0.5 A4:0.5 A4:0.5 A4:0.5 G4:2 | F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
      words: 'Baa baa black sheep have you an-y wool | Yes sir yes sir three bags full | One for the mas-ter and one for the dame | One for the lit-tle boy who lives down the lane | Baa baa black sheep have you an-y wool | Yes sir yes sir three bags full',
    },
    {
      id: 'birthday', title: 'Happy Birthday', emoji: '🎂', bpm: 110, color: '#fca5a5', unlock: 36,
      notes: 'G4:0.75 G4:0.25 A4:1 G4:1 C5:1 B4:2 | G4:0.75 G4:0.25 A4:1 G4:1 D5:1 C5:2 | G4:0.75 G4:0.25 G5:1 E5:1 C5:1 B4:1 A4:2 | F5:0.75 F5:0.25 E5:1 C5:1 D5:1 C5:2',
      words: 'Hap-py birth-day to you | Hap-py birth-day to you | Hap-py birth-day dear prin-cess | Hap-py birth-day to you',
    },
  ];

  function parse(song) {
    if (song._parsed) return song._parsed;
    const lines = song.notes.split('|').map((s) => s.trim());
    const wordLines = (song.words || '').split('|').map((s) => s.trim().split(/\s+/).filter(Boolean));
    const notes = [];
    let beat = 0;
    lines.forEach((line, li) => {
      const words = wordLines[li] || [];
      const syl = []; words.forEach((w, wi) => w.split('-').forEach((part) => syl.push({ text: part, word: wi })));
      let si = 0;
      line.split(/\s+/).forEach((tok) => {
        const [n, d] = tok.split(':'); const dur = parseFloat(d || '1');
        const rest = n === 'R'; const sy = rest ? null : syl[si++];
        notes.push({ note: rest ? null : n, rest, beat, beats: dur, line: li, lyric: sy ? sy.text : '', word: sy ? sy.word : -1 });
        beat += dur;
      });
      if (syl.length && si !== syl.length) console.warn('Lyric mismatch in', song.id, 'line', li, si, syl.length);
    });
    song._parsed = { notes, totalBeats: beat, lines: wordLines.map((ws) => ws.map((w) => w.replace(/-/g, ''))) };
    return song._parsed;
  }
  const Songs = {
    list: SONGS,
    byId(id) { return SONGS.find((s) => s.id === id); },
    unlocked(stars) { return SONGS.filter((s) => (s.unlock || 0) <= stars); },
    parse,
    // Absolute timeline in seconds.
    timeline(song, bpm) {
      const p = parse(song); const spb = 60 / (bpm || song.bpm);
      const tl = p.notes.map((n) => ({ note: n.note, rest: n.rest, t: n.beat * spb, dur: n.beats * spb, beats: n.beats, line: n.line, lyric: n.lyric, word: n.word }));
      tl.duration = p.totalBeats * spb; tl.spb = spb; tl.lines = p.lines;
      return tl;
    },
    // Map each pitched note of a song onto `lanes` lanes by relative pitch.
    lanes(song, lanes) {
      const p = parse(song);
      const pitches = [...new Set(p.notes.filter((n) => !n.rest).map((n) => n.note))].sort((a, b) => FL.Audio.freq(a) - FL.Audio.freq(b));
      const map = {};
      pitches.forEach((n, i) => { map[n] = pitches.length === 1 ? Math.floor(lanes / 2) : Math.min(lanes - 1, Math.floor((i / (pitches.length - 1)) * (lanes - 0.001))); });
      return map;
    },
    // Unique pitches in the song (used by the piano teacher).
    pitches(song) { const p = parse(song); return [...new Set(p.notes.filter((n) => !n.rest).map((n) => n.note))]; },
  };
  window.FL = window.FL || {};
  FL.Songs = Songs;
})();
