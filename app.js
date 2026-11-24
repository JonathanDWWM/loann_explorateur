'use strict';
/* =========================================================
   Loann l'explorateur — exercices ludiques (4-6 ans)
   Tout est dit à voix haute : l'enfant n'a pas besoin de lire.
   ========================================================= */
const NAME = 'Loann';
const ROUND = 5; // questions par partie

/* ---------------- Stockage (sur la tablette uniquement) ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('le_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('le_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
let state = Object.assign({ stars: 0, progress: 0, best: {}, learned: {}, rate: 0.9, album: [] }, store.get('state', {}));
let heroes = store.get('heroes', []); // [{id, name, img}] ajoutés par les parents
const save = () => store.set('state', state);

/* ---------------- Utilitaires ---------------- */
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Affiche un élément : emoji ou image personnelle
const pic = (it) => (it.img ? `<img class="em" src="${it.img}" alt="">` : it.e);
const choice = (html, ok, name) => ({ html, ok, name });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- Voix ---------------- */
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
let frVoice = null, enVoice = null, frVoices = [], enVoices = [];
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  const lg = (v) => (v.lang || '').replace('_', '-');
  frVoices = vs.filter((v) => lg(v).startsWith('fr'));
  enVoices = vs.filter((v) => lg(v).startsWith('en'));
  // Voix choisies par les parents (si elles existent sur cet appareil), sinon choix automatique
  frVoice = frVoices.find((v) => v.name === state.voiceFr) || vs.find((v) => lg(v) === 'fr-FR' && /google|samsung/i.test(v.name)) ||
            vs.find((v) => lg(v).startsWith('fr')) || null;
  enVoice = enVoices.find((v) => v.name === state.voiceEn) || vs.find((v) => lg(v) === 'en-GB' && /google|samsung/i.test(v.name)) || vs.find((v) => lg(v) === 'en-GB') ||
            vs.find((v) => lg(v).startsWith('en')) || null;
}
if (hasTTS) {
  pickVoice();
  speechSynthesis.onvoiceschanged = () => { pickVoice(); if (app && app.querySelector('.parent') && !document.activeElement.matches('input, select')) renderParent(); };
}
// Les morceaux entre [[ ]] sont dits avec la voix anglaise : say('Touche [[red]] !')
function say(text) {
  if (!hasTTS || !text) return;
  speechSynthesis.cancel();
  String(text).split(/\[\[(.+?)\]\]/).forEach((part, i) => {
    part = part.trim();
    if (!part || /^[\s.,;:!?…«»]+$/.test(part)) return;
    const en = i % 2 === 1;
    const u = new SpeechSynthesisUtterance(part);
    u.lang = en ? 'en-GB' : 'fr-FR';
    const v = en ? enVoice : frVoice;
    if (v) u.voice = v;
    u.rate = (state.rate || 0.9) * (en ? 0.9 : 1);
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  });
}

/* ---------------- Sons ---------------- */
let actx = null;
function tone(f, t, d, type, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type || 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + 0.05);
}
function sfx(kind) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    if (kind === 'ok') [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.09, 0.25));
    else if (kind === 'no') tone(200, t, 0.3, 'triangle', 0.15);
    else if (kind === 'win') [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.13, 0.3));
    else if (kind === 'tap') tone(700 + rnd(300), t, 0.1, 'sine', 0.12);
    else if (kind === 'siren') [660, 880, 660, 880].forEach((f, i) => tone(f, t + i * 0.22, 0.22, 'square', 0.06));
  } catch (e) { /* pas de son, pas grave */ }
}

/* =========================================================
   DONNÉES — thème : super-héros, chiots sauveteurs, véhicules
   ========================================================= */
const VEH = [
  { e: '🚒', n: 'camions de pompiers', s: 'le camion de pompiers' },
  { e: '🚓', n: 'voitures de police', s: 'la voiture de police' },
  { e: '🚑', n: 'ambulances', s: "l'ambulance" },
  { e: '🚜', n: 'tracteurs', s: 'le tracteur' },
  { e: '🚚', n: 'camions', s: 'le camion' },
  { e: '🏎️', n: 'voitures de course', s: 'la voiture de course' },
  { e: '🚗', n: 'voitures', s: 'la voiture' },
  { e: '🚌', n: 'bus', s: 'le bus' },
  { e: '🚁', n: 'hélicoptères', s: "l'hélicoptère" },
  { e: '🚀', n: 'fusées', s: 'la fusée' },
  { e: '🏍️', n: 'motos', s: 'la moto' },
  { e: '🚂', n: 'trains', s: 'le train' },
  { e: '✈️', n: 'avions', s: "l'avion" },
  { e: '🏗️', n: 'grues', s: 'la grue' }
];
const HERO_OBJ = [
  { e: '🦸', n: 'super-héros' }, { e: '🕷️', n: 'araignées' }, { e: '🐶', n: 'chiots' },
  { e: '🐕', n: 'chiens' }, { e: '🦴', n: 'os' }, { e: '🛡️', n: 'boucliers' },
  { e: '⚡', n: 'éclairs' }, { e: '⭐', n: 'étoiles' }, { e: '🦖', n: 'dinosaures' },
  { e: '🎈', n: 'ballons' }, { e: '🍎', n: 'pommes' }, { e: '⚽', n: 'ballons de foot' }
];
// Objets à compter : véhicules + héros + images des parents (plus souvent)
function countObj() {
  if (heroes.length && Math.random() < 0.45) { const h = pick(heroes); return { img: h.img, n: h.name }; }
  return Math.random() < 0.55 ? pick(VEH) : pick(HERO_OBJ);
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LNAME = { A: 'a', B: 'bé', C: 'cé', D: 'dé', E: 'e', F: 'èf', G: 'jé', H: 'ache', I: 'i', J: 'ji', K: 'ka', L: 'èl', M: 'èm', N: 'èn', O: 'o', P: 'pé', Q: 'ku', R: 'èr', S: 'èss', T: 'té', U: 'u', V: 'vé', W: 'double vé', X: 'ix', Y: 'i grec', Z: 'zèd' };
const WORDS = {
  A: { w: 'avion', e: '✈️' }, B: { w: 'bus', e: '🚌' }, C: { w: 'camion', e: '🚚' }, D: { w: 'dinosaure', e: '🦖' },
  F: { w: 'fusée', e: '🚀' }, G: { w: 'gâteau', e: '🎂' }, I: { w: 'île', e: '🏝️' }, J: { w: 'jus', e: '🧃' },
  K: { w: 'koala', e: '🐨' }, L: { w: 'lion', e: '🦁' }, M: { w: 'moto', e: '🏍️' }, N: { w: 'nuage', e: '☁️' },
  O: { w: 'os', e: '🦴' }, P: { w: 'pompier', e: '🚒' }, R: { w: 'robot', e: '🤖' }, S: { w: 'soleil', e: '☀️' },
  T: { w: 'tracteur', e: '🚜' }, V: { w: 'voiture', e: '🚗' }, Z: { w: 'zèbre', e: '🦓' }
};
const SPELL = [
  { w: 'LOANN', e: '🦸', label: 'ton prénom' }, { w: 'PAPA', e: '👨', label: 'papa' }, { w: 'MAMAN', e: '👩', label: 'maman' },
  { w: 'BUS', e: '🚌', label: 'bus' }, { w: 'MOTO', e: '🏍️', label: 'moto' }
];
// Mots découpés en syllabes (à l'oral, niveau grande section)
const SYLL = [
  { w: 'chat', s: ['chat'], e: '🐱' }, { w: 'bus', s: ['bus'], e: '🚌' }, { w: 'train', s: ['train'], e: '🚂' },
  { w: 'loup', s: ['loup'], e: '🐺' }, { w: 'chien', s: ['chien'], e: '🐶' }, { w: 'ours', s: ['ours'], e: '🐻' },
  { w: 'camion', s: ['ca', 'mion'], e: '🚚' }, { w: 'moto', s: ['mo', 'to'], e: '🏍️' }, { w: 'robot', s: ['ro', 'bot'], e: '🤖' },
  { w: 'lapin', s: ['la', 'pin'], e: '🐰' }, { w: 'Loann', s: ['Lo', 'ann'], e: '🦸' }, { w: 'fusée', s: ['fu', 'sée'], e: '🚀' },
  { w: 'pompier', s: ['pom', 'pier'], e: '🚒' }, { w: 'vélo', s: ['vé', 'lo'], e: '🚲' },
  { w: 'dinosaure', s: ['di', 'no', 'saure'], e: '🦖' }, { w: 'éléphant', s: ['é', 'lé', 'phant'], e: '🐘' },
  { w: 'ambulance', s: ['am', 'bu', 'lance'], e: '🚑' }, { w: 'crocodile', s: ['cro', 'co', 'dile'], e: '🐊' },
  { w: 'papillon', s: ['pa', 'pi', 'llon'], e: '🦋' }
];

/* ---------------- La famille (saisie par les parents) ---------------- */
let family = store.get('family', []); // [{id, rel, name, img?}]
const REL = {
  papa: { n: 'Papa', e: '👨', lab: 'le prénom de papa', s: 'Papa s’appelle %' },
  maman: { n: 'Maman', e: '👩', lab: 'le prénom de maman', s: 'Maman s’appelle %' },
  frere: { n: 'Frère', e: '👦', lab: 'le prénom de ton frère', s: 'Ton frère s’appelle %' },
  soeur: { n: 'Sœur', e: '👧', lab: 'le prénom de ta sœur', s: 'Ta sœur s’appelle %' },
  papi: { n: 'Papi', e: '👴', lab: 'le prénom de papi', s: 'Papi s’appelle %' },
  mamie: { n: 'Mamie', e: '👵', lab: 'le prénom de mamie', s: 'Mamie s’appelle %' },
  tonton: { n: 'Tonton', e: '🧔', lab: 'le prénom de tonton', s: 'Tonton s’appelle %' },
  tata: { n: 'Tata', e: '👩‍🦰', lab: 'le prénom de tata', s: 'Tata s’appelle %' },
  cousin: { n: 'Cousin / cousine', e: '🧒', lab: 'le prénom de ton cousin', s: 'Ton cousin s’appelle %' },
  ami: { n: 'Copain / copine', e: '🧒', lab: 'le prénom de ton copain', s: 'Ton copain s’appelle %' },
  animal: { n: 'Animal', e: '🐾', lab: 'le nom de ton animal', s: 'Ton animal s’appelle %' },
  nom: { n: 'Nom de famille', e: '🏠', lab: 'ton nom de famille', s: 'Ton nom de famille, c’est %' }
};
// Pour écrire : majuscules sans accents ni tirets (Léa-Rose -> LEAROSE)
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/Œ/g, 'OE').replace(/Æ/g, 'AE').replace(/[^A-Z]/g, '');
const famPic = (f) => (f && f.img ? `<img class="em" src="${f.img}" alt="">` : f ? REL[f.rel].e : '');
// Les mots « de la famille » à lire et à écrire : son prénom + ceux saisis par les parents
function famWords() {
  const list = [{ w: norm(NAME), label: 'ton prénom', who: `Toi, tu t’appelles ${NAME}`, said: NAME, pic: '🦸', rel: 'moi' }];
  family.forEach((f) => {
    const r = REL[f.rel] || REL.ami, w = norm(f.name);
    if (w.length >= 2 && !list.some((x) => x.w === w)) list.push({ w, label: r.lab, who: r.s.replace('%', f.name), said: f.name, pic: famPic(f), rel: f.rel });
  });
  if (list.length < 3) {
    [{ w: 'PAPA', label: 'le mot papa', who: 'Papa', said: 'papa', pic: '👨', rel: 'papa' }, { w: 'MAMAN', label: 'le mot maman', who: 'Maman', said: 'maman', pic: '👩', rel: 'maman' }]
      .forEach((x) => { if (list.length < 3 && !list.some((y) => y.rel === x.rel)) list.push(x); });
  }
  return list;
}
const FILLER = ['LEO', 'EMMA', 'JULES', 'LINA', 'HUGO', 'ROSE', 'TOM', 'MIA', 'PAUL', 'NINA', 'ADAM', 'JADE', 'SACHA', 'ZOE'];

/* ---------------- English ! (les mots entre [[ ]] sont dits en anglais) ---------------- */
const EN_COLORS = { rouge: 'red', bleu: 'blue', jaune: 'yellow', vert: 'green', orange: 'orange', violet: 'purple', rose: 'pink', marron: 'brown', noir: 'black', blanc: 'white', gris: 'grey' };
const EN_NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const EN_ANIMALS = [
  { en: 'cat', fr: 'le chat', e: '🐱' }, { en: 'dog', fr: 'le chien', e: '🐶' }, { en: 'cow', fr: 'la vache', e: '🐄' },
  { en: 'pig', fr: 'le cochon', e: '🐷' }, { en: 'duck', fr: 'le canard', e: '🦆' }, { en: 'horse', fr: 'le cheval', e: '🐴' },
  { en: 'lion', fr: 'le lion', e: '🦁' }, { en: 'fish', fr: 'le poisson', e: '🐟' }, { en: 'bird', fr: 'l’oiseau', e: '🐦' },
  { en: 'monkey', fr: 'le singe', e: '🐵' }, { en: 'rabbit', fr: 'le lapin', e: '🐰' }, { en: 'elephant', fr: 'l’éléphant', e: '🐘' }
];
const EN_FAMILY = [
  { en: 'mummy', fr: 'maman', e: '👩', rel: 'maman' }, { en: 'daddy', fr: 'papa', e: '👨', rel: 'papa' },
  { en: 'baby', fr: 'le bébé', e: '👶' }, { en: 'grandma', fr: 'mamie', e: '👵', rel: 'mamie' },
  { en: 'grandpa', fr: 'papi', e: '👴', rel: 'papi' }, { en: 'brother', fr: 'le frère', e: '👦', rel: 'frere' },
  { en: 'sister', fr: 'la sœur', e: '👧', rel: 'soeur' }
];
const EN_VEH = [
  { en: 'car', fr: 'la voiture', e: '🚗' }, { en: 'bus', fr: 'le bus', e: '🚌' }, { en: 'train', fr: 'le train', e: '🚂' },
  { en: 'plane', fr: 'l’avion', e: '✈️' }, { en: 'boat', fr: 'le bateau', e: '⛵' }, { en: 'bike', fr: 'le vélo', e: '🚲' },
  { en: 'fire engine', fr: 'le camion de pompiers', e: '🚒' }, { en: 'police car', fr: 'la voiture de police', e: '🚓' },
  { en: 'rocket', fr: 'la fusée', e: '🚀' }, { en: 'helicopter', fr: 'l’hélicoptère', e: '🚁' }
];
const EN_BODY = [
  { en: 'eyes', fr: 'les yeux', e: '👀' }, { en: 'nose', fr: 'le nez', e: '👃' }, { en: 'mouth', fr: 'la bouche', e: '👄' },
  { en: 'ears', fr: 'les oreilles', e: '👂' }, { en: 'hand', fr: 'la main', e: '✋' }, { en: 'foot', fr: 'le pied', e: '🦶' },
  { en: 'teeth', fr: 'les dents', e: '🦷' }, { en: 'leg', fr: 'la jambe', e: '🦵' }
];
const EN_PRAISE = ['[[Well done!]]', '[[Great!]]', '[[Super!]]', '[[Yes!]] Bravo !', '[[Good job!]]', '[[Brilliant!]]'];

