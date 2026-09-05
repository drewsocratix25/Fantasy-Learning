// Step-by-step drawing lessons for the Art Studio. Every picture lives in a 400 x 400 box.
// Shapes:  c circle [x,y,r] · e ellipse [x,y,rx,ry,rotDeg] · a arc [x,y,rx,ry,fromDeg,toDeg] · l line [x1,y1,x2,y2]
//          p polyline [[x,y,...], closed] · q curve [x1,y1,cx,cy,x2,y2] · b curve [x1,y1,c1x,c1y,c2x,c2y,x2,y2]
//          d dot [x,y,r] · s star [x,y,r] · r rounded box [x,y,w,h,radius] · path [[shapes...]] (joins shapes into one region)
// A fill is a shape with a colour as its last item. Fills are painted underneath all the outlines in the final "colour it in" step,
// so they are listed back-to-front (the thing furthest away first).
(function () {
  const D = {};
  const rays = (cx, cy, r0, r1, n) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI * 2) / n; return ['l', cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]; });
  const petal = (a, color) => { const r = (a * Math.PI) / 180; const e = ['e', 200 + Math.cos(r) * 66, 150 + Math.sin(r) * 66, 36, 22, a]; if (color) e.push(color); return e; };
  const scallop = (cx, cy, R, amp, bumps) => { const pts = []; for (let i = 0; i <= 140; i++) { const th = -Math.PI / 2 + (i / 140) * Math.PI * 2; const r = R + amp * Math.abs(Math.cos((bumps * th) / 2)); pts.push(cx + Math.cos(th) * r, cy + Math.sin(th) * r); } return pts; };
  const zigzag = (x1, x2, y, teeth, amp) => { const pts = []; for (let i = 0; i <= teeth * 2; i++) pts.push(x1 + ((x2 - x1) * i) / (teeth * 2), i % 2 ? y - amp : y); return pts; };
  const PETALS = [-90, -30, 30, 90, 150, 210];
  const TUMMY = ['a', 200, 290, 75, 70, -62, 242]; // round body hanging under a big head
  const PAWS = [['e', 172, 368, 24, 11], ['e', 228, 368, 24, 11]];

  D.list = [
    {
      id: 'sun', name: 'Sun', emoji: '☀️', level: 1, color: '#fde68a',
      steps: [
        { say: 'Draw a big circle in the middle of the paper.', strokes: [['c', 200, 200, 90]] },
        { say: 'Draw short lines all the way around the circle. Those are the sunbeams!', strokes: rays(200, 200, 112, 152, 12) },
        { say: 'Give the sun two happy eyes.', strokes: [['d', 168, 185, 8], ['d', 232, 185, 8]] },
        { say: 'Now draw a big smile!', strokes: [['a', 200, 200, 46, 40, 25, 155]] },
      ],
      fills: [['c', 200, 200, 90, '#fde047'], ['c', 150, 208, 9, '#fda4af'], ['c', 250, 208, 9, '#fda4af']],
    },
    {
      id: 'flower', name: 'Flower', emoji: '🌸', level: 1, color: '#fbcfe8',
      steps: [
        { say: 'Draw a small circle near the top of the paper.', strokes: [['c', 200, 150, 30]] },
        { say: 'Draw petals all around the circle, like a daisy.', strokes: PETALS.map((a) => petal(a)) },
        { say: 'Draw a long line going down. That is the stem.', strokes: [['l', 200, 252, 200, 385]] },
        { say: 'Add a leaf on each side of the stem.', strokes: [['e', 170, 300, 34, 14, -30], ['e', 230, 335, 34, 14, 30]] },
        { say: 'Give your flower a happy face!', strokes: [['d', 190, 144, 4], ['d', 210, 144, 4], ['a', 200, 150, 14, 12, 20, 160]] },
      ],
      fills: PETALS.map((a) => petal(a, '#f9a8d4')).concat([['c', 200, 150, 30, '#fde047'], ['e', 170, 300, 34, 14, -30, '#4ade80'], ['e', 230, 335, 34, 14, 30, '#4ade80']]),
    },
    {
      id: 'house', name: 'House', emoji: '🏠', level: 1, color: '#fed7aa',
      steps: [
        { say: 'Draw a big square for the walls.', strokes: [['p', [110, 200, 290, 200, 290, 360, 110, 360], true]] },
        { say: 'Draw a triangle on top for the roof.', strokes: [['p', [95, 200, 200, 90, 305, 200], true]] },
        { say: 'Draw a door in the middle. Add a little doorknob!', strokes: [['p', [178, 360, 178, 285, 222, 285, 222, 360]], ['d', 213, 325, 4]] },
        { say: 'Draw two square windows, with a cross inside each one.', strokes: [['p', [125, 225, 165, 225, 165, 265, 125, 265], true], ['l', 145, 225, 145, 265], ['l', 125, 245, 165, 245], ['p', [235, 225, 275, 225, 275, 265, 235, 265], true], ['l', 255, 225, 255, 265], ['l', 235, 245, 275, 245]] },
        { say: 'Draw a chimney on the roof, with puffy smoke coming out.', strokes: [['p', [240, 132, 240, 100, 265, 100, 265, 158]], ['c', 252, 80, 10], ['c', 262, 60, 12], ['c', 280, 40, 14]] },
        { say: 'Draw the ground, and a sun in the sky!', strokes: [['l', 30, 360, 370, 360], ['c', 60, 60, 24]].concat(rays(60, 60, 32, 46, 8)) },
      ],
      fills: [['p', [110, 200, 290, 200, 290, 360, 110, 360], '#fde68a'], ['p', [95, 200, 200, 90, 305, 200], '#ef4444'], ['p', [178, 360, 178, 285, 222, 285, 222, 360], '#92400e'],
        ['p', [125, 225, 165, 225, 165, 265, 125, 265], '#bae6fd'], ['p', [235, 225, 275, 225, 275, 265, 235, 265], '#bae6fd'], ['p', [240, 132, 240, 100, 265, 100, 265, 158], '#b91c1c'], ['c', 60, 60, 24, '#fde047']],
    },
    {
      id: 'icecream', name: 'Ice Cream', emoji: '🍦', level: 2, color: '#fbcfe8',
      steps: [
        { say: 'Draw a V shape, like a triangle pointing down. That is the cone.', strokes: [['p', [141, 221, 200, 385, 259, 221]]] },
        { say: 'Draw a big round scoop sitting on top of the cone.', strokes: [['c', 200, 180, 72]] },
        { say: 'Draw a smaller bump on top. That is the second scoop!', strokes: [['a', 200, 105, 56, 56, 25, -205]] },
        { say: 'Draw criss-cross lines on the cone to make it crunchy.', strokes: [['l', 212, 258, 183, 338], ['l', 232, 258, 193, 365], ['l', 187, 258, 170, 303], ['l', 188, 258, 217, 338], ['l', 168, 258, 207, 365], ['l', 213, 258, 230, 303]] },
        { say: 'Put a cherry on top!', strokes: [['c', 200, 36, 12], ['q', 200, 24, 204, 12, 216, 6]] },
        { say: 'Add lots of little sprinkles!', strokes: [['l', 165, 175, 177, 168], ['l', 215, 160, 228, 166], ['l', 185, 205, 198, 212], ['l', 232, 200, 244, 192], ['l', 152, 205, 160, 216], ['l', 205, 235, 218, 232], ['l', 240, 230, 250, 222], ['l', 180, 85, 190, 78], ['l', 215, 80, 226, 88]] },
      ],
      fills: [['p', [141, 221, 200, 385, 259, 221], '#f59e0b'], ['c', 200, 105, 56, '#bbf7d0'], ['c', 200, 180, 72, '#f9a8d4'], ['c', 200, 36, 12, '#ef4444']],
    },
    {
      id: 'fish', name: 'Fish', emoji: '🐟', level: 2, color: '#bae6fd',
      steps: [
        { say: 'Draw a big oval for the body, like an egg lying on its side.', strokes: [['e', 190, 200, 110, 65]] },
        { say: 'Draw a triangle at the back for the tail.', strokes: [['p', [297, 188, 365, 150, 365, 250, 297, 212]]] },
        { say: 'Draw a little fin on top, and one underneath.', strokes: [['p', [170, 136, 195, 98, 232, 140]], ['p', [180, 264, 205, 297, 232, 261]]] },
        { say: 'Draw a big round eye and a little smile.', strokes: [['c', 112, 190, 13], ['d', 115, 190, 5], ['a', 88, 208, 10, 10, 20, 130]] },
        { say: 'Draw two curvy stripes on the body.', strokes: [['q', 215, 137, 240, 200, 215, 263], ['q', 250, 146, 275, 200, 250, 254]] },
        { say: 'Add some bubbles coming out of its mouth!', strokes: [['c', 60, 130, 8], ['c', 45, 100, 11], ['c', 66, 68, 7]] },
      ],
      fills: [['p', [297, 188, 365, 150, 365, 250, 297, 212], '#fdba74'], ['p', [170, 136, 195, 98, 232, 140], '#fdba74'], ['p', [180, 264, 205, 297, 232, 261], '#fdba74'], ['e', 190, 200, 110, 65, 0, '#fb923c'], ['c', 112, 190, 13, '#fff']],
    },
    {
      id: 'tree', name: 'Tree', emoji: '🌳', level: 2, color: '#bbf7d0',
      steps: [
        { say: 'Draw two lines going down for the trunk, and join them at the bottom.', strokes: [['p', [186, 236, 178, 385, 222, 385, 214, 236]]] },
        { say: 'Draw a big bumpy cloud shape on top. Those are the leaves!', strokes: [['p', scallop(200, 150, 72, 18, 7)]] },
        { say: 'Draw some round apples in the leaves.', strokes: [['c', 170, 128, 12], ['c', 228, 158, 12], ['c', 198, 198, 11], ['c', 150, 176, 11], ['c', 238, 108, 11]] },
        { say: 'Draw zigzag grass along the bottom.', strokes: [['p', zigzag(40, 360, 385, 16, 16)]] },
        { say: 'Add a sun and a little bird in the sky!', strokes: [['c', 60, 60, 24]].concat(rays(60, 60, 32, 46, 8), [['a', 305, 70, 12, 10, 200, 340], ['a', 329, 70, 12, 10, 200, 340]]) },
      ],
      fills: [['p', [186, 225, 178, 385, 222, 385, 214, 225], '#92400e'], ['p', scallop(200, 150, 72, 18, 7), '#4ade80'], ['c', 170, 128, 12, '#ef4444'], ['c', 228, 158, 12, '#ef4444'], ['c', 198, 198, 11, '#ef4444'], ['c', 150, 176, 11, '#ef4444'], ['c', 238, 108, 11, '#ef4444'], ['c', 60, 60, 24, '#fde047']],
    },
    {
      id: 'car', name: 'Car', emoji: '🚗', level: 2, color: '#bfdbfe',
      steps: [
        { say: 'Draw a long rectangle with round corners. That is the bottom of the car.', strokes: [['r', 60, 250, 280, 62, 14]] },
        { say: 'Draw a bump on top for the roof.', strokes: [['p', [112, 250, 135, 190, 268, 190, 292, 250]]] },
        { say: 'Draw two circles for the wheels, with a small circle inside each one.', strokes: [['c', 122, 322, 32], ['c', 122, 322, 12], ['c', 278, 322, 32], ['c', 278, 322, 12]] },
        { say: 'Draw two windows in the roof.', strokes: [['p', [142, 200, 195, 200, 195, 242, 128, 242], true], ['p', [207, 200, 260, 200, 274, 242, 207, 242], true]] },
        { say: 'Add a headlight at the front, a light at the back, and a door handle.', strokes: [['c', 328, 272, 9], ['c', 72, 272, 7], ['l', 200, 250, 200, 306], ['l', 208, 274, 224, 274]] },
        { say: 'Draw a road under the car.', strokes: [['l', 20, 362, 380, 362], ['l', 50, 382, 95, 382], ['l', 140, 382, 185, 382], ['l', 230, 382, 275, 382], ['l', 320, 382, 365, 382]] },
      ],
      fills: [['p', [112, 250, 135, 190, 268, 190, 292, 250], '#3b82f6'], ['r', 60, 250, 280, 62, 14, '#3b82f6'], ['p', [142, 200, 195, 200, 195, 242, 128, 242], '#bae6fd'], ['p', [207, 200, 260, 200, 274, 242, 207, 242], '#bae6fd'],
        ['c', 122, 322, 32, '#1f2937'], ['c', 122, 322, 12, '#9ca3af'], ['c', 278, 322, 32, '#1f2937'], ['c', 278, 322, 12, '#9ca3af'], ['c', 328, 272, 9, '#fde047'], ['c', 72, 272, 7, '#ef4444']],
    },
    {
      id: 'butterfly', name: 'Butterfly', emoji: '🦋', level: 2, color: '#ddd6fe',
      steps: [
        { say: 'Draw a long thin oval in the middle for the body.', strokes: [['e', 200, 218, 16, 76]] },
        { say: 'Draw a small circle on top for the head.', strokes: [['c', 200, 122, 19]] },
        { say: 'Draw two big wings at the top, one on each side.', strokes: [['e', 126, 170, 62, 48, -22], ['e', 274, 170, 62, 48, 22]] },
        { say: 'Draw two smaller wings at the bottom.', strokes: [['e', 138, 262, 48, 40, 20], ['e', 262, 262, 48, 40, -20]] },
        { say: 'Draw two curly feelers on its head, and a happy face.', strokes: [['q', 192, 105, 178, 75, 166, 62], ['d', 166, 62, 4], ['q', 208, 105, 222, 75, 234, 62], ['d', 234, 62, 4], ['d', 194, 119, 3], ['d', 206, 119, 3], ['a', 200, 124, 7, 6, 20, 160]] },
        { say: 'Decorate the wings with big spots!', strokes: [['c', 122, 166, 13], ['c', 278, 166, 13], ['c', 138, 262, 9], ['c', 262, 262, 9]] },
      ],
      fills: [['e', 126, 170, 62, 48, -22, '#f472b6'], ['e', 274, 170, 62, 48, 22, '#f472b6'], ['e', 138, 262, 48, 40, 20, '#fbbf24'], ['e', 262, 262, 48, 40, -20, '#fbbf24'], ['e', 200, 218, 16, 76, 0, '#7c3aed'], ['c', 200, 122, 19, '#7c3aed'],
        ['c', 122, 166, 13, '#fff'], ['c', 278, 166, 13, '#fff'], ['c', 138, 262, 9, '#fff'], ['c', 262, 262, 9, '#fff']],
    },
    {
      id: 'cat', name: 'Cat', emoji: '🐱', level: 3, color: '#fed7aa',
      steps: [
        { say: 'Draw a big circle for the head.', strokes: [['c', 200, 150, 85]] },
        { say: 'Draw two pointy triangle ears on top of the head.', strokes: [['p', [140, 90, 135, 20, 185, 66]], ['p', [260, 90, 265, 20, 215, 66]]] },
        { say: 'Draw two round eyes and a little triangle nose.', strokes: [['c', 170, 138, 13], ['d', 172, 140, 6], ['c', 230, 138, 13], ['d', 228, 140, 6], ['p', [192, 160, 208, 160, 200, 170], true]] },
        { say: 'Draw a smile under the nose, and three whiskers on each cheek.', strokes: [['a', 190, 172, 10, 8, 0, 180], ['a', 210, 172, 10, 8, 0, 180], ['l', 150, 160, 100, 150], ['l', 150, 168, 98, 168], ['l', 150, 176, 100, 186], ['l', 250, 160, 300, 150], ['l', 250, 168, 302, 168], ['l', 250, 176, 300, 186]] },
        { say: 'Draw a big round tummy under the head.', strokes: [TUMMY] },
        { say: 'Add two little paws at the bottom, and a curly tail.', strokes: PAWS.concat([['q', 270, 315, 335, 300, 320, 235]]) },
      ],
      fills: [['p', [140, 90, 135, 20, 185, 66], '#fdba74'], ['p', [260, 90, 265, 20, 215, 66], '#fdba74'], ['e', 200, 290, 75, 70, 0, '#fdba74'], ['c', 200, 150, 85, '#fdba74'], ['p', [147, 84, 143, 38, 176, 68], '#fbcfe8'], ['p', [253, 84, 257, 38, 224, 68], '#fbcfe8'],
        ['c', 170, 138, 13, '#fff'], ['c', 230, 138, 13, '#fff'], ['p', [192, 160, 208, 160, 200, 170], '#f472b6'], ['e', 172, 368, 24, 11, 0, '#fdba74'], ['e', 228, 368, 24, 11, 0, '#fdba74']],
    },
    {
      id: 'dog', name: 'Dog', emoji: '🐶', level: 3, color: '#e7e5e4',
      steps: [
        { say: 'Draw a big circle for the head.', strokes: [['c', 200, 150, 85]] },
        { say: 'Draw two long floppy ears hanging down on each side.', strokes: [['b', 139, 91, 88, 105, 82, 235, 118, 240], ['q', 118, 240, 140, 232, 127, 192], ['b', 261, 91, 312, 105, 318, 235, 282, 240], ['q', 282, 240, 260, 232, 273, 192]] },
        { say: 'Draw two round eyes and a big nose.', strokes: [['c', 170, 135, 13], ['d', 172, 137, 6], ['c', 230, 135, 13], ['d', 228, 137, 6], ['e', 200, 170, 15, 11]] },
        { say: 'Draw a smile, with a tongue sticking out.', strokes: [['a', 200, 180, 26, 20, 25, 155], ['a', 204, 199, 10, 14, 180, 0]] },
        { say: 'Draw a big round tummy under the head.', strokes: [TUMMY] },
        { say: 'Draw a collar with a little bell.', strokes: [['a', 200, 243, 48, 12, 0, 180], ['a', 200, 243, 48, 22, 180, 0], ['c', 200, 272, 7]] },
        { say: 'Add two paws, and a waggy tail!', strokes: PAWS.concat([['q', 270, 315, 335, 300, 320, 235]]) },
      ],
      fills: [['path', [['b', 139, 91, 88, 105, 82, 235, 118, 240], ['q', 118, 240, 140, 232, 127, 192]], '#a16207'], ['path', [['b', 261, 91, 312, 105, 318, 235, 282, 240], ['q', 282, 240, 260, 232, 273, 192]], '#a16207'],
        ['e', 200, 290, 75, 70, 0, '#d6b48b'], ['c', 200, 150, 85, '#d6b48b'], ['c', 170, 135, 13, '#fff'], ['c', 230, 135, 13, '#fff'], ['e', 200, 170, 15, 11, 0, '#1f2937'], ['path', [['a', 204, 199, 10, 14, 180, 0]], '#f472b6'],
        ['path', [['a', 200, 243, 48, 12, 0, 180], ['a', 200, 243, 48, 22, 180, 0]], '#ef4444'], ['c', 200, 272, 7, '#fde047'], ['e', 172, 368, 24, 11, 0, '#d6b48b'], ['e', 228, 368, 24, 11, 0, '#d6b48b']],
    },
    {
      id: 'bunny', name: 'Bunny', emoji: '🐰', level: 3, color: '#fde68a',
      steps: [
        { say: 'Draw a circle for the head.', strokes: [['c', 200, 190, 70]] },
        { say: 'Draw two long ears standing up on top.', strokes: [['a', 168, 90, 22, 58, 32, -232], ['a', 232, 90, 22, 58, 148, 412]] },
        { say: 'Draw two eyes and a tiny nose.', strokes: [['d', 178, 182, 7], ['d', 222, 182, 7], ['e', 200, 200, 7, 5]] },
        { say: 'Draw a little mouth and some whiskers.', strokes: [['l', 200, 205, 200, 213], ['a', 191, 213, 9, 7, 0, 180], ['a', 209, 213, 9, 7, 0, 180], ['l', 160, 200, 120, 193], ['l', 160, 208, 120, 215], ['l', 240, 200, 280, 193], ['l', 240, 208, 280, 215]] },
        { say: 'Draw a round tummy under the head.', strokes: [['a', 200, 312, 66, 62, -66, 246]] },
        { say: 'Add two little paws and two big feet!', strokes: [['e', 156, 320, 14, 10], ['e', 244, 320, 14, 10], ['e', 165, 376, 28, 13], ['e', 235, 376, 28, 13]] },
      ],
      fills: [['e', 168, 90, 22, 58, 0, '#f5d3b0'], ['e', 232, 90, 22, 58, 0, '#f5d3b0'], ['e', 168, 88, 10, 38, 0, '#fbcfe8'], ['e', 232, 88, 10, 38, 0, '#fbcfe8'], ['e', 200, 312, 66, 62, 0, '#f5d3b0'], ['c', 200, 190, 70, '#f5d3b0'],
        ['c', 168, 204, 8, '#fda4af'], ['c', 232, 204, 8, '#fda4af'], ['e', 200, 200, 7, 5, 0, '#f472b6'], ['e', 165, 376, 28, 13, 0, '#f5d3b0'], ['e', 235, 376, 28, 13, 0, '#f5d3b0'], ['e', 156, 320, 14, 10, 0, '#fbcfe8'], ['e', 244, 320, 14, 10, 0, '#fbcfe8']],
    },
    {
      id: 'rocket', name: 'Rocket', emoji: '🚀', level: 3, color: '#c7d2fe',
      steps: [
        { say: 'Draw a tall rectangle in the middle of the paper.', strokes: [['p', [152, 150, 248, 150, 248, 300, 152, 300], true]] },
        { say: 'Draw a triangle on top. That is the pointy nose!', strokes: [['p', [152, 150, 200, 58, 248, 150]]] },
        { say: 'Draw a fin on each side at the bottom.', strokes: [['p', [152, 240, 108, 318, 152, 300]], ['p', [248, 240, 292, 318, 248, 300]]] },
        { say: 'Draw a round window, with a smaller circle inside it.', strokes: [['c', 200, 200, 26], ['c', 200, 200, 17]] },
        { say: 'Draw zigzag fire coming out of the bottom!', strokes: [['p', [162, 300, 176, 345, 190, 312, 200, 368, 210, 312, 224, 345, 238, 300]]] },
        { say: 'Add some twinkly stars in the sky.', strokes: [['s', 70, 85, 13], ['s', 330, 60, 11], ['s', 60, 250, 10], ['s', 338, 215, 12], ['d', 120, 40, 4], ['d', 300, 130, 4]] },
      ],
      fills: [['p', [152, 150, 248, 150, 248, 300, 152, 300], '#e5e7eb'], ['p', [152, 150, 200, 58, 248, 150], '#ef4444'], ['p', [152, 240, 108, 318, 152, 300], '#ef4444'], ['p', [248, 240, 292, 318, 248, 300], '#ef4444'],
        ['c', 200, 200, 26, '#60a5fa'], ['c', 200, 200, 17, '#bae6fd'], ['p', [162, 300, 176, 345, 190, 312, 200, 368, 210, 312, 224, 345, 238, 300], '#f97316'], ['p', [182, 300, 191, 322, 200, 340, 209, 322, 218, 300], '#fde047'],
        ['s', 70, 85, 13, '#fde047'], ['s', 330, 60, 11, '#fde047'], ['s', 60, 250, 10, '#fde047'], ['s', 338, 215, 12, '#fde047']],
    },
  ];
  D.byId = (id) => D.list.find((d) => d.id === id) || null;

  // ---- turn a shape into a polyline so it can be drawn bit by bit (for the animated pencil) ----
  function flatten(sh) {
    const s = sh.slice(); let fill = null; if (typeof s[s.length - 1] === 'string') fill = s.pop();
    let pts = [], dot = 0; const P = (x, y) => pts.push(x, y);
    const arc = (x, y, rx, ry, a0, a1, rot) => { const n = Math.max(8, Math.round(Math.abs(a1 - a0) / 6)); const ro = ((rot || 0) * Math.PI) / 180; for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; const px = Math.cos(a) * rx, py = Math.sin(a) * ry; P(x + px * Math.cos(ro) - py * Math.sin(ro), y + px * Math.sin(ro) + py * Math.cos(ro)); } };
    switch (s[0]) {
      case 'c': arc(s[1], s[2], s[3], s[3], -90, 270); break;
      case 'e': arc(s[1], s[2], s[3], s[4], -90, 270, s[5]); break;
      case 'a': arc(s[1], s[2], s[3], s[4], s[5], s[6]); break;
      case 'l': P(s[1], s[2]); P(s[3], s[4]); break;
      case 'p': pts = s[1].slice(); if (s[2]) pts.push(pts[0], pts[1]); break;
      case 'q': for (let i = 0; i <= 24; i++) { const u = i / 24, v = 1 - u; P(v * v * s[1] + 2 * v * u * s[3] + u * u * s[5], v * v * s[2] + 2 * v * u * s[4] + u * u * s[6]); } break;
      case 'b': for (let i = 0; i <= 32; i++) { const u = i / 32, v = 1 - u; P(v * v * v * s[1] + 3 * v * v * u * s[3] + 3 * v * u * u * s[5] + u * u * u * s[7], v * v * v * s[2] + 3 * v * v * u * s[4] + 3 * v * u * u * s[6] + u * u * u * s[8]); } break;
      case 'd': P(s[1], s[2]); dot = s[3]; break;
      case 's': for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? s[3] * 0.45 : s[3]; P(s[1] + Math.cos(a) * rr, s[2] + Math.sin(a) * rr); } break;
      case 'r': { const [, x, y, w, h, rad] = s; const r = Math.min(rad, w / 2, h / 2); P(x + r, y); [[x + w - r, y + r, -90, 0], [x + w - r, y + h - r, 0, 90], [x + r, y + h - r, 90, 180], [x + r, y + r, 180, 270]].forEach(([cx, cy, a0, a1]) => arc(cx, cy, r, r, a0, a1)); P(x + r, y); break; }
      case 'path': s[1].forEach((part) => { const f = flatten(part); pts = pts.concat(f.pts); }); break;
      default: P(0, 0);
    }
    let total = 0; for (let i = 2; i < pts.length; i += 2) total += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    return { pts, dot, total, fill };
  }
  const cache = new WeakMap();
  D.flat = function (sh) { let f = cache.get(sh); if (!f) { f = flatten(sh); cache.set(sh, f); } return f; };

  window.FL = window.FL || {};
  FL.Drawings = D;
})();
