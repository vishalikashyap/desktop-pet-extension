// Shared pet rig builder used by both content-script.js and popup.js.
// Builds a small articulated SVG per species out of plain shapes (no image assets),
// with named groups that CSS/JS can target for animation.
(function (global) {
  const SPECIES = {
    cat: {
      label: 'Cat',
      body: '#e8a750',
      belly: '#fff3e0',
      ear: 'triangle',
      earFill: '#e8a750',
      innerEarFill: '#f7c98e',
      tail: 'thin',
      tailFill: '#e8a750',
      noseFill: '#a5502f'
    },
    dog: {
      label: 'Dog',
      body: '#c98a4b',
      belly: '#f5e2c8',
      ear: 'floppy',
      earFill: '#8a5a2b',
      innerEarFill: '#c98a4b',
      tail: 'short',
      tailFill: '#c98a4b',
      noseFill: '#3b2416'
    },
    panda: {
      label: 'Panda',
      body: '#fafafa',
      belly: '#ffffff',
      ear: 'round',
      earFill: '#2b2b2b',
      innerEarFill: '#2b2b2b',
      tail: 'round',
      tailFill: '#2b2b2b',
      noseFill: '#2b2b2b',
      eyePatchFill: '#2b2b2b'
    },
    rabbit: {
      label: 'Rabbit',
      body: '#f2ede3',
      belly: '#ffffff',
      ear: 'long',
      earFill: '#f2ede3',
      innerEarFill: '#f7b8c8',
      tail: 'cotton',
      tailFill: '#ffffff',
      noseFill: '#e07a92'
    },
    fox: {
      label: 'Fox',
      body: '#e8672c',
      belly: '#fff3e6',
      ear: 'triangle',
      earFill: '#e8672c',
      innerEarFill: '#2b2b2b',
      tail: 'fluffy',
      tailFill: '#e8672c',
      tailTipFill: '#ffffff',
      noseFill: '#2b2b2b'
    }
  };

  const SVGNS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(node);
    return node;
  }

  function buildEars(head, cfg) {
    const shape = cfg.ear;
    if (shape === 'triangle') {
      el('polygon', { class: 'dp-ear dp-ear-l', points: '68,34 60,4 84,20', fill: cfg.earFill }, head);
      el('polygon', { class: 'dp-ear dp-ear-r', points: '108,20 132,4 124,34', fill: cfg.earFill }, head);
    } else if (shape === 'round') {
      el('circle', { class: 'dp-ear dp-ear-l', cx: 70, cy: 14, r: 14, fill: cfg.earFill }, head);
      el('circle', { class: 'dp-ear dp-ear-r', cx: 122, cy: 14, r: 14, fill: cfg.earFill }, head);
    } else if (shape === 'floppy') {
      el('ellipse', { class: 'dp-ear dp-ear-l', cx: 66, cy: 34, rx: 10, ry: 20, fill: cfg.earFill }, head);
      el('ellipse', { class: 'dp-ear dp-ear-r', cx: 126, cy: 34, rx: 10, ry: 20, fill: cfg.earFill }, head);
    } else if (shape === 'long') {
      el('ellipse', { class: 'dp-ear dp-ear-l', cx: 72, cy: -14, rx: 8, ry: 30, fill: cfg.earFill }, head);
      el('ellipse', { class: 'dp-ear dp-ear-r', cx: 120, cy: -14, rx: 8, ry: 30, fill: cfg.earFill }, head);
      el('ellipse', { cx: 72, cy: -14, rx: 4, ry: 22, fill: cfg.innerEarFill }, head);
      el('ellipse', { cx: 120, cy: -14, rx: 4, ry: 22, fill: cfg.innerEarFill }, head);
    }
    if (shape === 'triangle') {
      el('polygon', { points: '68,28 64,10 78,20', fill: cfg.innerEarFill }, head);
      el('polygon', { points: '114,20 128,10 124,28', fill: cfg.innerEarFill }, head);
    } else if (shape === 'round') {
      el('circle', { cx: 70, cy: 14, r: 7, fill: cfg.innerEarFill }, head);
      el('circle', { cx: 122, cy: 14, r: 7, fill: cfg.innerEarFill }, head);
    } else if (shape === 'floppy') {
      el('ellipse', { cx: 66, cy: 36, rx: 5, ry: 14, fill: cfg.innerEarFill }, head);
      el('ellipse', { cx: 126, cy: 36, rx: 5, ry: 14, fill: cfg.innerEarFill }, head);
    }
  }

  function buildTail(root, cfg) {
    const tail = el('g', { class: 'dp-tail' }, root);
    const shape = cfg.tail;
    if (shape === 'thin') {
      el('path', { d: 'M20,84 Q0,70 8,50', stroke: cfg.tailFill, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, tail);
    } else if (shape === 'short') {
      el('ellipse', { cx: 16, cy: 82, rx: 8, ry: 6, fill: cfg.tailFill }, tail);
    } else if (shape === 'round') {
      el('circle', { cx: 14, cy: 84, r: 9, fill: cfg.tailFill }, tail);
    } else if (shape === 'cotton') {
      el('circle', { cx: 14, cy: 84, r: 8, fill: cfg.tailFill }, tail);
      el('circle', { cx: 14, cy: 84, r: 8, fill: 'none', stroke: '#ddd', 'stroke-width': 1 }, tail);
    } else if (shape === 'fluffy') {
      el('path', { d: 'M22,86 Q-8,80 -4,52 Q-2,38 14,42 Q26,46 20,62 Q30,68 22,86 Z', fill: cfg.tailFill }, tail);
      el('circle', { cx: 8, cy: 46, r: 8, fill: cfg.tailTipFill || '#fff' }, tail);
    }
    return tail;
  }

  function buildPetSVG(species) {
    const cfg = SPECIES[species] || SPECIES.cat;
    const svg = el('svg', {
      class: 'dp-rig',
      viewBox: '0 0 160 120',
      xmlns: SVGNS
    });

    buildTail(svg, cfg);

    el('g', { class: 'dp-leg dp-leg-back' }, svg).appendChild(
      el('rect', { x: 58, y: 88, width: 14, height: 22, rx: 6, fill: cfg.body })
    );
    el('g', { class: 'dp-leg dp-leg-front' }, svg).appendChild(
      el('rect', { x: 96, y: 88, width: 14, height: 22, rx: 6, fill: cfg.body })
    );

    const body = el('g', { class: 'dp-body' }, svg);
    el('ellipse', { cx: 84, cy: 78, rx: 42, ry: 28, fill: cfg.body }, body);
    el('ellipse', { cx: 90, cy: 88, rx: 22, ry: 16, fill: cfg.belly }, body);

    const arm = el('g', { class: 'dp-arm' }, svg);
    el('ellipse', { cx: 118, cy: 70, rx: 8, ry: 14, fill: cfg.body }, arm);

    const head = el('g', { class: 'dp-head' }, svg);
    buildEars(head, cfg);
    el('circle', { cx: 96, cy: 36, r: 30, fill: cfg.body }, head);
    if (cfg.eyePatchFill) {
      el('ellipse', { cx: 84, cy: 34, rx: 9, ry: 11, fill: cfg.eyePatchFill, opacity: 0.85 }, head);
      el('ellipse', { cx: 110, cy: 34, rx: 9, ry: 11, fill: cfg.eyePatchFill, opacity: 0.85 }, head);
    }
    el('ellipse', { cx: 108, cy: 44, rx: 12, ry: 9, fill: cfg.belly || '#fff' }, head);
    el('circle', { class: 'dp-eye dp-eye-l', cx: 86, cy: 32, r: 3.4, fill: '#2b2b2b' }, head);
    el('circle', { class: 'dp-eye dp-eye-r', cx: 104, cy: 30, r: 3.4, fill: '#2b2b2b' }, head);
    el('circle', { cx: 114, cy: 45, r: 3.6, fill: cfg.noseFill }, head);
    el('path', {
      class: 'dp-mouth',
      d: 'M108,49 Q114,54 120,49',
      fill: 'none',
      stroke: '#2b2b2b',
      'stroke-width': 1.6,
      'stroke-linecap': 'round'
    }, head);
    el('path', {
      class: 'dp-smile',
      d: 'M104,48 Q114,58 124,48',
      fill: 'none',
      stroke: '#2b2b2b',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      opacity: 0
    }, head);

    return svg;
  }

  global.DP_PET_RIG = { SPECIES, buildPetSVG };
})(typeof window !== 'undefined' ? window : this);