const COLORS = [
  { n: 'rouge', f: 'rouge', c: '#e53935' }, { n: 'bleu', f: 'bleue', c: '#1e88e5' }, { n: 'jaune', f: 'jaune', c: '#fdd835' },
  { n: 'vert', f: 'verte', c: '#43a047' }, { n: 'orange', f: 'orange', c: '#fb8c00' }, { n: 'violet', f: 'violette', c: '#8e24aa' },
  { n: 'rose', f: 'rose', c: '#f48fb1' }, { n: 'marron', f: 'marron', c: '#795548' }, { n: 'noir', f: 'noire', c: '#212121' },
  { n: 'blanc', f: 'blanche', c: '#ffffff' }, { n: 'gris', f: 'grise', c: '#9e9e9e' }
];
const colorByName = (n) => COLORS.find((x) => x.n === n);
const SHAPES = [
  { id: 'rond', n: 'le rond' }, { id: 'carre', n: 'le carré' }, { id: 'triangle', n: 'le triangle' },
  { id: 'etoile', n: "l'étoile", fem: true }, { id: 'coeur', n: 'le cœur' }, { id: 'rectangle', n: 'le rectangle' },
  { id: 'losange', n: 'le losange' }
];
function starPoints() {
  const p = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 20 : 46, a = (Math.PI / 5) * i - Math.PI / 2; p.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (53 + r * Math.sin(a)).toFixed(1)); }
  return p.join(' ');
}
const SHAPE_SVG = {
  rond: '<circle cx="50" cy="50" r="42"/>',
  carre: '<rect x="10" y="10" width="80" height="80" rx="6"/>',
  triangle: '<polygon points="50,8 94,90 6,90"/>',
  etoile: `<polygon points="${starPoints()}"/>`,
  coeur: '<path d="M50 88 C20 66 4 46 16 26 C28 8 46 14 50 30 C54 14 72 8 84 26 C96 46 80 66 50 88Z"/>',
  rectangle: '<rect x="4" y="26" width="92" height="48" rx="5"/>',
  losange: '<polygon points="50,4 92,50 50,96 8,50"/>'
};
const shape = (id, color) => `<svg class="shape" viewBox="0 0 100 100"><g fill="${color}" stroke="#2b2d42" stroke-width="3" stroke-linejoin="round">${SHAPE_SVG[id]}</g></svg>`;

const ANIMALS = [
  { e: '🐱', n: 'le chat', h: 'ferme' }, { e: '🐄', n: 'la vache', h: 'ferme' }, { e: '🐷', n: 'le cochon', h: 'ferme' },
  { e: '🐔', n: 'la poule', h: 'ferme' }, { e: '🐑', n: 'le mouton', h: 'ferme' }, { e: '🐴', n: 'le cheval', h: 'ferme' },
  { e: '🦁', n: 'le lion', h: 'savane' }, { e: '🐘', n: "l'éléphant", h: 'savane' }, { e: '🦒', n: 'la girafe', h: 'savane' },
  { e: '🦓', n: 'le zèbre', h: 'savane' }, { e: '🐒', n: 'le singe', h: 'savane' }, { e: '🐊', n: 'le crocodile', h: 'savane' },
  { e: '🐟', n: 'le poisson', h: 'mer' }, { e: '🐬', n: 'le dauphin', h: 'mer' }, { e: '🐙', n: 'la pieuvre', h: 'mer' },
  { e: '🦈', n: 'le requin', h: 'mer' }, { e: '🐳', n: 'la baleine', h: 'mer' }, { e: '🦀', n: 'le crabe', h: 'mer' },
  { e: '🦊', n: 'le renard', h: 'foret' }, { e: '🦉', n: 'le hibou', h: 'foret' }, { e: '🐻', n: "l'ours", h: 'foret' },
  { e: '🦔', n: 'le hérisson', h: 'foret' }, { e: '🐿️', n: "l'écureuil", h: 'foret' }, { e: '🐺', n: 'le loup', h: 'foret' },
  { e: '🐌', n: "l'escargot", h: 'jardin' }, { e: '🦋', n: 'le papillon', h: 'jardin' }, { e: '🐝', n: "l'abeille", h: 'jardin' },
  { e: '🐞', n: 'la coccinelle', h: 'jardin' }, { e: '🐛', n: 'la chenille', h: 'jardin' }
];
const HAB = {
  ferme: { l: 'à la ferme', e: '🚜' }, savane: { l: 'dans la savane', e: '🌴' }, mer: { l: 'dans la mer', e: '🌊' },
  foret: { l: 'dans la forêt', e: '🌲' }, jardin: { l: 'dans le jardin', e: '🌷' }
};

