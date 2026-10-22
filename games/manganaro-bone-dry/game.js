'use strict';

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
// Liquids: `color` is the bottle's own line color (the art draws liquid as that
// color, semi-transparent). `shelf` = display size on the shelf from Figma
// (vodka isn't on the Figma shelf — sized at the same scale as the other bottles).
// `outline` = hand-drawn selection outline from Figma, positioned relative to the bottle.
const INGREDIENTS = {
  vodka:          { name:'Vodka',         type:'liquid',  file:'vodka.png',        color:'#6ce4f0', shelf:[53.1, 134.4] },
  gin:            { name:'Gin',           type:'liquid',  file:'gin.png',          color:'#843cfc', shelf:[66.91, 163.664] },
  tequila:        { name:'Tequila',       type:'liquid',  file:'tequila.png',      color:'#fc0cc0', shelf:[82.313, 128.396] },
  whiskey:        { name:'Whiskey',       type:'liquid',  file:'whiskey.png',      color:'#ff8147', shelf:[62.036, 145.615],
                    outline:{ src:'assets/ui/select-outline-whiskey.svg', x:-3.5, y:-3.4, w:70.05, h:151.51 } },
  'white-rum':    { name:'White Rum',     type:'liquid',  file:'white-rum.png',    color:'#fc00c0', shelf:[56.916, 146.818] },
  'triple-sec':   { name:'Triple Sec',    type:'liquid',  file:'triple-sec.png',   color:'#fc7830', shelf:[60.414, 198] },
  'soda-water':   { name:'Soda Water',    type:'liquid',  file:'soda-water.png',   color:'#fcfcfc', shelf:[52.7, 133.137] },
  'tonic-water':  { name:'Tonic Water',   type:'liquid',  file:'tonic-water.png',  color:'#6ce4f0', shelf:[46.535, 103.772] },
  cola:           { name:'Cola',          type:'liquid',  file:'cola.png',         color:'#f90049', shelf:[47.772, 79.512],
                    outline:{ src:'assets/ui/select-outline-cola.svg', x:-2.7, y:-3.0, w:53.12, h:86.44 } },
  'ginger-beer':  { name:'Ginger Beer',   type:'liquid',  file:'ginger-beer.png',  color:'#fce4b4', shelf:[46.928, 163.785] },
  cranberry:      { name:'Cranberry Juice', type:'liquid', file:'cranberry.png',   color:'#f00048', shelf:[64.653, 126.043] },
  oj:             { name:'Orange Juice',  type:'liquid',  file:'oj.png',           color:'#fc6000', shelf:[55.389, 111.184] },
  'lime-juice':   { name:'Lime Juice',    type:'liquid',  file:'lime-juice.png',   color:'#0cd830', shelf:[49.177, 141.23] },
  'simple-syrup': { name:'Simple Syrup',  type:'liquid',  file:'simple-syrup.png', color:'#fcd884', shelf:[47.177, 141.327] },
  grenadine:      { name:'Grenadine',     type:'liquid',  file:'grenadine.png',    color:'#fc0c3c', shelf:[64.343, 132.593] },
  // Added 2026-10-07 (user's art): lemon-lime soda + lemon juice are on both shelves; the rest are mocktail-only
  'lemon-lime':   { name:'Lemon-Lime Soda', type:'liquid', file:'lemon-lime-soda.png', color:'#b0d838', shelf:[50.2, 80] },
  'lemon-juice':  { name:'Lemon Juice',   type:'liquid',  file:'lemon-juice.png',  color:'#fce800', shelf:[43.4, 140] },
  lemonade:       { name:'Lemonade',      type:'liquid',  file:'lemonade.png',     color:'#fce800', shelf:[68.9, 135] },
  'iced-tea':     { name:'Iced Tea',      type:'liquid',  file:'iced-tea.png',     color:'#f8a850', shelf:[64.5, 135] },
  pineapple:      { name:'Pineapple Juice', type:'liquid', file:'pineapple.png',   color:'#fce800', shelf:[70.9, 140] },
  grapefruit:     { name:'Grapefruit Juice', type:'liquid', file:'grapefruit.png', color:'#e070f8', shelf:[70.9, 140] },
  'coconut-cream':{ name:'Coconut Cream', type:'liquid',  file:'coconut-cream.png', color:'#f8e8f8', shelf:[65.9, 120] },
  peach:          { name:'Peach Juice',   type:'liquid',  file:'peach.png',        color:'#f8a890', shelf:[62.3, 140] },
  lime:           { name:'Lime',          type:'garnish', file:'lime.png' },
  lemon:          { name:'Lemon',         type:'garnish', file:'lemon.png' },
  orange:         { name:'Orange',        type:'garnish', file:'orange.png' },
  cherry:         { name:'Cherry',        type:'garnish', file:'cherry.png' },
  mint:           { name:'Mint',          type:'garnish', file:'mint.png' },
};
const LIQUID_IDS = Object.keys(INGREDIENTS).filter(id => INGREDIENTS[id].type === 'liquid');

// Mocktail mode (user, 2026-10-07): the shelf drops the spirits + triple sec and gets the six
// mocktail bottles instead. Cocktail mode keeps a cocktail shelf (no mocktail-only bottles).
const MOCKTAIL_ONLY_IDS = new Set(['lemonade', 'iced-tea', 'pineapple', 'grapefruit', 'coconut-cream', 'peach']);
const ALCOHOL_IDS = new Set(['vodka', 'gin', 'tequila', 'whiskey', 'white-rum', 'triple-sec']);
const COCKTAIL_SHELF = LIQUID_IDS.filter(id => !MOCKTAIL_ONLY_IDS.has(id));
const MOCKTAIL_SHELF = LIQUID_IDS.filter(id => !ALCOHOL_IDS.has(id));

// Shelf heights: each bottle at its rough real-life height, all at one scale
// (user, 2026-09-24). Width follows each bottle's own art. `shelf` above stays
// the Figma size — the pour screen still sizes bottles from it.
const REAL_HEIGHT_CM = {
  vodka: 30, 'white-rum': 29, gin: 29, 'triple-sec': 28, whiskey: 25, tequila: 24,   // 750 ml liquor
  'simple-syrup': 26, cranberry: 23, oj: 22, 'lime-juice': 21, grenadine: 19,        // bar bottles / juice
  'soda-water': 20, 'ginger-beer': 20, 'tonic-water': 18, cola: 14,                   // mixers, cola can
  'lemon-lime': 14, 'lemon-juice': 21, lemonade: 22, 'iced-tea': 22,                 // added 2026-10-07
  pineapple: 23, grapefruit: 23, 'coconut-cream': 18, peach: 22,
};
const SHELF_PX_PER_CM = 5.8;   // tallest (vodka, 30 cm) ≈ 174 px
function shelfSize(id) {
  const [w, h] = INGREDIENTS[id].shelf;
  const H = REAL_HEIGHT_CM[id] * SHELF_PX_PER_CM;
  return [w * H / h, H];
}