// q = question, a = l'explication dite pendant la leçon et quand il se trompe
const VIE = [
  { q: 'Qui éteint le feu ?', ok: '🚒', no: ['🚜', '🚌'], show: '🔥', a: 'Le camion de pompiers éteint le feu.' },
  { q: 'Qui emmène les blessés à l’hôpital ?', ok: '🚑', no: ['🏎️', '🚜'], a: 'L’ambulance emmène les blessés à l’hôpital.' },
  { q: 'Qui attrape les voleurs ?', ok: '🚓', no: ['🚑', '🚌'], a: 'La voiture de police attrape les voleurs.' },
  { q: 'Qui travaille dans les champs ?', ok: '🚜', no: ['🚓', '🚁'], a: 'Le tracteur travaille dans les champs.' },
  { q: 'Qu’est-ce qui roule sur les rails ?', ok: '🚂', no: ['✈️', '🚤'], a: 'Le train roule sur les rails.' },
  { q: 'Qu’est-ce qui vole dans le ciel ?', ok: '🚁', no: ['🚗', '🚂'], a: 'L’hélicoptère vole dans le ciel.' },
  { q: 'Qu’est-ce qui va sur l’eau ?', ok: '🚤', no: ['🚜', '🚲'], a: 'Le bateau va sur l’eau.' },
  { q: 'Qu’est-ce qui soulève les choses très lourdes ?', ok: '🏗️', no: ['🚲', '🛴'], a: 'La grue soulève les choses très lourdes.' },
  { q: 'Avec quoi je me brosse les dents ?', ok: '🪥', no: ['🍴', '✏️'], a: 'Je me brosse les dents avec la brosse à dents.' },
  { q: 'Avec quoi j’écris ?', ok: '✏️', no: ['🥄', '🧦'], a: 'J’écris avec un crayon.' },
  { q: 'Avec quoi je mange ma soupe ?', ok: '🥄', no: ['✂️', '🧢'], a: 'Je mange ma soupe avec une cuillère.' },
  { q: 'Qu’est-ce que je prends quand il pleut ?', ok: '☂️', no: ['🕶️', '⚽'], show: '🌧️', a: 'Quand il pleut, je prends un parapluie.' },
  { q: 'Qu’est-ce que je mets à mes pieds ?', ok: '👟', no: ['🧤', '🧢'], a: 'Je mets mes chaussures à mes pieds.' },
  { q: 'Avec quoi je coupe le papier ?', ok: '✂️', no: ['🥄', '🪥'], a: 'Je coupe le papier avec des ciseaux.' },
  { q: 'Où est-ce que je dors ?', ok: '🛏️', no: ['🛁', '🚗'], a: 'Je dors dans mon lit.' },
  { q: 'Qu’est-ce qui est froid ?', ok: '🧊', no: ['🔥', '☕'], a: 'Le glaçon est très froid.' },
  { q: 'Qu’est-ce qui est chaud ?', ok: '🔥', no: ['🧊', '⛄'], a: 'Le feu est chaud. Attention, ça brûle !' }
];
const CORPS = [
  { q: 'Avec quoi je regarde ?', ok: '👀', no: ['👂', '🦶'], a: 'Je regarde avec mes yeux.' },
  { q: 'Avec quoi j’écoute la musique ?', ok: '👂', no: ['👃', '✋'], a: 'J’écoute avec mes oreilles.' },
  { q: 'Avec quoi je sens les fleurs ?', ok: '👃', no: ['👀', '🦶'], a: 'Je sens les fleurs avec mon nez.' },
  { q: 'Avec quoi je marche ?', ok: '🦶', no: ['👂', '👃'], a: 'Je marche avec mes pieds.' },
  { q: 'Avec quoi j’attrape le ballon ?', ok: '✋', no: ['👃', '👂'], a: 'J’attrape le ballon avec mes mains.' },
  { q: 'Avec quoi je croque une pomme ?', ok: '🦷', no: ['👂', '✋'], a: 'Je croque une pomme avec mes dents.' },
  { q: 'Avec quoi je réfléchis, comme un super-héros ?', ok: '🧠', no: ['🦶', '👂'], a: 'Je réfléchis avec mon cerveau, dans ma tête.' },
  { q: 'Qu’est-ce qui fait boum boum dans ma poitrine ?', ok: '❤️', no: ['⭐', '🍎'], a: 'C’est mon cœur qui fait boum boum.' },
  { q: 'Qu’est-ce qui rend les muscles forts ?', ok: '🥦', no: ['🍭', '🍩'], a: 'Les légumes, comme le brocoli, rendent les muscles forts.' }
];
const COMPARE = [
  { q: 'Lequel est le plus lourd ?', ok: '🐘', no: ['🐭', '🐦'], a: 'L’éléphant est le plus lourd.' },
  { q: 'Lequel va le plus vite ?', ok: '🚀', no: ['🐢', '🚲'], a: 'La fusée va le plus vite.' },
  { q: 'Lequel est le plus lent ?', ok: '🐌', no: ['🏎️', '✈️'], a: 'L’escargot est le plus lent.' },
  { q: 'Lequel est le plus grand ?', ok: '🦒', no: ['🐰', '🐱'], a: 'La girafe est la plus grande.' },
  { q: 'Lequel est le plus petit ?', ok: '🐜', no: ['🐻', '🚚'], a: 'La fourmi est la plus petite.' },
  { q: 'Lequel peut voler ?', ok: '🚁', no: ['🚜', '🚂'], a: 'L’hélicoptère peut voler.' },
  { q: 'Lequel vit dans l’eau ?', ok: '🐟', no: ['🐔', '🐶'], a: 'Le poisson vit dans l’eau.' },
  { q: 'Lequel est le plus léger ?', ok: '🪶', no: ['🪨', '🚚'], a: 'La plume est la plus légère.' },
  { q: 'Lequel est le plus chaud ?', ok: '☀️', no: ['🌙', '⛄'], a: 'Le soleil est le plus chaud.' },
  { q: 'Lequel transporte le plus de personnes ?', ok: '🚌', no: ['🏍️', '🚲'], a: 'Le bus transporte le plus de personnes.' }
];
const SAVANT = [
  { q: 'Que devient la chenille quand elle grandit ?', ok: '🦋', no: ['🐝', '🐞'], show: '🐛', a: 'La chenille devient un papillon.' },
  { q: 'Qui nous donne le lait ?', ok: '🐄', no: ['🐔', '🐷'], show: '🥛', a: 'La vache nous donne le lait.' },
  { q: 'Qui fabrique le miel ?', ok: '🐝', no: ['🦋', '🐜'], show: '🍯', a: 'L’abeille fabrique le miel.' },
  { q: 'Qui pond des œufs ?', ok: '🐔', no: ['🐄', '🐶'], show: '🥚', a: 'La poule pond des œufs.' },
  { q: 'Quel est le bébé de la poule ?', ok: '🐣', no: ['🐶', '🐟'], show: '🐔', a: 'Le bébé de la poule, c’est le poussin.' },
  { q: 'Qu’est-ce qui brille dans le ciel la journée ?', ok: '☀️', no: ['🌙', '⭐'], a: 'Le soleil brille la journée.' },
  { q: 'Qu’est-ce qu’on voit dans le ciel la nuit ?', ok: '🌙', no: ['☀️', '🌈'], a: 'La nuit, on voit la lune.' },
  { q: 'Où est la Terre, notre planète ?', ok: '🌍', no: ['🌙', '☀️'], a: 'Voici la Terre, notre planète. Elle est bleue et verte.' },
  { q: 'Avec quoi les astronautes vont dans l’espace ?', ok: '🚀', no: ['🚂', '🚗'], a: 'Les astronautes vont dans l’espace en fusée.' },
  { q: 'Qu’est-ce qui fond quand il fait chaud ?', ok: '⛄', no: ['🪨', '🌳'], a: 'Le bonhomme de neige fond quand il fait chaud.' },
  { q: 'Qu’est-ce qui pousse dans un pommier ?', ok: '🍎', no: ['🍌', '🥕'], a: 'Dans un pommier poussent des pommes.' },
  { q: 'De quoi la plante a besoin pour boire ?', ok: '💧', no: ['🔥', '🧱'], show: '🌱', a: 'La plante boit de l’eau.' },
  { q: 'Qu’est-ce qu’on voit avec la pluie et le soleil ?', ok: '🌈', no: ['⛄', '🌙'], a: 'Avec la pluie et le soleil, on voit un arc-en-ciel.' },
  { q: 'Qu’est-ce qui avance avec de l’essence ?', ok: '🚗', no: ['🚲', '🐴'], show: '⛽', a: 'La voiture avance avec de l’essence.' }
];
const CATS = [
  { n: 'des véhicules', l: ['🚗', '🚌', '🚒', '🚜', '🚂', '✈️', '🚑', '🚓'] },
  { n: 'des animaux', l: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸'] },
  { n: 'des fruits', l: ['🍎', '🍌', '🍓', '🍇', '🍐', '🍊', '🍒', '🍉'] },
  { n: 'des vêtements', l: ['👕', '👖', '🧦', '🧢', '🧤', '👟', '🧣'] },
  { n: 'des ballons', l: ['⚽', '🏀', '🏈', '🎾', '🏐'] },
  { n: 'des plantes', l: ['🌸', '🌻', '🌳', '🌵', '🍄', '🌷'] }
];
const PAT_POOL = ['🔴', '🔵', '🟡', '🟢', '⭐', '🌙', '🚒', '🚓', '🐶', '🦸', '🕷️', '⚡', '🚗', '🚀'];
const MEM_SETS = [
  ['🚒', '🚓', '🚑', '🚜', '🚚', '🏎️', '🚌', '🚁'],
  ['🦸', '🦹', '🕷️', '🐶', '🐕', '🦴', '🛡️', '⚡'],
  ['🦖', '🦕', '🐊', '🐢', '🦎', '🐍', '🐉', '🦭'],
  ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸']
];
const STICKERS = [
  { e: '🚒', n: 'le camion de pompiers' }, { e: '🚓', n: 'la voiture de police' }, { e: '🚑', n: "l'ambulance" },
  { e: '🚜', n: 'le tracteur' }, { e: '🏎️', n: 'la voiture de course' }, { e: '🚁', n: "l'hélicoptère" },
  { e: '🚀', n: 'la fusée' }, { e: '🏍️', n: 'la moto' }, { e: '🚂', n: 'le train' }, { e: '🏗️', n: 'la grue' },
  { e: '🦸', n: 'le super-héros' }, { e: '🦹', n: 'le méchant' }, { e: '🕷️', n: "l'araignée" }, { e: '🕸️', n: 'la toile' },
  { e: '🛡️', n: 'le bouclier' }, { e: '⚡', n: "l'éclair" }, { e: '💪', n: 'les muscles' }, { e: '🐶', n: 'le chiot' },
  { e: '🐕', n: 'le chien' }, { e: '🦴', n: "l'os" }, { e: '🏅', n: 'la médaille' }, { e: '🏆', n: 'la coupe' },
  { e: '🦖', n: 'le dinosaure' }, { e: '🦁', n: 'le lion' }, { e: '🐉', n: 'le dragon' }, { e: '🌈', n: "l'arc-en-ciel" },
  { e: '🪐', n: 'la planète' }, { e: '🤖', n: 'le robot' }, { e: '🛸', n: 'la soucoupe volante' }, { e: '👑', n: 'la couronne' }
];

/* =========================================================
   GÉNÉRATEURS DE QUESTIONS
   ========================================================= */
function near(n, lo, hi, k) {
  const pool = [];
  for (let v = Math.max(lo, n - 3); v <= Math.min(hi, n + 3); v++) if (v !== n) pool.push(v);
  let res = sample(pool, k - 1);
  if (res.length < k - 1) {
    const all = [];
    for (let v = lo; v <= hi; v++) if (v !== n && !res.includes(v)) all.push(v);
    res = res.concat(sample(all, k - 1 - res.length));
  }
  return shuffle([n, ...res]);
}
function numChoices(n, lo, hi, k, dots) {
  return near(n, lo, hi, k).map((v) => choice(
    `<span class="num">${v}</span>${dots ? `<span class="dots">${'●'.repeat(v)}</span>` : ''}`, v === n, String(v)));
}
// Objets rangés par lignes de 5 (plus facile à compter)
function rowsOf(it, n, cls, goneFrom) {
  let h = '<div class="objs">';
  for (let r = 0; r < n; r += 5) {
    h += '<div class="row">';
    for (let i = r; i < Math.min(n, r + 5); i++) {
      const gone = goneFrom !== undefined && i >= goneFrom ? ' gone' : '';
      h += `<span class="o ${cls || ''}${gone}" style="animation-delay:${i * 70}ms">${pic(it)}</span>`;
    }
    h += '</div>';
  }
  return h + '</div>';
}
const big = (e) => `<div class="bigicon">${e}</div>`;
const emo = (e) => `<span class="emo">${e}</span>`;
function qaGen(list) {
  return () => {
    const it = pick(list);
    return { say: it.q, show: it.show ? big(it.show) : '', choices: shuffle([choice(emo(it.ok), true), ...it.no.map((e) => choice(emo(e), false))]),
      okSay: 'Bravo ! ' + it.a, teach: it.a + ' C’est celui qui brille !' };
  };
}
function patternQ(units) {
  const pool = sample(PAT_POOL, 3);
  const unit = pick(units);
  const len = unit.length * 2 + rnd(unit.length);
  const seq = [];
  for (let i = 0; i < len; i++) seq.push(pool[unit[i % unit.length]]);
  const ans = pool[unit[len % unit.length]];
  return {
    say: 'Mission logique ! Qu’est-ce qui vient après ? Regarde bien la suite.',
    show: `<div class="seq">${seq.map((e) => `<span>${e}</span>`).join('')}<span class="miss">?</span></div>`,
    choices: shuffle(pool).map((e) => choice(emo(e), e === ans))
  };
}
// Anglais : on entend le mot anglais, on touche la bonne image
function enQ(list, k, visual) {
  const opts = sample(list, k), t = pick(opts), vis = visual || ((x) => emo(x.e));
  return { key: t.en, say: `Où est [[${t.en}]] ? Touche [[${t.en}]] !`, show: big('🇬🇧'),
    choices: opts.map((x) => choice(vis(x), x === t, `[[${x.en}]], ${x.fr}`)),
    okSay: `${pick(EN_PRAISE)} [[${t.en}]], c’est ${t.fr} !`,
    hint: `Écoute bien : [[${t.en}]].`, teach: `[[${t.en}]], c’est ${t.fr} en français ! C’est celui qui brille.` };
}
const enColorList = (n) => COLORS.slice(0, n).map((c) => ({ en: EN_COLORS[c.n], fr: 'le ' + c.n, c: c.c }));
const enNumList = (a, b) => range(a, b).map((n) => ({ en: EN_NUM[n], fr: String(n), n }));
const enColorVis = (x) => shape('rond', x.c);
const enNumVis = (x) => `<span class="num">${x.n}</span>`;
// Pour « daddy » ou « mummy », on montre la photo de papa ou maman si les parents l'ont ajoutée
const enFamVis = (x) => { const f = x.rel && family.find((y) => y.rel === x.rel && y.img); return f ? emo(famPic(f)) : emo(x.e); };
// Écrire un mot de la famille
function spellQ(it, nomodel) {
  return { type: 'spell', word: it.w, emoji: it.pic, label: it.label, nomodel, key: it.w + (nomodel ? '-' : ''),
    say: nomodel ? `Écris ${it.label} tout seul ! Regarde bien, je vais le cacher.` : `Écris ${it.label} : ${it.said} ! Touche les lettres dans l’ordre.` };
}

/* ---------------- Modules (mondes) ---------------- */
const MODULES = [
  {
    id: 'nombres', title: 'Les nombres', icon: '🔢', color: '#ff7043',
    levels: [
      { name: 'Compter jusqu’à 5', gen() { const o = countObj(), n = 1 + rnd(5); return { key: o.n + n, say: `Combien y a-t-il de ${o.n} ? Touche-les pour compter !`, show: rowsOf(o, n, 'tap'), choices: numChoices(n, 1, 5, 3, true), help: 'count', n, teach: `Il y en a ${n} ! Trouve le ${n}.` }; } },
      { name: 'Compter jusqu’à 10', gen() { const o = countObj(), n = 3 + rnd(8); return { key: o.n + n, say: `Combien y a-t-il de ${o.n} ?`, show: rowsOf(o, n, 'tap'), choices: numChoices(n, 1, 10, 3, false), help: 'count', n, teach: `Il y en a ${n} ! Trouve le ${n}.` }; } },
      { name: 'Reconnaître les nombres', gen() { const n = rnd(11); return { say: `Trouve le nombre ${n} !`, show: big('🔍'), choices: numChoices(n, 0, 10, 4, false), teach: `Le ${n}, c’est celui qui brille ! Regarde bien sa forme.` }; } },
      { name: 'Additions', gen() { const o = countObj(), a = 1 + rnd(3), b = 1 + rnd(3); return { key: '' + a + b, say: `On met ensemble ! Compte tous les ${o.n}. Combien ça fait en tout ?`, show: `<div class="sum">${rowsOf(o, a, 'tap')}<span class="op">+</span>${rowsOf(o, b, 'tap')}</div>`, choices: numChoices(a + b, 1, 8, 3, false), help: 'count', n: a + b, teach: `En tout, il y en a ${a + b} ! Trouve le ${a + b}.` }; } },
      { name: 'Le plus et le moins', gen() {
        const o = countObj(); const a = 1 + rnd(9); let b; do { b = 1 + rnd(9); } while (b === a);
        const more = Math.random() < 0.6; const okA = more ? a > b : a < b;
        return { key: '' + a + b, say: more ? `Où y a-t-il le plus de ${o.n} ?` : `Où y a-t-il le moins de ${o.n} ?`, show: '',
          choices: [choice(rowsOf(o, a, 'sm'), okA), choice(rowsOf(o, b, 'sm'), !okA)], hint: 'Compte chaque groupe !',
          teach: `Ici il y en a ${a}, et là il y en a ${b}. ${more ? 'Le plus' : 'Le moins'}, c’est celui qui brille !` }; } },
      { name: 'Compter jusqu’à 15', gen() { const o = countObj(), n = 8 + rnd(8); return { key: o.n + n, say: `Grand défi ! Combien y a-t-il de ${o.n} ?`, show: rowsOf(o, n, 'tap'), choices: numChoices(n, 5, 15, 3, false), help: 'count', n, teach: `Il y en a ${n} ! Trouve le ${n}.` }; } },
      { name: 'Enlever', gen() {
        const o = countObj(), a = 3 + rnd(4), b = 1 + rnd(a - 1);
        return { key: '' + a + b, say: `Il y avait ${a} ${o.n}. On en enlève ${b} : ${b === 1 ? 'il devient tout gris' : 'ils deviennent tout gris'}. Combien en reste-t-il ?`, show: rowsOf(o, a, '', a - b), choices: numChoices(a - b, 0, 6, 3, false),
          help: 'count', n: a - b, teach: `Il en reste ${a - b} ! Trouve le ${a - b}.` }; } },
      { name: 'Autant que', gen() {
        const o = countObj(), n = 2 + rnd(5), dot = { e: '🔵' };
        const counts = shuffle([n, ...sample([n - 2, n - 1, n + 1, n + 2].filter((v) => v >= 1), 2)]);
        return { key: o.n + n, say: `Compte les ${o.n}. Trouve le groupe de ronds où il y en a autant : pas plus, pas moins !`, show: rowsOf(o, n, 'tap'),
          choices: counts.map((v) => choice(rowsOf(dot, v, 'sm'), v === n)), help: 'count', n, teach: `Il y a ${n} ${o.n}. Le groupe avec ${n} ronds, c’est celui qui brille !` }; } }
    ]
  },
  {
    id: 'lettres', title: 'Les lettres', icon: '🔤', color: '#7c4dff',
    levels: [
      { name: 'Les lettres de LOANN', gen() {
        const t = pick(['L', 'O', 'A', 'N']); const others = sample(LETTERS.filter((l) => !'LOAN'.includes(l)), 2);
        return { say: `Trouve la lettre ${LNAME[t]} ! ${t === 'L' ? 'Comme Loann !' : 'Elle est dans ton prénom.'}`,
          show: `<div class="name">${'LOANN'.split('').map((l) => `<span class="${l === t ? 'hl' : ''}">${l}</span>`).join('')}</div>`,
          choices: shuffle([t, ...others]).map((l) => choice(`<span class="letter">${l}</span>`, l === t, 'la lettre ' + LNAME[l])),
          hint: 'Regarde ton prénom en haut : la lettre orange !', teach: `C’est celle qui brille : la lettre ${LNAME[t]}, comme dans ton prénom !` }; } },
      { name: 'Les voyelles', gen() {
        const t = pick(['A', 'E', 'I', 'O', 'U']); const others = sample(['A', 'E', 'I', 'O', 'U'].filter((l) => l !== t), 2);
        return { say: `Trouve la lettre ${LNAME[t]} !`, show: big('🔍'), choices: shuffle([t, ...others]).map((l) => choice(`<span class="letter">${l}</span>`, l === t, 'la lettre ' + LNAME[l])) }; } },
      { name: 'Toutes les lettres', gen() {
        const t = pick(Object.keys(WORDS)); const w = WORDS[t]; const others = sample(LETTERS.filter((l) => l !== t), 3);
        return { say: `Trouve la lettre ${LNAME[t]}, comme ${w.w} !`, show: big(w.e), choices: shuffle([t, ...others]).map((l) => choice(`<span class="letter">${l}</span>`, l === t, 'la lettre ' + LNAME[l])) }; } },
      { name: 'Le premier son', gen() {
        const t = pick(Object.keys(WORDS)); const w = WORDS[t]; const others = sample(Object.keys(WORDS).filter((l) => l !== t), 2);
        return { say: `${w.w} ! Par quelle lettre commence le mot ${w.w} ?`, show: big(w.e), choices: shuffle([t, ...others]).map((l) => choice(`<span class="letter">${l}</span>`, l === t, 'la lettre ' + LNAME[l])), okSay: `Bravo ! ${w.w} commence par ${LNAME[t]} !` }; } },
      { name: 'Majuscules et minuscules', gen() {
        const t = pick(LETTERS.filter((l) => !'WXYQK'.includes(l))); const others = sample(LETTERS.filter((l) => l !== t), 3);
        return { say: `Voici la lettre ${LNAME[t]} en grand. Trouve la même en petit !`, show: `<div class="letter huge">${t}</div>`,
          choices: shuffle([t, ...others]).map((l) => choice(`<span class="letter lower">${l.toLowerCase()}</span>`, l === t, 'la lettre ' + LNAME[l])) }; } },
      { name: 'Taper les syllabes', gen() {
        const w = pick(SYLL), n = w.s.length;
        return { key: w.w, say: `${cap(w.w)}. Tape dans tes mains en disant le mot. Combien de syllabes ?`, show: big(w.e),
          choices: [1, 2, 3].map((k) => choice(`<span class="num">${k}</span><span class="claps">${'👏'.repeat(k)}</span>`, k === n, String(k))),
          okSay: `Bravo ! ${w.s.join(' ! ')} ! Ça fait ${n} ${n > 1 ? 'syllabes' : 'syllabe'} !`,
          hint: `Écoute bien : ${w.s.join('... ')}.`, teach: `${w.s.join('... ')}. On tape ${n} ${n > 1 ? 'fois' : 'fois'} : ${n} ${n > 1 ? 'syllabes' : 'syllabe'} !` }; } },
      { name: 'Écrire mon prénom', gen() {
        const s = Math.random() < 0.6 ? SPELL[0] : pick(SPELL);
        return { type: 'spell', word: s.w, emoji: s.e, label: s.label, say: `Écris ${s.label} ! Touche les lettres dans l’ordre.` }; } },
      { name: 'Les prénoms de ma famille', gen() {
        const fam = famWords(), t = pick(fam), first = t.w[0];
        const pool = [...fam.filter((x) => x.w !== t.w && x.rel !== t.rel).map((x) => x.w), ...shuffle(FILLER)].filter((w) => w !== t.w);
        const others = [];
        pool.forEach((w) => { if (others.length < 2 && w[0] !== first && !others.includes(w)) others.push(w); });
        return { key: t.w, say: `${t.who}. Trouve ${t.label} ! Il commence par la lettre ${LNAME[first]}.`, show: big(t.pic),
          choices: shuffle([t.w, ...others]).map((w) => choice(`<span class="word">${esc(w)}</span>`, w === t.w, `${w.toLowerCase()}. Il commence par ${LNAME[w[0]]}`)),
          hint: `Cherche le mot qui commence par la lettre ${LNAME[first]}.`,
          teach: `${cap(t.said)} commence par la lettre ${LNAME[first]}. C’est celui qui brille !`, okSay: `Bravo ! C’est écrit ${t.said} !` }; } },
      { name: 'Écrire les prénoms de la famille', gen() {
        const fam = famWords(), others = fam.slice(1);
        return spellQ(others.length && Math.random() < 0.8 ? pick(others) : fam[0]); } },
      { name: 'Écrire mon prénom tout seul', gen() {
        const fam = famWords();
        return spellQ(Math.random() < 0.6 ? fam[0] : pick(fam), true); } }
    ]
  },
  {
    id: 'anglais', title: 'English', icon: '🇬🇧', color: '#1e88e5',
    levels: [
      { name: 'Hello ! Les couleurs', gen() { return enQ(enColorList(4), 3, enColorVis); } },
      { name: 'Compter en anglais', gen() { return enQ(enNumList(1, 5), 3, enNumVis); } },
      { name: 'Les animaux en anglais', gen() { return enQ(EN_ANIMALS.slice(0, 8), 3); } },
      { name: 'Les nombres jusqu’à 10', gen() { return enQ(enNumList(1, 10), 4, enNumVis); } },
      { name: 'Ma famille en anglais', gen() { return enQ(EN_FAMILY, 3, enFamVis); } },
      { name: 'Les véhicules en anglais', gen() { return enQ(EN_VEH, 3); } },
      { name: 'Mon corps en anglais', gen() { return enQ(EN_BODY, 3); } },
      { name: 'Toutes les couleurs en anglais', gen() { return enQ(enColorList(COLORS.length), 4, enColorVis); } }
    ]
  },
  {
    id: 'couleurs', title: 'Couleurs et formes', icon: '🎨', color: '#ec407a',
    levels: [
      { name: 'Les 4 couleurs', gen() {
        const base = COLORS.slice(0, 4); const c = pick(base); const opts = shuffle([c, ...sample(base.filter((x) => x !== c), 2)]);
        return { say: `Touche le ${c.n} !`, show: big('🎨'), choices: opts.map((x) => choice(shape('rond', x.c), x === c, 'le ' + x.n)) }; } },
      { name: 'Toutes les couleurs', gen() {
        const c = pick(COLORS); const opts = shuffle([c, ...sample(COLORS.filter((x) => x !== c), 3)]);
        return { say: `Touche le ${c.n} !`, show: big('🎨'), choices: opts.map((x) => choice(shape('rond', x.c), x === c, 'le ' + x.n)) }; } },
      { name: 'Les formes', gen() {
        const base = SHAPES.slice(0, 4); const s = pick(base); const col = pick(COLORS.slice(0, 6)).c;
        const opts = shuffle([s, ...sample(base.filter((x) => x !== s), 2)]);
        return { say: `Touche ${s.n} !`, show: '', choices: opts.map((x) => choice(shape(x.id, col), x === s, x.n)) }; } },
      { name: 'Toutes les formes', gen() {
        const s = pick(SHAPES); const opts = shuffle([s, ...sample(SHAPES.filter((x) => x !== s), 3)]);
        return { say: `Touche ${s.n} !`, show: '', choices: opts.map((x) => choice(shape(x.id, pick(COLORS.slice(0, 8)).c), x === s, x.n)) }; } },
      { name: 'Forme et couleur', gen() {
        const [s, s2, s3] = sample(SHAPES.slice(0, 5), 3); const [c, c2, c3] = sample(COLORS.slice(0, 8), 3);
        const opts = shuffle([[s, c, true], [s, c2, false], [s2, c, false], [s3, c3, false]]);
        return { say: `Touche ${s.n} ${s.fem ? c.f : c.n} !`, show: '', choices: opts.map(([x, y, ok]) => choice(shape(x.id, y.c), ok)) }; } },
      { name: 'Mélanger les couleurs', gen() {
        const [a, b, r] = pick([['jaune', 'bleu', 'vert'], ['rouge', 'jaune', 'orange'], ['rouge', 'bleu', 'violet'], ['blanc', 'rouge', 'rose'], ['blanc', 'noir', 'gris']]);
        const others = sample(COLORS.filter((x) => ![a, b, r].includes(x.n)), 2);
        return { key: r, say: `Si je mélange le ${a} et le ${b}, quelle couleur j’obtiens ?`,
          show: `<div class="mix">${shape('rond', colorByName(a).c)}<span class="op">+</span>${shape('rond', colorByName(b).c)}<span class="op">=</span><span class="op">?</span></div>`,
          choices: shuffle([colorByName(r), ...others]).map((x) => choice(shape('rond', x.c), x.n === r, 'le ' + x.n)), okSay: `Bravo ! Ça fait du ${r} !` }; } }
    ]
  },
  {
    id: 'logique', title: 'Logique', icon: '🧩', color: '#26a69a',
    levels: [
      { name: 'Grand ou petit', gen() {
        const e = pick(['🚒', '🚚', '🐘', '🦸', '🐶', '🏠', '🌳', '🚀']); const bigQ = Math.random() < 0.5;
        return { say: bigQ ? 'Touche le plus grand !' : 'Touche le plus petit !', show: '',
          choices: shuffle([0, 1, 2]).map((s) => choice(`<span class="sz s${s}">${e}</span>`, bigQ ? s === 2 : s === 0)) }; } },
      { name: 'Suites simples', gen() { return patternQ([[0, 1]]); } },
      { name: 'Trouve l’intrus', gen() {
        const [A, B] = sample(CATS, 2); const same = sample(A.l, 3); const odd = pick(B.l);
        return { say: 'Trouve l’intrus ! Lequel n’est pas de la même famille ?', show: '',
          choices: shuffle([...same.map((e) => choice(emo(e), false)), choice(emo(odd), true)]), okSay: `Bravo ! Les autres, ce sont ${A.n} !` }; } },
      { name: 'Suites difficiles', gen() { return patternQ([[0, 1, 1], [0, 0, 1], [0, 1, 2]]); } },
      { name: 'Le nombre qui manque', gen() {
        const start = 1 + rnd(6); const seq = [0, 1, 2, 3, 4].map((i) => start + i); const mi = 1 + rnd(4);
        return { key: '' + start + mi, say: 'Quel nombre manque ? Compte dans ta tête !', teach: `${seq.join(', ')} ! Il manquait le ${seq[mi]}, c’est celui qui brille !`,
          show: `<div class="seq nums">${seq.map((v, i) => (i === mi ? '<span class="miss">?</span>' : `<span>${v}</span>`)).join('')}</div>`,
          choices: numChoices(seq[mi], 1, 12, 3, false) }; } }
    ]
  },
  {
    id: 'memoire', title: 'Mémoire', icon: '🃏', color: '#42a5f5', type: 'memory',
    levels: [{ name: '3 paires', pairs: 3 }, { name: '4 paires', pairs: 4 }, { name: '6 paires', pairs: 6 }, { name: '8 paires', pairs: 8 }]
  },
  {
    id: 'monde', title: 'Le monde', icon: '🌍', color: '#66bb6a',
    levels: [
      { name: 'Animaux et véhicules', gen() {
        const list = Math.random() < 0.5 ? ANIMALS : VEH.map((v) => ({ e: v.e, n: v.s }));
        const opts = sample(list, 3); const t = pick(opts);
        return { say: `Trouve ${t.n} !`, show: '', choices: opts.map((x) => choice(emo(x.e), x === t, x.n)) }; } },
      { name: 'Où vivent les animaux ?', gen() {
        const hs = sample(Object.keys(HAB), 3);
        const opts = hs.map((h) => pick(ANIMALS.filter((a) => a.h === h)));
        return { key: hs[0], say: `Quel animal vit ${HAB[hs[0]].l} ?`, show: big(HAB[hs[0]].e), teach: `${cap(opts[0].n)} vit ${HAB[hs[0]].l}. C’est celui qui brille !`, choices: shuffle(opts).map((x) => choice(emo(x.e), x === opts[0], x.n)) }; } },
      { name: 'La vie de tous les jours', gen: qaGen(VIE) },
      { name: 'Mon corps', gen: qaGen(CORPS) },
      { name: 'Comparer', gen: qaGen(COMPARE) },
      { name: 'Petit savant', gen: qaGen(SAVANT) }
    ]
  }
];

const PRAISE = ['Bravo !', 'Super !', 'Génial !', 'Bien joué !', 'Excellent !', 'Trop fort !', 'Oui, c’est ça !', 'Mission réussie !', 'Tu es un super-héros !'];
const RETRY = ['Essaie encore !', 'Presque ! Essaie encore.', 'Regarde bien, et essaie encore !'];

/* =========================================================
   L'AVENTURE : chapitres et missions à débloquer dans l'ordre
   Chaque mission = un niveau d'un monde. Chaque chapitre finit
   par un grand défi qui mélange tout ce qui a été appris.
   ========================================================= */
const CHAPTERS = [
  { t: 'La caserne des pompiers', e: '🚒', c: '#ef5350', m: [['nombres', 0], ['couleurs', 0], ['lettres', 0], ['anglais', 0], ['logique', 0], ['monde', 0], ['memoire', 0]] },
  { t: 'La patrouille de police', e: '🚓', c: '#42a5f5', m: [['nombres', 1], ['couleurs', 2], ['lettres', 1], ['logique', 1], ['anglais', 1], ['monde', 1], ['couleurs', 1]] },
  { t: 'La ville des super-héros', e: '🦸', c: '#ab47bc', m: [['nombres', 2], ['lettres', 2], ['logique', 2], ['anglais', 2], ['memoire', 1], ['monde', 2], ['lettres', 7], ['couleurs', 3]] },
  { t: 'L’expédition dans la jungle', e: '🦁', c: '#43a047', m: [['nombres', 3], ['lettres', 3], ['monde', 3], ['anglais', 3], ['logique', 3], ['nombres', 4], ['couleurs', 4], ['anglais', 4], ['lettres', 4]] },
  { t: 'La mission dans l’espace', e: '🚀', c: '#5c6bc0', m: [['memoire', 2], ['monde', 4], ['anglais', 5], ['nombres', 5], ['logique', 4], ['couleurs', 5], ['lettres', 5]] },
  { t: 'La planète des champions', e: '🏆', c: '#ff8f00', m: [['monde', 5], ['nombres', 6], ['lettres', 6], ['anglais', 6], ['lettres', 8], ['memoire', 3], ['anglais', 7], ['nombres', 7], ['lettres', 9]] }
];
// Ancien parcours (avant l'anglais et la famille) : sert à reprendre la progression déjà faite
const OLD_CHAPTERS = [
  [['nombres', 0], ['couleurs', 0], ['lettres', 0], ['logique', 0], ['monde', 0], ['memoire', 0]],
  [['nombres', 1], ['couleurs', 2], ['lettres', 1], ['logique', 1], ['monde', 1], ['couleurs', 1]],
  [['nombres', 2], ['lettres', 2], ['logique', 2], ['memoire', 1], ['monde', 2], ['couleurs', 3]],
  [['nombres', 3], ['lettres', 3], ['monde', 3], ['logique', 3], ['nombres', 4], ['couleurs', 4], ['lettres', 4]],
  [['memoire', 2], ['monde', 4], ['nombres', 5], ['logique', 4], ['couleurs', 5], ['lettres', 5]],
  [['monde', 5], ['nombres', 6], ['lettres', 6], ['memoire', 3], ['nombres', 7]]
];
const PASS = 3;      // étoiles (sur 5) pour réussir une mission
const BOSS_PASS = 4; // étoiles pour réussir un grand défi
const BOSS_Q = 8;    // questions dans un grand défi
const MISSIONS = [];
CHAPTERS.forEach((ch, ci) => {
  ch.m.forEach(([id, lv]) => {
    const mod = MODULES.find((x) => x.id === id);
    MISSIONS.push({ ch: ci, mod, lv, name: mod.levels[lv].name, icon: mod.icon, key: id + ':' + lv });
  });
  MISSIONS.push({ ch: ci, boss: true, name: 'Grand défi', icon: '🏆', key: 'boss:' + ci });
});
MISSIONS.forEach((m, i) => { m.i = i; });

// Les étoiles et leçons sont rangées par mission (clé stable), plus par numéro.
// Ancienne sauvegarde : on convertit, et on garde la mission où il en était.
(function migrate() {
  if (state.v >= 2) return;
  const oldKeys = [];
  OLD_CHAPTERS.forEach((ms, ci) => { ms.forEach(([id, lv]) => oldKeys.push(id + ':' + lv)); oldKeys.push('boss:' + ci); });
  const conv = (o) => { const r = {}; Object.keys(o || {}).forEach((i) => { if (oldKeys[i]) r[oldKeys[i]] = o[i]; }); return r; };
  state.best = conv(state.best);
  state.learned = conv(state.learned);
  const p = state.progress || 0;
  if (p >= oldKeys.length) state.progress = MISSIONS.length - 1; // aventure finie : reste le dernier défi à refaire
  else if (p > 0) state.progress = MISSIONS.findIndex((m) => m.key === oldKeys[p]);
  state.v = 2;
  save();
})();

/* =========================================================
   LEÇONS — avant chaque nouvelle mission, on APPREND d'abord.
   La tablette montre, explique et compte avec lui.
   ========================================================= */
let animTok = 0; // change à chaque écran : arrête les animations de l'écran précédent
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
function later(ms, fn) { const tok = animTok; setTimeout(() => { if (tok === animTok) fn(); }, ms); }
// Allume les éléments un par un en disant chaque texte (ex : compter 1, 2, 3...)
function sayAlong(sel, texts, done) {
  const tok = animTok, els = [...app.querySelectorAll(sel)];
  let k = 0;
  (function step() {
    if (tok !== animTok) return;
    els.forEach((e) => e.classList.remove('now'));
    if (k >= els.length || k >= texts.length) { if (done) later(400, done); return; }
    els[k].classList.add('counted', 'now');
    say(String(texts[k]));
    k++;
    setTimeout(step, 850 + String(texts[k - 1]).length * 70);
  })();
}
const reveal = (sel) => app.querySelectorAll(sel).forEach((e) => e.classList.remove('hide'));
const S = (show, text, anim) => ({ show, say: text, anim });
const lgrid = (list, cls) => `<div class="lgrid ${cls || ''}">${list.map((e) => `<span class="li">${e}</span>`).join('')}</div>`;
// Diapo : on nomme chaque image une par une, puis on dit le texte
const nameSlide = (head, emojis, names, text) => S((head || '') + lgrid(emojis), text, (s) => sayAlong('.lesson .li', names, () => say(s.say)));
const countSlide = (o, n, text) => S(`<div class="lrow">${rowsOf(o, n, '')}<div class="ldigit hide">${n}</div></div>`,
  text || `Il y a ${n} ${o.n}. Le nombre ${n} s’écrit comme ça !`,
  (s) => sayAlong('.lesson .o', range(1, n), () => { reveal('.lesson .ldigit'); say(s.say); }));
const lineSlide = (a, b, text) => S(`<div class="nline">${range(a, b).map((v) => `<span>${v}</span>`).join('')}</div>`, text,
  (s) => sayAlong('.lesson .nline span', range(a, b), () => say(s.say)));
const qSlide = (it) => S(`${it.show ? big(it.show) : ''}<div class="lqa"><span class="emo hide">${it.ok}</span></div>`, it.a,
  (s) => { say(it.q); later(2600, () => { reveal('.lesson .emo'); sfx('ok'); say(s.say); }); });
const letterSlide = (l, e, text) => S(`<div class="lpair"><div class="letter huge">${l}</div>${e ? `<span class="emo">${e}</span>` : ''}</div>`, text);
function addSlide(o, a, b) {
  return S(`<div class="sum">${rowsOf(o, a, '')}<span class="op">+</span>${rowsOf(o, b, '')}<span class="op">=</span><span class="ldigit hide">${a + b}</span></div>`,
    `${a} et encore ${b}, ça fait ${a + b} en tout !`,
    (s) => { say(`Ici ${a}, et là ${b}. On met tout ensemble et on compte tout !`); later(3800, () => sayAlong('.lesson .o', range(1, a + b), () => { reveal('.lesson .ldigit'); say(s.say); })); });
}
function compareSlide(o, a, b, more) {
  const win = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  return S(`<div class="lpair"><div class="lgrp">${rowsOf(o, a, 'g1')}</div><div class="lgrp">${rowsOf(o, b, 'g2')}</div></div>`,
    more ? `${Math.max(a, b)}, c’est plus que ${Math.min(a, b)} ! C’est ici qu’il y en a le plus.` : `${Math.min(a, b)}, c’est moins que ${Math.max(a, b)} ! C’est ici qu’il y en a le moins.`,
    (s) => sayAlong('.lesson .g1', range(1, a), () => { say(`Ici, il y en a ${a}.`); later(2200, () => sayAlong('.lesson .g2', range(1, b), () => {
      say(`Là, il y en a ${b}.`); later(2200, () => { app.querySelectorAll('.lesson .lgrp')[win].classList.add('lwin'); say(s.say); }); })); }));
}
function takeSlide(o, a, b) {
  return S(`<div class="lrow">${rowsOf(o, a, '')}<span class="op">→</span><div class="ldigit hide">${a - b}</div></div>`,
    `Il y en avait ${a}, on en enlève ${b}, il en reste ${a - b} !`,
    (s) => {
      say(`Il y a ${a} ${o.n}. On en enlève ${b}. Regarde !`);
      const els = [...app.querySelectorAll('.lesson .o')].slice(a - b);
      els.forEach((e, i) => later(3200 + i * 700, () => { e.classList.add('gone'); sfx('tap'); }));
      later(3600 + b * 700, () => { say('Combien en reste-t-il ? On compte !');
        later(2400, () => sayAlong('.lesson .o:not(.gone)', range(1, a - b), () => { reveal('.lesson .ldigit'); say(s.say); })); });
    });
}
function sameSlide(o, n) {
  return S(`<div class="lpair"><div class="lgrp">${rowsOf(o, n, 'g1')}</div><div class="lgrp">${rowsOf({ e: '🔵' }, n, 'g2')}</div></div>`,
    `${n} ${o.n} et ${n} ronds : c’est pareil ! Il y en a autant.`,
    (s) => { say('Autant, ça veut dire le même nombre : pas plus, pas moins.');
      later(3500, () => sayAlong('.lesson .g1', range(1, n), () => later(500, () => sayAlong('.lesson .g2', range(1, n), () => {
        app.querySelectorAll('.lesson .lgrp').forEach((g) => g.classList.add('lwin')); say(s.say); })))); });
}
function clapSlide(w) {
  return S(`${big(w.e)}<div class="claps big">${w.s.map((x) => `<span class="li">👏<small>${x}</small></span>`).join('')}</div>`,
    `${cap(w.w)} : ${w.s.length} ${w.s.length > 1 ? 'syllabes' : 'syllabe'} ! On a tapé ${w.s.length} ${w.s.length > 1 ? 'fois' : 'fois'}.`,
    (s) => { say(`${cap(w.w)}. On tape dans les mains !`); later(2400, () => sayAlong('.lesson .claps .li', w.s, () => say(s.say))); });
}
function seqSlide(items, names, ans, text) {
  return S(`<div class="seq">${items.map((e) => `<span class="li">${e}</span>`).join('')}<span class="miss">?</span></div>`, text,
    (s) => sayAlong('.lesson .seq .li', names, () => { const m = app.querySelector('.lesson .miss'); if (m) { m.textContent = ans; m.classList.add('found'); } sfx('ok'); say(s.say); }));
}
function shapeSlide(id, color, e, text) {
  return S(`<div class="lpair">${shape(id, color)}<span class="emo">${e}</span></div>`, text);
}
const COLOR_EX = {
  rouge: [['🚒', '🍎', '🍓'], 'le camion de pompiers, la pomme et la fraise'], bleu: [['🌊', '🐳', '💧'], 'la mer, la baleine et l’eau'],
  jaune: [['☀️', '🍌', '🐥'], 'le soleil, la banane et le poussin'], vert: [['🌳', '🥦', '🐸'], 'l’arbre, le brocoli et la grenouille'],
  orange: [['🍊', '🥕', '🎃'], 'l’orange, la carotte et la citrouille'], violet: [['🍇', '🍆'], 'le raisin et l’aubergine'],
  rose: [['🌸', '🐷', '🦩'], 'la fleur, le cochon et le flamant rose'], marron: [['🐻', '🌰', '🍫'], 'l’ours, la châtaigne et le chocolat'],
  noir: [['🎱', '🐜', '🕷️'], 'la boule, la fourmi et l’araignée'], blanc: [['⛄', '🥛', '☁️'], 'la neige, le lait et le nuage'],
  gris: [['🐘', '🐭', '🪨'], 'l’éléphant, la souris et le caillou']
};
const colorSlide = (c) => S(`<div class="lpair">${shape('rond', c.c)}${lgrid(COLOR_EX[c.n][0])}</div>`, `Le ${c.n} ! Comme ${COLOR_EX[c.n][1]}.`);
function mixSlide(a, b, r) {
  return S(`<div class="mix">${shape('rond', colorByName(a).c)}<span class="op">+</span>${shape('rond', colorByName(b).c)}<span class="op">=</span><span class="hide">${shape('rond', colorByName(r).c)}</span></div>`,
    `Ça fait du ${r} !`, (s) => { say(`Si je mélange le ${a} et le ${b}...`); later(2600, () => { reveal('.lesson .hide'); sfx('ok'); say(s.say); }); });
}
// Anglais : l'image, le mot écrit, et la tablette le dit en français puis en anglais
const enSlide = (x, vis) => S(`<div class="lpair">${vis ? vis(x) : emo(x.e)}<div class="enword">${esc(x.en)}</div></div>`,
  `${cap(x.fr)}, en anglais, c’est [[${x.en}]] ! Répète avec moi : [[${x.en}]] !`);
const enRecap = (list, vis, text) => S(lgrid(list.map((x) => (vis ? vis(x) : x.e))), text,
  (s) => sayAlong('.lesson .li', list.map((x) => `[[${x.en}]]`), () => say(s.say)));
const enLine = (a, b, text) => S(`<div class="nline">${range(a, b).map((v) => `<span>${v}</span>`).join('')}</div>`, text,
  (s) => sayAlong('.lesson .nline span', range(a, b).map((v) => `[[${EN_NUM[v]}]]`), () => say(s.say)));
const enHello = (text) => S(big('🇬🇧'), `[[Hello ${NAME}!]] ${text}`);
// Famille : la photo ou l'image, le mot écrit, puis on épelle lettre par lettre
const famSlide = (it, text) => S(`<div class="bigicon sm">${it.pic}</div><div class="model">${it.w.split('').map((l) => `<span>${l}</span>`).join('')}</div>`,
  text || `${it.said} ! ${it.w.split('').map((l) => LNAME[l]).join(', ')}.`,
  (s) => { say(`${it.who}. Ça s’écrit comme ça. Écoute !`); later(1800 + it.who.length * 70, () => sayAlong('.lesson .model span', it.w.split('').map((l) => LNAME[l]), () => say(s.say))); });

function lessonFor(m) {
  const o = countObj(), lv = m.lv;
  const L = {
    nombres: [
      () => [S(big('🔢'), `On apprend à compter jusqu’à 5 avec les ${o.n} ! Regarde et écoute bien.`),
        ...range(1, 5).map((n) => countSlide(o, n)),
        lineSlide(1, 5, 'Un, deux, trois, quatre, cinq ! Répète avec moi !'),
        S(big('👆'), 'À toi maintenant ! Pour compter, touche chaque objet une seule fois. La tablette compte avec toi.')],
      () => [S(big('🔢'), 'Aujourd’hui, on apprend à compter jusqu’à 10 ! Écoute bien et répète avec moi.'),
        lineSlide(1, 10, 'Bravo ! Encore une fois, plus fort !'), lineSlide(1, 10, 'Super !'),
        ...range(6, 10).map((n) => countSlide(o, n)),
        S(big('💡'), 'Astuce de champion : touche chaque objet une seule fois. Le dernier nombre que tu dis, c’est la réponse !')],
      () => [lineSlide(0, 10, 'Voici les nombres de zéro à dix. Regarde bien comment ils s’écrivent.'),
        S('<div class="lpair"><div class="ldigit">6</div><div class="ldigit">9</div></div>', 'Attention ! Le 6 a son rond en bas. Le 9 a son rond en haut.'),
        S('<div class="lpair"><div class="ldigit">1</div><div class="ldigit">7</div></div>', 'Le 1 est tout droit, avec un petit nez. Le 7 a une grande barre en haut.'),
        S('<div class="lpair"><div class="ldigit">2</div><div class="ldigit">5</div></div>', 'Le 2 est comme un cygne sur l’eau. Le 5 a un chapeau et un gros ventre.'),
        S('<div class="lpair"><div class="ldigit">10</div></div>', 'Le 10 s’écrit avec deux chiffres : un 1 et un 0.')],
      () => [S(big('➕'), 'On apprend à mettre ensemble ! Quand on met deux groupes ensemble, on compte tout.'), addSlide(o, 2, 1), addSlide(o, 2, 2), addSlide(o, 3, 2)],
      () => [S(big('⚖️'), 'On apprend le plus et le moins. Pour savoir, on compte chaque groupe !'), compareSlide(o, 6, 2, true), compareSlide(o, 3, 7, false), compareSlide(o, 4, 8, true)],
      () => [S(big('🔢'), 'Après dix, on continue : onze, douze, treize, quatorze, quinze !'), lineSlide(1, 15, 'Bravo ! Encore une fois avec moi !'), lineSlide(10, 15, 'Super !'),
        countSlide(o, 12), S(big('💡'), 'Astuce : les objets sont rangés par lignes de 5. Une ligne, c’est 5. Deux lignes, c’est 10 !'), countSlide(o, 14)],
      () => [S(big('✋'), 'On apprend à enlever. Quand on enlève des objets, il en reste moins !'), takeSlide(o, 4, 1), takeSlide(o, 5, 2), takeSlide(o, 6, 3)],
      () => [S(big('🤝'), 'On apprend « autant ». Deux groupes ont autant quand ils ont le même nombre.'), sameSlide(o, 3), sameSlide(o, 5),
        S(big('💡'), 'Astuce : compte le premier groupe, retiens le nombre, puis cherche un groupe avec le même nombre !')]
    ],
    lettres: [
      () => [S(`<div class="name">${'LOANN'.split('').map((l) => `<span>${l}</span>`).join('')}</div>`, 'Loann ! èl, o, a, èn, èn.',
        (s) => { say('Ton prénom s’écrit avec 5 lettres. Écoute !'); later(2800, () => sayAlong('.lesson .name span', ['èl', 'o', 'a', 'èn', 'èn'], () => say(s.say))); }),
        letterSlide('L', '🦸', 'Voici la lettre èl. Un grand trait, et un pied qui part à droite. C’est la première lettre de Loann !'),
        letterSlide('O', '⭕', 'Voici la lettre o. Elle est toute ronde, comme une roue !'),
        letterSlide('A', '🏠', 'Voici la lettre a. Elle ressemble à un toit de maison, avec une barre au milieu.'),
        letterSlide('N', '⛰️', 'Voici la lettre èn. Elle monte, elle descend, et elle remonte ! Il y en a deux dans Loann.'),
        S(big('🔍'), 'À toi ! Retrouve les lettres de ton prénom.')],
      () => [nameSlide('', ['A', 'E', 'I', 'O', 'U'], ['a', 'e', 'i', 'o', 'u'], 'Ce sont les voyelles : les lettres qui chantent ! A, E, I, O, U.'),
        letterSlide('A', '✈️', 'A, comme avion !'), letterSlide('E', '🐘', 'E, comme éléphant !'), letterSlide('I', '🏝️', 'I, comme île !'),
        letterSlide('O', '🦴', 'O, comme os !'), letterSlide('U', '🦄', 'U, comme une licorne ! Le U est comme un gobelet.')],
      () => [S(lgrid(LETTERS, 'abc'), 'Bravo ! Ça, c’est tout l’alphabet !', (s) => { say('Voici l’alphabet : toutes les lettres. Écoute !'); later(2500, () => sayAlong('.lesson .abc .li', LETTERS.map((l) => LNAME[l]), () => say(s.say))); }),
        ...sample(Object.keys(WORDS), 5).map((l) => letterSlide(l, WORDS[l].e, `${LNAME[l]}, comme ${WORDS[l].w} !`))],
      () => [S(big('👂'), 'Les mots commencent par un son. Écoute bien le tout début des mots !'),
        letterSlide('M', '🏍️', 'Moto. Mmmmoto. Au début, on entend mmm. C’est la lettre èm !'),
        letterSlide('S', '☀️', 'Soleil. Sssssoleil. Au début, on entend sss, comme un serpent. C’est la lettre èss !'),
        letterSlide('R', '🤖', 'Robot. Rrrrobot. Au début, on entend rrr, comme un moteur. C’est la lettre èr !'),
        letterSlide('V', '🚗', 'Voiture. Vvvvoiture. Au début, on entend vvv. C’est la lettre vé !'),
        letterSlide('L', '🦸', 'Loann ! Llllloann. Au début, on entend lll. C’est la lettre èl, comme ton prénom !')],
      () => [S(`<div class="lpairs">${'ABCDEFGH'.split('').map((l) => `<span><b>${l}</b>${l.toLowerCase()}</span>`).join('')}</div>`, 'Chaque lettre s’écrit en grand et en petit. Le grand A et le petit a, c’est la même lettre !'),
        S('<div class="lpairs"><span><b>B</b>b</span><span><b>D</b>d</span></div>', 'Attention ! Le petit b a son ventre à droite. Le petit d a son ventre à gauche.'),
        S('<div class="lpairs"><span><b>O</b>o</span><span><b>S</b>s</span><span><b>C</b>c</span></div>', 'Certaines se ressemblent beaucoup : le grand O et le petit o, le grand S et le petit s, le grand C et le petit c.'),
        S('<div class="lpairs"><span><b>L</b>l</span><span><b>A</b>a</span><span><b>N</b>n</span></div>', 'Et les lettres de ton prénom : le L devient l, le A devient a, le N devient n !')],
      () => [S(big('👏'), 'Les mots sont faits de petits morceaux : les syllabes. Pour les compter, on tape dans les mains !'),
        clapSlide(SYLL.find((w) => w.w === 'chat')), clapSlide(SYLL.find((w) => w.w === 'Loann')), clapSlide(SYLL.find((w) => w.w === 'camion')),
        clapSlide(SYLL.find((w) => w.w === 'dinosaure')), S(big('💡'), 'À toi ! Dis le mot en tapant dans tes mains, et compte les tapes.')],
      () => [S('<div class="bigicon sm">🦸</div><div class="model">' + 'LOANN'.split('').map((l) => `<span>${l}</span>`).join('') + '</div>',
        'Pour écrire, on prend les lettres dans l’ordre, de gauche à droite.',
        (s) => { say(s.say); later(4500, () => sayAlong('.lesson .model span', ['èl', 'o', 'a', 'èn', 'èn'])); }),
        S('<div class="model"><span class="cur">L</span><span>O</span><span>A</span><span>N</span><span>N</span></div>', 'Dans le jeu, la lettre orange te montre quelle lettre chercher. Trouve-la en bas, et touche-la !')],
      () => { const fam = famWords();
        return [S(big('👨‍👩‍👦'), 'Dans ta famille, tout le monde a un prénom. On va apprendre à les reconnaître quand ils sont écrits !'),
          ...fam.slice(0, 6).map((it) => famSlide(it)),
          S(big('💡'), 'Astuce : regarde bien la première lettre du mot. Elle t’aide à le reconnaître !')]; },
      () => { const fam = famWords(), it = fam[1] || fam[0];
        return [S(big('✏️'), 'Tu sais écrire ton prénom. Maintenant, on écrit les prénoms de ta famille !'),
          famSlide(it), S(`<div class="model">${it.w.split('').map((l, i) => `<span class="${i === 0 ? 'cur' : ''}">${l}</span>`).join('')}</div>`,
            'Comme pour ton prénom : la lettre orange te montre quelle lettre chercher. On prend les lettres dans l’ordre, de gauche à droite.')]; },
      () => [S(`<div class="model">${norm(NAME).split('').map((l) => `<span>${l}</span>`).join('')}</div>`, 'Regarde bien ton prénom... Je le cache !',
        (s) => { say('Tu connais bien ton prénom. Maintenant, tu vas l’écrire tout seul, sans modèle ! ' + s.say);
          later(6500, () => app.querySelectorAll('.lesson .model span').forEach((e) => e.classList.add('masked'))); }),
        S(`<div class="model">${norm(NAME).split('').map((l, i) => `<span class="${i ? 'masked' : 'cur'}">${l}</span>`).join('')}</div>`,
          'Si tu ne te souviens plus, ce n’est pas grave : quand tu te trompes, la lettre réapparaît pour t’aider !')]
    ],
    anglais: [
      () => [enHello('Aujourd’hui, on apprend l’anglais ! L’anglais, c’est la langue qu’on parle en Angleterre, et dans plein de pays du monde.'),
        S(big('👋'), 'Pour dire bonjour en anglais, on dit [[Hello!]] Dis bonjour avec moi : [[Hello!]]'),
        ...enColorList(4).map((x) => enSlide(x, enColorVis)),
        enRecap(enColorList(4), enColorVis, '[[Red, blue, yellow, green!]] Bravo !')],
      () => [enHello('On apprend à compter en anglais !'),
        enLine(1, 5, 'Bravo ! Répète avec moi !'), enLine(1, 5, '[[Well done!]] Super !'),
        ...enNumList(1, 5).map((x) => enSlide(x, enNumVis))],
      () => [enHello('Découvrons les animaux en anglais !'), ...EN_ANIMALS.slice(0, 8).map((x) => enSlide(x)),
        enRecap(EN_ANIMALS.slice(0, 8), null, 'Bravo ! Tu parles anglais !')],
      () => [enHello('On compte jusqu’à dix en anglais !'), enLine(1, 10, 'Bravo ! Encore une fois !'), enLine(1, 10, '[[Great!]]'),
        ...enNumList(6, 10).map((x) => enSlide(x, enNumVis))],
      () => [enHello('Aujourd’hui, la famille en anglais !'), ...EN_FAMILY.map((x) => enSlide(x, enFamVis)),
        S(big('💡'), 'Tu peux dire [[I love you, mummy!]] et [[I love you, daddy!]] Ça veut dire : je t’aime, maman ! Je t’aime, papa !')],
      () => [enHello('Les véhicules en anglais ! Vroum !'), ...EN_VEH.map((x) => enSlide(x)), enRecap(EN_VEH.slice(0, 6), null, '[[Brilliant!]]')],
      () => [enHello('Découvrons notre corps en anglais !'), ...EN_BODY.map((x) => enSlide(x)),
        S(big('🙌'), 'On chante ! [[Eyes and ears and mouth and nose!]] Touche tes yeux, tes oreilles, ta bouche et ton nez !')],
      () => [enHello('On révise toutes les couleurs en anglais !'), ...enColorList(COLORS.length).slice(4).map((x) => enSlide(x, enColorVis)),
        enRecap(enColorList(COLORS.length), enColorVis, '[[Well done!]] Tu connais toutes les couleurs en anglais !')]
    ],
    couleurs: [
      () => [S(big('🎨'), 'On apprend les couleurs ! Regarde bien.'), ...COLORS.slice(0, 4).map(colorSlide)],
      () => [S(big('🎨'), 'Il y a encore plein d’autres couleurs !'), ...COLORS.slice(4).map(colorSlide)],
      () => [S(big('🔷'), 'On apprend les formes !'),
        shapeSlide('rond', '#1e88e5', '⚽', 'Le rond est tout rond, sans aucune pointe. Comme un ballon ou une roue !'),
        shapeSlide('carre', '#e53935', '🎁', 'Le carré a 4 côtés, tous de la même taille, et 4 coins. Comme un cadeau !'),
        shapeSlide('triangle', '#fdd835', '🍕', 'Le triangle a 3 côtés et 3 pointes. Comme une part de pizza !'),
        shapeSlide('etoile', '#fb8c00', '⭐', 'L’étoile a 5 pointes, comme les étoiles dans le ciel !')],
      () => [S(big('🔷'), 'Encore des nouvelles formes !'),
        shapeSlide('coeur', '#e53935', '❤️', 'Le cœur a deux bosses en haut et une pointe en bas. C’est le signe de l’amour !'),
        shapeSlide('rectangle', '#43a047', '🚪', 'Le rectangle a 4 côtés : 2 longs et 2 courts. Comme une porte !'),
        shapeSlide('losange', '#8e24aa', '🪁', 'Le losange, c’est comme un carré posé sur sa pointe. Comme un cerf-volant !')],
      () => [S(`<div class="lgrid">${[['carre', '#1e88e5', 1], ['carre', '#e53935', 1], ['rond', '#1e88e5', 0], ['triangle', '#fdd835', 0]].map(([id, c, sq]) => `<span class="li${sq ? ' sq' : ''}${sq && c === '#1e88e5' ? ' blue' : ''}">${shape(id, c)}</span>`).join('')}</div>`,
        'Celui-ci ! Le carré bleu !',
        (s) => { say('Pour trouver le carré bleu, je cherche d’abord les carrés.'); later(3500, () => { app.querySelectorAll('.lesson .sq').forEach((e) => e.classList.add('counted')); say('Voilà les carrés. Maintenant, lequel est bleu ?'); });
          later(7000, () => { const b = app.querySelector('.lesson .blue'); if (b) b.classList.add('lok'); sfx('ok'); say(s.say); }); }),
        S(big('💡'), 'Astuce : d’abord la forme, ensuite la couleur !')],
      () => [S(big('🎨'), 'Les peintres mélangent les couleurs pour en faire de nouvelles. Regarde, c’est magique !'),
        mixSlide('jaune', 'bleu', 'vert'), mixSlide('rouge', 'jaune', 'orange'), mixSlide('rouge', 'bleu', 'violet'), mixSlide('blanc', 'rouge', 'rose'), mixSlide('blanc', 'noir', 'gris')]
    ],
    logique: [
      () => [nameSlide('', ['<span class="sz s0">🚒</span>', '<span class="sz s1">🚒</span>', '<span class="sz s2">🚒</span>'], ['Petit.', 'Moyen.', 'Grand !'],
        'Le plus grand prend le plus de place. Le plus petit est tout petit !'),
        nameSlide('', ['<span class="sz s2">🐘</span>', '<span class="sz s1">🐘</span>', '<span class="sz s0">🐘</span>'], ['Grand.', 'Moyen.', 'Petit !'], 'Regarde bien la taille !')],
      () => [S(big('🔁'), 'Une suite, c’est quand les choses se répètent toujours dans le même ordre.'),
        seqSlide(['🚒', '🚓', '🚒', '🚓', '🚒'], ['pompiers', 'police', 'pompiers', 'police', 'pompiers'], '🚓', 'Après les pompiers, vient la police ! La suite se répète.'),
        seqSlide(['⭐', '🌙', '⭐', '🌙'], ['étoile', 'lune', 'étoile', 'lune'], '⭐', 'Après la lune, vient l’étoile !')],
      () => [S(big('🕵️'), 'L’intrus, c’est celui qui n’est pas de la même famille que les autres.'),
        nameSlide('', ['🍎', '🍌', '🍓', '🚗'], ['pomme', 'banane', 'fraise', 'voiture'], 'Pomme, banane, fraise : ce sont des fruits. La voiture n’est pas un fruit : c’est l’intrus !'),
        nameSlide('', ['🐶', '🐱', '🐰', '🚒'], ['chien', 'chat', 'lapin', 'camion'], 'Chien, chat, lapin : ce sont des animaux. Le camion n’est pas un animal : c’est l’intrus !')],
      () => [seqSlide(['🔴', '🔵', '🔵', '🔴', '🔵', '🔵', '🔴'], ['rouge', 'bleu', 'bleu', 'rouge', 'bleu', 'bleu', 'rouge'], '🔵', 'Rouge, bleu, bleu, et ça recommence ! Après rouge, vient bleu.'),
        seqSlide(['🚒', '🚓', '🚑', '🚒', '🚓', '🚑', '🚒'], ['pompiers', 'police', 'ambulance', 'pompiers', 'police', 'ambulance', 'pompiers'], '🚓', 'Pompiers, police, ambulance, et ça recommence ! Après pompiers, vient police.'),
        S(big('💡'), 'Astuce : dis la suite à voix haute, tu entendras ce qui vient après !')],
      () => [lineSlide(1, 10, 'Les nombres se suivent toujours dans le même ordre.'),
        S('<div class="seq nums"><span class="li">4</span><span class="li">5</span><span class="li miss">?</span><span class="li">7</span><span class="li">8</span></div>', 'Quatre, cinq, six, sept, huit ! Il manquait le six !',
          (s) => sayAlong('.lesson .seq .li', ['4', '5', 'Hmm ?', '7', '8'], () => { const m = app.querySelector('.lesson .miss'); m.textContent = '6'; m.classList.add('found'); sfx('ok'); say(s.say); }))]
    ],
    memoire: [
      () => [S(lgrid(['⭐', '⭐', '⭐', '⭐']), 'Jeu de mémoire ! Les cartes sont retournées, on ne voit pas les images.'),
        S(lgrid(['🚒', '⭐', '🚒', '⭐']), 'Touche une carte, puis une autre. Si les deux images sont pareilles, tu gagnes la paire !'),
        S(lgrid(['🚒', '⭐', '🚓', '⭐']), 'Si elles ne sont pas pareilles, elles se retournent. Essaie de te souvenir où elles sont !'),
        S(big('💡'), 'Astuce : dis à voix haute ce que tu vois. « Camion, ici ! » Comme ça, tu t’en souviens mieux.')]
    ],
    monde: [
      () => [nameSlide(big('🐾'), ['🐱', '🐄', '🦁', '🐘', '🦒', '🐟'], ['le chat', 'la vache', 'le lion', 'l’éléphant', 'la girafe', 'le poisson'], 'Bravo ! Ce sont des animaux.'),
        nameSlide(big('🚦'), ['🚒', '🚓', '🚑', '🚜', '🚁', '🚂'], ['le camion de pompiers', 'la voiture de police', 'l’ambulance', 'le tracteur', 'l’hélicoptère', 'le train'], 'Ce sont des véhicules !')],
      () => Object.keys(HAB).map((h) => { const an = ANIMALS.filter((a) => a.h === h).slice(0, 4);
        return nameSlide(big(HAB[h].e), an.map((a) => a.e), an.map((a) => a.n), `Ils vivent tous ${HAB[h].l} !`); }),
      () => [S(big('🏠'), 'Découvrons à quoi servent les choses autour de nous !'), ...sample(VIE, 6).map(qSlide)],
      () => [S(big('🧒'), 'Découvrons notre corps !'), ...sample(CORPS, 6).map(qSlide)],
      () => [S(big('⚖️'), 'On apprend à comparer : plus grand, plus lourd, plus rapide !'), ...sample(COMPARE, 6).map(qSlide)],
      () => [S(big('🔬'), 'Petit savant ! Découvrons la nature et l’espace.'), ...sample(SAVANT, 7).map(qSlide)]
    ]
  };
  return (L[m.mod.id][lv] || L[m.mod.id][0])();
}

function playLesson(slides, done) {
  let i = 0;
  cur.inLesson = true;
  const show = () => {
    animTok++;
    const s = slides[i];
    app.innerHTML = `<header class="top"><button class="home rnd" aria-label="Carte">🗺️</button>
      <div class="lessontag">📖 J’apprends <small>${i + 1} / ${slides.length}</small></div>
      <button class="speak rnd" aria-label="Répéter">🔊</button></header>
      <section class="lesson">${s.show}</section>
      <div class="lnav"><button class="lnext rnd big" aria-label="Suite">▶</button></div>`;
    if (s.anim) s.anim(s); else say(s.say);
  };
  cur.replay = show;
  cur.lessonNext = () => {
    i++;
    if (i < slides.length) return show();
    cur.inLesson = false;
    done();
  };
  show();
}

/* =========================================================
   MOTEUR
   ========================================================= */
let app = null;
let cur = null;  // partie en cours
let lock = false;

function heroPic() {
  return heroes.length ? `<img class="em" src="${pick(heroes).img}" alt="">` : '🦸';
}

function renderStart() {
  app.innerHTML = `<section class="splash">
    <div class="mascot">${heroPic()}</div>
    <h1>${NAME}<br><span>l'explorateur</span></h1>
    <button class="start" aria-label="Commencer">▶</button></section>`;
}
function begin() {
  sfx('siren');
  say(`Bonjour ${NAME} ! Prêt pour une nouvelle mission ? Choisis un monde !`);
  renderHome();
}

// 5 étoiles -> 3 petites étoiles sur la carte
const miniStars = (s) => { const n = s >= 5 ? 3 : s >= 4 ? 2 : s >= PASS ? 1 : 0; return [0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join(''); };

function renderHome() {
  cur = null; lock = false; animTok++;
  const finished = state.progress >= MISSIONS.length;
  const p = Math.min(state.progress, MISSIONS.length - 1);
  const chaps = CHAPTERS.map((ch, ci) => {
    const ms = MISSIONS.filter((m) => m.ch === ci);
    const open = ms[0].i <= state.progress;
    return `<section class="chap${open ? '' : ' closed'}" style="--c:${ch.c}">
      <h2><span class="che">${open ? ch.e : '🔒'}</span> ${ci + 1}. ${ch.t}</h2>
      <div class="path">${ms.map((m) => {
        const cls = m.i < state.progress ? 'done' : m.i === state.progress ? 'current' : 'locked';
        return `<button class="node ${cls}${m.boss ? ' boss' : ''}" data-m="${m.i}">
          ${cls === 'current' ? `<span class="me">${heroPic()}</span>` : ''}
          <span class="ni">${cls === 'locked' ? '🔒' : m.icon}</span>
          <span class="nn">${m.boss ? 'DÉFI' : m.i + 1}</span>
          ${cls === 'done' ? `<span class="ns">${miniStars(state.best[m.key] || 0)}</span>` : ''}
        </button>`; }).join('')}</div>
    </section>`;
  }).join('');
  app.innerHTML = `
  <header class="top">
    <div class="brand"><span class="mini">${heroPic()}</span> ${NAME} l'explorateur</div>
    <div class="topr"><button class="albumbtn" aria-label="Album">📒 <b>${state.album.length}</b></button>
    <div class="starbox">⭐ <b>${state.stars}</b></div></div>
  </header>
  <main class="map">${chaps}<div class="mapend">${finished ? '🏆 Aventure terminée ! Bravo champion !' : ''}</div></main>
  ${finished ? '' : `<button class="play" data-m="${p}">▶ <span>Mission ${p + 1}</span></button>`}
  <button class="gear" aria-label="Espace parents">⚙️</button>`;
  const c = app.querySelector('.node.current');
  if (c) c.scrollIntoView({ block: 'center' });
}

function onNode(t) {
  const i = +t.dataset.m;
  if (i > state.progress) {
    sfx('no'); shake(t);
    return say(`Cette mission est encore fermée. Réussis d’abord la mission ${state.progress + 1} !`);
  }
  startMission(MISSIONS[i]);
}

function goHome() {
  animTok++;
  if (hasTTS) speechSynthesis.cancel();
  if (history.state && history.state.g) history.back(); // déclenche popstate -> renderHome
  else renderHome();
}

function header(progHTML) {
  return `<header class="top"><button class="home rnd" aria-label="Maison">🏠</button><div class="prog">${progHTML}</div><button class="speak rnd" aria-label="Répéter">🔊</button></header>`;
}
const progressHTML = () => Array.from({ length: cur.total }, (_, i) => `<i class="${i < cur.idx ? 'done' : i === cur.idx ? 'now' : ''}"></i>`).join('');

function startMission(m, opts) {
  if (!history.state || !history.state.g) history.pushState({ g: 1 }, '');
  lock = true;
  animTok++;
  const withLesson = !m.boss && ((opts && opts.lesson) || !state.learned[m.key]);
  if (m.boss) {
    const gens = MISSIONS.filter((x) => x.ch === m.ch && !x.boss && x.mod.type !== 'memory').map((x) => x.mod.levels[x.lv].gen);
    cur = { mission: m, gens, total: BOSS_Q, idx: 0, score: 0, seen: [] };
  } else if (m.mod.type === 'memory') {
    cur = { mission: m, total: 1, idx: 0, score: 0, seen: [] };
  } else {
    cur = { mission: m, gens: [m.mod.levels[m.lv].gen], total: ROUND, idx: 0, score: 0, seen: [] };
  }
  // Écran d'annonce de la mission
  const ch = CHAPTERS[m.ch];
  app.innerHTML = `<section class="intro" style="--c:${ch.c}">
    <div class="bigicon">${m.icon}</div>
    <h1>${m.boss ? 'Grand défi !' : 'Mission ' + (m.i + 1)}</h1>
    <p>${m.boss ? ch.t : m.mod.title + ' · ' + m.name}</p></section>`;
  sfx('siren');
  say(m.boss ? `Grand défi ! Montre tout ce que tu as appris. Il faut ${BOSS_PASS} étoiles pour gagner !`
    : withLesson ? `Mission ${m.i + 1} ! D’abord, on apprend ensemble.` : `Mission ${m.i + 1} !`);
  const play = () => { if (m.mod && m.mod.type === 'memory') startMemory(); else nextQuestion(); };
  later(m.boss ? 4200 : withLesson ? 3000 : 1600, () => {
    if (!withLesson) return play();
    playLesson(lessonFor(m), () => {
      state.learned[m.key] = true; save();
      animTok++;
      app.innerHTML = `<section class="intro" style="--c:${CHAPTERS[m.ch].c}"><div class="bigicon">🎮</div><h1>À toi de jouer !</h1></section>`;
      say(`Bravo, tu as bien écouté ! Maintenant, à toi de jouer, ${NAME} !`);
      later(3200, play);
    });
  });
}

function nextQuestion() {
  lock = false;
  animTok++;
  cur.wrong = 0; cur.letterPos = -1; cur.letterErr = 0;
  let q, tries = 0;
  do { q = pick(cur.gens)(); tries++; } while (cur.seen.includes(q.key || q.say) && tries < 15);
  cur.seen.push(q.key || q.say);
  cur.q = q; cur.missed = false; cur.errors = 0; cur.counted = 0; cur.pos = 0;
  renderQuestion();
  say(q.say);
}

function renderQuestion() {
  const q = cur.q;
  let prompt = q.show || '', body;
  if (q.type === 'spell') {
    prompt = `<div class="bigicon sm">${q.emoji}</div>
      <div class="model">${q.word.split('').map((l, i) => `<span class="${i === 0 ? 'cur' : ''}">${l}</span>`).join('')}</div>
      <div class="slots">${q.word.split('').map((l, i) => `<span class="slot${i === 0 ? ' next' : ''}"></span>`).join('')}</div>`;
    const extra = sample(LETTERS.filter((l) => !q.word.includes(l)), 2); // 2 lettres pièges
    body = `<div class="tiles">${shuffle([...q.word.split(''), ...extra]).map((l) => `<button class="tile" data-l="${l}">${l}</button>`).join('')}</div>`;
  } else {
    body = `<div class="choices" data-n="${q.choices.length}" style="--n:${q.choices.length}">${q.choices.map((c, i) => `<button class="choice" data-i="${i}">${c.html}</button>`).join('')}</div>`;
  }
  app.innerHTML = header(progressHTML()) + `<section class="prompt${prompt ? '' : ' none'}${q.type === 'spell' ? ' col' : ''}">${prompt}</section>` + body;
  // Sans modèle : on montre le mot quelques secondes, puis on le cache
  if (q.nomodel) {
    lock = true;
    later(5500, () => {
      app.querySelectorAll('.model span').forEach((e, i) => { if (i >= cur.pos) e.classList.add('masked'); });
      lock = false;
      say('À toi ! Écris-le de mémoire.');
    });
  }
}

function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

function flashHero() {
  const d = document.createElement('div');
  d.className = 'herofly';
  d.innerHTML = heroPic();
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1400);
}

function onChoice(btn) {
  if (lock || btn.disabled) return;
  const c = cur.q.choices[+btn.dataset.i];
  if (c.ok) {
    lock = true;
    btn.classList.add('good');
    sfx('ok');
    if (!cur.missed) cur.score++;
    flashHero();
    say(cur.q.okSay || pick(PRAISE));
    setTimeout(advance, 1700);
  } else {
    // Il se trompe : on lui APPREND au lieu de juste dire « non »
    const q = cur.q, wrongTxt = c.name ? `Ça, c’est ${c.name}. ` : '';
    cur.missed = true;
    cur.wrong++;
    btn.classList.add('bad');
    btn.disabled = true;
    shake(btn);
    sfx('no');
    const left = q.choices.length - cur.wrong;
    if (q.help === 'count' && cur.wrong === 1 && left > 1) {
      // 1re erreur sur un comptage : la tablette recompte avec lui
      lock = true;
      say(wrongTxt + 'Pas grave ! On compte ensemble, regarde.');
      app.querySelectorAll('.prompt .o').forEach((o) => o.classList.remove('counted', 'now'));
      later(2600, () => sayAlong('.prompt .o:not(.gone)', range(1, q.n), () => { lock = false; say(q.teach); }));
    } else if (cur.wrong >= 2 || left <= 1) {
      // 2e erreur : on montre la bonne réponse qui brille, et on explique
      const i = q.choices.findIndex((x) => x.ok);
      app.querySelector(`.choice[data-i="${i}"]`).classList.add('hintme');
      say(wrongTxt + (q.teach || 'Regarde, c’est celui qui brille ! Touche-le.'));
    } else {
      say(wrongTxt + (q.hint ? 'Presque ! ' + q.hint : pick(RETRY)));
    }
  }
}

function onTile(t) {
  if (lock || t.disabled) return;
  const w = cur.q.word, need = w[cur.pos];
  if (t.dataset.l === need) {
    t.disabled = true; t.classList.add('used');
    const slots = app.querySelectorAll('.slot'), model = app.querySelectorAll('.model span');
    slots[cur.pos].textContent = need; slots[cur.pos].classList.add('filled'); slots[cur.pos].classList.remove('next');
    model[cur.pos].classList.remove('cur');
    cur.pos++;
    sfx('tap');
    if (cur.pos === w.length) {
      lock = true; sfx('ok'); flashHero();
      if (cur.errors <= 1) cur.score++;
      app.querySelectorAll('.model span').forEach((e) => e.classList.remove('masked'));
      say(`Bravo ! Tu as écrit ${cur.q.label}${cur.q.nomodel ? ', tout seul' : ''} !`);
      setTimeout(advance, 2200);
    } else {
      slots[cur.pos].classList.add('next'); model[cur.pos].classList.add('cur');
      say(LNAME[need]);
    }
  } else {
    cur.errors++;
    shake(t); sfx('no');
    cur.letterErr = (cur.letterPos === cur.pos ? cur.letterErr : 0) + 1;
    cur.letterPos = cur.pos;
    const m = app.querySelectorAll('.model span')[cur.pos];
    if (m) m.classList.remove('masked'); // sans modèle : la lettre réapparaît pour l'aider
    if (cur.letterErr >= 2) {
      const good = [...app.querySelectorAll('.tile')].find((x) => !x.disabled && x.dataset.l === need);
      if (good) good.classList.add('hintme');
      say(`Ça, c’est ${LNAME[t.dataset.l]}. La lettre ${LNAME[need]}, c’est celle qui brille !`);
    } else say(`Non, ça c’est ${LNAME[t.dataset.l]}. Cherche la lettre ${LNAME[need]}, celle qui est en orange en haut.`);
  }
}

function onCount(o) {
  if (lock || o.classList.contains('counted')) return;
  o.classList.add('counted');
  cur.counted++;
  sfx('tap');
  say(String(cur.counted));
}

function advance() {
  cur.idx++;
  if (cur.idx >= cur.total) endRound(Math.round((cur.score / cur.total) * 5));
  else nextQuestion();
}

/* ---------------- Mémoire ---------------- */
function startMemory() {
  lock = false;
  const pairs = cur.mission.mod.levels[cur.mission.lv].pairs;
  let set = pick(MEM_SETS).map((e) => ({ e }));
  if (heroes.length >= 2 && Math.random() < 0.6) set = shuffle([...heroes.map((h) => ({ img: h.img, id: h.id })), ...set]);
  const items = sample(set, pairs).map((it, i) => Object.assign({ k: i }, it));
  cur.mem = { cards: shuffle([...items, ...items]), open: [], found: 0, misses: 0, pairs };
  cur.q = { say: 'Retrouve les paires ! Touche deux cartes pour trouver les mêmes.' };
  const cols = pairs <= 4 ? pairs : 4;
  const rows = Math.ceil((pairs * 2) / cols);
  app.innerHTML = header(memProg()) + `<section class="memory" style="--cols:${cols}">${cur.mem.cards.map((c, i) =>
    `<button class="card" data-i="${i}"><span class="back">⭐</span><span class="face">${pic(c)}</span></button>`).join('')}</section>`;
  sizeMemory(cols, rows);
  say(cur.q.say);
}
function memProg() { return `<span class="pairs">${'🟢'.repeat(cur.mem.found)}${'⚪'.repeat(cur.mem.pairs - cur.mem.found)}</span>`; }
function sizeMemory(cols, rows) {
  const el = app.querySelector('.memory'); if (!el) return;
  const r = el.getBoundingClientRect(), gap = 14;
  const s = Math.floor(Math.min((r.width - gap * (cols + 1)) / cols, (r.height - gap * (rows + 1)) / rows, 220));
  el.style.setProperty('--s', Math.max(s, 50) + 'px');
  el.dataset.cols = cols; el.dataset.rows = rows;
}
function onCard(t) {
  const M = cur.mem, i = +t.dataset.i;
  if (lock || t.classList.contains('flip')) return;
  t.classList.add('flip'); sfx('tap');
  M.open.push(i);
  if (M.open.length < 2) return;
  const [a, b] = M.open;
  const ca = app.querySelector(`.card[data-i="${a}"]`), cb = app.querySelector(`.card[data-i="${b}"]`);
  M.open = [];
  if (M.cards[a].k === M.cards[b].k) {
    M.found++;
    setTimeout(() => { ca.classList.add('match'); cb.classList.add('match'); sfx('ok'); }, 300);
    app.querySelector('.prog').innerHTML = memProg();
    if (M.found === M.pairs) {
      lock = true;
      const score = Math.max(1, Math.min(5, 5 - Math.floor(Math.max(0, M.misses - M.pairs) / 2)));
      setTimeout(() => endRound(score), 1300);
    } else say(pick(PRAISE));
  } else {
    M.misses++; lock = true;
    setTimeout(() => { ca.classList.remove('flip'); cb.classList.remove('flip'); lock = false; }, 1000);
  }
}

/* ---------------- Fin de partie ---------------- */
function confetti() {
  const em = ['⭐', '🎉', '✨', '🌟', '⚡'];
  for (let i = 0; i < 32; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = pick(em);
    s.style.left = rnd(100) + 'vw';
    s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    s.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4000);
  }
}

function endRound(score) {
  const m = cur.mission;
  state.stars += score;
  state.best[m.key] = Math.max(state.best[m.key] || 0, score);
  const need = m.boss ? BOSS_PASS : PASS;
  const passed = score >= need;
  let unlocked = false;
  if (passed && m.i === state.progress) { state.progress++; unlocked = true; }
  const finished = unlocked && state.progress >= MISSIONS.length;
  const hasNext = passed && m.i + 1 < MISSIONS.length;
  // Autocollant gagné si 3 étoiles ou plus
  let sticker = null;
  if (score >= 3) {
    const left = STICKERS.filter((s) => !state.album.includes(s.e));
    sticker = left.length ? pick(left) : pick(STICKERS);
    if (!state.album.includes(sticker.e)) state.album.push(sticker.e);
  }
  save();
  const stars = Array.from({ length: 5 }, (_, i) => `<span class="bigstar ${i < score ? 'on' : ''}" style="animation-delay:${i * 180}ms">⭐</span>`).join('');
  app.innerHTML = `<section class="end">
    <div class="stars5">${stars}</div>
    <h1>${passed ? 'Mission réussie' : 'Presque'}, ${NAME} !</h1>
    ${finished ? '<div class="levelup">🏆 Toute l’aventure est terminée !</div>'
      : unlocked && m.boss ? '<div class="levelup">🏆 Chapitre terminé !</div>'
      : unlocked ? '<div class="levelup">🔓 Mission suivante débloquée !</div>' : ''}
    ${!passed ? `<div class="need">Il faut ${'⭐'.repeat(need)} pour passer</div>` : ''}
    ${sticker ? `<div class="newsticker"><span>${sticker.e}</span><small>Nouvel autocollant !</small></div>` : ''}
    <div class="endbtns">
      ${hasNext ? '<button class="next rnd big" aria-label="Mission suivante">▶</button>' : ''}
      ${!passed && !m.boss ? '<button class="relearn rnd big" aria-label="Réapprendre">📖</button>' : ''}
      <button class="again rnd${!passed && m.boss ? ' big' : ''}" aria-label="Rejouer">🔁</button>
      ${passed && !m.boss ? '<button class="relearn rnd" aria-label="Revoir la leçon">📖</button>' : ''}
      <button class="home rnd" aria-label="Carte">🗺️</button></div>
  </section>`;
  sfx(passed ? 'win' : 'ok');
  if (passed) confetti();
  let msg;
  if (passed) msg = `Bravo ${NAME} ! Mission réussie avec ${score} étoiles !`;
  else msg = `${score <= 1 ? 'Bien essayé' : 'Presque'} ${NAME} ! Il faut ${need} étoiles pour passer. ` +
    (m.boss ? 'On réessaie ?' : 'On réapprend ensemble ? Appuie sur le livre !');
  if (sticker) msg += ` Tu gagnes un autocollant : ${sticker.n} !`;
  if (finished) msg += ' Tu as fini toute l’aventure ! Tu es un vrai champion !';
  else if (unlocked && m.boss) msg += ' Tu as terminé le chapitre ! Un nouveau monde t’attend !';
  else if (unlocked) msg += ' La mission suivante est débloquée ! Appuie sur la flèche verte !';
  say(msg);
}