// Approved menu (2026-09-24). Add a drink = add a line here.
const DRINKS = [
  { id:'vodka-soda',      name:'Vodka Soda',      ingredients:[{id:'vodka',oz:1.5},{id:'soda-water',oz:4},{id:'lime',count:1}] },
  { id:'vodka-tonic',     name:'Vodka Tonic',     ingredients:[{id:'vodka',oz:1.5},{id:'tonic-water',oz:4},{id:'lime',count:1}] },
  { id:'vodka-cranberry', name:'Vodka Cranberry', ingredients:[{id:'vodka',oz:1.5},{id:'cranberry',oz:4},{id:'lime',count:1}] },
  { id:'dirty-shirley',   name:'Dirty Shirley',   ingredients:[{id:'vodka',oz:1.5},{id:'lemon-lime',oz:4},{id:'grenadine',oz:0.5},{id:'cherry',count:1}] },   // added 2026-09-29
  { id:'screwdriver',     name:'Screwdriver',     ingredients:[{id:'vodka',oz:1.5},{id:'oj',oz:4},{id:'orange',count:1}] },
  { id:'moscow-mule',     name:'Moscow Mule',     ingredients:[{id:'vodka',oz:1.5},{id:'ginger-beer',oz:4},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'kentucky-mule',   name:'Kentucky Mule',   ingredients:[{id:'whiskey',oz:1.5},{id:'ginger-beer',oz:4},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },   // added 2026-09-29
  { id:'mexican-mule',    name:'Mexican Mule',    ingredients:[{id:'tequila',oz:1.5},{id:'ginger-beer',oz:4},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },   // added 2026-09-29
  { id:'cosmopolitan',    name:'Cosmopolitan',    ingredients:[{id:'vodka',oz:1.5},{id:'triple-sec',oz:0.5},{id:'cranberry',oz:1},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'gin-tonic',       name:'Gin and Tonic',   ingredients:[{id:'gin',oz:1.5},{id:'tonic-water',oz:4},{id:'lime',count:1}] },
  { id:'gin-rickey',      name:'Gin Rickey',      ingredients:[{id:'gin',oz:1.5},{id:'lime-juice',oz:0.5},{id:'soda-water',oz:4},{id:'lime',count:1}] },
  { id:'tom-collins',     name:'Tom Collins',     ingredients:[{id:'gin',oz:1.5},{id:'simple-syrup',oz:0.5},{id:'soda-water',oz:4},{id:'lemon',count:1}] },
  { id:'cuba-libre',      name:'Cuba Libre',      ingredients:[{id:'white-rum',oz:1.5},{id:'cola',oz:4},{id:'lime',count:1}] },
  { id:'rum-punch',       name:'Rum Punch',       ingredients:[{id:'white-rum',oz:1.5},{id:'oj',oz:2},{id:'cranberry',oz:2},{id:'grenadine',oz:0.5},{id:'cherry',count:1}] },
  { id:'daiquiri',        name:'Daiquiri',        ingredients:[{id:'white-rum',oz:2},{id:'lime-juice',oz:1},{id:'simple-syrup',oz:0.5},{id:'lime',count:1}] },   // added 2026-09-29
  { id:'mojito',          name:'Mojito',          ingredients:[{id:'white-rum',oz:1.5},{id:'lime-juice',oz:0.5},{id:'simple-syrup',oz:0.5},{id:'soda-water',oz:3},{id:'mint',count:1},{id:'lime',count:1}] },
  { id:'whiskey-coke',    name:'Whiskey Coke',    ingredients:[{id:'whiskey',oz:1.5},{id:'cola',oz:4},{id:'lime',count:1}] },
  { id:'whiskey-ginger',  name:'Whiskey Ginger',  ingredients:[{id:'whiskey',oz:1.5},{id:'ginger-beer',oz:4},{id:'lemon',count:1}] },
  { id:'margarita',       name:'Margarita',       ingredients:[{id:'tequila',oz:2},{id:'triple-sec',oz:1},{id:'lime-juice',oz:1},{id:'lime',count:1}] },
  { id:'tequila-sunrise', name:'Tequila Sunrise', ingredients:[{id:'tequila',oz:1.5},{id:'oj',oz:4},{id:'grenadine',oz:0.5},{id:'orange',count:1},{id:'cherry',count:1}] },
  { id:'long-island',     name:'Long Island Iced Tea', ingredients:[{id:'vodka',oz:0.5},{id:'gin',oz:0.5},{id:'white-rum',oz:0.5},{id:'tequila',oz:0.5},{id:'triple-sec',oz:0.5},{id:'lemon-juice',oz:0.5},{id:'simple-syrup',oz:0.5},{id:'cola',oz:1.5},{id:'lemon',count:1}] },   // added 2026-09-29
  { id:'tequila-soda',    name:'Tequila Soda',    ingredients:[{id:'tequila',oz:1.5},{id:'soda-water',oz:4},{id:'lime',count:1}] },   // added 2026-09-29
  { id:'ranch-water',     name:'Ranch Water',     ingredients:[{id:'tequila',oz:1.5},{id:'lime-juice',oz:0.5},{id:'soda-water',oz:4},{id:'lime',count:1}] },

  // ── Mocktails (drafted 2026-10-05, added 2026-10-07). Peach is a juice, so it's poured by the ounce.
  //    No accents in names — the game fonts have no ñ. ──
  { id:'shirley-temple',  name:'Shirley Temple',  mocktail:true, ingredients:[{id:'lemon-lime',oz:4},{id:'grenadine',oz:0.5},{id:'cherry',count:1}] },
  { id:'roy-rogers',      name:'Roy Rogers',      mocktail:true, ingredients:[{id:'cola',oz:4},{id:'grenadine',oz:0.5},{id:'cherry',count:1}] },
  { id:'cherry-limeade',  name:'Cherry Limeade',  mocktail:true, ingredients:[{id:'lemon-lime',oz:4},{id:'grenadine',oz:0.5},{id:'lime-juice',oz:0.5},{id:'lime',count:1},{id:'cherry',count:1}] },
  { id:'nojito',          name:'Nojito',          mocktail:true, ingredients:[{id:'lime-juice',oz:1},{id:'simple-syrup',oz:0.5},{id:'soda-water',oz:3},{id:'mint',count:1},{id:'lime',count:1}] },
  { id:'virgin-mule',     name:'Virgin Mule',     mocktail:true, ingredients:[{id:'ginger-beer',oz:4},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'virgin-sunrise',  name:'Virgin Sunrise',  mocktail:true, ingredients:[{id:'oj',oz:4},{id:'grenadine',oz:0.5},{id:'orange',count:1},{id:'cherry',count:1}] },
  { id:'cranberry-spritzer', name:'Cranberry Spritzer', mocktail:true, ingredients:[{id:'cranberry',oz:3},{id:'soda-water',oz:2},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'tonic-lime',      name:'Tonic and Lime',  mocktail:true, ingredients:[{id:'tonic-water',oz:4},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'virgin-cuba-libre', name:'Virgin Cuba Libre', mocktail:true, ingredients:[{id:'cola',oz:4},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'virgin-cosmo',    name:'Virgin Cosmo',    mocktail:true, ingredients:[{id:'cranberry',oz:2},{id:'oj',oz:0.5},{id:'lime-juice',oz:0.5},{id:'soda-water',oz:1},{id:'lime',count:1}] },
  { id:'arnold-palmer',   name:'Arnold Palmer',   mocktail:true, ingredients:[{id:'iced-tea',oz:3},{id:'lemonade',oz:3},{id:'lemon',count:1}] },
  { id:'peach-iced-tea',  name:'Peach Iced Tea',  mocktail:true, ingredients:[{id:'iced-tea',oz:3},{id:'peach',oz:1},{id:'lemon',count:1}] },
  { id:'sweet-tea-fizz',  name:'Sweet Tea Fizz',  mocktail:true, ingredients:[{id:'iced-tea',oz:3},{id:'simple-syrup',oz:0.5},{id:'lemon-lime',oz:2},{id:'lemon',count:1}] },
  { id:'pink-lemonade',   name:'Pink Lemonade',   mocktail:true, ingredients:[{id:'lemonade',oz:4},{id:'grenadine',oz:0.5},{id:'lemon',count:1}] },
  { id:'sparkling-lemonade', name:'Sparkling Lemonade', mocktail:true, ingredients:[{id:'lemonade',oz:3},{id:'soda-water',oz:2},{id:'lemon',count:1},{id:'mint',count:1}] },
  { id:'ginger-lemonade', name:'Ginger Lemonade', mocktail:true, ingredients:[{id:'lemonade',oz:3},{id:'ginger-beer',oz:2},{id:'lemon',count:1}] },
  { id:'virgin-pina-colada', name:'Virgin Pina Colada', mocktail:true, ingredients:[{id:'pineapple',oz:3},{id:'coconut-cream',oz:1.5},{id:'cherry',count:1}] },
  { id:'coconut-cooler',  name:'Coconut Cooler',  mocktail:true, ingredients:[{id:'pineapple',oz:2},{id:'coconut-cream',oz:1},{id:'soda-water',oz:2},{id:'lime',count:1}] },
  { id:'bay-breeze',      name:'Bay Breeze',      mocktail:true, ingredients:[{id:'cranberry',oz:3},{id:'pineapple',oz:1.5},{id:'lime',count:1}] },
  { id:'tropical-punch',  name:'Tropical Punch',  mocktail:true, ingredients:[{id:'pineapple',oz:2},{id:'oj',oz:2},{id:'grenadine',oz:0.5},{id:'orange',count:1},{id:'cherry',count:1}] },
  { id:'virgin-paloma',   name:'Virgin Paloma',   mocktail:true, ingredients:[{id:'grapefruit',oz:3},{id:'lime-juice',oz:0.5},{id:'soda-water',oz:2},{id:'lime',count:1}] },
  { id:'grapefruit-tonic', name:'Grapefruit Tonic', mocktail:true, ingredients:[{id:'grapefruit',oz:2},{id:'tonic-water',oz:3},{id:'lime',count:1}] },
  { id:'virgin-bellini',  name:'Virgin Bellini',  mocktail:true, ingredients:[{id:'peach',oz:2},{id:'lemon-lime',oz:2},{id:'orange',count:1}] },
];
// Bone Dry signature cocktails — the printed poster (Figma 688:2116), amounts exactly as printed
// (Night Shift + Grave Yard amounts updated by the user 2026-10-07).
// Locked until the poster's QR code is scanned (?unlock=signature), then ordered like any cocktail.
DRINKS.push(
  { id:'the-bone-dry',  name:'The Bone Dry', signature:true, ingredients:[{id:'gin',oz:1.5},{id:'tonic-water',oz:3},{id:'lime-juice',oz:0.5},{id:'lime',count:1}] },
  { id:'sour-skull',    name:'Sour Skull',   signature:true, ingredients:[{id:'whiskey',oz:1.5},{id:'cola',oz:3},{id:'lemon-juice',oz:0.5},{id:'lemon',count:1}] },
  { id:'funny-bone',    name:'Funny Bone',   signature:true, ingredients:[{id:'vodka',oz:1.5},{id:'cranberry',oz:1},{id:'lemon-lime',oz:3},{id:'lime-juice',oz:0.5},{id:'cherry',count:1}] },
  { id:'night-shift',   name:'Night Shift',  signature:true, ingredients:[{id:'white-rum',oz:1.5},{id:'ginger-beer',oz:3},{id:'lime-juice',oz:1},{id:'grenadine',oz:1},{id:'lime',count:1}] },
  { id:'skeletonic',    name:'Skeletonic',   signature:true, ingredients:[{id:'tequila',oz:1.5},{id:'tonic-water',oz:3},{id:'grenadine',oz:0.25},{id:'orange',count:1}] },
  { id:'grave-yard',    name:'Grave Yard',   signature:true, ingredients:[{id:'vodka',oz:1.5},{id:'simple-syrup',oz:1},{id:'soda-water',oz:3},{id:'mint',count:1}] },
);
const SIGNATURES = DRINKS.filter(d => d.signature);
const COCKTAILS = DRINKS.filter(d => !d.mocktail && !d.signature);
const MOCKTAILS = DRINKS.filter(d => d.mocktail);
// In cocktail mode about 1 order in 15 is a mocktail — only ones the cocktail shelf can make (user, 2026-10-07)
const MOCKTAIL_CHANCE = 1 / 15;
const SHELF_MOCKTAILS = MOCKTAILS.filter(d => d.ingredients.every(i => INGREDIENTS[i.id].type !== 'liquid' || COCKTAIL_SHELF.includes(i.id)));

// How garnish amounts read on the recipe card
const GARNISH_UNITS = { lime:'slice', lemon:'slice', orange:'slice', mint:'sprig', cherry:'' };

/* ═══════════════════════════════════════════════════════════════
   ART — swap bar background / counter here
═══════════════════════════════════════════════════════════════ */
const ART = {
  barBackground: 'assets/bar/background-030214.jpg',   // black recolored to #030214 (user, 2026-10-01; #12111D, #040318 were too light); original: background.jpg
  barCounter:    'assets/bar/counter-slate.png',   // slate indigo #3d3b70 (original purple: assets/bar/counter.png)
  glass:         'assets/glass-straight-on.png',
};

/* ═══════════════════════════════════════════════════════════════
   CUSTOMERS
   Box size (skeleton) and the selected image's rect inside it come from
   the Figma component sets on the "updates" page. `sink` lowers a
   customer behind the counter (purple sits 23px lower in the bar frames).
═══════════════════════════════════════════════════════════════ */
// `bubble`: speech bubble colors + where it sits over this customer (Figma 486:1923).
//   dx = bubble center relative to the customer's center, tail = tail's left edge relative to it.
const CUSTOMERS = {
  // Figma 527:134 "customers" (user, 2026-09-29): 10 customers. `sel` = selected art's box vs the skeleton's.
  // `sink` = px lower than standing on the counter line: hides where each drawing's own bottom
  // edge rounds off (and the PNG's straight edge) behind the counter — at least 3 for everyone.
  red:      { w:102,    h:224,    sel:{ x:-11,    y:-5.5,  w:124,    h:235 }, sink:3,             bubble:{ bg:'#c06b7f', text:'#551222', dx:-49, tail:-15.5 } },
  purple:   { w:108,    h:241,    sel:{ x:-8,     y:1.5,   w:124,    h:238 },  sink:23,  bubble:{ bg:'#9d9cb6', text:'#353454', dx:-41, tail:-7.5 } },
  yellow:   { w:130,    h:232,    sel:{ x:-2.5,   y:0,     w:135,    h:232 }, sink:9,             bubble:{ bg:'#c5c497', text:'#393308', dx:-35, tail:-1.5 } },   // hat guy (was "lime" in code)
  orange:   { w:101,    h:223,    sel:{ x:0,      y:-14.5, w:101,    h:252 }, sink:3,             bubble:{ bg:'#e6baa0', text:'#522408', dx:-41, tail:-7.5 } },
  pink:     { w:136.62, h:231.82, sel:{ x:-23.8,  y:-7.93, w:184.22, h:247.68 }, sink:6,          bubble:{ bg:'#c597b3', text:'#631041', dx:-41, tail:-7.5 } },
  // New (2026-09-29): bubble colors = each one's art color, muted like the Figma ones — swap for official colors
  lavender: { w:92.13,  h:225,    sel:{ x:-26.13, y:-3.1,  w:144.39, h:231.2 }, sink:7,           bubble:{ bg:'#9999c0', dx:-41, tail:-7.5 } },
  blue:     { w:95.19,  h:219.48, sel:{ x:-14.1,  y:-7.93, w:123.4,  h:235.34 }, sink:3,          bubble:{ bg:'#8fc1ca', dx:-41, tail:-7.5 } },
  lime:     { w:97.84,  h:223.88, sel:{ x:-17.63, y:-2.64, w:133.1,  h:229.17 }, sink:5,          bubble:{ bg:'#bac692', dx:-41, tail:-7.5 } },
  orange2:  { w:92.55,  h:224.77, sel:{ x:-4.85,  y:-4.41, w:102.25, h:233.58 }, sink:5,          bubble:{ bg:'#caa48f', dx:-41, tail:-7.5 } },
  teal:     { w:102.25, h:227.41, sel:{ x:-6.61,  y:-10.58,w:115.47, h:248.56 }, sink:3,          bubble:{ bg:'#8fcab9', dx:-41, tail:-7.5 } },
};
// Bubble on the counter, under the customer (Figma: orange example) — tail points up
const BUBBLE_BELOW = { dx:38.5, tail:-17.5 };

// How customers order (user, 2026-09-24) — same four for everyone, one picked per customer
const ORDER_LINES = ['{drink} please', '{drink}', 'one {drink}', 'just a {drink}'];
const orderLine = drink => ORDER_LINES[Math.floor(Math.random() * ORDER_LINES.length)].replace('{drink}', drink.name.toLowerCase());

// What each customer says after being served (user-approved, 2026-09-24). Kept vague on
// purpose — a hint, not a breakdown. Max 4 words; never "alcohol" or "drunk".
// Mood comes from scoreDrink(): perfect / good / strong / weak / sweet / off / bad / slow.
const REACTIONS = {
  red:    { perfect:'perfect, thank you!', good:'mm, lovely!', strong:'ooh, a little strong', weak:'a bit weak', sweet:'ooh, very sweet', off:'not quite right…', bad:'is this mine?', slow:'that took a while' },
  purple: { perfect:'splendid, thank you', good:"that'll do nicely", strong:"goodness, that's strong", weak:'rather weak', sweet:'a touch sweet', off:'not quite right', bad:'in my day…', slow:'took your time' },
  yellow: { perfect:'yooo perfect', good:'solid, thanks', strong:'woah. strong.', weak:'kinda weak ngl', sweet:'dang, sweet', off:'hm, not quite', bad:'bro, what?', slow:'finally lol' },
  pink:   { perfect:'okay, you ate', good:'not bad', strong:'heavy hand much?', weak:'forget something?', sweet:'too sweet, babe', off:'this is not it', bad:'absolutely not', slow:'took you long enough' },
  orange: { perfect:'perfect!! thank you!', good:'yay, thanks!', strong:'whoa, strong!', weak:'kinda weak?', sweet:'sooo sweet', off:'not quite right…', bad:'oh no…', slow:'finally, yay!' },
  // New customers' lines (user-approved, 2026-09-29)
  lavender: { perfect:"oh, it's perfect!", good:'lovely, thank you', strong:"oof, that's strong", weak:'hmm, kinda weak', sweet:'oh, so sweet', off:'not quite right…', bad:'oh… no thanks', slow:'that took forever' },
  blue:     { perfect:'perfect, thanks', good:"that's good", strong:"that's strong", weak:'a little weak', sweet:'pretty sweet', off:'not quite it', bad:'hm, no', slow:'took a bit' },
  lime:     { perfect:'omg perfect!', good:'cute, thanks!', strong:'ooh, strong!', weak:'a little weak?', sweet:'so sweet!', off:'hmm, not quite', bad:'um… what?', slow:'finally!' },
  orange2:  { perfect:'perfect, thanks pal', good:'good stuff', strong:'whoa, strong one', weak:'bit weak, bud', sweet:'real sweet', off:'not quite right', bad:'uh… nope', slow:'took a while, huh' },
  teal:     { perfect:'this is perfect!', good:'thanks so much!', strong:"oh, that's strong", weak:'kinda weak', sweet:"that's sweet!", off:'not quite right', bad:'oh… hm', slow:'that took a while' },
};
// Fallback for any customer added later without their own lines
const DEFAULT_REACTIONS = { perfect:'perfect, thanks!', good:'nice, thanks!', strong:'a little strong', weak:'a bit weak', sweet:'kinda sweet', off:'not quite right', bad:'hmm… no', slow:'that took a while' };
const CUSTOMER_IDS = Object.keys(CUSTOMERS);
const CUSTOMER_ART_V = 3;   // bump when customer art changes so phones reload it
const customerImg = (id, state) => `assets/customers/${id}-${state}.png?v=${CUSTOMER_ART_V}`;

// Slot centers (x) and counter top (y) from the bar frames
const SLOT_CX = [176, 399, 625];
const COUNTER_TOP = 348;

const SHIFT_SECONDS = 300;
const CONFIRM_MS = 1200;   // how long "ADDED ✓" / "GLASS EMPTIED ✓" / "GARNISH REMOVED ✓" stay before fading

/* ═══════════════════════════════════════════════════════════════
   PROGRESS
   Familiarity (user, 2026-09-25 — prototype rules): the first time a drink comes up,
   its recipe opens by itself and re-opening it is free ("new"). After that ("familiar")
   the recipe is always one tap away, but every peek costs PEEK_COST (after a confirm).
   No "mastered" tier. Which drinks you've made is NOT saved — it starts over every time
   the app opens, so a class demo plays like a first time. Shift history is still saved.
═══════════════════════════════════════════════════════════════ */
const SAVE_KEY = 'boneDry.progress.v1';
const PEEK_COST = 0.50;   // tip lost for each peek at a familiar recipe

function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (p) return { drinks: {}, shifts: p.shifts || [] };
  } catch (e) { /* no saved progress yet */ }
  return { drinks: {}, shifts: [] };
}
const PROGRESS = loadProgress();

function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ shifts: PROGRESS.shifts })); } catch (e) { /* storage unavailable */ }
}

function timesMade(drinkId) {
  return PROGRESS.drinks[drinkId]?.made || 0;
}

function tierOf(drinkId) {
  return timesMade(drinkId) === 0 ? 'new' : 'familiar';
}

/* ═══════════════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════════════ */
const G = {
  screen: 'bar',
  tips: 0,
  shiftRemaining: SHIFT_SECONDS, // bar timer: counts down in the background
  drinkElapsed: 0,               // per-drink timer: counts up, resets each order
  shiftOver: false,              // timer hit 0 — finish the current drink, then end
  timerRunning: false,           // false while paused
  tickInterval: null,
  nextArrivalIn: 1,              // seconds until the next customer walks up
  dial: 0.35,                    // hidden difficulty: 0 = calm, 1 = rush (reset from PACE.startDial)
  customers: [],    // [{type, drink, state:'skeleton'|'selected'|'served', slot, el}]
  selectedIdx: null,
  lastDrinkId: null,
  drinksServed: 0,
  shelf: { order: [], selected: null, toast: null },
  drink: {
    forCustomer: null,   // index in G.customers
    recipe: null,
    poured: [],          // totals per ingredient [{id, oz?, count?}] — used for scoring
    layers: [],          // every pour in order [{id, oz}] — drawn as bands in the glass
    garnishes: [],       // placed on the drink [{id, spot}]
    tier: 'new',         // new | familiar (when the order started)
    peeks: 0,            // paid peeks at the recipe on a familiar drink
    activeIngredient: null,
  },
  pour: {
    ingredientId: null,
    mode: 'liquid',
    ozPoured: 0,
    pouring: false,
    lastTick: 0,
    garnishPlaced: [],
    dragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
  },
  rafId: null,
  shiftEnded: false,
};

/* ═══════════════════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const dom = {
  viewport:         $('viewport'),
  game:             $('game'),
  screens: {
    home:           $('screen-home'),
    menu:           $('screen-menu'),
    bar:            $('screen-bar'),
    shelf:          $('screen-shelf'),
    pour:           $('screen-pour'),
    garnish:        $('screen-garnish'),
    end:            $('screen-end'),
    profile:        $('screen-profile'),
    leaderboard:    $('screen-leaderboard'),
  },
  overlay:          $('overlay-recipe'),
  recipeCard:       $('recipe-card'),

  barBg:            $('bar-bg'),
  barCounter:       $('bar-counter'),
  counterDrinks:    $('counter-drinks'),
  barTips:          $('bar-tips'),
  barPause:         $('bar-pause'),
  speechArea:       $('speech-area'),
  speechText:       $('speech-text'),
  speechCanvas:     $('speech-canvas'),
  btnStartOrder:    $('btn-start-order'),

  shelfTimer:       $('shelf-timer'),
  shelfPause:       $('shelf-pause'),
  btnPourOut:       $('btn-pour-out'),
  shelfRow:         $('shelf-row'),
  shelfTitle:       $('shelf-title'),
  btnPour:          $('btn-pour'),
  shelfAdded:       $('shelf-added'),
  shelfAddedText:   $('shelf-added-text'),
  btnToBar:         $('btn-to-bar'),
  btnToGarnish:     $('btn-to-garnish'),
  btnBackToPour:    $('btn-back-to-pour'),

  pourTimer:        $('pour-timer'),
  pourPause:        $('pour-pause'),
  btnBack:          $('btn-back-to-shelf'),
  btnDone:          $('btn-pour-done'),

  pourBottle:       $('pour-bottle-img'),
  pourGlass:        $('pour-glass'),
  pourLiquid:       $('pour-liquid'),

  endTips:          $('end-tips'),
  btnPlayAgain:     $('btn-play-again'),

  pauseOverlay:     $('pause-overlay'),
  notifLayer:       $('notification-layer'),
};

/* ═══════════════════════════════════════════════════════════════
   VIEWPORT SCALING
═══════════════════════════════════════════════════════════════ */
let scale = 1;

function updateScale() {
  scale = Math.min(window.innerWidth / 844, window.innerHeight / 390);
  dom.viewport.style.transform = `scale(${scale})`;
  // Center
  const sw = 844 * scale;
  const sh = 390 * scale;
  dom.viewport.style.left = Math.max(0, (window.innerWidth  - sw) / 2) + 'px';
  dom.viewport.style.top  = Math.max(0, (window.innerHeight - sh) / 2) + 'px';
  dom.viewport.style.position = 'fixed';
}
window.addEventListener('resize', updateScale);
updateScale();

/* ═══════════════════════════════════════════════════════════════
   SCREEN MANAGEMENT
═══════════════════════════════════════════════════════════════ */
function showScreen(name) {
  G.screen = name;
  Object.values(dom.screens).forEach(s => s.classList.remove('active'));
  if (dom.screens[name]) dom.screens[name].classList.add('active');
  // Recipe card closes whenever you change screens
  dom.recipeCard.classList.remove('slide-up'); dom.overlay.classList.remove('open', 'shown');
  updateTimerDisplays();
}

/* ═══════════════════════════════════════════════════════════════
   TIMER
═══════════════════════════════════════════════════════════════ */
function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// One game clock drives the shift countdown, the per-drink timer and arrivals.
const TICK = 0.1; // seconds

function startTimer() {
  if (G.tickInterval) clearInterval(G.tickInterval);
  G.timerRunning = true;
  G.tickInterval = setInterval(tick, TICK * 1000);
}

function stopTimer() {
  G.timerRunning = false;
  if (G.tickInterval) { clearInterval(G.tickInterval); G.tickInterval = null; }
}

function tick() {
  if (!G.timerRunning || G.shiftEnded) return;

  if (!G.shiftOver) {
    G.shiftRemaining = Math.max(0, G.shiftRemaining - TICK);
    if (G.shiftRemaining === 0) onShiftTimeUp();
  }

  if (G.drink.forCustomer !== null) G.drinkElapsed += TICK;

  if (!G.shiftOver) {
    G.nextArrivalIn -= TICK;
    if (G.nextArrivalIn <= 0) trySpawnCustomer();
  }

  updateCallOuts();
  updateTimerDisplays();
}

/* Waiting customers call out (user, 2026-10-01): if nobody taps a customer for
   CALL_AFTER seconds, they say one of these over their head in white text, then a different one
   every few seconds until they're tapped. (Briefly speech bubbles on 2026-10-11 — the user
   preferred the text. Figma 740:101.) */
const CALL_OUTS = ['excuse me!', 'hello?', 'over here!', 'hey, bartender!', 'um, hi?', 'can i order?',
                   'ahem…', 'anyone there?', 'psst!', "i'm ready!", 'still waiting…', 'yoo-hoo!'];
const CALL_AFTER = 2.5;   // seconds of waiting before the first call-out (user, 2026-10-01: was 6)
const CALL_SHOW  = 2.5;   // each phrase stays this long…
const CALL_GAP   = 1.5;   // …then a short pause before the next one

const HINT_AFTER = 2;     // seconds on the bar before "TAP A CUSTOMER TO SERVE" shows (user, 2026-10-11)

function updateCallOuts() {
  if (G.hintWait > 0 && (G.hintWait -= TICK) <= 0) $('tap-hint').classList.add('show');
  [0, 1, 2].forEach(slot => {
    const c = G.customers[slot], el = $(`callout-${slot}`);
    const waiting = c && c.state === 'skeleton' && G.drink.forCustomer !== slot && dom.speechArea.style.display === 'none';   // quiet while an order bubble is up
    if (!waiting) {
      if (c) { c.waited = 0; c.callTimer = 0; }
      el.classList.remove('show');
      return;
    }
    c.waited = (c.waited || 0) + TICK;
    if (c.waited < CALL_AFTER) return;
    c.callTimer = (c.callTimer || 0) - TICK;
    if (c.callTimer > 0) return;
    if (el.classList.contains('show')) {
      el.classList.remove('show');
      c.callTimer = CALL_GAP;
    } else {
      const options = CALL_OUTS.filter(p => p !== c.lastCall);
      c.lastCall = options[Math.floor(Math.random() * options.length)];
      el.textContent = c.lastCall;
      const spec = CUSTOMERS[c.type];
      el.style.left = SLOT_CX[slot] + 'px';
      el.style.top = (COUNTER_TOP + (spec.sink || 0) - spec.h - 37) + 'px';   // 14px over their head (Figma 740:101)
      el.classList.add('show');
      c.callTimer = CALL_SHOW;
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   SOUND (user, 2026-10-11) — a pouring loop while you hold to pour and a pop when a garnish
   lands. SOUND ON/OFF lives on the pause screen and is remembered. No background music: the
   user tried a track and took it out (2026-10-12).
   Files: pour.mp3 (Freesound 235555 by simosco, CC0), pop.mp3 (Freesound 245645 by unfa, CC0).
   Web Audio, so volumes work on iPhone; the context is created on the first tap.
═══════════════════════════════════════════════════════════════ */
const SOUND_KEY = 'bonedry-sound';
let soundOn = true;
try { soundOn = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { /* storage unavailable */ }
const Sound = (() => {
  const VOL = { pour: 0.55, pop: 0.8 };
  let ctx = null, master, pourGain, pourSrc = null;
  const buf = {};
  function load(name) {
    fetch(`assets/audio/${name}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
      .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .then(b => { buf[name] = b; }).catch(() => { /* file missing — that sound just stays silent */ });
  }
  // Must run inside a tap/click the first time (phones block audio before that)
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iOS: follows the ring switch */ }
    master = ctx.createGain(); master.gain.value = soundOn ? 1 : 0; master.connect(ctx.destination);
    pourGain = ctx.createGain(); pourGain.gain.value = 0; pourGain.connect(master);
    load('pour'); load('pop');
  }
  function pour(on) {
    if (!ctx) return;
    const t = ctx.currentTime;
    if (on && !pourSrc && buf.pour && soundOn) {
      pourSrc = ctx.createBufferSource(); pourSrc.buffer = buf.pour; pourSrc.loop = true;
      const d = buf.pour.duration; pourSrc.loopStart = Math.min(0.6, d * 0.2); pourSrc.loopEnd = Math.max(d - 0.6, d * 0.8);
      pourSrc.connect(pourGain); pourSrc.start(0, pourSrc.loopStart);
      pourGain.gain.cancelScheduledValues(t); pourGain.gain.setValueAtTime(0, t); pourGain.gain.linearRampToValueAtTime(VOL.pour, t + 0.06);
    } else if (!on && pourSrc) {
      const src = pourSrc; pourSrc = null;
      pourGain.gain.cancelScheduledValues(t); pourGain.gain.setValueAtTime(pourGain.gain.value, t); pourGain.gain.linearRampToValueAtTime(0, t + 0.09);
      try { src.stop(t + 0.1); } catch (e) {}
    }
  }
  function pop() {
    if (!ctx || !buf.pop || !soundOn) return;
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf.pop; g.gain.value = VOL.pop; src.connect(g); g.connect(master); src.start();
  }
  function setOn(on) {
    soundOn = on;
    try { localStorage.setItem(SOUND_KEY, on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    if (!ctx) return;
    master.gain.value = on ? 1 : 0;
    if (!on) pour(false);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pour(false); });
  return { init, pour, pop, setOn };
})();
function refreshSoundButton() {
  const b = $('btn-sound');
  b.classList.toggle('off', !soundOn);
  b.setAttribute('aria-pressed', soundOn);
  $('sound-label').textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
}

function pauseToggle() {
  if (G.shiftEnded) return;
  G.timerRunning = !G.timerRunning;
  dom.pauseOverlay.style.display = G.timerRunning ? 'none' : 'block';
  dom.game.classList.toggle('paused', !G.timerRunning);
  Sound.pour(false);
}

// Keyboard: P pauses / resumes during a shift (Studio Arcade kiosk rule — Esc belongs to the arcade, so it's never used here)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'p' && e.key !== 'P') return;
  if (e.repeat || G.shiftEnded || !['bar', 'shelf', 'pour', 'garnish'].includes(G.screen)) return;
  e.preventDefault();
  pauseToggle();
});

function updateTimerDisplays() {
  const left = Math.ceil(G.shiftRemaining);   // bar screen: time left in the shift, m:ss (Figma 740:80)
  $('bar-timer').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const t = formatTime(Math.floor(G.drinkElapsed));
  dom.shelfTimer.textContent = t;
  dom.pourTimer.textContent  = t;
  $('garnish-timer').textContent = t;
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════════════════ */
function showNotif(msg) {
  const el = document.createElement('div');
  el.className = 'notification';
  el.textContent = msg;
  dom.notifLayer.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function showTipFloat(msg, slotIdx) {
  // "$2" sits above the served customer (Figma: x = customer center - 16, y = 79)
  const el = document.createElement('div');
  el.className = 'bar-tip-float';
  el.textContent = msg;
  el.style.left = (SLOT_CX[slotIdx] - 16) + 'px';
  dom.screens.bar.appendChild(el);
  return el;
}

/* ═══════════════════════════════════════════════════════════════
   DIFFICULTY DIAL — fast-paced: the bar fills quickly and keeps
   refilling; the dial climbs with every drink, eases off only at the very end.
═══════════════════════════════════════════════════════════════ */
const PACE = {
  startDial:   0.35,  // difficulty at the start of a shift (0 calm … 1 rush)
  calmGap:     4,     // seconds between customers at dial 0
  rushGap:     1.5,   // seconds between customers at dial 1
  refillGap:   1,     // when the bar is full, next customer steps up this soon after a spot opens
  taperSecs:   30,    // ease off over the last N seconds
  lastCallSecs:15,    // no new customers in the last N seconds
};
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

function effectiveDial() {
  const taper = Math.min(1, G.shiftRemaining / PACE.taperSecs);
  return G.dial * taper;
}

function scheduleNextArrival() {
  const gap = lerp(PACE.calmGap, PACE.rushGap, effectiveDial());
  G.nextArrivalIn = gap * (0.8 + Math.random() * 0.4);
}

function updateDial(score, drinkTime, peeked) {
  // score 0–100, drinkTime in seconds — every drink pushes the pace up; good ones push harder
  const accuracy = score / 100;
  const speed = drinkTime < 30 ? 1 : drinkTime < 60 ? 0.6 : drinkTime < 120 ? 0.3 : 0;
  const perf = 0.6 * accuracy + 0.25 * speed + 0.15 * (peeked ? 0 : 1);
  G.dial = Math.max(0.2, Math.min(1, G.dial + 0.08 + (perf - 0.5) * 0.3));
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOMER MANAGEMENT
═══════════════════════════════════════════════════════════════ */
// MOCKTAILS ONLY toggle on home (Figma 606:554 / 606:942). Remembered between visits.
const MODE_KEY = 'bonedry-mocktails-only';
let mocktailsOnly = false;
try { mocktailsOnly = localStorage.getItem(MODE_KEY) === '1'; } catch (e) { /* storage unavailable */ }
const shelfIds = () => mocktailsOnly ? MOCKTAIL_SHELF : COCKTAIL_SHELF;

// Signature menu: unlocked by scanning the poster's QR code, which opens the game at
// https://sicilyrose4.github.io/bone-dry/?unlock=signature — keep handling that address
// forever, printed posters depend on it. Saved on this phone's browser.
const SIGNATURE_KEY = 'bonedry-signature-unlocked';
let signatureUnlocked = false;
try { signatureUnlocked = localStorage.getItem(SIGNATURE_KEY) === '1'; } catch (e) { /* storage unavailable */ }
const cocktailPool = () => signatureUnlocked ? [...COCKTAILS, ...SIGNATURES] : COCKTAILS;
// Every drink a customer could order in this mode (also what the drink menu shows — signatures first)
const menuDrinks = () => mocktailsOnly ? MOCKTAILS : [...(signatureUnlocked ? SIGNATURES : []), ...COCKTAILS, ...SHELF_MOCKTAILS];

function pickDrink() {
  // Calm → more new drinks; as the dial climbs, drinks you've already made show up more
  const d = effectiveDial();
  const weight = { new: 0.6 * (1 - d) + 0.1, familiar: 0.8 + 0.7 * d };
  // Cocktail mode: mostly cocktails, now and then a mocktail (never two in a row)
  const lastWasMock = MOCKTAILS.some(x => x.id === G.lastDrinkId);
  const source = mocktailsOnly ? MOCKTAILS
    : (!lastWasMock && Math.random() < MOCKTAIL_CHANCE) ? SHELF_MOCKTAILS : cocktailPool();
  const pool = source.filter(x => x.id !== G.lastDrinkId);
  const total = pool.reduce((sum, x) => sum + weight[tierOf(x.id)], 0);
  let r = Math.random() * total;
  let pick = pool[pool.length - 1];
  for (const x of pool) { r -= weight[tierOf(x.id)]; if (r <= 0) { pick = x; break; } }
  G.lastDrinkId = pick.id;
  return pick;
}

function trySpawnCustomer() {
  // Last call: nobody new near the end — they couldn't be served in time
  if (G.shiftRemaining < PACE.lastCallSecs) { scheduleNextArrival(); return; }
  const empty = [0, 1, 2].filter(i => !G.customers[i]);
  // Bar full: check again shortly so a freed spot refills right away
  if (!empty.length) { G.nextArrivalIn = PACE.refillGap; return; }
  scheduleNextArrival();
  const slot = empty[Math.floor(Math.random() * empty.length)];
  createCustomer(slot, nextCustomerType());
}

// Who walks in next (user, 2026-09-29): every customer comes through once, in a random
// order, before anyone repeats — a served customer is never replaced by a copy of themselves.
const RECENT_GUARD = 3;   // someone who just left can't come back until this many others have
function nextCustomerType() {
  const present = G.customers.filter(Boolean).map(c => c.type);
  const ok = t => !present.includes(t) && !G.recentTypes.includes(t);
  if (!G.customerQueue.some(ok)) {
    // New round: everyone, shuffled — whoever was just here goes to the back of the line
    const recent = [...present, ...G.recentTypes];
    G.customerQueue.push(...shuffleArray(CUSTOMER_IDS.filter(t => !recent.includes(t))),
                         ...shuffleArray(CUSTOMER_IDS.filter(t => recent.includes(t))));
  }
  let i = G.customerQueue.findIndex(ok);
  if (i < 0) i = G.customerQueue.findIndex(t => !present.includes(t));
  return G.customerQueue.splice(i, 1)[0];
}
function noteCustomerLeft(type) {
  G.recentTypes = [type, ...G.recentTypes].slice(0, RECENT_GUARD);
}

function createCustomer(slot, type) {
  const el = document.getElementById(`slot-${slot}`);
  const drink = pickDrink();
  const customer = { type, drink, line: orderLine(drink), state: 'skeleton', slot, el };
  G.customers[slot] = customer;
  renderCustomer(slot);
  el.classList.remove('leaving');
  el.classList.add('arriving');
  setTimeout(() => el.classList.remove('arriving'), 650);
  return customer;
}

function renderCustomer(slot) {
  const c = G.customers[slot];
  const el = document.getElementById(`slot-${slot}`);
  el.innerHTML = '';
  if (!c) { el.style.display = 'none'; return; }

  const spec = CUSTOMERS[c.type];
  el.style.display = 'block';
  el.style.width  = spec.w + 'px';
  el.style.height = spec.h + 'px';
  el.style.left   = (SLOT_CX[slot] - spec.w / 2) + 'px';
  el.style.top    = (COUNTER_TOP + (spec.sink || 0) - spec.h) + 'px';

  const img = document.createElement('img');
  img.alt = c.type + ' customer';
  const showSelected = c.state === 'selected' || c.state === 'served';
  const r = showSelected ? spec.sel : { x: 0, y: 0, w: spec.w, h: spec.h };
  img.src = customerImg(c.type, showSelected ? 'selected' : 'skeleton');
  img.style.left = r.x + 'px';
  img.style.top = r.y + 'px';
  img.style.width = r.w + 'px';
  img.style.height = r.h + 'px';
  el.appendChild(img);
}

// Tapping a customer clears what everyone else is saying (user, 2026-10-05): a served
// customer's reaction + tip and any "excuse me!" call-outs fade right away, so nothing
// stacks on top of the new order bubble.
function clearCustomerChatter() {
  document.querySelectorAll('.bar-tip-float, .speech-bubble.reaction').forEach(e => e.classList.add('leaving'));
  document.querySelectorAll('.callout').forEach(e => e.classList.remove('show'));
  $('tap-hint').classList.remove('show');   // they've tapped a customer — the hint has done its job
  G.hintWait = 0;
}

function selectCustomer(slot) {
  if (G.shiftEnded) return;
  // While a drink is being made, customers can't be switched or deselected
  if (G.drink.forCustomer !== null) return;
  const c = G.customers[slot];
  if (!c || c.state === 'served') return;

  // Tapping the selected customer again deselects them
  if (slot === G.selectedIdx) {
    c.state = 'skeleton';
    renderCustomer(slot);
    G.selectedIdx = null;
    hideSpeechArea();
    refreshBarControls();
    return;
  }

  clearCustomerChatter();
  const prev = G.selectedIdx;
  if (prev !== null && G.customers[prev] && G.customers[prev].state === 'selected') {
    G.customers[prev].state = 'skeleton';
    renderCustomer(prev);
  }
  G.selectedIdx = slot;
  c.state = 'selected';
  renderCustomer(slot);
  showSpeechArea(c.line, slot);   // orders are lowercase (Figma 459:1276)
  refreshBarControls();
}

function showSpeechArea(text, slotIdx) {
  placeBubble(dom.speechArea, dom.speechText, dom.speechCanvas, text, slotIdx, true);
  // The order bubble wins: clear any reaction bubble it would cover
  const box = dom.speechArea.getBoundingClientRect();
  document.querySelectorAll('.speech-bubble.reaction').forEach(r => {
    const o = r.getBoundingClientRect();
    if (o.left < box.right && o.right > box.left && o.top < box.bottom && o.bottom > box.top) r.remove();
  });
}

// Lay out one A6 bubble over a customer. `mayGoBelow`: the order bubble drops onto the
// counter when "above" would touch the tips / pause (never for the far-right customer);
// reaction bubbles slide sideways instead, since the served drink sits on the counter.
function placeBubble(area, textEl, canvas, text, slotIdx, mayGoBelow) {
  const c = G.customers[slotIdx];
  const style = CUSTOMERS[c.type].bubble;
  const cx = SLOT_CX[slotIdx];
  textEl.textContent = text;
  area.style.setProperty('--bubble-text', style.bg);   // A6: text in the outline color
  area.classList.remove('below');
  area.style.display = 'flex';
  const w = area.offsetWidth;
  const clampLeft = l => Math.min(Math.max(l, 8), 844 - w - 8);

  let left = clampLeft(cx + style.dx - w / 2);
  let tailX = cx + style.tail;
  if (bubbleHitsTopRow(left, w)) {
    if (mayGoBelow && slotIdx !== 2) {
      area.classList.add('below');
      left = clampLeft(cx + BUBBLE_BELOW.dx - w / 2);
      tailX = cx + BUBBLE_BELOW.tail;
    } else if (!mayGoBelow) {
      const GAP = 10, minLeft = 30 + dom.barTips.offsetWidth + GAP, maxLeft = TOP_ROW_RIGHT - GAP - w;
      left = Math.min(Math.max(left, minLeft), maxLeft);
    }
  }
  // `tail` offsets were measured for Figma's 30.5px tail — keep the same center for the narrower one
  tailX += (30.5 - BUBBLE_TAIL_W) / 2;
  const tailLeft = Math.min(Math.max(tailX - left, 14), w - 14 - BUBBLE_TAIL_W);
  area.style.left = left + 'px';
  drawChalkBubble(canvas, w, area.offsetHeight, tailLeft, style.bg, area.classList.contains('below'), c.type.length);
}

// Reaction after serving: the customer's A6 bubble with their line for this mood
function showReaction(slotIdx, mood) {
  const line = (REACTIONS[G.customers[slotIdx].type] || DEFAULT_REACTIONS)[mood];
  if (!line) return null;
  const area = document.createElement('div');
  area.className = 'speech-bubble reaction';
  area.innerHTML = '<div class="speech-text"></div><canvas aria-hidden="true"></canvas>';
  dom.screens.bar.appendChild(area);
  placeBubble(area, area.firstChild, area.lastChild, line, slotIdx, false);
  return area;
}

/* Speech bubble style "A6" (user, 2026-09-24): dark fill, chalky outline in the
   customer's color, radius 6, short straight tail. Drawn on a canvas, like the liquid. */
const BUBBLE_R = 6, BUBBLE_TAIL_W = 22, BUBBLE_TAIL_H = 16, BUBBLE_LINE = 3.2, BUBBLE_WOBBLE = 0.8;
const BUBBLE_FILL = 'rgba(4, 3, 24, 0.9)';

// Outline of the bubble (clockwise, box 0,0–w,h) with the tail hanging off the bottom edge
function bubbleOutline(w, h, tailLeft, seed) {
  const r = BUBBLE_R, step = 3, pts = [], P = Math.PI;
  const line = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
  };
  const arc = (cx, cy, a0) => { for (let i = 0; i < 4; i++) { const a = a0 + (P / 2) * i / 4; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  const tl = tailLeft, tr = tailLeft + BUBBLE_TAIL_W, tip = [tailLeft + BUBBLE_TAIL_W * 0.45, h + BUBBLE_TAIL_H];
  line(r, 0, w - r, 0);            arc(w - r, r, -P / 2);
  line(w, r, w, h - r);            arc(w - r, h - r, 0);
  line(w - r, h, tr, h);           line(tr, h, tip[0], tip[1]);   line(tip[0], tip[1], tl, h);
  line(tl, h, r, h);               arc(r, h - r, P / 2);
  line(0, h - r, 0, r);            arc(r, r, P);
  // Hand-drawn wobble: nudge every point along its normal by a few overlapping waves
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let nx = b[1] - a[1], ny = a[0] - b[0];
    const L = Math.hypot(nx, ny) || 1;
    const t = i / n * 2 * P;
    const o = BUBBLE_WOBBLE * (Math.sin(t * 5 + seed) + 0.6 * Math.sin(t * 11 + seed * 2.3) + 0.3 * Math.sin(t * 23 + seed * 0.7));
    return [p[0] + nx / L * o, p[1] + ny / L * o];
  });
}

// Paint a bubble of box size w×h onto `canvas` (sits behind the text). Below = tail points up.
function drawChalkBubble(canvas, w, h, tailLeft, color, below, seed) {
  const pad = 6, cw = w + 2 * pad, ch = h + BUBBLE_TAIL_H + 2 * pad;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.ceil(cw * dpr);
  canvas.height = Math.ceil(ch * dpr);
  Object.assign(canvas.style, {
    left: -pad + 'px', top: (below ? -(BUBBLE_TAIL_H + pad) : -pad) + 'px',
    width: cw + 'px', height: ch + 'px', transform: below ? 'scaleY(-1)' : 'none',
  });
  const pts = bubbleOutline(w, h, tailLeft, seed);
  const trace = ctx => {
    ctx.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
    ctx.beginPath();
    pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  };
  const ctx = canvas.getContext('2d');
  trace(ctx);
  ctx.fillStyle = BUBBLE_FILL;
  ctx.fill();
  // Chalky outline: stroke on its own layer, knock grain out of it, then lay it on top
  const line = document.createElement('canvas');
  line.width = canvas.width; line.height = canvas.height;
  const lc = line.getContext('2d');
  trace(lc);
  lc.strokeStyle = color;
  lc.lineWidth = BUBBLE_LINE;
  lc.lineJoin = 'round';
  lc.stroke();
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.globalCompositeOperation = 'destination-in';
  lc.fillStyle = lc.createPattern(grainTile(), 'repeat');
  lc.fillRect(0, 0, line.width, line.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(line, 0, 0);
}

const TOP_ROW_RIGHT = 733;   // the shift timer starts here (then the pause bars at 800)
// Would a bubble at the top (y 45–93) touch the tips amount or the shift timer?
function bubbleHitsTopRow(left, w) {
  const GAP = 10;
  const tipsRight = 30 + dom.barTips.offsetWidth;          // "$0.00" starts at x=30
  return left < tipsRight + GAP || left + w > TOP_ROW_RIGHT - GAP;
}

function hideSpeechArea() {
  dom.speechArea.style.display = 'none';
  dom.speechText.textContent = '';
}

/* ═══════════════════════════════════════════════════════════════
   RECIPE CARD — Figma 502:1932
═══════════════════════════════════════════════════════════════ */
// Scratchy rules (user): its E is drawn small, so every E is 8px bigger than the rest,
// and the letter right before an E sits a little tighter (-2.25px at 45px = 5% of the size).
function scratchyHTML(text, size) {
  const chars = [...text];
  return chars.map((ch, i) => {
    const isE = ch.toUpperCase() === 'E';
    const beforeE = chars[i + 1] && chars[i + 1].toUpperCase() === 'E' && ch !== ' ';
    const style = [];
    if (isE) style.push(`font-size:${(size * (1 + 8 / 45)).toFixed(1)}px`);   // +8px at the 45px title size — scaled for smaller text
    if (beforeE) style.push(`letter-spacing:${-(size * 0.05).toFixed(2)}px`);
    return style.length ? `<span style="${style.join(';')}">${ch}</span>` : ch;
  }).join('');
}

function recipeLine(ing) {
  const name = INGREDIENTS[ing.id].name.toLowerCase();
  let amount;
  if (ing.oz) amount = `${ing.oz} oz`;
  else {
    const unit = GARNISH_UNITS[ing.id] ?? '';
    amount = unit ? `${ing.count} ${unit}${ing.count > 1 ? 's' : ''}` : `${ing.count}`;
  }
  return `<div><span class="ing">${name}</span> - ${amount}</div>`;
}

function openRecipe(drink) {
  // Title: shrink to fit 260px if the name is long (E stays +8px)
  const title = $('recipe-title');
  let size = 45;
  title.innerHTML = scratchyHTML(drink.name.toUpperCase(), size);
  title.style.fontSize = size + 'px';
  dom.overlay.classList.add('open');           // needs layout to measure
  while (title.scrollWidth > 260 && size > 26) {
    size -= 1;
    title.style.fontSize = size + 'px';
    title.innerHTML = scratchyHTML(drink.name.toUpperCase(), size);
  }
  // Ingredients: 28px as designed; smaller when a recipe has more lines
  const list = $('recipe-list');
  const n = drink.ingredients.length;
  let fs = n <= 3 ? 28 : n === 4 ? 25 : n === 5 ? 21 : 19;
  list.style.fontSize = fs + 'px';
  list.style.lineHeight = '';
  list.innerHTML = drink.ingredients.map(recipeLine).join('');
  // Longer recipes: tighten + shrink until the space under the mini drink (to the screen's bottom
  // edge, where the card runs off) matches the 37px above the title (user, 2026-10-11)
  const listBottom = () => 62 + list.offsetTop + list.offsetHeight;   // card sits at y=62
  const limit = 390 - 37 - 59.5 - 13;                                   // mini drink (59.5 + 13 gap) below it
  if (listBottom() > limit) list.style.lineHeight = '1.22';
  while (listBottom() > limit && fs > 15) list.style.fontSize = (fs -= 0.5) + 'px';
  if (listBottom() > limit) list.style.lineHeight = '1.08';            // very long ones (Long Island)
  while (listBottom() > limit && fs > 12) list.style.fontSize = (fs -= 0.5) + 'px';
  // Mini drink: what the finished drink should look like
  const poured = drink.ingredients.filter(i => i.oz).map(i => ({ id: i.id, oz: i.oz }));
  const garnishes = [];
  drink.ingredients.filter(i => i.count).forEach(i => {
    for (let k = 0; k < i.count; k++) garnishes.push({ id: i.id, spot: garnishSpot(i.id, garnishes) });
  });
  renderDrinkView($('recipe-drink'), poured, garnishes);

  // Move in: card slides up while the dark layer fades in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dom.recipeCard.classList.add('slide-up');
    dom.overlay.classList.add('shown');
  }));
}

function closeRecipe() {
  dom.recipeCard.classList.remove('slide-up');
  dom.overlay.classList.remove('shown');
  setTimeout(() => {
    if (!dom.recipeCard.classList.contains('slide-up')) dom.overlay.classList.remove('open');
  }, 350);
}

/* ═══════════════════════════════════════════════════════════════
   SHELF SCREEN
   One swipeable row. Tap a bottle to select it (tap again to deselect),
   POUR opens the pour screen. The order shuffles every new order.
═══════════════════════════════════════════════════════════════ */
function ingPath(id) {
  return `assets/ingredients-bd/${INGREDIENTS[id].file}`;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The last visible bottle must be cut off by the right edge (like the OJ in Figma)
// so it's obvious the row scrolls. Bottles start at x=38 with 56px gaps (buildShelf sets the row's gap from SHELF_GAP).
const SHELF_START_X = 38, SHELF_GAP = 56, SCREEN_W = 844;
function edgeBottleVisible(order) {
  let x = SHELF_START_X;
  for (const id of order) {
    const [w] = shelfSize(id);
    if (x < SCREEN_W && x + w > SCREEN_W) return (SCREEN_W - x) / w;   // fraction showing
    x += w + SHELF_GAP;
  }
  return null; // edge fell in a gap
}
function shuffleShelfOrder() {
  let order;
  for (let tries = 0; tries < 500; tries++) {
    order = shuffleArray(shelfIds());
    const v = edgeBottleVisible(order);
    if (v !== null && v >= 0.3 && v <= 0.75) break;
  }
  return order;
}

function buildShelf() {
  G.shelf.order = shuffleShelfOrder();
  dom.shelfRow.innerHTML = '';
  dom.shelfRow.style.gap = SHELF_GAP + 'px';
  dom.shelfRow.scrollLeft = 0;
  G.shelf.order.forEach(id => {
    const ing = INGREDIENTS[id];
    const el = document.createElement('div');
    el.className = 'shelf-bottle' + (ing.outline ? '' : ' traced');
    el.dataset.id = id;
    const [w, h] = shelfSize(id), k = h / ing.shelf[1];
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    const img = document.createElement('img');
    img.className = 'bottle';
    img.src = ingPath(id);
    img.alt = ing.name;
    el.appendChild(img);
    if (ing.outline) {
      const o = document.createElement('img');
      o.className = 'outline';
      o.src = ing.outline.src;
      o.alt = '';
      Object.assign(o.style, { left: ing.outline.x * k + 'px', top: ing.outline.y * k + 'px', width: ing.outline.w * k + 'px', height: ing.outline.h * k + 'px' });
      el.appendChild(o);
    }
    el.addEventListener('click', () => toggleBottle(id));
    dom.shelfRow.appendChild(el);
  });
}

function toggleBottle(id) {
  if (G.screen !== 'shelf' || !G.timerRunning) return;
  G.shelf.selected = G.shelf.selected === id ? null : id;
  G.shelf.toast = null;
  renderShelf();
}

function renderShelf() {
  const sel = G.shelf.selected;
  dom.shelfRow.querySelectorAll('.shelf-bottle').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === sel);
  });
  if (sel) {
    dom.shelfTitle.textContent = INGREDIENTS[sel].name.toUpperCase();
    dom.shelfTitle.classList.add('ingredient');
  } else {
    dom.shelfTitle.textContent = G.drink.recipe ? G.drink.recipe.name.toUpperCase() : '';
    dom.shelfTitle.classList.remove('ingredient');
  }
  dom.btnPour.style.display = sel ? '' : 'none';
  // Confirmation: "WHISKEY ADDED ✓" / "GLASS EMPTIED ✓"
  const added = !sel && G.shelf.toast;
  dom.shelfAdded.style.display = added ? 'flex' : 'none';
  if (added) dom.shelfAddedText.textContent = G.shelf.toast;
  if (added && !G.shelf.addedShown) {
    // fades out after CONFIRM_MS
    G.shelf.addedShown = true;
    dom.shelfAdded.classList.remove('fading');
    clearTimeout(G.shelf.addedTimer);
    G.shelf.addedTimer = setTimeout(() => {
      dom.shelfAdded.classList.add('fading');
      G.shelf.addedTimer = setTimeout(() => {
        G.shelf.toast = null;
        G.shelf.addedShown = false;
        dom.shelfAdded.classList.remove('fading');
        dom.shelfAdded.style.display = 'none';
      }, 400);
    }, CONFIRM_MS);
  } else if (!added) {
    clearTimeout(G.shelf.addedTimer);
    G.shelf.addedShown = false;
    dom.shelfAdded.classList.remove('fading');
  }
  dom.btnToGarnish.disabled = !G.drink.poured.some(p => p.oz > 0);
  updateRecipeButtons();
}

function openShelf() {
  showScreen('shelf');
  renderShelf();
}

/* Bar controls while an order exists: START ORDER before it starts,
   POUR → (back to the drink) once it's in progress */
function refreshBarControls() {
  const inProgress = G.drink.forCustomer !== null;
  dom.btnStartOrder.style.display = !inProgress && G.selectedIdx !== null ? '' : 'none';
  dom.btnBackToPour.style.display = inProgress ? 'flex' : 'none';
}

/* ═══════════════════════════════════════════════════════════════
   POUR SCREEN — LIQUID MODE
   Hold anywhere to pour at 1 oz/sec; release to stop; BACK or DONE saves the pour.
   The glass reads the TOTAL level — every pour stacks as its own band.
═══════════════════════════════════════════════════════════════ */
const MAX_OZ = 8;
const OZ_ZERO_Y = 366;   // glass bottom (0 oz) — from Figma tick marks
const PX_PER_OZ = 28;    // ticks are 14px apart, one per 0.5 oz
const ozToY = oz => OZ_ZERO_Y - oz * PX_PER_OZ;

// Bottle poses from Figma: idle box + tilted center/rotation.
// Other bottles: idle = shelf size x3.08 standing at y=380 (like whiskey/cola),
// tilted so the mouth lands where whiskey's/cola's do (~455, 62).
// Layout = Figma 512:97 (+ DONE kept, user 2026-09-28): bottle 90px and glass 59px right of the older frames.
const POUR_POSE = {
  whiskey: { idle:{ x:177, y:-68, w:191, h:448 }, tilt:{ cx:241.5, cy:156,  rot:68.63 } },
  cola:    { idle:{ x:185, y:87,  w:176, h:293 }, tilt:{ cx:317.6, cy:85.3, rot:75.8 } },
  vodka:   { idle:{ x:182, y:-66, w:175, h:444 }, tilt:{ cx:239.5, cy:134,  rot:77.42 } },  // Figma 437:295 / 437:333
};
function pourPose(id) {
  if (POUR_POSE[id]) return POUR_POSE[id];
  const [sw, sh] = INGREDIENTS[id].shelf;
  const w = sw * 3.079, h = sh * 3.079, rot = 72, r = rot * Math.PI / 180;
  return {
    idle: { x: 272.75 - w / 2, y: 380 - h, w, h },
    tilt: { cx: 455 - (h / 2) * Math.sin(r), cy: 62 + (h / 2) * Math.cos(r), rot },
  };
}

function setBottleTilt(tilted) {
  const pose = pourPose(G.pour.ingredientId);
  const { idle, tilt } = pose;
  if (!tilted) { dom.pourBottle.style.transform = 'none'; return; }
  const dx = tilt.cx - (idle.x + idle.w / 2);
  const dy = tilt.cy - (idle.y + idle.h / 2);
  dom.pourBottle.style.transform = `translate(${dx}px, ${dy}px) rotate(${tilt.rot}deg)`;
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
}

/* Hand-drawn liquid details (style "C", matching the bottle art):
   a drawn surface line on top of each liquid, bubble outlines in fizzy ones,
   a soft shine streak down the side, all with a chalky grain.
   Drawn on a <canvas> — Safari chokes on SVG noise filters redrawn every frame. */
const FIZZY_IDS = new Set(['soda-water', 'tonic-water', 'cola', 'ginger-beer', 'lemon-lime']);
const WAVE_FIZZY = { amp: 2.6, cycles: 2.2 };
const WAVE_STILL = { amp: 0.8, cycles: 1.2 };
const SHINE = 'rgba(255,255,255,0.41)', SHINE_DIM = 'rgba(255,255,255,0.33)';

function wavePoints(x0, x1, y, { amp, cycles }) {
  const steps = 28, pts = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    pts.push([x0 + (x1 - x0) * t, y + amp * Math.sin(t * cycles * 2 * Math.PI)]);
  }
  return pts;
}

// Tiny seeded random so bubbles stay put while the glass fills
function seededRandom(seed) {
  let s = seed * 9301 + 49297;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// Chalky grain: a tile of random alpha that knocks bits out of every stroke
let grainTileCanvas = null;
function grainTile() {
  if (grainTileCanvas) return grainTileCanvas;
  const n = 128, c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d'), img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x += 2) {
    const a = 90 + Math.random() * 165;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) img.data[((y + dy) * n + x + dx) * 4 + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  return (grainTileCanvas = c);
}

// Strokes (lines / circles) onto a canvas covering box [x, y, w, h] in the caller's coordinates
function drawLiquidDetail(canvas, [bx, by, bw, bh], strokes) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = Math.ceil(bw * dpr), H = Math.ceil(bh * dpr);
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  canvas.style.width = bw + 'px';
  canvas.style.height = bh + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  if (!strokes.length) return;
  ctx.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);
  ctx.lineCap = ctx.lineJoin = 'round';
  strokes.forEach(st => {
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.width;
    ctx.beginPath();
    if (st.r) ctx.arc(st.x, st.y, st.r, 0, 2 * Math.PI);
    else st.pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

// Inside walls of the pour glass (same trace as the #pour-liquid clip-path)
const TICK_LABEL_OZ = [8, 6, 4, 2.5, 1.5];   // the oz labels printed on the pour glass
const POUR_WALL_L = [[465,132],[473,192],[485,276],[496.5,331.5],[500.5,352],[506.5,365.5]];
const POUR_WALL_R = [[631.5,132],[625.5,192],[613,276],[610,331.5],[605,358.5],[597,366.5]];
const POUR_DETAIL_BOX = [449, 110, 200, 270];   // matches .liquid-detail in style.css
function wallX(wall, y) {
  if (y <= wall[0][1]) return wall[0][0];
  for (let i = 1; i < wall.length; i++) {
    const [x0, y0] = wall[i - 1], [x1, y1] = wall[i];
    if (y <= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0);
  }
  return wall[wall.length - 1][0];
}

// Stacked bands: every committed pour, plus the one in progress
let pourDetailCanvas = null;
function renderPourLiquid() {
  const layers = [...G.drink.layers];
  if (G.pour.ozPoured > 0) layers.push({ id: G.pour.ingredientId, oz: G.pour.ozPoured });
  dom.pourLiquid.innerHTML = '';
  let total = 0;
  const strokes = [];
  layers.forEach((l, i) => {
    const band = document.createElement('div');
    band.className = 'liquid-band';
    const bottom = i === 0 ? OZ_ZERO_Y + 6 : ozToY(total);   // first band fills the rounded bottom
    total = Math.min(MAX_OZ, total + l.oz);
    const top = ozToY(total);
    const color = INGREDIENTS[l.id].color;
    band.style.top = top + 'px';
    band.style.height = Math.max(0, bottom - top) + 'px';
    band.style.background = hexToRgba(color, 0.3);
    dom.pourLiquid.appendChild(band);
    if (bottom - top < 1) return;

    const fizzy = FIZZY_IDS.has(l.id);
    // Bubbles fill in from the bottom of the layer as it rises
    if (fizzy) {
      const rand = seededRandom(i + 1);
      const floor = Math.min(bottom, 358);
      const placed = [];
      for (let k = 0; k < 40; k++) {
        const y = floor - 12 - k * 7 - rand() * 4, r = 3.5 + rand() * 3.5, f = rand();
        if (y - r < top + 8) break;
        // Stay right of the ticks and clear of the shine; hop over the oz labels
        const xl = 529, xr = wallX(POUR_WALL_R, y) - 26;
        if (y + r > floor - 4 || xr - xl < 2 * r) continue;
        const x = xl + r + (xr - xl - 2 * r) * f;
        const onLabel = TICK_LABEL_OZ.some(oz => Math.abs(ozToY(oz) - y) < r + 8 && x - r < 573);
        if (onLabel || placed.some(([px, py]) => Math.hypot(px - x, py - y) < 22)) continue;
        placed.push([x, y]);
        strokes.push({ x, y, r, color, width: 2.6 });
      }
    }
    // Surface line on top of this layer
    strokes.push({ pts: wavePoints(wallX(POUR_WALL_L, top) + 8, wallX(POUR_WALL_R, top) - 8, top, fizzy ? WAVE_FIZZY : WAVE_STILL), color, width: 4 });
  });

  // Shine streak down the side of the whole drink (right side here — the ticks sit on the left)
  const top = ozToY(total), y1 = top + 18, len = Math.min(60, (356 - y1) * 0.6);
  const shineX = y => wallX(POUR_WALL_R, y) - 13;
  if (strokes.length && len >= 12) {
    const y2 = y1 + len, y3 = y2 + 12, y4 = y3 + 10;
    strokes.push({ pts: [[shineX(y1), y1], [shineX(y2), y2]], color: SHINE, width: 3.5 });
    if (y4 < 350) strokes.push({ pts: [[shineX(y3), y3], [shineX(y4), y4]], color: SHINE_DIM, width: 3.5 });
  }
  if (!pourDetailCanvas) {
    pourDetailCanvas = document.createElement('canvas');
    pourDetailCanvas.className = 'liquid-detail';
  }
  drawLiquidDetail(pourDetailCanvas, POUR_DETAIL_BOX, strokes);
  dom.pourLiquid.appendChild(pourDetailCanvas);
}

function totalPouredOz() {
  return G.drink.layers.reduce((s, l) => s + l.oz, 0);
}

function openPourLiquid(ingredientId) {
  G.pour.ingredientId = ingredientId;
  G.pour.mode = 'liquid';
  G.pour.ozPoured = 0;
  G.pour.pouring = false;
  G.pour.lastTick = 0;
  G.pour.baselineOz = totalPouredOz();

  const { idle } = pourPose(ingredientId);
  dom.pourBottle.src = ingPath(ingredientId);
  Object.assign(dom.pourBottle.style, { left: idle.x + 'px', top: idle.y + 'px', width: idle.w + 'px', height: idle.h + 'px' });
  setBottleTilt(false);
  dom.screens.pour.classList.remove('is-pouring');
  renderPourLiquid();
  showScreen('pour');
  updateRecipeButtons();
}

/* Pour RAF loop */
function pourLoop(now) {
  if (G.screen !== 'pour' || G.pour.mode !== 'liquid') return;
  if (G.pour.pouring && !G.shiftEnded && G.timerRunning) {
    if (G.pour.lastTick === 0) G.pour.lastTick = now;
    const dt = (now - G.pour.lastTick) / 1000;
    G.pour.lastTick = now;
    const rate = 1; // oz per second
    // Past 8 oz the glass is full — the pour just stops
    G.pour.ozPoured = Math.min(G.pour.ozPoured + dt * rate, MAX_OZ - G.pour.baselineOz);
    renderPourLiquid();
    Sound.pour(G.pour.ozPoured < MAX_OZ - G.pour.baselineOz);   // silent once the glass is full
  } else {
    G.pour.lastTick = 0;
    Sound.pour(false);
  }
  G.rafId = requestAnimationFrame(pourLoop);
}

function startPourRAF() {
  if (G.rafId) cancelAnimationFrame(G.rafId);
  G.rafId = requestAnimationFrame(pourLoop);
}

function stopPourRAF() {
  Sound.pour(false);
  if (G.rafId) { cancelAnimationFrame(G.rafId); G.rafId = null; }
}

// Tick labels sit on their tick marks
document.querySelectorAll('.tick-label').forEach(el => {
  el.style.top = (ozToY(parseFloat(el.dataset.oz)) - 7) + 'px';
});

/* ═══════════════════════════════════════════════════════════════
   SCORING
═══════════════════════════════════════════════════════════════ */
// For the customer's reaction: which pours make a drink taste strong / sweet
const SPIRIT_IDS = new Set(['vodka', 'gin', 'tequila', 'whiskey', 'white-rum']);
const SWEET_IDS  = new Set(['simple-syrup', 'grenadine', 'triple-sec']);

/* Shift-over summary (user, 2026-10-05): a neutral, ~2-line reason for each tip — not in
   the customer's voice. Built from the same details scoreDrink() uses, so it always matches. */
const GARNISH_PLURAL = { lime: 'limes', lemon: 'lemons', orange: 'orange slices', cherry: 'cherries', mint: 'mint sprigs' };
function tipReason(recipe, poured, drinkTime, tier, peeks, result) {
  const name = id => INGREDIENTS[id].name.toLowerCase();
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const list = ns => ns.length < 3 ? ns.join(' and ') : ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1];
  const issues = [];   // [penalty, sentence (lowercase start), isForgot]
  const extra = poured.filter(p => !recipe.ingredients.some(r => r.id === p.id)).map(p => name(p.id));
  if (extra.length) issues.push([35, `${list(extra)} ${extra.length > 1 ? "don't" : "doesn't"} belong in this one.`]);
  const missing = recipe.ingredients.filter(r => !poured.find(p => p.id === r.id));
  const missLiquid = missing.filter(r => INGREDIENTS[r.id].type !== 'garnish').map(r => name(r.id));
  const missGarnish = missing.filter(r => INGREDIENTS[r.id].type === 'garnish').map(r => name(r.id));
  if (missLiquid.length) issues.push([30, `it was missing the ${list(missLiquid)}.`]);
  if (missGarnish.length) issues.push([30, `you forgot the ${list(missGarnish)}.`, true]);
  recipe.ingredients.forEach(req => {
    const actual = poured.find(p => p.id === req.id);
    if (!actual) return;
    if (req.count && (actual.count || 0) !== req.count)
      issues.push([10, (actual.count || 0) > req.count ? `too many ${GARNISH_PLURAL[req.id] || name(req.id)}.` : `needed more ${GARNISH_PLURAL[req.id] || name(req.id)}.`]);
    if (req.oz) {
      const delta = (actual.oz || 0) - req.oz, diff = Math.abs(delta), n = name(req.id);
      if (diff > 1.5)       issues.push([20, delta > 0 ? `way too much ${n}.` : `way too little ${n}.`]);
      else if (diff > 0.75) issues.push([12, delta > 0 ? `heavy on the ${n}.` : `light on the ${n}.`]);
      else if (diff > 0.3)  issues.push([5,  delta > 0 ? `a little heavy on the ${n}.` : `a little light on the ${n}.`]);
    }
  });
  issues.sort((a, b) => b[0] - a[0]);
  const extras = [];
  if (peeks) extras.push(peeks === 1 ? `Peeking at the recipe cost $${PEEK_COST.toFixed(2)}.`
                                     : `Peeking ${peeks === 2 ? 'twice' : peeks + ' times'} cost $${(PEEK_COST * peeks).toFixed(2)}.`);
  if (tier !== 'new') {
    if (drinkTime < 30)       extras.push('Fast service earned a bonus.');
    else if (drinkTime < 60)  extras.push('Quick service, small bonus.');
    else if (drinkTime > 120) extras.push('Took over 2 minutes, so the tip dropped.');
  }
  const parts = [];
  if (issues.length) {
    parts.push(cap(issues[0][1]));
    if (issues[1]) parts.push(issues[1][2] ? cap(issues[1][1].replace('you forgot', 'you also forgot')) : 'Also ' + issues[1][1]);
    else if (extras[0]) parts.push(extras[0]);
  } else {
    parts.push(result.score >= 95 ? 'Spot on, every pour was right.' : 'Close to the recipe.');
    if (extras[0]) parts.push(extras[0]);
  }
  return parts.join(' ');
}

function scoreDrink(recipe, poured, drinkTime, tier, peeks) {
  let score = 100;
  const reqIds = recipe.ingredients.map(r => r.id);
  const pouredIds = poured.map(p => p.id);
  let wrongOrMissing = false, amountsOff = false;
  let spirit = 0, sweet = 0, mixer = 0;   // oz over (+) / under (−) the recipe, by kind

  pouredIds.forEach(id => {
    if (!reqIds.includes(id)) { score -= 35; wrongOrMissing = true; }
  });

  recipe.ingredients.forEach(req => {
    const actual = poured.find(p => p.id === req.id);
    if (!actual) { score -= 30; wrongOrMissing = true; return; }
    if (req.count && (actual.count || 0) !== req.count) score -= 10;  // e.g. 2 limes when they asked for 1
    if (req.oz) {
      const delta = (actual.oz || 0) - req.oz, diff = Math.abs(delta);
      if (diff > 1.5)       score -= 20;
      else if (diff > 0.75) score -= 12;
      else if (diff > 0.3)  score -= 5;
      if (diff > 0.75) amountsOff = true;
      if (SPIRIT_IDS.has(req.id)) spirit += delta;
      else if (SWEET_IDS.has(req.id)) sweet += delta;
      else mixer += delta;
    }
  });

  score = Math.max(0, Math.min(100, score));

  // Time bonus: faster service → higher tip (a brand-new drink has no time pressure)
  let timeMult = 1.0;
  if (tier === 'new')       timeMult = 1.0;
  else if (drinkTime < 30)  timeMult = 1.5;
  else if (drinkTime < 60)  timeMult = 1.25;
  else if (drinkTime > 120) timeMult = 0.75;

  let base;
  if (score >= 80) base = 2.00;
  else if (score >= 60) base = 1.00;
  else if (score >= 40) base = 0.50;
  else base = 0.00;

  let tip = base * timeMult;
  tip = Math.max(0, tip - PEEK_COST * peeks);
  tip = Math.round(tip * 100) / 100;

  // Mood for the reaction — the biggest reason behind the tip, said vaguely
  let mood;
  if (base === 0)          mood = 'bad';
  else if (wrongOrMissing) mood = 'off';
  else if (amountsOff) {
    const strength = spirit - mixer;   // more spirit or less mixer → strong
    const taste = { strong: strength, weak: -strength, sweet };
    mood = Object.keys(taste).reduce((a, b) => taste[b] > taste[a] ? b : a);
  }
  else if (timeMult < 1)   mood = 'slow';
  else                     mood = score >= 95 ? 'perfect' : 'good';
  return { tip, score, mood };
}

/* ═══════════════════════════════════════════════════════════════
   LIQUID COLOR — blend of every liquid poured, weighted by ounces
═══════════════════════════════════════════════════════════════ */
function blendLiquids(poured) {
  let total = 0, r = 0, g = 0, b = 0;
  poured.forEach(p => {
    const hex = p.oz && INGREDIENTS[p.id]?.color;
    if (!hex) return;
    const n = parseInt(hex.slice(1), 16);
    r += (n >> 16 & 255) * p.oz; g += (n >> 8 & 255) * p.oz; b += (n & 255) * p.oz;
    total += p.oz;
  });
  if (!total) return null;
  const h = v => Math.round(v / total).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/* ═══════════════════════════════════════════════════════════════
   SERVE DRINK
═══════════════════════════════════════════════════════════════ */
const TIP_AFTER_REACTION_MS = 1000; // tip appears this long after the reaction bubble
const SERVED_LINGER_MS = 3500; // customer stays ~3.5s (time to read their reaction), then fades
const FADE_MS = 600;

function putDrinkOnCounter(slot, poured, garnishes) {
  // Figma 461:1361: glass 48.54 wide at customer center + 70, y = 293 —
  // the garnish-screen drink scaled down (48.54 / 122.49)
  const el = document.createElement('div');
  el.className = 'counter-drink drink-view';
  el.style.left = (SLOT_CX[slot] + 70) + 'px';
  el.style.top = '293px';
  el.style.transformOrigin = '0 0';
  el.style.transform = `scale(${48.54 / 122.49})`;
  renderDrinkView(el, poured, garnishes);
  dom.counterDrinks.appendChild(el);
  return el;
}

function serveDrink() {
  if (G.drink.forCustomer === null) return;
  const customerIdx = G.drink.forCustomer;
  const customer = G.customers[customerIdx];
  if (!customer) return;

  const drinkTime = G.drinkElapsed;
  const result = scoreDrink(G.drink.recipe, G.drink.poured, drinkTime, G.drink.tier, G.drink.peeks);
  G.tips += result.tip;
  G.drinksServed++;
  G.shiftLog.push({ type: customer.type, drink: G.drink.recipe.name, tip: result.tip,
                    reason: tipReason(G.drink.recipe, G.drink.poured, drinkTime, G.drink.tier, G.drink.peeks, result) });
  updateDial(result.score, drinkTime, G.drink.peeks > 0);

  // Familiarity: every served drink counts toward new → familiar (this session only)
  const rec = PROGRESS.drinks[G.drink.recipe.id] || (PROGRESS.drinks[G.drink.recipe.id] = { made: 0 });
  rec.made++;
  saveProgress();

  // Served customer keeps their "selected" look, drink lands on the counter, tip shows
  customer.state = 'served';
  renderCustomer(customerIdx);
  const drinkEl = putDrinkOnCounter(customerIdx, G.drink.poured, G.drink.garnishes);
  hideSpeechArea();
  showScreen('bar');   // before measuring the reaction bubble (hidden screens measure 0)
  const tipEl = showTipFloat(`$${result.tip % 1 === 0 ? result.tip : result.tip.toFixed(2)}`, customerIdx);
  const reactionEl = showReaction(customerIdx, result.mood);
  if (reactionEl) {
    // The reaction takes the spot over their head — the tip sits beside it instead
    tipEl.classList.add('with-reaction');
    const right = reactionEl.offsetLeft + reactionEl.offsetWidth + 12;
    tipEl.style.left = (right + tipEl.offsetWidth <= 790 ? right : reactionEl.offsetLeft - 12 - tipEl.offsetWidth) + 'px';
    // The customer speaks first; the tip follows a beat later, like it's their answer
    tipEl.classList.add('pending');
  }
  const tipsNow = G.tips;
  setTimeout(() => {
    tipEl.classList.remove('pending');
    if (G.customers[customerIdx] === customer) dom.barTips.textContent = '$' + tipsNow.toFixed(2);
  }, reactionEl ? TIP_AFTER_REACTION_MS : 0);
  G.selectedIdx = null;
  resetCurrentDrink();
  refreshBarControls();
  G.serving = (G.serving || 0) + 1;

  setTimeout(() => {
    [customer.el, drinkEl, tipEl, reactionEl].forEach(e => e && e.classList.add('leaving'));
    setTimeout(() => {
      drinkEl.remove();
      tipEl.remove();
      if (reactionEl) reactionEl.remove();
      if (G.customers[customerIdx] === customer) {
        G.customers[customerIdx] = null;
        noteCustomerLeft(customer.type);
        renderCustomer(customerIdx);
      }
      G.serving--;
      maybeEndShift();
    }, FADE_MS);
  }, SERVED_LINGER_MS);
}

/* ═══════════════════════════════════════════════════════════════
   RESET DRINK
═══════════════════════════════════════════════════════════════ */
function resetCurrentDrink() {
  G.drink.forCustomer = null;
  G.drink.recipe = null;
  G.drink.poured = [];
  G.drink.layers = [];
  G.drink.garnishes = [];
  G.drink.activeIngredient = null;
  G.drink.tier = 'new';
  G.drink.peeks = 0;
  G.drinkElapsed = 0;
}

/* ═══════════════════════════════════════════════════════════════
   END SHIFT
   At 0:00 the player finishes the drink they're making, serves it,
   gets the tip — then the shift ends.
═══════════════════════════════════════════════════════════════ */
function onShiftTimeUp() {
  G.shiftOver = true;
  maybeEndShift();
}

function maybeEndShift() {
  if (G.shiftOver && G.drink.forCustomer === null && !G.serving) endShift();
}

function endShift(early = false) {
  if (G.shiftEnded) return;
  G.shiftEnded = true;
  stopTimer();
  stopPourRAF();
  // Ending early from pause: the drink in progress (if any) is dropped
  if (early) resetCurrentDrink();
  dom.pauseOverlay.style.display = 'none';
  dom.game.classList.remove('paused');
  PROGRESS.shifts.push({ date: new Date().toISOString(), tips: Math.round(G.tips * 100) / 100, served: G.drinksServed,
                         ...(early ? { endedEarly: true, secondsLeft: Math.ceil(G.shiftRemaining) } : {}) });
  saveProgress();
  dom.endTips.textContent = `Total tips: $${G.tips.toFixed(2)}`;
  $('end-bank').textContent = `all-time tips: $${tipBank().toFixed(2)}`;   // "total tips" in the profile; worded differently here, next to this shift's "Total tips"
  showScreen('end');
  buildShiftSummary();
}

/* Shift-over summary panel (Figma 568:497): every order with its tip and why. The whole card
   scrolls as one layer (its top edge scrolls off too). It drifts down very slowly, rests at the
   end, glides back to the top, rests, and goes again (user, 2026-10-05). The player can scroll
   it any time; when they stop, it carries on from wherever they left it. */
const SUMMARY_SPEED = 12;        // px per second while drifting down
const SUMMARY_IDLE_MS = 1500;    // after the player stops touching it
const SUMMARY_END_PAUSE = 2500;  // rest at the bottom
const SUMMARY_TOP_PAUSE = 1500;  // rest at the top before drifting again
const SUMMARY_RETURN_MS = 1200;  // glide back up
const summary = { raf: 0, pos: 0, expected: 0, last: 0, holdUntil: 0, touching: false, max: 0, phase: 'drift', phaseAt: 0, from: 0 };
const money = v => '$' + (v % 1 === 0 ? v : v.toFixed(2));

function summaryItemHTML(o) {
  const spec = CUSTOMERS[o.type], h = 78.6, w = h * spec.w / spec.h;
  return `<div class="sum-item">
    <div class="sum-cust-box"><img class="sum-cust" src="${customerImg(o.type, 'skeleton')}" alt="" style="width:${Math.min(w, 46).toFixed(1)}px;height:${(Math.min(w, 46) * h / w).toFixed(1)}px" /></div>
    <div class="sum-text">
      <div class="sum-drink">${o.drink.toUpperCase()}</div>
      <div class="sum-tip">TIP: ${money(o.tip)}</div>
      <p class="sum-reason">${o.reason}</p>
    </div>
  </div>`;
}

function buildShiftSummary() {
  const box = $('end-summary'), list = $('end-summary-list');
  cancelAnimationFrame(summary.raf);
  list.innerHTML = G.shiftLog.length ? G.shiftLog.map(summaryItemHTML).join('')
                                     : '<p class="sum-empty">No drinks were served this shift.</p>';
  box.scrollTop = 0;
  // Few orders: the card just runs off the bottom like the frame and stays put
  const fits = 56.3 + list.offsetHeight <= 390;
  box.classList.toggle('fits', fits);
  summary.max = box.scrollHeight - box.clientHeight;
  if (fits || summary.max <= 1) return;
  Object.assign(summary, { pos: 0, expected: 0, last: 0, touching: false, phase: 'rest-top', phaseAt: performance.now() });
  summary.raf = requestAnimationFrame(stepSummary);
}

function stepSummary(now) {
  if (G.screen !== 'end') return;
  const box = $('end-summary');
  const dt = summary.last ? Math.min(0.25, (now - summary.last) / 1000) : 0;   // keeps speed steady even if frames are slow
  summary.last = now;
  summary.max = box.scrollHeight - box.clientHeight;
  if (!summary.touching && now > summary.holdUntil) {
    const since = now - summary.phaseAt;
    if (summary.phase === 'drift') {
      summary.pos = Math.min(summary.max, summary.pos + SUMMARY_SPEED * dt);
      if (summary.pos >= summary.max - 0.5) { summary.phase = 'rest-end'; summary.phaseAt = now; }
    } else if (summary.phase === 'rest-end' && since > SUMMARY_END_PAUSE) {
      Object.assign(summary, { phase: 'return', phaseAt: now, from: summary.pos });
    } else if (summary.phase === 'return') {
      const t = Math.min(1, since / SUMMARY_RETURN_MS), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      summary.pos = summary.from * (1 - e);
      if (t >= 1) { summary.phase = 'rest-top'; summary.phaseAt = now; }
    } else if (summary.phase === 'rest-top' && since > SUMMARY_TOP_PAUSE) {
      summary.phase = 'drift';
    }
    box.scrollTop = summary.pos;
    summary.expected = box.scrollTop;
  }
  summary.raf = requestAnimationFrame(stepSummary);
}

(() => {
  const box = $('end-summary');
  // The player took over: keep their position and drift on from there once they let go
  const hold = () => { summary.holdUntil = performance.now() + SUMMARY_IDLE_MS; summary.phase = 'drift'; summary.phaseAt = performance.now(); };
  box.addEventListener('pointerdown', () => { summary.touching = true; hold(); });
  box.addEventListener('touchstart', () => { summary.touching = true; hold(); }, { passive: true });
  ['pointerup', 'pointercancel', 'touchend', 'touchcancel'].forEach(t => window.addEventListener(t, () => { if (summary.touching) { summary.touching = false; hold(); } }));
  box.addEventListener('wheel', hold, { passive: true });
  box.addEventListener('scroll', () => {
    if (Math.abs(box.scrollTop - summary.expected) > 1.5) { summary.pos = summary.expected = box.scrollTop; hold(); }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   INIT / RESET
═══════════════════════════════════════════════════════════════ */
function initGame() {
  Sound.init();
  G.screen = 'bar';
  G.tips = 0;
  G.shiftRemaining = SHIFT_SECONDS;
  G.shiftOver = false;
  G.dial = PACE.startDial;
  G.nextArrivalIn = 0.2;   // first customer starts fading in right away (user, 2026-10-01: was 1s)
  G.serving = 0;
  G.timerRunning = false;
  G.customers = [];
  G.customerQueue = [];   // this round's arrival order (nextCustomerType)
  G.recentTypes = [];     // who just left, most recent first
  G.selectedIdx = null;
  G.lastDrinkId = null;
  G.drinksServed = 0;
  G.shiftLog = [];        // every drink served this shift, for the shift-over summary
  G.shiftEnded = false;
  resetCurrentDrink();

  dom.barBg.src = ART.barBackground;
  dom.barCounter.src = ART.barCounter;
  dom.pourGlass.src = ART.glass;
  dom.barTips.textContent = '$0.00';
  dom.pauseOverlay.style.display = 'none';
  dom.game.classList.remove('paused');
  dom.counterDrinks.innerHTML = '';
  document.querySelectorAll('.bar-tip-float, .speech-bubble.reaction').forEach(e => e.remove());
  document.querySelectorAll('.callout').forEach(e => e.classList.remove('show'));
  $('tap-hint').classList.remove('show');
  G.hintWait = HINT_AFTER;                  // TAP A CUSTOMER TO SERVE appears after a moment, until the first tap of the shift
  hideSpeechArea();
  G.shelf = { order: [], selected: null, toast: null };
  refreshBarControls();
  for (let i = 0; i < 3; i++) renderCustomer(i);

  stopPourRAF();
  showScreen('bar');
  updateTimerDisplays();
  startTimer(); // first customer walks up after ~1s, the dial paces the rest
}

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — BAR SCREEN
═══════════════════════════════════════════════════════════════ */

// Customer slot clicks
for (let i = 0; i < 3; i++) {
  const slot = document.getElementById(`slot-${i}`);
  slot.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (G.screen !== 'bar' || G.shiftEnded || !G.timerRunning) return;
    selectCustomer(i);
  });
}

dom.btnStartOrder.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (G.selectedIdx === null || !G.timerRunning) return;
  const customer = G.customers[G.selectedIdx];
  if (!customer) return;
  G.drink.forCustomer = G.selectedIdx;
  G.drink.recipe = customer.drink;
  G.drink.poured = [];
  G.drink.layers = [];
  G.drink.garnishes = [];
  G.drink.activeIngredient = null;
  G.drinkElapsed = 0;
  G.shelf.selected = null;
  G.shelf.toast = null;
  G.drink.tier = tierOf(customer.drink.id);
  G.drink.peeks = 0;
  buildShelf();
  openShelf();
  if (G.drink.tier === 'new') setTimeout(() => openRecipe(customer.drink), 50);
});

dom.barPause.addEventListener('pointerdown', (e) => { e.stopPropagation(); pauseToggle(); });

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — RECIPE CARD
═══════════════════════════════════════════════════════════════ */
// Close with the X or by tapping outside the card (taps on the card itself do nothing)
dom.overlay.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (e.target.closest('#btn-recipe-close') || !e.target.closest('#recipe-card')) closeRecipe();
});

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — SHELF SCREEN
═══════════════════════════════════════════════════════════════ */
// POUR OUT empties the glass; you stay on the shelf with the same order
dom.btnPourOut.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!G.timerRunning) return;
  G.drink.poured = [];
  G.drink.layers = [];
  G.drink.garnishes = [];
  G.drink.activeIngredient = null;
  G.shelf.selected = null;
  G.shelf.toast = 'GLASS EMPTIED';
  G.shelf.addedShown = false;   // restart its fade timer
  renderShelf();
});

dom.shelfPause.addEventListener('pointerdown', (e) => { e.stopPropagation(); pauseToggle(); });

// Recipe icon (shelf, pour, garnish) — always there while a drink is in progress.
// New drink: re-open for free. Familiar drink: every peek costs PEEK_COST, after a confirm.
const RECIPE_BUTTON_IDS = ['btn-recipe-peek', 'btn-recipe-peek-pour', 'btn-recipe-peek-garnish'];
function updateRecipeButtons() {
  RECIPE_BUTTON_IDS.forEach(id => { $(id).style.display = G.drink.recipe ? 'block' : 'none'; });
}
RECIPE_BUTTON_IDS.forEach(id => $(id).addEventListener('pointerdown', (e) => {
  e.stopPropagation();   // don't start a pour on the pour screen
  if (!G.timerRunning || !G.drink.recipe) return;
  if (G.drink.tier === 'new') openRecipe(G.drink.recipe);
  else openPeekConfirm();
}));

// Peek confirm — Figma 509:88 (wording as designed: "Peek at the recipe for 0.50?")
function openPeekConfirm() {
  $('peek-confirm-text').textContent = `Peek at the recipe for ${PEEK_COST.toFixed(2)}?`;
  $('peek-confirm').style.display = 'flex';
}
function closePeekConfirm() { $('peek-confirm').style.display = 'none'; }
$('btn-peek-yes').addEventListener('click', (e) => {
  e.stopPropagation();
  closePeekConfirm();
  if (!G.drink.recipe) return;
  G.drink.peeks++;
  openRecipe(G.drink.recipe);
});
$('btn-peek-no').addEventListener('click', (e) => { e.stopPropagation(); closePeekConfirm(); });
$('peek-confirm').addEventListener('pointerdown', (e) => { if (e.target.id === 'peek-confirm') closePeekConfirm(); });

dom.btnPour.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!G.shelf.selected || !G.timerRunning) return;
  openPourLiquid(G.shelf.selected);
  startPourRAF();
});

// ← BAR keeps the drink in progress so the player can check the bar
dom.btnToBar.addEventListener('click', (e) => {
  e.stopPropagation();
  G.shelf.selected = null;
  showScreen('bar');
  refreshBarControls();
});

dom.btnToGarnish.addEventListener('click', (e) => {
  e.stopPropagation();
  if (dom.btnToGarnish.disabled || !G.timerRunning) return;
  G.shelf.selected = null;
  openGarnishScreen();
});

// Bar: POUR → returns to the drink in progress
dom.btnBackToPour.addEventListener('click', (e) => {
  e.stopPropagation();
  if (G.drink.forCustomer === null) return;
  openShelf();
});

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — POUR SCREEN
═══════════════════════════════════════════════════════════════ */
// Two ways off the pour screen, and both keep what was poured (user, 2026-09-28)
[dom.btnBack, dom.btnDone].forEach(btn => btn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  commitLiquidPour();
}));

dom.pourPause.addEventListener('pointerdown', (e) => { e.stopPropagation(); pauseToggle(); });


// Hold anywhere (except buttons) to pour
dom.screens.pour.addEventListener('pointerdown', (e) => {
  if (G.screen !== 'pour' || G.pour.mode !== 'liquid') return;
  if (e.target.closest('button')) return;
  if (!G.timerRunning) return;
  G.pour.pouring = true;
  G.pour.lastTick = 0;
  dom.screens.pour.classList.add('is-pouring');
  setBottleTilt(true);
});

dom.screens.pour.addEventListener('pointerup', stopPouring);
dom.screens.pour.addEventListener('pointercancel', stopPouring);

function stopPouring() {
  if (G.pour.mode !== 'liquid' || !G.pour.pouring) return;
  G.pour.pouring = false;
  G.pour.lastTick = 0;
  dom.screens.pour.classList.remove('is-pouring');
  setBottleTilt(false);
}

function commitLiquidPour() {
  G.pour.pouring = false;
  stopPourRAF();
  dom.screens.pour.classList.remove('is-pouring');

  const id = G.pour.ingredientId;
  const oz = parseFloat(G.pour.ozPoured.toFixed(2));

  if (oz > 0) {
    G.drink.layers.push({ id, oz });
    const existing = G.drink.poured.find(p => p.id === id);
    if (existing) {
      existing.oz = (existing.oz || 0) + oz;
    } else {
      G.drink.poured.push({ id, oz });
    }
    G.drink.activeIngredient = id;
    G.shelf.toast = `${INGREDIENTS[id].name.toUpperCase()} ADDED`;   // "WHISKEY ADDED ✓"
    G.shelf.addedShown = false; // restart its fade timer
  }
  G.pour.ozPoured = 0;
  G.shelf.selected = null;
  openShelf();
}

/* ═══════════════════════════════════════════════════════════════
   GARNISH SCREEN
   Tap a garnish (tap again to deselect) → a TAP circle appears where it goes
   → tap it to place. REMOVE GARNISH clears them all. SERVE hands it over.
═══════════════════════════════════════════════════════════════ */
// Tray positions from Figma 454:1147 (center, unrotated box, rotation, mirrored)
const GARNISH_TRAY = {
  lemon:  { cx:228.32, cy:114.45, w:42.81, h:86.74, rot:-89.84 },
  orange: { cx:228.01, cy:189.82, w:46.86, h:95.65, rot:-90.47 },
  lime:   { cx:227.8,  cy:262.19, w:44.38, h:95.61, rot:-90, flip:true,
            outline:{ src:'assets/ui/select-outline-lime.svg', cx:227.77, cy:261.48, w:102.53, h:51.04 } },
  mint:   { cx:610.56, cy:135.5,  w:75.13, h:45,    rot:0 },
  cherry: { cx:620.01, cy:228.51, w:32.02, h:67.03, rot:0 },
};

// Where a garnish lands, relative to the glass's top-left (glass is 122.49 x 164).
// Rim slice = Figma 459:1230 (lime). Cherry/mint spots aren't designed yet.
const RIM_SPOTS = [
  { target:{ x:106, y:4 },  cx:108.29, cy:0.12, w:31.98, h:68.88, rot:125.81, flip:true },   // Figma lime
  { target:{ x:16,  y:4 },  cx:14.2,   cy:0.12, w:31.98, h:68.88, rot:-125.81 },             // mirrored, left rim
  { target:{ x:61,  y:2 },  cx:61,     cy:-4,   w:31.98, h:68.88, rot:180 },                 // back of the rim
];
// Cherry drops into the drink; mint floats on top. Extras fan out a little.
const GARNISH_SPOTS = {
  cherry: { target:{ x:61, y:45 }, cx:61, cy:45, w:23.05, h:48.26, rot:0,
            extra:[[0,0], [-17,8], [17,8], [0,18], [-9,26], [9,26]] },
  mint:   { target:{ x:45, y:20 }, cx:45, cy:20, w:54.1,  h:32.4,  rot:0,
            extra:[[0,0], [30,3], [-12,8], [16,12]] },
};
const RIM_GARNISHES = ['lime', 'lemon', 'orange'];

// Any number of garnishes can go on a drink — each new one takes the next spot
function garnishSpot(id, placed) {
  if (RIM_GARNISHES.includes(id)) {
    const n = placed.filter(g => RIM_GARNISHES.includes(g.id)).length;
    const base = RIM_SPOTS[n % RIM_SPOTS.length];
    const lap = Math.floor(n / RIM_SPOTS.length) * 6;   // later laps sit a bit lower
    return { ...base, cy: base.cy + lap, target: { x: base.target.x, y: base.target.y + lap } };
  }
  const s = GARNISH_SPOTS[id];
  const n = placed.filter(g => g.id === id).length;
  const [dx, dy] = s.extra[n % s.extra.length];
  return { ...s, cx: s.cx + dx, cy: s.cy + dy, target: { x: s.target.x + dx, y: s.target.y + dy } };
}

const LIQUID_PATH = 'M15.2349 92C9.81188 73.7941 3.01339 25.9849 0.0160161 2.24516C-0.134587 1.05236 0.796158 0 1.99843 0H98.1087C99.2614 0 100.176 0.963895 100.085 2.11295C98.3598 23.9369 88.5012 89.4568 83.4396 121.698C83.3135 122.501 82.7139 123.124 81.9206 123.302C56.3859 129.03 34.0433 125.913 24.8618 123.334C24.1586 123.137 23.6472 122.559 23.4847 121.847C22.6398 118.146 20.1902 108.635 15.2349 92Z';

// Bubble outlines for a mixed drink (liquid-shape coords); fizzier drinks show more of them
const MIXED_BUBBLES = [[0.30,0.20,2.4],[0.66,0.16,1.5],[0.50,0.45,2.9],[0.74,0.52,1.8],[0.30,0.62,1.5],[0.58,0.78,1.1],[0.40,0.88,1.4]];

// One blended liquid in the hand-drawn style: surface line, bubbles, shine (on top of the fill)
function mixedLiquidStrokes(poured, color) {
  const totalOz = poured.reduce((s, p) => s + (p.oz || 0), 0);
  const fizzyShare = poured.reduce((s, p) => s + (FIZZY_IDS.has(p.id) ? p.oz || 0 : 0), 0) / totalOz;
  const strokes = [];
  if (fizzyShare > 0) {
    MIXED_BUBBLES.slice(0, Math.max(3, Math.round(MIXED_BUBBLES.length * Math.min(1, fizzyShare * 1.4)))).forEach(([fx, fy, r]) => {
      const y = 11 + 104 * fy;
      strokes.push({ x: 13 + 68 * fx - (y - 9) * 0.05, y, r, color, width: 1.2 });
    });
  }
  const wave = fizzyShare > 0 ? { amp: 1.1, cycles: 2.2 } : { amp: 0.45, cycles: 1.2 };
  strokes.push({ pts: wavePoints(6, 83, 3.2, wave), color, width: 1.9 });
  strokes.push({ pts: [[13, 13], [16, 39]], color: SHINE, width: 1.8 });
  strokes.push({ pts: [[18, 47], [19, 52]], color: SHINE_DIM, width: 1.8 });
  return strokes;
}

// Glass + one blended liquid color + placed garnishes (garnish screen and bar counter)
function renderDrinkView(el, poured, garnishes) {
  el.innerHTML = '';
  const color = blendLiquids(poured);
  if (color) {
    el.insertAdjacentHTML('beforeend', `<svg class="dv-liquid" viewBox="0 0 100.091 126.534" preserveAspectRatio="none"><path d="${LIQUID_PATH}" fill="${color}" fill-opacity="0.3"/></svg>`);
    const detail = document.createElement('canvas');
    detail.className = 'dv-liquid';
    drawLiquidDetail(detail, [0, 0, 100.091, 126.534], mixedLiquidStrokes(poured, color));
    el.appendChild(detail);
  }
  const glass = document.createElement('img');
  glass.className = 'dv-glass';
  glass.src = ART.glass;
  glass.alt = '';
  el.appendChild(glass);
  garnishes.forEach((g, i) => {
    const img = document.createElement('img');
    img.className = 'dv-garnish';
    img.dataset.index = i;
    img.draggable = false;   // no native image drag — it would cancel our own drag
    img.src = ingPath(g.id);
    img.alt = '';
    const p = g.spot;
    Object.assign(img.style, { left: (p.cx - p.w / 2) + 'px', top: (p.cy - p.h / 2) + 'px', width: p.w + 'px', height: p.h + 'px',
      transform: `rotate(${p.rot}deg)${p.flip ? ' scaleY(-1)' : ''}` });
    el.appendChild(img);
  });
}

function buildGarnishTray() {
  const tray = $('garnish-tray');
  tray.innerHTML = '';
  Object.entries(GARNISH_TRAY).forEach(([id, t]) => {
    const r = t.rot * Math.PI / 180;
    const bw = Math.abs(t.w * Math.cos(r)) + Math.abs(t.h * Math.sin(r));
    const bh = Math.abs(t.w * Math.sin(r)) + Math.abs(t.h * Math.cos(r));
    const el = document.createElement('div');
    el.className = 'tray-garnish' + (t.outline ? '' : ' traced');
    el.dataset.id = id;
    Object.assign(el.style, { left: (t.cx - bw / 2) + 'px', top: (t.cy - bh / 2) + 'px', width: bw + 'px', height: bh + 'px' });
    const img = document.createElement('img');
    img.className = 'g';
    img.src = ingPath(id);
    img.alt = INGREDIENTS[id].name;
    Object.assign(img.style, { inset: 'auto', left: (bw - t.w) / 2 + 'px', top: (bh - t.h) / 2 + 'px', width: t.w + 'px', height: t.h + 'px',
      transform: `rotate(${t.rot}deg)${t.flip ? ' scaleY(-1)' : ''}` });
    el.appendChild(img);
    if (t.outline) {
      const o = document.createElement('img');
      o.className = 'outline';
      o.src = t.outline.src;
      o.alt = '';
      const ox = t.outline.cx - t.outline.w / 2 - (t.cx - bw / 2);
      const oy = t.outline.cy - t.outline.h / 2 - (t.cy - bh / 2);
      Object.assign(o.style, { left: ox + 'px', top: oy + 'px', width: t.outline.w + 'px', height: t.outline.h + 'px' });
      el.appendChild(o);
    }
    el.addEventListener('click', () => {
      if (garnishDrag.justDropped) { garnishDrag.justDropped = false; return; }   // that was a drag, not a tap
      toggleGarnish(id);
    });
    el.addEventListener('pointerdown', (e) => startGarnishDrag(e, id, el));
    tray.appendChild(el);
  });
}

/* Drag a garnish onto the drink (user, 2026-09-30) — works alongside tap → TAP circle.
   A copy follows the finger; the target circle shows where it lands. Drop on the glass
   or near the circle to place it; anywhere else it just goes back. */
const DRAG_START_PX = 8;     // movement before a press counts as a drag (stage px)
const DROP_RADIUS = 70;      // drop this close to the target circle's center to place
const garnishDrag = { id: null, el: null, ghost: null, x0: 0, y0: 0, dragging: false, justDropped: false, prevSel: null };

// Pointer position in stage coords (the 844×390 stage is scaled to fit the phone)
function stagePoint(e) {
  const r = dom.screens.garnish.getBoundingClientRect();
  return { x: (e.clientX - r.left) * 844 / r.width, y: (e.clientY - r.top) * 390 / r.height };
}

function startGarnishDrag(e, id, el) {
  if (G.screen !== 'garnish' || !G.timerRunning) return;
  const p = stagePoint(e);
  Object.assign(garnishDrag, { id, el, ghost: null, x0: p.x, y0: p.y, dragging: false, justDropped: false, prevSel: G.garnishSel });
}

function moveGarnishDrag(e) {
  const d = garnishDrag;
  if (!d.id) return;
  const p = stagePoint(e);
  if (!d.dragging) {
    if (Math.hypot(p.x - d.x0, p.y - d.y0) < DRAG_START_PX) return;
    d.dragging = true;
    hideGarnishToast();
    G.garnishSel = d.id;          // names the garnish up top (no circle while dragging)
    renderGarnishScreen();
    d.ghost = d.el.cloneNode(true);
    d.ghost.classList.remove('selected');
    d.ghost.classList.add('garnish-ghost');
    dom.screens.garnish.appendChild(d.ghost);
    d.offX = d.x0 - parseFloat(d.el.style.left);
    d.offY = d.y0 - parseFloat(d.el.style.top);
  }
  d.ghost.style.left = (p.x - d.offX) + 'px';
  d.ghost.style.top = (p.y - d.offY) + 'px';
}

function endGarnishDrag(e) {
  const d = garnishDrag;
  if (!d.id) return;
  if (d.dragging) {
    const p = stagePoint(e);
    const spot = garnishSpot(d.id, G.drink.garnishes);
    const tx = 355 + spot.target.x, ty = 120 + spot.target.y;   // target circle center (garnish-drink at 355,120)
    const overGlass = p.x > 355 - 20 && p.x < 355 + 122.49 + 20 && p.y > 120 - 20 && p.y < 120 + 164 + 20;
    if (d.ghost) d.ghost.remove();
    if (G.timerRunning && (overGlass || Math.hypot(p.x - tx, p.y - ty) < DROP_RADIUS)) {
      G.garnishSel = d.id;
      placeSelectedGarnish();
    } else {
      d.dragging = false;
      G.garnishSel = d.prevSel;   // missed: back to how it was (its tap circle returns)
      renderGarnishScreen();
    }
    d.justDropped = true;         // swallow the click that follows pointerup
    setTimeout(() => { d.justDropped = false; }, 50);
  }
  d.id = null; d.el = null; d.ghost = null; d.dragging = false;
}
window.addEventListener('pointermove', moveGarnishDrag);
window.addEventListener('pointerup', endGarnishDrag);
window.addEventListener('pointercancel', endGarnishDrag);

/* Drag a garnish that's already on the drink (user, 2026-09-30): it comes off the drink and
   a trash icon shows at the bottom center (between ← POUR and SERVE →). Over the trash the
   garnish drops to 60% opacity; let go there and it's gone. Let go anywhere else → back on. */
const TRASH = { cx: 421, cy: 344, radius: 55 };   // midway between the nav buttons (156 ↔ 686), level with them
const placedDrag = { g: null, index: -1, x0: 0, y0: 0, dragging: false, ghost: null, offX: 0, offY: 0 };

function changeGarnishCount(id, delta) {
  const p = G.drink.poured.find(x => x.id === id);
  if (p) p.count = (p.count || 0) + delta;
  else if (delta > 0) G.drink.poured.push({ id, count: delta });
  G.drink.poured = G.drink.poured.filter(x => INGREDIENTS[x.id].type !== 'garnish' || x.count > 0);
}

$('garnish-drink').addEventListener('pointerdown', (e) => {
  const img = e.target.closest('.dv-garnish');
  if (!img || G.screen !== 'garnish' || !G.timerRunning) return;
  e.stopPropagation();
  const p = stagePoint(e), index = +img.dataset.index;
  Object.assign(placedDrag, { g: G.drink.garnishes[index], index, img, x0: p.x, y0: p.y, dragging: false, ghost: null });
});

window.addEventListener('pointermove', (e) => {
  const d = placedDrag;
  if (!d.g) return;
  const p = stagePoint(e);
  if (!d.dragging) {
    if (Math.hypot(p.x - d.x0, p.y - d.y0) < DRAG_START_PX) return;
    d.dragging = true;
    // Lift it off the drink. Hide its image rather than re-rendering: iPhone Safari stops
    // sending move events if the element under the finger is removed mid-touch.
    G.drink.garnishes.splice(d.index, 1);
    changeGarnishCount(d.g.id, -1);
    hideGarnishToast();
    d.img.style.visibility = 'hidden';
    const s = d.g.spot, left = 355 + s.cx - s.w / 2, top = 120 + s.cy - s.h / 2;   // garnish-drink sits at (355,120)
    d.ghost = document.createElement('img');
    d.ghost.className = 'placed-ghost';
    d.ghost.src = ingPath(d.g.id);
    d.ghost.alt = '';
    Object.assign(d.ghost.style, { width: s.w + 'px', height: s.h + 'px', transform: `rotate(${s.rot}deg)${s.flip ? ' scaleY(-1)' : ''}` });
    d.offX = d.x0 - left; d.offY = d.y0 - top;
    dom.screens.garnish.appendChild(d.ghost);
    $('garnish-trash').style.display = 'block';
  }
  d.ghost.style.left = (p.x - d.offX) + 'px';
  d.ghost.style.top = (p.y - d.offY) + 'px';
  d.ghost.style.opacity = overTrash(p) ? '0.6' : '1';
});

const overTrash = p => Math.hypot(p.x - TRASH.cx, p.y - TRASH.cy) < TRASH.radius;

function endPlacedDrag(e) {
  const d = placedDrag;
  if (!d.g) return;
  if (d.dragging) {
    if (d.ghost) d.ghost.remove();
    $('garnish-trash').style.display = 'none';
    if (!overTrash(stagePoint(e))) {
      // Not trashed — it goes back where it was
      G.drink.garnishes.splice(d.index, 0, d.g);
      changeGarnishCount(d.g.id, +1);
    }
    renderGarnishScreen();
  }
  d.g = null; d.img = null; d.dragging = false; d.ghost = null;
}
window.addEventListener('pointerup', endPlacedDrag);
window.addEventListener('pointercancel', endPlacedDrag);

function openGarnishScreen() {
  G.garnishSel = null;
  hideGarnishToast();
  updateRecipeButtons();
  showScreen('garnish');
  renderGarnishScreen();
}

function toggleGarnish(id) {
  if (G.screen !== 'garnish' || !G.timerRunning) return;
  hideGarnishToast();
  G.garnishSel = G.garnishSel === id ? null : id;
  renderGarnishScreen();
}

function renderGarnishScreen() {
  const sel = G.garnishSel;
  document.querySelectorAll('.tray-garnish').forEach(el => el.classList.toggle('selected', el.dataset.id === sel));
  const title = $('garnish-title');
  if (sel) {
    title.textContent = INGREDIENTS[sel].name.toUpperCase();
    title.classList.add('ingredient');
  } else {
    title.textContent = G.drink.recipe ? G.drink.recipe.name.toUpperCase() : '';
    title.classList.remove('ingredient');
  }
  renderDrinkView($('garnish-drink'), G.drink.poured, G.drink.garnishes);

  const target = $('garnish-target');
  if (sel && !garnishDrag.dragging) {   // the circle is for tapping only — not while dragging
    const spot = garnishSpot(sel, G.drink.garnishes);
    target.style.left = (355 + spot.target.x - 31) + 'px';
    target.style.top = (120 + spot.target.y - 31) + 'px';
    target.style.display = 'block';
  } else {
    target.style.display = 'none';
  }
}

function placeSelectedGarnish() {
  const id = G.garnishSel;
  if (!id || !G.timerRunning) return;
  G.drink.garnishes.push({ id, spot: garnishSpot(id, G.drink.garnishes) });
  Sound.pop();
  const existing = G.drink.poured.find(p => p.id === id);
  if (existing) existing.count = (existing.count || 0) + 1;
  else G.drink.poured.push({ id, count: 1 });
  G.garnishSel = null;
  renderGarnishScreen();
}

$('garnish-target').addEventListener('click', (e) => { e.stopPropagation(); placeSelectedGarnish(); });

// "GARNISH REMOVED ✓" — same look and fade as the shelf confirmations
let garnishToastTimer = null;
function hideGarnishToast() {
  clearTimeout(garnishToastTimer);
  const t = $('garnish-toast');
  t.classList.remove('fading');
  t.style.display = 'none';
}
function flashGarnishToast(msg) {
  hideGarnishToast();
  const t = $('garnish-toast');
  $('garnish-toast-text').textContent = msg;
  t.style.display = 'flex';
  garnishToastTimer = setTimeout(() => {
    t.classList.add('fading');
    garnishToastTimer = setTimeout(hideGarnishToast, 400);
  }, CONFIRM_MS);
}

$('btn-remove-garnish').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!G.timerRunning) return;
  G.drink.garnishes = [];
  G.drink.poured = G.drink.poured.filter(p => INGREDIENTS[p.id].type !== 'garnish');
  G.garnishSel = null;
  renderGarnishScreen();
  flashGarnishToast('GARNISH REMOVED');
});

$('btn-garnish-to-pour').addEventListener('click', (e) => {
  e.stopPropagation();
  G.garnishSel = null;
  openShelf();
});

$('btn-serve').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!G.timerRunning) return;
  serveDrink();
});

$('garnish-pause').addEventListener('pointerdown', (e) => { e.stopPropagation(); pauseToggle(); });

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — END SCREEN
═══════════════════════════════════════════════════════════════ */
dom.btnPlayAgain.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  initGame();
});

/* ═══════════════════════════════════════════════════════════════
   PAUSE OVERLAY click to unpause
═══════════════════════════════════════════════════════════════ */
$('btn-end-shift').addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  endShift(true);
});

['btn-resume', 'btn-resume-icon'].forEach(id => $(id).addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (!G.timerRunning) pauseToggle();
}));
// Full-screen pause (Figma 743:555): RESUME or the play icon resumes; taps elsewhere do nothing
dom.pauseOverlay.addEventListener('pointerdown', (e) => e.stopPropagation());
$('btn-sound').addEventListener('click', (e) => { e.stopPropagation(); Sound.init(); Sound.setOn(!soundOn); refreshSoundButton(); });
refreshSoundButton();
// Any first tap wakes the audio (phones need a tap before sound can play)
['click', 'touchend'].forEach(ev => document.addEventListener(ev, () => Sound.init(), { once: true, passive: true }));

/* ═══════════════════════════════════════════════════════════════
   BOOT — loading screen preloads every image, then home
═══════════════════════════════════════════════════════════════ */
function allImagePaths() {
  const ui = ['icon-restart.svg','arrow-bar.svg','shelf-line.svg','icon-check.svg','icon-back.svg',
              'pour-ticks.svg','tap-target.png','select-outline-whiskey.svg','select-outline-cola.svg',
              'select-outline-lime.svg','icon-recipe.svg','icon-close.svg'].map(f => `assets/ui/${f}`);
  return [
    ...Object.values(ART),
    ...CUSTOMER_IDS.flatMap(id => [customerImg(id, 'skeleton'), customerImg(id, 'selected')]),
    ...Object.keys(INGREDIENTS).map(ingPath),
    ...ui,
  ];
}

function preload(onProgress) {
  const paths = allImagePaths();
  const fonts = [document.fonts.load("28px 'BarFont'"), document.fonts.load("26px 'BarFontBold'"), document.fonts.load("45px 'Scratchy'")];
  const total = paths.length + fonts.length;
  let done = 0;
  const tick = () => onProgress(++done / total);
  const images = paths.map(src => new Promise(res => {
    const img = new Image();
    img.onload = img.onerror = () => { tick(); res(); };
    img.src = src;
  }));
  return Promise.all([...images, ...fonts.map(f => f.then(tick, tick))]);
}

$('btn-start-shift').addEventListener('click', (e) => { e.stopPropagation(); initGame(); });

// MOCKTAILS ONLY toggle (Figma 606:554 off / 606:942 on)
function applyMode() {
  dom.screens.home.classList.toggle('mocktails', mocktailsOnly);
  $('btn-mocktails').setAttribute('aria-checked', mocktailsOnly);
}
$('btn-mocktails').addEventListener('click', (e) => {
  e.stopPropagation();
  mocktailsOnly = !mocktailsOnly;
  try { localStorage.setItem(MODE_KEY, mocktailsOnly ? '1' : '0'); } catch (err) { /* storage unavailable */ }
  applyMode();
});
$('btn-mode-info').addEventListener('click', (e) => { e.stopPropagation(); $('mode-tip').classList.toggle('show'); });
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#btn-mode-info')) $('mode-tip').classList.remove('show'); });
applyMode();

/* ═══════════════════════════════════════════════════════════════
   DRINK MENU — Figma 559:427 (user, 2026-10-01): looping carousel of recipe cards.
   Arrows or swipe to move; tap a side card to bring it to the middle. Cards slide
   over and grow/shrink. Five cards live in the DOM (slots −2…+2); the ones that
   slide off one side are refilled and dropped in on the other.
═══════════════════════════════════════════════════════════════ */
const MENU_SLOTS = {   // card center (x, y), scale, opacity — scaled from the Figma frame
  '-2': { x: 19.2,  y: 204.5, s: 0.72, o: 0 },
  '-1': { x: 220.4, y: 204.5, s: 0.72, o: 0.7 },
  '0':  { x: 421.7, y: 192.7, s: 1,    o: 1 },
  '1':  { x: 611.0, y: 204.5, s: 0.72, o: 0.7 },
  '2':  { x: 812.2, y: 204.5, s: 0.72, o: 0 },
};
const MENU_CARD_W = 277.2, MENU_CARD_H = 308.6, MENU_CARD_PAD = 34.2;   // PAD = top padding, kept under the glass too
const menu = { index: 0, cards: [] };   // index = drink in the middle

function drinkGarnishes(drink) {
  const g = [];
  drink.ingredients.filter(i => i.count).forEach(i => {
    for (let k = 0; k < i.count; k++) g.push({ id: i.id, spot: garnishSpot(i.id, g) });
  });
  return g;
}

function fillMenuCard(card, drink) {
  card.classList.toggle('long', drink.ingredients.length > 6);
  card.innerHTML = `<div class="menu-name"><span></span></div>
    <div class="menu-ings">${drink.ingredients.map(recipeLine).join('')}</div>
    <div class="menu-glass"><div class="drink-view"></div></div>`;
  renderDrinkView(card.querySelector('.drink-view'), drink.ingredients.filter(i => i.oz).map(i => ({ id: i.id, oz: i.oz })), drinkGarnishes(drink));
  // Name: Scratchy at 41.6px (E rule built in), shrunk to fit the card
  const nameBox = card.querySelector('.menu-name'), span = nameBox.firstChild, name = drink.name.toUpperCase();
  let size = 41.6;
  const setName = () => { nameBox.style.fontSize = size + 'px'; span.innerHTML = scratchyHTML(name, size); };
  setName();
  while (span.offsetWidth > 236 && size > 18) { size -= 1; setName(); }
  // Lines: shrink until the space under the glass matches the padding above the title
  // (user, 2026-10-11: the drink must never touch the bottom of the card)
  const ings = card.querySelector('.menu-ings'), glass = card.querySelector('.menu-glass');
  const n = drink.ingredients.length;
  let fs = n > 6 ? 17 : 25.9;
  ings.style.fontSize = fs + 'px';
  ings.style.lineHeight = n >= 5 ? 1.22 : '';   // longer recipes sit a little tighter
  const limit = card.clientHeight - MENU_CARD_PAD;
  while (glass.offsetTop + glass.offsetHeight > limit && fs > 11) ings.style.fontSize = (fs -= 0.5) + 'px';
}

function placeMenuCard(card, slot) {
  const p = MENU_SLOTS[slot];
  card.dataset.slot = slot;
  card.style.transform = `translate(${p.x - MENU_CARD_W / 2}px, ${p.y - MENU_CARD_H / 2}px) scale(${p.s})`;
  card.style.opacity = p.o;
  card.style.zIndex = 3 - Math.abs(slot);
  card.style.pointerEvents = p.o ? 'auto' : 'none';
}

const drinkAt = offset => { const list = menuDrinks(), n = list.length; return list[((menu.index + offset) % n + n) % n]; };

function openDrinkMenu() {
  showScreen('menu');
  menu.index %= menuDrinks().length;   // the list changes with the mode
  const wrap = $('menu-carousel');
  wrap.innerHTML = '';
  menu.cards = [-2, -1, 0, 1, 2].map(slot => {
    const card = document.createElement('div');
    card.className = 'menu-card no-anim';
    wrap.appendChild(card);   // in the page first, so it can be measured
    fillMenuCard(card, drinkAt(slot));
    placeMenuCard(card, slot);
    card.addEventListener('click', () => { const sl = +card.dataset.slot; if (sl && !menu.swiped) moveMenu(sl); });
    return card;
  });
  requestAnimationFrame(() => menu.cards.forEach(c => c.classList.remove('no-anim')));
}

// Step the carousel by dir (+1 → next drink slides in from the right)
function moveMenu(dir) {
  if (!dir) return;
  const step = Math.sign(dir);
  menu.index = (menu.index + step + menuDrinks().length) % menuDrinks().length;
  menu.cards.forEach(card => {
    let slot = +card.dataset.slot - step;
    if (Math.abs(slot) > 2) {
      // Fell off one end: refill and drop it in on the far side (no animation)
      slot = -Math.sign(slot) * 2;
      card.classList.add('no-anim');
      fillMenuCard(card, drinkAt(slot));
      placeMenuCard(card, slot);
      void card.offsetWidth;
      card.classList.remove('no-anim');
    } else placeMenuCard(card, slot);
  });
  if (Math.abs(dir) > 1) setTimeout(() => moveMenu(dir - step), 120);
}

$('btn-menu-prev').addEventListener('click', (e) => { e.stopPropagation(); moveMenu(-1); });
$('btn-menu-next').addEventListener('click', (e) => { e.stopPropagation(); moveMenu(1); });
// Swipe left/right on the cards
(() => {
  let x0 = null;
  const wrap = $('menu-carousel');
  wrap.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  window.addEventListener('pointerup', (e) => {
    if (x0 === null || G.screen !== 'menu') { x0 = null; return; }
    const r = dom.screens.menu.getBoundingClientRect();
    const dx = (e.clientX - x0) * 844 / r.width;
    x0 = null;
    if (Math.abs(dx) > 40) {
      moveMenu(dx < 0 ? 1 : -1);
      menu.swiped = true;                                   // the click that may follow isn't a tap
      setTimeout(() => { menu.swiped = false; }, 60);
    }
  });
})();

$('btn-drink-menu').addEventListener('click', (e) => { e.stopPropagation(); openDrinkMenu(); });
$('btn-end-home').addEventListener('click', (e) => { e.stopPropagation(); showScreen('home'); });
$('btn-menu-home').addEventListener('click', (e) => { e.stopPropagation(); showScreen('home'); });

/* ═══════════════════════════════════════════════════════════════
   TIP BANK, PROFILE, LEADERBOARD (user, 2026-10-13)
   Total tips (was "tip bank") = every saved shift's tips added up; never resets. The leaderboard is today only:
   sample players with fixed scores, plus the player's real "best shift today" and "tips today".
   Sign in / out only switches what the account card shows — there are no real accounts.
═══════════════════════════════════════════════════════════════ */
const dollars = n => `$${n.toFixed(2)}`;   // always two decimals (the summary's money() drops .00)
const tipBank = () => PROGRESS.shifts.reduce((sum, sh) => sum + (sh.tips || 0), 0);
function todaysShifts() {
  const today = new Date().toDateString();
  return PROGRESS.shifts.filter(sh => new Date(sh.date).toDateString() === today);
}
// Sample players (made up; scores stay the same every day) — enough of them that each list scrolls
const BOARD_BEST = [['femur fatale', 'pink', 28.5], ['bony tony', 'red', 27], ['marrow', 'teal', 25], ['spine tingler', 'blue', 24],
                    ['patella', 'lavender', 22.5], ['jaw dropper', 'orange2', 21], ['skully', 'yellow', 19], ['knuckles', 'purple', 17.5],
                    ['tibia tim', 'orange', 16.5], ['lazy bones', 'lime', 14], ['cranium', 'teal', 12], ['scapula', 'pink', 9.5]];
const BOARD_TOTAL = [['marrow', 'teal', 74.5], ['spine tingler', 'blue', 68], ['skully', 'yellow', 61], ['bony tony', 'red', 55.5],
                     ['femur fatale', 'pink', 52.5], ['knuckles', 'purple', 47], ['patella', 'lavender', 41], ['jaw dropper', 'orange2', 36.5],
                     ['ribcage', 'lime', 28], ['tibia tim', 'orange', 22], ['lazy bones', 'lime', 15.5], ['scapula', 'pink', 9]];
function boardRows(samples, mine) {
  const rows = [...samples.map(([name, type, amt]) => ({ name, type, amt })), { name: 'you', amt: mine, you: true }]
    .sort((a, b) => b.amt - a.amt || (a.you ? 1 : -1));   // on a tie the sample player stays ahead
  return rows.map((r, i) => `<div class="board-row${r.you ? ' you' : ''}"><span class="n">${i + 1}</span>` +
    (r.you ? `<span class="a me">${signedIn ? 'S' : ''}</span>` : `<span class="a"><img src="${customerImg(r.type, 'skeleton')}" alt="" /></span>`) +
    `${r.name}<span class="amt">${dollars(r.amt)}</span></div>`).join('');
}
function openLeaderboard() {
  const today = todaysShifts().map(sh => sh.tips || 0);
  $('board-title').innerHTML = scratchyHTML('LEADERBOARD', 45);
  $('board-best').innerHTML = boardRows(BOARD_BEST, today.length ? Math.max(...today) : 0);
  $('board-total').innerHTML = boardRows(BOARD_TOTAL, today.reduce((a, b) => a + b, 0));
  showScreen('leaderboard');
  // Each list scrolls; open with the player's own row in view
  ['board-best', 'board-total'].forEach(id => {
    const list = $(id), me = list.querySelector('.you');
    list.scrollTop = Math.max(0, me.offsetTop - (list.clientHeight - me.offsetHeight) / 2);
  });
}

const SIGNED_KEY = 'bonedry-signed-in';
let signedIn = true;
try { signedIn = localStorage.getItem(SIGNED_KEY) !== '0'; } catch (e) { /* storage unavailable */ }
function refreshProfile() {
  dom.screens.home.classList.toggle('signed-out', !signedIn);
  $('account-in').style.display = signedIn ? '' : 'none';
  $('account-out').style.display = signedIn ? 'none' : '';
  $('pf-bank').textContent = `total tips ${dollars(tipBank())}`;
  $('row-sound').querySelector('.tog').classList.toggle('on', soundOn);
  $('row-mocktails').querySelector('.tog').classList.toggle('on', mocktailsOnly);
}
function setSignedIn(on) {
  signedIn = on;
  try { localStorage.setItem(SIGNED_KEY, on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  refreshProfile();
}
$('btn-profile').addEventListener('click', (e) => { e.stopPropagation(); refreshProfile(); showScreen('profile'); });
$('btn-profile-home').addEventListener('click', (e) => { e.stopPropagation(); showScreen('home'); });
$('btn-sign-out').addEventListener('click', (e) => { e.stopPropagation(); setSignedIn(false); });
$('btn-sign-in').addEventListener('click', (e) => { e.stopPropagation(); setSignedIn(true); });
$('row-sound').addEventListener('click', (e) => { e.stopPropagation(); Sound.init(); Sound.setOn(!soundOn); refreshSoundButton(); refreshProfile(); });
$('row-mocktails').addEventListener('click', (e) => {
  e.stopPropagation();
  mocktailsOnly = !mocktailsOnly;
  try { localStorage.setItem(MODE_KEY, mocktailsOnly ? '1' : '0'); } catch (err) { /* storage unavailable */ }
  applyMode(); refreshProfile();
});
$('row-leaderboard').addEventListener('click', (e) => { e.stopPropagation(); openLeaderboard(); });
$('btn-board-back').addEventListener('click', (e) => { e.stopPropagation(); refreshProfile(); showScreen('profile'); });
refreshProfile();

// Opens straight to home (loading screen removed, user 2026-09-30). Art still preloads
// quietly in the background so nothing pops in once a shift starts.
window.addEventListener('DOMContentLoaded', () => {
  buildGarnishTray();
  showScreen('home');
  preload(() => {});
  // Poster QR code → https://sicilyrose4.github.io/bone-dry/?unlock=signature (scanning again just shows it again)
  if (new URLSearchParams(location.search).get('unlock') === 'signature') {
    history.replaceState(null, '', location.pathname);   // so a reload / "Add to Home Screen" opens plain home
    // Wait for the fonts (cards are measured) and the shaker art, so nothing pops in mid-animation
    const art = [...Object.values(SHAKER_PARTS).map(p => p.src), customerImg('purple', 'selected'), 'assets/ui/unlock-bubble.svg', 'assets/ui/menu-arrow-next.svg']
      .map(src => { const i = new Image(); i.src = src; return i.decode().catch(() => {}); });
    Promise.all([document.fonts.load("21px 'Scratchy'"), document.fonts.load("13px 'BarFont'"), document.fonts.load("28px 'BarFontBold'"), ...art])
      .catch(() => {}).then(unlockSignatureMenu);
  }
});

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE MENU UNLOCKED — Figma 719:1910 (user, 2026-10-07; reworked 2026-10-08)
   The shaker shakes by itself in the middle ("start in the center") → slides to the side
   ("move to the side") → tips over and the cap pops off ("opened") → it lies poured out while the
   six recipe cards fly out of its mouth into a fan ("poured") → the shaker slides away, the fan
   rises and "SIGNATURE MENU UNLOCKED!" fades in ("after" 719:1675) → after a short pause the cards
   straighten into a carousel, the purple customer rises up and their bubble pops in ("after" 731:253).
   The carousel then works like the DRINK MENU one. No X — BACK TO HOME only.
═══════════════════════════════════════════════════════════════ */
const SHAKER_PARTS = {
  body: { src: 'assets/ui/shaker-body.png', w: 111.42, h: 219.69,
          center: [417.9, 312.1, 5.19], side: [177.6, 313.9, -6.08], open: [152.2, 310.1, 23.89], pour: [16.1, 307.8, 49.49] },
  cap:  { src: 'assets/ui/shaker-cap.png',  w: 111.42, h: 120.88,
          center: [431.4, 163.9, 5.2],  side: [161.8, 165.9, -6.08],  open: [184.4, 137.7, -13.21], pour: [102.7, 146.7, -12.66] },
};
// Fan in the "after" frame 719:1675, left → right (center, rotation, width — one card scaled), paint order.
// In "poured" the same fan sits 20px lower.
const UNLOCK_FAN = [
  { x: 195.2, y: 244.1, r: -31,    w: 106.49, z: 1 },
  { x: 255.7, y: 219.1, r: -19.86, w: 124.65, z: 3 },
  { x: 352.9, y: 205.9, r: -4.15,  w: 140.29, z: 4 },
  { x: 470.1, y: 204.5, r: 3.73,   w: 140.29, z: 6 },
  { x: 577.1, y: 225.8, r: 14.98,  w: 125.17, z: 5 },
  { x: 650.6, y: 248.6, r: 28.2,   w: 106.49, z: 2 },
];
// Carousel in the final frame 731:253 — slot by offset from the middle card. With six drinks one is
// always tucked behind the middle card (offset 3).
const UNLOCK_ROW = {
  '-2': { x: 236.3, y: 194.1, w: 115.56, o: 0.6, z: 1 },
  '-1': { x: 319.0, y: 194.8, w: 136.76, o: 0.8, z: 2 },
  '0':  { x: 422.1, y: 195.0, w: 174.25, o: 1,   z: 3 },
  '1':  { x: 543.8, y: 194.8, w: 136.76, o: 0.8, z: 2 },
  '2':  { x: 607.7, y: 194.1, w: 115.56, o: 0.6, z: 1 },
  '3':  { x: 422.1, y: 195.0, w: 115.56, o: 0,   z: 0 },
};
const SIG_CARD_W = 140.29, SIG_CARD_H = 156.19, SIG_CARD_BG = '#3c3b5c';
// Carousel order (user, 2026-10-08): The Bone Dry in the middle, then the poster order
const UNLOCK_ORDER = ['the-bone-dry', 'sour-skull', 'funny-bone', 'night-shift', 'skeletonic', 'grave-yard'];
// Fan slot → carousel offset, so each card glides to its neighbour's spot (The Bone Dry on the top fan card)
const FAN_OFFSETS = [3, -2, -1, 0, 1, 2];

const pose = (w, h, [cx, cy, r], s = 1) => `translate(${cx - w / 2}px, ${cy - h / 2}px) rotate(${r}deg) scale(${s})`;
const rowOffset = (ci, index) => { const n = UNLOCK_ORDER.length; let o = ((ci - index) % n + n) % n; return o > 3 ? o - n : o; };
const rowPose = slot => pose(SIG_CARD_W, SIG_CARD_H, [slot.x, slot.y, 0], slot.w / SIG_CARD_W);

function buildSigCard(drink) {
  const c = document.createElement('div');
  c.className = 'sig-card';
  c.style.background = SIG_CARD_BG;
  c.style.opacity = 0;   // hidden until it flies out of the shaker
  c.innerHTML = `<div class="t"></div>
    <div class="ls">${drink.ingredients.map(recipeLine).join('')}</div><div class="g"><div class="drink-view"></div></div>`;
  renderDrinkView(c.querySelector('.drink-view'), drink.ingredients.filter(i => i.oz).map(i => ({ id: i.id, oz: i.oz })), drinkGarnishes(drink));
  return c;
}
// After it's in the page: shrink the name to fit, and the lines so the glass stays on the card
function fitSigCard(c, drink) {
  const t = c.querySelector('.t'), name = drink.name.toUpperCase();
  let size = 21.04;
  const setName = () => { t.style.fontSize = size + 'px'; t.innerHTML = scratchyHTML(name, size); };
  setName();
  while (t.offsetWidth > 122 && size > 12) { size -= 0.5; setName(); }
  const ls = c.querySelector('.ls'), g = c.querySelector('.g');
  let fs = 13.09;
  // same space under the glass as above the title (17.3)
  while (g.offsetTop + g.offsetHeight > SIG_CARD_H - 17.3 && fs > 8.5) { fs -= 0.25; ls.style.fontSize = fs + 'px'; ls.style.lineHeight = fs > 11 ? 1.32 : 1.22; }
}

let unlockAnims = [];
const unlockRow = { index: 0, cards: [], live: false, swiped: false };
function unlockSignatureMenu() {
  signatureUnlocked = true;
  try { localStorage.setItem(SIGNATURE_KEY, '1'); } catch (e) { /* storage unavailable */ }
  playUnlock();
}

function playUnlock(freezeAt) {
  const ov = $('unlock-overlay'), stage = $('unlock-stage');
  unlockAnims.forEach(a => a.cancel());
  unlockAnims = [];
  unlockRow.live = false; unlockRow.index = 0;
  $('btn-unlock-home').classList.remove('shown');   // only appears once the animation is done (user, 2026-10-08)
  $('btn-unlock-skip').classList.remove('gone');    // SKIP shows while it plays (Figma 719:1911)
  stage.innerHTML = '';
  ov.style.display = '';
  const anim = (el, kf, delay, duration, easing = 'ease-in-out', extra = {}) => {
    const a = el.animate(kf, { delay, duration, easing, fill: 'both', ...extra }); unlockAnims.push(a); return a; };

  // Shaker: a rig (for the shake) holding the body + cap
  const rig = document.createElement('div'); rig.className = 'shaker-rig'; stage.appendChild(rig);
  const parts = {};
  for (const [k, p] of Object.entries(SHAKER_PARTS)) {
    const img = document.createElement('img');
    img.className = 'shaker-part'; img.src = p.src; img.alt = '';
    Object.assign(img.style, { width: p.w + 'px', height: p.h + 'px' });
    rig.appendChild(img); parts[k] = img;
  }
  const B = SHAKER_PARTS.body, C = SHAKER_PARTS.cap;

  // Cards (in the page first so they can be measured). Fan slot i holds the card that ends at FAN_OFFSETS[i].
  const cards = FAN_OFFSETS.map((off, i) => {
    const ci = (off + UNLOCK_ORDER.length) % UNLOCK_ORDER.length, drink = SIGNATURES.find(d => d.id === UNLOCK_ORDER[ci]);
    const c = buildSigCard(drink); stage.appendChild(c); fitSigCard(c, drink);
    c.style.zIndex = UNLOCK_FAN[i].z;
    c.addEventListener('click', (e) => { if (!unlockRow.live) return; e.stopPropagation(); const o = rowOffset(ci, unlockRow.index); if (o && o !== 3 && !unlockRow.swiped) moveUnlockRow(o); });
    return { c, fan: UNLOCK_FAN[i], ci };
  });
  unlockRow.cards = cards;

  // Customer + bubble (final frame), arrows
  const cust = document.createElement('img'); cust.id = 'unlock-customer'; cust.src = customerImg('purple', 'selected'); cust.alt = ''; stage.appendChild(cust);
  const bub = document.createElement('div'); bub.id = 'unlock-bubble';
  bub.innerHTML = '<img src="assets/ui/unlock-bubble.svg" alt="" /><p>The Bone Dry signature cocktails are now available for your customers to order.</p>';
  stage.appendChild(bub);
  const arrows = ['prev', 'next'].map(dir => {
    const b = document.createElement('button'); b.className = 'unlock-arrow ' + dir; b.setAttribute('aria-label', dir === 'prev' ? 'Previous drink' : 'Next drink');
    b.innerHTML = '<img src="assets/ui/menu-arrow-next.svg" alt="" />';
    b.addEventListener('click', (e) => { e.stopPropagation(); if (unlockRow.live) moveUnlockRow(dir === 'prev' ? -1 : 1); });
    stage.appendChild(b); return b;
  });

  // 0 — screen fades in
  anim(ov, [{ opacity: 0 }, { opacity: 1 }], 0, 300, 'ease-out');
  // 1 — shaking by itself in the middle (rig wobbles around the shaker's base, harder and harder, with little hops)
  const SHAKE_AT = 350, SHAKE_MS = 1500;
  rig.style.transformOrigin = '408px 422px';
  const wob = [];
  for (let k = 0; k <= 16; k++) {
    const amp = k === 0 || k === 16 ? 0 : 2 + 7 * (k / 16);
    wob.push({ transform: `translateY(${k % 2 ? -3 - amp / 3 : 0}px) rotate(${k % 2 ? amp : -amp}deg)`, offset: k / 16 });
  }
  anim(rig, wob, SHAKE_AT, SHAKE_MS, 'linear');
  // 2 — slides over to the left side
  const MOVE_AT = SHAKE_AT + SHAKE_MS + 100, MOVE_MS = 650;
  anim(parts.body, [{ transform: pose(B.w, B.h, B.center) }, { transform: pose(B.w, B.h, B.side) }], MOVE_AT, MOVE_MS);
  anim(parts.cap, [{ transform: pose(C.w, C.h, C.center) }, { transform: pose(C.w, C.h, C.side) }], MOVE_AT, MOVE_MS);
  // 3 — tips over, cap pops off
  const TIP_AT = MOVE_AT + MOVE_MS + 120, TIP_MS = 420;
  anim(parts.body, [{ transform: pose(B.w, B.h, B.side) }, { transform: pose(B.w, B.h, B.open) }], TIP_AT, TIP_MS, 'cubic-bezier(.5,0,.8,.6)', { fill: 'forwards' });
  anim(parts.cap, [{ transform: pose(C.w, C.h, C.side) },
                   { transform: pose(C.w, C.h, [C.open[0] - 4, C.open[1] - 22, C.open[2] - 6]), offset: .7 },
                   { transform: pose(C.w, C.h, C.open) }], TIP_AT, TIP_MS + 80, 'ease-out', { fill: 'forwards' });
  // 4 — keeps falling to "poured"; the cap tumbles off to the side
  const POUR_AT = TIP_AT + TIP_MS + 60, POUR_MS = 380;
  anim(parts.body, [{ transform: pose(B.w, B.h, B.open) }, { transform: pose(B.w, B.h, B.pour) }], POUR_AT, POUR_MS, 'cubic-bezier(.4,0,.6,1.3)', { fill: 'forwards' });
  anim(parts.cap, [{ transform: pose(C.w, C.h, C.open) },
                   { transform: pose(C.w, C.h, [C.pour[0] + 30, C.pour[1] - 40, C.pour[2] - 20]), offset: .45 },
                   { transform: pose(C.w, C.h, C.pour) }], POUR_AT, POUR_MS + 200, 'ease-out', { fill: 'forwards' });
  // 5 — cards fly out of the shaker's mouth into the fan ("poured" = the fan 20px lower)
  const r = B.pour[2] * Math.PI / 180, mouth = [B.pour[0] + Math.sin(r) * B.h / 2, B.pour[1] - Math.cos(r) * B.h / 2];
  const OUT_AT = POUR_AT + POUR_MS - 60;
  const fanPose = (f, dy = 0) => pose(SIG_CARD_W, SIG_CARD_H, [f.x, f.y + dy, f.r], f.w / SIG_CARD_W);
  cards.forEach(({ c, fan }, n) => {
    const s = fan.w / SIG_CARD_W, mid = [(mouth[0] + fan.x) / 2, Math.min(mouth[1], fan.y + 20) - 70, fan.r * 0.5 + 25];
    anim(c, [{ transform: pose(SIG_CARD_W, SIG_CARD_H, [mouth[0], mouth[1], B.pour[2]], 0.12), opacity: 0 },
             { transform: pose(SIG_CARD_W, SIG_CARD_H, mid, s * 0.8), opacity: 1, offset: .45 },
             { transform: fanPose(fan, 20), opacity: 1 }], OUT_AT + n * 110, 620, 'cubic-bezier(.25,.8,.3,1)', { fill: 'forwards' });
  });
  // 6 — the shaker slides off, the fan rises into the "after" frame, the title fades in
  const AWAY_AT = OUT_AT + 5 * 110 + 620 + 250;
  anim(rig, [{ transform: 'none', opacity: 1 }, { transform: 'translate(-150px, 60px)', opacity: 0 }], AWAY_AT, 500, 'ease-in', { fill: 'forwards' });
  cards.forEach(({ c, fan }) => anim(c, [{ transform: fanPose(fan, 20) }, { transform: fanPose(fan) }], AWAY_AT + 150, 450, 'ease-out', { fill: 'forwards' }));
  const title = $('unlock-title');
  anim(title, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], AWAY_AT + 350, 500, 'ease-out');
  // 7 — short pause, then the cards straighten into the carousel; the title moves up to make room
  const ROW_AT = AWAY_AT + 350 + 500 + 900, ROW_MS = 700;
  // (paint order switches from the fan's to the carousel's halfway through — a discrete z-index step)
  cards.forEach(({ c, fan, ci }) => {
    const slot = UNLOCK_ROW[rowOffset(ci, 0)];
    anim(c, [{ transform: fanPose(fan), opacity: 1, zIndex: fan.z, offset: 0 }, { zIndex: fan.z, offset: .5 }, { zIndex: slot.z, offset: .5 },
             { transform: rowPose(slot), opacity: slot.o, zIndex: slot.z, offset: 1 }], ROW_AT, ROW_MS, 'cubic-bezier(.45,0,.25,1)', { fill: 'forwards' });
  });
  anim(title, [{ transform: 'none' }, { transform: 'translateY(-19px)' }], ROW_AT, ROW_MS, 'cubic-bezier(.45,0,.25,1)', { fill: 'forwards' });
  arrows.forEach(b => anim(b, [{ opacity: 0 }, { opacity: 1 }], ROW_AT + 400, 400, 'ease-out'));
  // 8 — the purple customer rises up from the bottom, then their bubble pops in
  anim(cust, [{ transform: 'translateY(110px)' }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'none' }], ROW_AT + 500, 550, 'ease-out');
  anim(bub, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.06)', offset: .7 }, { opacity: 1, transform: 'none' }], ROW_AT + 1100, 320, 'ease-out');
  // Resting state for the shaker parts before their animations start
  parts.body.style.transform = pose(B.w, B.h, B.center);
  parts.cap.style.transform = pose(C.w, C.h, C.center);

  // When everything has played (or was skipped), hand the cards over to the carousel
  Promise.all(unlockAnims.map(a => a.finished)).then(startUnlockRow, () => {});

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) unlockAnims.forEach(a => a.finish());
  if (freezeAt != null) unlockAnims.forEach(a => { a.pause(); a.currentTime = freezeAt; });
}

// Carousel (same feel as the DRINK MENU): arrows, swipe, tap a side card; loops
function placeUnlockRow() {
  unlockRow.cards.forEach(({ c, ci }) => {
    const slot = UNLOCK_ROW[rowOffset(ci, unlockRow.index)];
    c.style.transform = rowPose(slot); c.style.opacity = slot.o; c.style.zIndex = slot.z;
  });
}
function startUnlockRow() {
  unlockRow.cards.forEach(({ c }) => c.getAnimations().forEach(a => a.cancel()));
  placeUnlockRow();
  void $('unlock-stage').offsetWidth;
  unlockRow.cards.forEach(({ c }) => c.classList.add('in-row'));
  unlockRow.live = true;
  $('btn-unlock-home').classList.add('shown');
  $('btn-unlock-skip').classList.add('gone');
}
function moveUnlockRow(dir) {
  if (!dir) return;
  const step = Math.sign(dir), n = UNLOCK_ORDER.length;
  unlockRow.index = (unlockRow.index + step + n) % n;
  placeUnlockRow();
  if (Math.abs(dir) > 1) setTimeout(() => moveUnlockRow(dir - step), 120);
}
(() => {
  let x0 = null;
  $('unlock-stage').addEventListener('pointerdown', (e) => { x0 = unlockRow.live ? e.clientX : null; });
  window.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const r = $('unlock-overlay').getBoundingClientRect(), dx = (e.clientX - x0) * 844 / r.width;
    x0 = null;
    if (Math.abs(dx) > 40) { moveUnlockRow(dx < 0 ? 1 : -1); unlockRow.swiped = true; setTimeout(() => { unlockRow.swiped = false; }, 60); }
  });
})();

const closeUnlock = () => { unlockAnims.forEach(a => a.cancel()); unlockAnims = []; unlockRow.live = false; $('unlock-overlay').style.display = 'none'; showScreen('home'); };
$('btn-unlock-home').addEventListener('click', (e) => { e.stopPropagation(); closeUnlock(); });
// SKIP jumps to the final frame (tapping elsewhere no longer skips — user, 2026-10-08)
$('btn-unlock-skip').addEventListener('click', (e) => { e.stopPropagation(); if (!unlockRow.live) unlockAnims.forEach(a => { if (a.playState !== 'finished') a.finish(); }); });