/* ---------------- Album d'autocollants ---------------- */
function renderAlbum() {
  if (!history.state || !history.state.g) history.pushState({ g: 1 }, '');
  cur = null;
  app.innerHTML = `<header class="top"><button class="home rnd" aria-label="Maison">🏠</button><div class="brand">📒 Mon album</div><div class="starbox">${state.album.length} / ${STICKERS.length}</div></header>
  <section class="album">${STICKERS.map((s) => state.album.includes(s.e)
    ? `<button class="stk" data-n="${esc(s.n)}">${s.e}</button>` : '<span class="stk empty">?</span>').join('')}</section>`;
  say(state.album.length ? `Ton album ! Tu as ${state.album.length} autocollants.` : 'Ton album est vide. Gagne des étoiles pour avoir des autocollants !');
}

/* =========================================================
   ESPACE PARENTS
   ========================================================= */
function parentGate() {
  const a = 6 + rnd(4), b = 6 + rnd(4);
  app.insertAdjacentHTML('beforeend', `<div class="overlay"><div class="gate">
    <p><b>Espace parents</b></p><p class="gq">Combien font ${a} × ${b} ?</p>
    <input type="number" inputmode="numeric" class="gin">
    <div class="gbtns"><button data-act="gcancel">Annuler</button><button data-act="gok" data-ans="${a * b}">Valider</button></div></div></div>`);
  const inp = app.querySelector('.gin');
  inp.focus();
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') app.querySelector('[data-act="gok"]').click(); });
}

function renderParent(msg) {
  const v = frVoice ? frVoice.name : (hasTTS ? 'aucune voix française trouvée' : 'synthèse vocale indisponible');
  const ve = enVoice ? enVoice.name : (hasTTS ? 'aucune voix anglaise trouvée' : 'synthèse vocale indisponible');
  app.innerHTML = `<section class="parent">
  <header class="ptop"><h2>⚙️ Espace parents</h2><button data-act="pclose">Fermer</button></header>
  ${msg ? `<p class="pmsg">${esc(msg)}</p>` : ''}
  <p>Étoiles gagnées : <b>${state.stars}</b> · Autocollants : <b>${state.album.length}/${STICKERS.length}</b></p>

  <h3>🦸 Mes héros</h3>
  <p class="hint">Ajoutez des images de ses personnages préférés (depuis la galerie de la tablette). Elles restent sur la tablette et apparaissent dans les jeux : à compter, dans le jeu de mémoire, et pour le féliciter.</p>
  <div class="heroes">${heroes.map((h) => `<div class="hero"><img src="${h.img}" alt=""><span>${esc(h.name)}</span><button data-act="hdel" data-id="${h.id}">✕</button></div>`).join('') || '<p class="hint">Aucun héros pour l’instant.</p>'}</div>
  <div class="addhero">
    <input type="text" class="hname" placeholder="Nom (ex. Spiderman)" maxlength="30">
    <label class="filebtn">📷 Choisir une image<input type="file" accept="image/*" class="hfile" hidden></label>
  </div>

  <h3>👨‍👩‍👦 Ma famille</h3>
  <p class="hint">Les prénoms de sa famille, pour apprendre à les reconnaître et à les écrire (missions « Les prénoms de ma famille », « Écrire les prénoms de la famille », « Écrire mon prénom tout seul »). La photo est facultative ; elle sert aussi en anglais pour « mummy » et « daddy ». Les accents et tirets sont retirés pour l’écriture (Léa-Rose → LEAROSE).</p>
  <div class="heroes">${family.map((f) => `<div class="hero fam"><span class="fpic">${famPic(f)}</span><b>${esc(f.name)}</b><span>${esc((REL[f.rel] || REL.ami).n)}</span><button data-act="fdel" data-id="${f.id}">✕</button></div>`).join('') || '<p class="hint">Personne pour l’instant : en attendant, il écrit PAPA et MAMAN.</p>'}</div>
  <div class="addhero">
    <select class="frel hname">${Object.keys(REL).map((k) => `<option value="${k}">${REL[k].n}</option>`).join('')}</select>
    <input type="text" class="fname hname" placeholder="Prénom (ex. Julie)" maxlength="20">
    <button data-act="fadd">➕ Ajouter</button>
    <label class="filebtn">📷 Ajouter avec une photo<input type="file" accept="image/*" class="ffile" hidden></label>
  </div>

  <h3>🗺️ Progression</h3>
  <p class="hint">Les missions se débloquent une par une : il faut ${PASS} étoiles sur 5 pour passer (${BOSS_PASS} pour un grand défi de fin de chapitre). Loann peut rejouer les missions déjà réussies, mais pas sauter en avant. Les boutons − / + permettent de reculer ou d'avancer sa mission actuelle.</p>
  ${(() => { const p = Math.min(state.progress, MISSIONS.length - 1), m = MISSIONS[p];
    return `<div class="prow"><span class="pi">${m.icon}</span><div class="pt"><b>${state.progress >= MISSIONS.length ? 'Aventure terminée' : `Mission ${p + 1} / ${MISSIONS.length}`}</b><small>${m.boss ? 'Grand défi : ' + CHAPTERS[m.ch].t : m.mod.title + ' · ' + m.name}</small></div><button data-act="pdown">−</button><button data-act="pup">+</button></div>`; })()}
  <details class="prog-list"><summary>Voir tout le programme</summary><ol>${MISSIONS.map((m) =>
    `<li class="${m.i < state.progress ? 'ok' : ''}">${m.icon} ${m.boss ? '<b>Grand défi : ' + CHAPTERS[m.ch].t + '</b>' : m.mod.title + ' · ' + m.name}${state.best[m.key] ? ` — ${state.best[m.key]}⭐` : ''}</li>`).join('')}</ol></details>

  <h3>🔊 Voix</h3>
  ${voiceRow('Voix française', 'fr', frVoices, frVoice, v)}
  ${voiceRow('Voix anglaise (monde English)', 'en', enVoices, enVoice, ve)}
  <p class="hint">Pas assez de voix ? Paramètres de la tablette → Gestion globale → Synthèse vocale → moteur Google → installer les voix « Français » et « English (United Kingdom) ». Les voix « en ligne » ou « réseau » sont plus jolies mais ne marchent pas sans internet.</p>
  <div class="seg">${[['Lente', 0.75], ['Normale', 0.9], ['Rapide', 1.05]].map(([n, r]) => `<button data-act="rate" data-r="${r}" class="${state.rate === r ? 'sel' : ''}">${n}</button>`).join('')}</div>

  <h3>🗑️ Remise à zéro</h3>
  <button data-act="reset" class="danger">Effacer étoiles, niveaux et album</button>
  </section>`;
  app.querySelector('.hfile').addEventListener('change', onHeroFile);
  app.querySelector('.ffile').addEventListener('change', onFamFile);
  app.querySelectorAll('.vsel').forEach((sel) => sel.addEventListener('change', () => {
    state[sel.dataset.lang === 'en' ? 'voiceEn' : 'voiceFr'] = sel.value; save();
    if (hasTTS) pickVoice();
    testVoice(sel.dataset.lang);
  }));
}

// Liste déroulante des voix d'une langue + bouton pour l'écouter
function voiceRow(title, lang, list, curV, label) {
  if (!list.length) return `<p class="hint"><b>${title}</b> : ${esc(label)}.</p>`;
  const opts = `<option value="">Automatique</option>` + list.map((x) =>
    `<option value="${esc(x.name)}"${curV && x.name === curV.name && (lang === 'en' ? state.voiceEn : state.voiceFr) ? ' selected' : ''}>${esc(x.name)} (${esc(x.lang)})</option>`).join('');
  return `<div class="vrow"><b>${title}</b><div class="addhero"><select class="vsel hname" data-lang="${lang}">${opts}</select>
    <button data-act="testvoice" data-lang="${lang}">▶ Écouter</button></div><small class="hint">En ce moment : ${esc(label)}</small></div>`;
}
function testVoice(lang) {
  say(lang === 'en' ? `[[Hello ${NAME}! Where is the red fire engine?]]` : `Bonjour ${NAME} ! Combien y a-t-il de camions de pompiers ?`);
}

// Lit une image de la galerie et la réduit (240 px) pour tenir dans la mémoire de la tablette
function readImage(f, done) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 240, k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      let data = cv.toDataURL('image/webp', 0.85);
      if (!data.startsWith('data:image/webp')) data = cv.toDataURL('image/png');
      done(data);
    };
    img.onerror = () => renderParent('Image illisible, essayez une autre.');
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
}

function onHeroFile(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const name = (app.querySelector('.addhero .hname:not(.frel):not(.fname)').value || '').trim() || 'mon héros';
  readImage(f, (data) => {
    heroes.push({ id: Date.now().toString(36), name, img: data });
    if (!store.set('heroes', heroes)) { heroes.pop(); return renderParent('Mémoire pleine : supprimez un héros avant d’en ajouter un autre.'); }
    renderParent(`${name} a été ajouté !`);
  });
}

function addFamily(img) {
  const rel = app.querySelector('.frel').value, name = (app.querySelector('.fname').value || '').trim(), w = norm(name);
  if (w.length < 2) return renderParent('Écrivez d’abord un prénom (au moins 2 lettres).');
  if (w.length > 12) return renderParent('Prénom trop long pour l’écran : 12 lettres au maximum (un diminutif marche très bien).');
  family.push(Object.assign({ id: Date.now().toString(36), rel, name }, img ? { img } : {}));
  if (!store.set('family', family)) { family.pop(); return renderParent('Mémoire pleine : supprimez un héros ou une photo.'); }
  renderParent(`${name} a été ajouté à la famille ! Il s’écrira ${w}.`);
}
function onFamFile(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (norm(app.querySelector('.fname').value || '').length < 2) return renderParent('Écrivez d’abord le prénom, puis choisissez la photo.');
  readImage(f, addFamily);
}

function parentAct(act, t) {
  if (act === 'gcancel') return app.querySelector('.overlay').remove();
  if (act === 'gok') {
    const v = +app.querySelector('.gin').value;
    if (v === +t.dataset.ans) return renderParent();
    const inp = app.querySelector('.gin'); inp.value = ''; shake(inp); return;
  }
  if (act === 'pclose') return renderHome();
  if (act === 'pup' || act === 'pdown') {
    state.progress = Math.max(0, Math.min(MISSIONS.length, state.progress + (act === 'pup' ? 1 : -1)));
    save();
    return renderParent();
  }
  if (act === 'rate') { state.rate = +t.dataset.r; save(); return renderParent(); }
  if (act === 'testvoice') return testVoice(t.dataset.lang);
  if (act === 'fadd') return addFamily(null);
  if (act === 'fdel') { family = family.filter((f) => f.id !== t.dataset.id); store.set('family', family); return renderParent(); }
  if (act === 'hdel') { heroes = heroes.filter((h) => h.id !== t.dataset.id); store.set('heroes', heroes); return renderParent(); }
  if (act === 'reset') {
    if (!t.dataset.confirm) { t.dataset.confirm = '1'; t.textContent = 'Touchez encore pour confirmer'; return; }
    state = { v: 2, stars: 0, progress: 0, best: {}, learned: {}, rate: state.rate, voiceFr: state.voiceFr, voiceEn: state.voiceEn, album: [] }; save();
    return renderParent('Tout a été remis à zéro (les héros sont conservés).');
  }
}

/* =========================================================
   DÉMARRAGE
   ========================================================= */
function init() {
  app = document.getElementById('app');
  app.addEventListener('click', (e) => {
    const t = e.target.closest('button, .o.tap, label');
    if (!t || t.tagName === 'LABEL') return;
    if (t.dataset.act) return parentAct(t.dataset.act, t);
    if (t.classList.contains('start')) return begin();
    if (t.classList.contains('node') || t.classList.contains('play')) return onNode(t);
    if (t.classList.contains('next')) return startMission(MISSIONS[cur.mission.i + 1]);
    if (t.classList.contains('gear')) return parentGate();
    if (t.classList.contains('albumbtn')) return renderAlbum();
    if (t.classList.contains('home')) return goHome();
    if (t.classList.contains('again')) return startMission(cur.mission);
    if (t.classList.contains('speak')) return cur && cur.inLesson ? cur.replay() : say(cur && cur.q ? cur.q.say : '');
    if (t.classList.contains('lnext')) return cur.lessonNext();
    if (t.classList.contains('relearn')) return startMission(cur.mission, { lesson: true });
    if (t.classList.contains('choice')) return onChoice(t);
    if (t.classList.contains('tile')) return onTile(t);
    if (t.classList.contains('card')) return onCard(t);
    if (t.classList.contains('stk')) { sfx('tap'); return say(t.dataset.n); }
    if (t.classList.contains('tap')) return onCount(t);
  });
  window.addEventListener('popstate', () => { if (!app.querySelector('.splash')) renderHome(); });
  window.addEventListener('resize', () => {
    const el = app.querySelector('.memory');
    if (el) sizeMemory(+el.dataset.cols, +el.dataset.rows);
  });
  renderStart();
}
if (typeof document !== 'undefined') init();
