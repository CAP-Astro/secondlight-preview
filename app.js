/* Second Light AU — clickable UI mockup (vanilla JS, hash routing, sample data). */
(() => {
  'use strict';

  const CURRENCY = 'A$';
  // Owner-adjustable fee rules (edited on the Owner admin screen). Launch mode makes listing free.
  const DEFAULT_FEES = {
    launch: true, launchEnds: '2027-06-30', firstFree: true, foundingDiscount: 50, launchCredits: 2,
    rate: 2, min: 2, cap: 40, featured: 7, spotlight: 15, bump: 2,
  };

  // ---------- Storage (per-browser convenience only) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('am:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('am:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  const state = {
    user: store.get('user', null),
    favs: store.get('favs', []),
    myListings: store.get('myListings', []),
    sold: store.get('sold', []),
    sent: store.get('sent', []),
    receipts: store.get('receipts', []),
    fees: { ...DEFAULT_FEES, ...store.get('fees', {}) },
  };
  const save = () => ['user', 'favs', 'myListings', 'sold', 'sent', 'receipts', 'fees'].forEach(k => store.set(k, state[k]));

  // ---------- Categories ----------
  const CATS = [
    { id: 'telescopes', name: 'Telescopes', blurb: 'Refractors, RCs, SCTs, smart scopes', kind: 'refractor' },
    { id: 'mounts', name: 'Mounts', blurb: 'EQ, harmonic, star trackers', kind: 'mount' },
    { id: 'cameras', name: 'Cameras', blurb: 'Cooled CMOS, mono, DSLR', kind: 'camera' },
    { id: 'filters', name: 'Filters', blurb: 'Narrowband, LRGB, dual-band', kind: 'filter' },
    { id: 'guiding', name: 'Guiding', blurb: 'Guide scopes, OAGs, cams', kind: 'guide' },
    { id: 'accessories', name: 'Accessories', blurb: 'Focusers, power, controllers', kind: 'box' },
  ];
  const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
  const stateOf = l => (l.location || '').split(',').pop().trim();
  // Rough Australian postcode -> state lookup for delivery estimates.
  const postcodeState = pc => {
    const n = Number(pc);
    if (!/^\d{4}$/.test(pc)) return '';
    if (n >= 800 && n <= 999) return 'NT';
    if ((n >= 200 && n <= 299) || (n >= 2600 && n <= 2618) || (n >= 2900 && n <= 2920)) return 'ACT';
    return { 1: 'NSW', 2: 'NSW', 3: 'VIC', 4: 'QLD', 5: 'SA', 6: 'WA', 7: 'TAS', 8: 'VIC', 9: 'QLD' }[pc[0]] || '';
  };
  const catName = id => (CATS.find(c => c.id === id) || {}).name || id;

  // ---------- Sample listings ----------
  const LISTINGS = [
    { id: 1, title: 'William Optics RedCat 51 WIFD Petzval APO', cat: 'telescopes', brand: 'William Optics', price: 749, was: 999, cond: 'Like new', location: 'Brisbane, QLD', seller: 'nebula_nick', rating: 4.9, sales: 37, posted: '2 days ago', kind: 'refractor', hue: 0,
      specs: { Aperture: '51 mm', 'Focal length': '250 mm (f/4.9)', Design: 'Petzval, 4-element', Backfocus: '55 mm', Weight: '1.6 kg' },
      desc: 'Used for one season under dark skies. Optics are spotless, no scratches on the coatings. Comes with original soft case, Bahtinov mask cap and Vixen dovetail. Selling only because I upgraded to a larger refractor.' },
    { id: 2, title: 'ZWO ASI2600MC Pro — Cooled Colour APS-C Camera', cat: 'cameras', brand: 'ZWO', price: 1390, was: 1799, cond: 'Like new', location: 'Perth, WA', seller: 'darksky_dee', rating: 5.0, sales: 12, posted: '5 hours ago', kind: 'camera', hue: 0,
      specs: { Sensor: 'Sony IMX571', Resolution: '26 MP', 'Pixel size': '3.76 µm', Cooling: 'TEC, ΔT 35°C', ADC: '16-bit' },
      desc: 'Approximately 120 hours of use. No dust on sensor window, cooler works perfectly. Includes original box, cables, power lead and adapter set.' },
    { id: 3, title: 'Sky-Watcher EQ6-R Pro SynScan GoTo Mount', cat: 'mounts', brand: 'Sky-Watcher', price: 1650, cond: 'Good', location: 'Melbourne, VIC', seller: 'orion_oz', rating: 4.8, sales: 58, posted: '1 day ago', kind: 'mount', hue: 220,
      specs: { Payload: '20 kg', Type: 'German equatorial', Control: 'SynScan hand controller', Weight: '17.3 kg head', Tripod: '2" steel legs' },
      desc: 'Belt-modded and recently re-greased. Guides at 0.5–0.7" RMS with PHD2. Light cosmetic wear on the tripod legs. Local pickup preferred; can ship palletised at buyer cost.' },
    { id: 4, title: 'Optolong L-eXtreme 2" Dual-Band 7nm Filter', cat: 'filters', brand: 'Optolong', price: 245, was: 329, cond: 'Like new', location: 'Sydney, NSW', seller: 'halpha_hana', rating: 4.9, sales: 21, posted: '3 days ago', kind: 'filter', hue: 340,
      specs: { Size: '2" mounted', Bandpass: 'Hα 7nm + OIII 7nm', Thread: 'M48 x 0.75', Thickness: '1.85 mm' },
      desc: 'Perfect for OSC cameras under light-polluted skies. No scratches or coating defects. Original case included.' },
    { id: 5, title: 'Celestron EdgeHD 8" Optical Tube Assembly', cat: 'telescopes', brand: 'Celestron', price: 1890, cond: 'Good', location: 'Adelaide, SA', seller: 'galaxy_gus', rating: 4.7, sales: 9, posted: '1 week ago', kind: 'sct', hue: 30,
      specs: { Aperture: '203 mm', 'Focal length': '2032 mm (f/10)', Design: 'Aplanatic SCT', Weight: '6.4 kg', Dovetail: 'Vixen/CGE' },
      desc: 'Great planetary and galaxy scope. Collimation is spot-on. Small mark on the tube paint, optics clean. Includes 0.7x reducer (worth $650).' },
    { id: 6, title: 'ZWO ASIAIR Plus 256GB Smart Controller', cat: 'accessories', brand: 'ZWO', price: 299, was: 389, cond: 'Like new', location: 'Hobart, TAS', seller: 'southern_sky', rating: 5.0, sales: 4, posted: '6 hours ago', kind: 'box', hue: 200,
      specs: { Storage: '256 GB eMMC', Ports: '4x USB, 4x 12V DC', Wireless: 'Dual-band Wi-Fi', Power: '12V DC' },
      desc: 'Moved to a mini-PC setup so this is spare. Works flawlessly, firmware up to date.' },
    { id: 7, title: 'iOptron CEM40 Center-Balanced Equatorial Mount', cat: 'mounts', brand: 'iOptron', price: 2150, cond: 'Like new', location: 'Canberra, ACT', seller: 'pier_pete', rating: 4.9, sales: 15, posted: '4 days ago', kind: 'mount', hue: 0,
      specs: { Payload: '18 kg', Type: 'Center-balanced EQ', Weight: '7.2 kg head', 'Polar scope': 'iPolar electronic', Tripod: 'Not included' },
      desc: 'Head only, used on a permanent pier. Includes counterweight, hand controller and iPolar.' },
    { id: 8, title: 'Askar FRA400 72mm f/5.6 Quintuplet Astrograph', cat: 'telescopes', brand: 'Askar', price: 920, was: 1199, cond: 'Like new', location: 'Gold Coast, QLD', seller: 'nebula_nick', rating: 4.9, sales: 37, posted: '2 days ago', kind: 'refractor', hue: 260,
      specs: { Aperture: '72 mm', 'Focal length': '400 mm (f/5.6)', Design: 'Quintuplet flat-field', Backfocus: '55 mm', Weight: '3.2 kg' },
      desc: 'Pin-sharp corners on full frame. Includes rings, handle, dovetail and dew heater strap.' },
    { id: 9, title: 'Antlia 3nm Pro Hα 36mm Unmounted Filter', cat: 'filters', brand: 'Antlia', price: 310, cond: 'New', location: 'Darwin, NT', seller: 'halpha_hana', rating: 4.9, sales: 21, posted: '12 hours ago', kind: 'filter', hue: 350,
      specs: { Size: '36 mm unmounted', Bandpass: 'Hα 3nm', Transmission: '>90%', Thickness: '2 mm' },
      desc: 'Brand new, unopened. Bought two by mistake.' },
    { id: 10, title: 'ZWO ASI120MM Mini Guide Camera', cat: 'guiding', brand: 'ZWO', price: 95, cond: 'Good', location: 'Newcastle, NSW', seller: 'orion_oz', rating: 4.8, sales: 58, posted: '3 days ago', kind: 'guide', hue: 210,
      specs: { Sensor: 'AR0130CS mono', Resolution: '1.2 MP', 'Pixel size': '3.75 µm', Port: 'ST4 + USB 2.0' },
      desc: 'Reliable guide cam. Comes with ST4 cable and USB cable.' },
    { id: 11, title: 'Sky-Watcher Star Adventurer GTi Tracker Kit', cat: 'mounts', brand: 'Sky-Watcher', price: 540, cond: 'Like new', location: 'Cairns, QLD', seller: 'milkyway_mo', rating: 4.6, sales: 3, posted: '5 days ago', kind: 'mount', hue: 160,
      specs: { Payload: '5 kg', Type: 'GoTo star tracker', Control: 'SynScan app (Wi-Fi)', Weight: '1.4 kg head' },
      desc: 'Ideal for widefield and travel. Includes tripod, counterweight and EQ wedge.' },
    { id: 12, title: 'Pegasus Astro Pocket Powerbox Advance Gen2', cat: 'accessories', brand: 'Pegasus Astro', price: 215, was: 289, cond: 'Good', location: 'Geelong, VIC', seller: 'southern_sky', rating: 5.0, sales: 4, posted: '1 week ago', kind: 'box', hue: 0,
      specs: { Outputs: '4x 12V, 2x dew', USB: '6x USB 2.0 hub', Sensors: 'Temp/humidity', Input: '12V 10A' },
      desc: 'Fully working, minor scuffs on the case. Includes power cable.' },
    { id: 13, title: 'ZWO Seestar S50 All-in-One Smart Telescope', cat: 'telescopes', brand: 'ZWO', price: 699, was: 849, cond: 'Like new', location: 'Wollongong, NSW', seller: 'milkyway_mo', rating: 4.6, sales: 3, posted: '8 hours ago', kind: 'smart', hue: 0,
      specs: { Aperture: '50 mm', 'Focal length': '250 mm', Sensor: 'Sony IMX462', Battery: '6000 mAh', Weight: '2.5 kg' },
      desc: 'Fun grab-and-go scope. Includes tripod and solar filter. Upgrading to a full rig.' },
    { id: 14, title: 'William Optics UniGuide 32mm Guide Scope', cat: 'guiding', brand: 'William Optics', price: 120, cond: 'Good', location: 'Toowoomba, QLD', seller: 'pier_pete', rating: 4.9, sales: 15, posted: '2 weeks ago', kind: 'guide', hue: 40,
      specs: { Aperture: '32 mm', 'Focal length': '120 mm', Focus: 'Helical', Mount: 'Vixen-style foot' },
      desc: 'Guides great with a 120mm mini. Slight anodising wear.' },
    { id: 15, title: 'ZWO EAF Electronic Auto Focuser (5V)', cat: 'accessories', brand: 'ZWO', price: 135, cond: 'Like new', location: 'Ballarat, VIC', seller: 'darksky_dee', rating: 5.0, sales: 12, posted: '4 days ago', kind: 'box', hue: 280,
      specs: { Steps: '5760 / rev', Power: '5V USB', Compatibility: 'ASIAIR, ASCOM, INDI', Bracket: 'Universal kit' },
      desc: 'Includes universal bracket set and hand controller.' },
    { id: 16, title: 'Canon EOS Ra Full-Frame Astro Mirrorless Body', cat: 'cameras', brand: 'Canon', price: 1450, cond: 'Good', location: 'Bendigo, VIC', seller: 'galaxy_gus', rating: 4.7, sales: 9, posted: '6 days ago', kind: 'dslr', hue: 0,
      specs: { Sensor: '30 MP full-frame', 'Hα sensitivity': '4x standard', Mount: 'RF', 'Shutter count': '~8,200' },
      desc: 'Discontinued astro-modified body. Two batteries, charger and strap included.' },
  ];

  const allListings = () => [...state.myListings, ...LISTINGS];
  const byId = id => allListings().find(l => String(l.id) === String(id));

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => CURRENCY + Number(n).toLocaleString('en-AU', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const stars = r => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
  const condClass = c => ({ 'New': 'tag-new', 'Like new': 'tag-like-new', 'Good': 'tag-good', 'Fair': 'tag-fair' }[c] || 'tag-good');
  const initials = n => n.replace(/[^a-z]/gi, ' ').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- Icons ----------
  const I = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 4 4 7.3 4c2 0 3.5 1.1 4.7 2.7C13.2 5.1 14.7 4 16.7 4 20 4 22.4 7.3 21.2 10.7 19.5 15.4 12 20 12 20Z"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4V5Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  };

  // Category glyphs (line icons)
  const CAT_ICONS = {
    telescopes: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 22 26-11 3 7-26 11z"/><path d="m34 11 4-2 3 7-4 2"/><path d="M20 26l-6 16M22 25l6 17M21 26v16"/></svg>',
    mounts: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="8" width="12" height="12" rx="2"/><path d="M24 20v6M10 42l14-16 14 16M24 26v16M30 14h10M40 10v8"/></svg>',
    cameras: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><rect x="20" y="20" width="8" height="8" rx="1"/></svg>',
    filters: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="12" stroke-dasharray="2 3"/><path d="M15 19c5-4 13-4 18 0" /></svg>',
    guiding: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="24" r="14"/><path d="M24 4v10M24 34v10M4 24h10M34 24h10"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>',
    accessories: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="8" y="14" width="32" height="22" rx="3"/><path d="M14 36v4M34 36v4M14 22h4M14 28h4"/><circle cx="31" cy="25" r="4"/></svg>',
  };

  // ---------- Generated product art (placeholder for real photos) ----------
  let artSeq = 0;
  function rng(seed) { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

  function art(kind, hue = 0, seed = 1) {
    const id = 'a' + (++artSeq);
    const r = rng(seed * 7 + 3);
    const bg = 205 + Math.round(r() * 20);
    const h1 = (215 + hue) % 360, h2 = (195 + hue) % 360;
    const metal = `url(#${id}m)`;
    const objects = {
      refractor: `<g transform="translate(200 150) rotate(-18)">
          <rect x="-130" y="-30" width="200" height="60" rx="8" fill="${metal}"/>
          <rect x="60" y="-36" width="70" height="72" rx="6" fill="#20263f" stroke="#3a4470"/>
          <rect x="-160" y="-16" width="34" height="32" rx="4" fill="#2b3150"/>
          <rect x="-178" y="-12" width="20" height="24" rx="3" fill="#c33d4a"/>
          <rect x="-70" y="-44" width="16" height="88" rx="3" fill="#1a1f35"/><rect x="0" y="-44" width="16" height="88" rx="3" fill="#1a1f35"/>
          <rect x="-90" y="-52" width="120" height="10" rx="4" fill="#2b3150"/>
          <ellipse cx="130" cy="0" rx="4" ry="34" fill="hsl(${h1} 60% 55%)" opacity=".6"/></g>`,
      sct: `<g transform="translate(205 150) rotate(-12)">
          <rect x="-110" y="-60" width="190" height="120" rx="14" fill="hsl(${(25 + hue) % 360} 25% 22%)" stroke="#3a4470"/>
          <rect x="60" y="-64" width="30" height="128" rx="6" fill="#1a1f35"/>
          <ellipse cx="90" cy="0" rx="10" ry="58" fill="hsl(${h1} 50% 45%)" opacity=".55"/>
          <rect x="-140" y="-18" width="34" height="36" rx="4" fill="#2b3150"/>
          <rect x="-60" y="58" width="110" height="12" rx="3" fill="#8a93b8"/></g>`,
      camera: `<g transform="translate(200 150)">
          <circle r="92" fill="${metal}"/>
          ${Array.from({ length: 24 }, (_, i) => `<rect x="-3" y="-104" width="6" height="16" rx="2" fill="#2b3150" transform="rotate(${i * 15})"/>`).join('')}
          <circle r="62" fill="#c33d4a"/><circle r="50" fill="#0a0d1a"/>
          <rect x="-26" y="-18" width="52" height="36" rx="3" fill="hsl(${h1} 60% 40%)"/>
          <rect x="-26" y="-18" width="52" height="36" rx="3" fill="url(#${id}g)" opacity=".7"/></g>`,
      dslr: `<g transform="translate(200 158)">
          <rect x="-120" y="-60" width="240" height="120" rx="18" fill="#1a1d2b" stroke="#3a4470"/>
          <rect x="-40" y="-84" width="80" height="30" rx="6" fill="#1a1d2b" stroke="#3a4470"/>
          <circle r="54" fill="#2b3150"/><circle r="40" fill="#0a0d1a"/><circle r="40" fill="url(#${id}g)" opacity=".6"/>
          <circle cx="86" cy="-38" r="8" fill="#c33d4a"/></g>`,
      mount: `<g transform="translate(200 150)">
          <path d="M-8 30 L-110 140 M8 30 L110 140 M0 30 L0 150" stroke="#8a93b8" stroke-width="10" stroke-linecap="round"/>
          <rect x="-46" y="-10" width="92" height="46" rx="8" fill="#2b3150" stroke="#3a4470"/>
          <rect x="-34" y="-90" width="68" height="86" rx="10" fill="${metal}"/>
          <circle cx="0" cy="-48" r="22" fill="#1a1f35" stroke="#3a4470"/>
          <path d="M34 -48 L140 -48" stroke="#8a93b8" stroke-width="8" stroke-linecap="round"/>
          <rect x="118" y="-70" width="26" height="44" rx="4" fill="#5a6390"/>
          <rect x="-70" y="-104" width="140" height="14" rx="4" fill="hsl(${(hue + 210) % 360} 30% 35%)"/></g>`,
      filter: `<g transform="translate(200 150)">
          <circle r="96" fill="${metal}"/><circle r="84" fill="#141a2e"/>
          <circle r="78" fill="url(#${id}f)"/>
          <ellipse cx="-24" cy="-30" rx="40" ry="16" fill="#fff" opacity=".18" transform="rotate(-30)"/></g>`,
      guide: `<g transform="translate(200 150) rotate(-14)">
          <rect x="-120" y="-20" width="170" height="40" rx="6" fill="${metal}"/>
          <rect x="50" y="-26" width="50" height="52" rx="5" fill="#20263f" stroke="#3a4470"/>
          <rect x="-160" y="-28" width="44" height="56" rx="22" fill="#c33d4a"/>
          <rect x="-60" y="20" width="60" height="26" rx="3" fill="#2b3150"/></g>`,
      box: `<g transform="translate(200 150)">
          <rect x="-120" y="-70" width="240" height="140" rx="18" fill="${metal}"/>
          <rect x="-104" y="-54" width="208" height="30" rx="6" fill="#141a2e"/>
          ${Array.from({ length: 6 }, (_, i) => `<rect x="${-92 + i * 32}" y="-46" width="20" height="14" rx="2" fill="#2b3150"/>`).join('')}
          ${Array.from({ length: 4 }, (_, i) => `<circle cx="${-78 + i * 34}" cy="30" r="11" fill="#1a1f35" stroke="#3a4470"/>`).join('')}
          <circle cx="86" cy="30" r="7" fill="hsl(${(hue + 130) % 360} 80% 55%)"/>
          <circle cx="86" cy="30" r="14" fill="hsl(${(hue + 130) % 360} 80% 55%)" opacity=".2"/></g>`,
      smart: `<g transform="translate(200 150) rotate(-25)">
          <rect x="-70" y="-90" width="140" height="180" rx="40" fill="#d7dbe8"/>
          <rect x="-70" y="-90" width="140" height="40" rx="20" fill="#c33d4a"/>
          <circle cx="0" cy="-30" r="28" fill="#0a0d1a"/><circle cx="0" cy="-30" r="28" fill="url(#${id}g)" opacity=".6"/>
          <rect x="-20" y="50" width="40" height="6" rx="3" fill="#8a93b8"/></g>`,
    };
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Product photo placeholder">
      <defs>
        <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f1f3fa"/><stop offset=".5" stop-color="#b7bdd4"/><stop offset="1" stop-color="#7d84a3"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${h1} 90% 70%)"/><stop offset="1" stop-color="hsl(${h2} 90% 40%)"/></linearGradient>
        <radialGradient id="${id}f" cx="35%" cy="35%" r="80%"><stop stop-color="hsl(${(hue + 340) % 360} 90% 65%)" stop-opacity=".95"/><stop offset=".6" stop-color="hsl(${(hue + 175) % 360} 80% 45%)" stop-opacity=".85"/><stop offset="1" stop-color="#0a0d1a"/></radialGradient>
      </defs>
      <rect width="400" height="300" fill="hsl(${bg} 40% 94%)"/>
      <rect y="214" width="400" height="86" fill="hsl(${bg} 32% 89%)"/>
      <ellipse cx="200" cy="262" rx="150" ry="12" fill="#16233f" opacity=".07"/>
      ${objects[kind] || objects.box}
    </svg>`;
  }

  // Artwork for a listing; user-created listings may carry real uploaded photos.
  function listingArt(l, variant = 0) {
    if (l.photos && l.photos.length) {
      const src = l.photos[variant % l.photos.length];
      return `<div style="width:100%;height:100%;background:url('${src}') center/cover"></div>`;
    }
    const seed = Number(String(l.id).replace(/\D/g, '').slice(-4)) || 7;
    return art(l.kind, l.hue + variant * 40, seed * 13 + variant);
  }

  // ---------- Launch model: featured samples, founding sellers, fees ----------
  [2, 8, 13].forEach(id => { LISTINGS.find(l => l.id === id).featured = true; });
  const FOUNDING_SELLERS = ['nebula_nick', 'darksky_dee', 'halpha_hana', 'southern_sky'];
  const isFounding = l => FOUNDING_SELLERS.includes(l.seller) || (l.mine && state.user && state.user.founding);
  const publicListings = () => allListings().filter(l => l.status !== 'review' && !state.sold.includes(l.id));
  const idOf = raw => (isNaN(raw) ? raw : Number(raw));
  const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const today = () => new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const UPGRADES = [
    { id: 'featured', name: 'Featured', desc: 'Top of search and category pages for 7 days' },
    { id: 'spotlight', name: 'Home page spotlight', desc: 'Shown on the home page for 7 days' },
    { id: 'bump', name: 'Bump', desc: 'Move back to the top of “newest” once' },
  ];

  function newUser(name, email) {
    const f = state.fees;
    return { name, email, founding: f.launch, credits: f.launch ? f.launchCredits : 0, listed: 0 };
  }
  if (state.user && state.user.credits == null) state.user = newUser(state.user.name, state.user.email);

  function baseFee(price) {
    const f = state.fees;
    if (!price) return 0;
    return Math.min(f.cap, Math.max(f.min, Math.round(price * f.rate) / 100));
  }

  // What a seller pays to publish a listing, after launch offer / first-free / founding discount / credits.
  function quote(price, ups = []) {
    const f = state.fees, u = state.user || {};
    const base = baseFee(price);
    let fee = base, note = '';
    if (f.launch) { fee = 0; note = 'Launch offer — free to list'; }
    else if (f.firstFree && !u.listed) { fee = 0; note = 'Your first listing is free'; }
    else if (u.founding && f.foundingDiscount) { fee = Math.round(base * (100 - f.foundingDiscount)) / 100; note = `Founding member −${f.foundingDiscount}%`; }
    const lines = [{ label: `Listing fee (${f.rate}% of price)`, kind: 'listing', base, amount: fee, note }];
    let credits = u.credits || 0;
    ups.forEach(id => {
      const up = UPGRADES.find(x => x.id === id);
      if (credits > 0) { credits--; lines.push({ label: up.name, kind: 'upgrade', base: f[id], amount: 0, note: 'Launch credit used' }); }
      else lines.push({ label: up.name, kind: 'upgrade', base: f[id], amount: f[id], note: '' });
    });
    const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
    return { lines, total, creditsUsed: (u.credits || 0) - credits };
  }

  function quoteHtml(q) {
    return q.lines.map(l => `<div class="line"><span>${esc(l.label)}${l.note ? `<br><small class="ok-note">${esc(l.note)}</small>` : ''}</span><span>${l.amount < l.base ? `<s class="faint">${money(l.base)}</s> ` : ''}${l.amount ? money(l.amount) : 'Free'}</span></div>`).join('')
      + `<div class="total"><span>Total due now</span><span>${money(q.total)}</span></div>`;
  }

  // ---------- Components ----------
  function card(l) {
    const fav = state.favs.includes(l.id);
    const sold = state.sold.includes(l.id);
    return `<a class="card${l.featured ? ' featured' : ''}" href="#/item/${l.id}">
      <div class="art">${listingArt(l)}
        <span class="tag ${condClass(l.cond)}">${esc(l.cond)}</span>
        ${l.featured ? '<span class="tag tag-featured">Featured</span>' : ''}
        ${sold ? '<span class="sold-cover">Sold</span>' : ''}
        <button class="fav ${fav ? 'on' : ''}" data-fav="${l.id}" aria-label="Save to watchlist">${I.heart}</button>
      </div>
      <div class="card-body">
        <div class="card-title">${esc(l.title)}</div>
        <div class="card-meta"><span>${esc(l.location)}</span>·<span>${esc(l.posted)}</span></div>
        <div class="card-foot">
          <div class="price">${money(l.price)}${l.was ? `<s>${money(l.was)}</s>` : ''}</div>
          <span class="stars" title="Seller rating ${l.rating}">★ ${l.rating.toFixed(1)}</span>
        </div>
      </div>
    </a>`;
  }


  function launchBar() {
    const f = state.fees;
    if (!f.launch) return '';
    return `<div class="launch-bar"><div class="container">      <span><b>Launch offer:</b> listing is free until ${fmtDate(f.launchEnds)}. Join now to become a <b>Founding member</b> with ${f.foundingDiscount}% off listing fees for life.</span>
      <a href="#/pricing">How pricing works →</a></div></div>`;
  }

  function renderNav() {
    const route = location.hash.split('?')[0];
    const user = state.user;
    const unread = user ? 2 : 0;
    $('#nav').innerHTML = `
      <a class="link ${route.startsWith('#/browse') ? 'active' : ''}" href="#/browse">Browse</a>
      <a class="link ${route.startsWith('#/sell') ? 'active' : ''}" href="#/sell">Sell</a>
      <a class="link ${route.startsWith('#/pricing') ? 'active' : ''}" href="#/pricing">Pricing</a>
      <a class="icon-btn" href="#/account?tab=watchlist" aria-label="Watchlist">${I.heart}</a>
      <a class="icon-btn" href="${user ? '#/account?tab=messages' : '#/login?next=account'}" aria-label="Messages">${I.msg}${unread ? `<span class="badge">${unread}</span>` : ''}</a>
      ${user
        ? `<a href="#/account" class="avatar" title="${esc(user.name)}">${initials(user.name)}</a>`
        : `<a class="btn btn-sm btn-ghost" href="#/login">Log in</a><a class="btn btn-sm btn-primary" href="#/register">Join free</a>`}
    `;
    const on = r => (r === '#/' ? route === '' || route === '#/' : route.startsWith(r)) ? 'on' : '';
    const msgsOn = location.hash.includes('tab=messages') ? 'on' : '';
    $('#tabbar').innerHTML = `
      <a class="${on('#/')}" href="#/">${I.home}Home</a>
      <a class="${on('#/browse')}" href="#/browse">${I.search}Browse</a>
      <a class="sell ${on('#/sell')}" href="#/sell">${I.plus}Sell</a>
      <a class="${msgsOn}" href="${user ? '#/account?tab=messages' : '#/login?next=account'}">${I.msg}${unread ? `<span class="badge">${unread}</span>` : ''}Messages</a>
      <a class="${msgsOn ? '' : on('#/account') || on('#/login') || on('#/register')}" href="${user ? '#/account' : '#/login'}">${I.user}${user ? 'Account' : 'Log in'}</a>`;
  }

  // ---------- Pages ----------
  function pageHome() {
    const f = state.fees;
    const pub = publicListings();
    const featured = pub.filter(l => l.featured);
    const fresh = pub.filter(l => !l.featured).slice(0, 8);
    const hero = byId(2);
    return `${launchBar()}
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <div class="eyebrow">Pre-loved astro gear for Australian imagers</div>
          <h1>The Australian marketplace for <span>astrophotography gear</span></h1>
          <p class="lead">Telescopes, cameras, mounts, filters and accessories from fellow astrophotographers. Message sellers directly and agree on your own terms — buying is always free.</p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" href="#/browse">Browse gear</a>
            <a class="btn btn-lg" href="#/sell">${f.launch ? 'List your gear free' : 'Sell your equipment'}</a>
          </div>
          <div class="hero-stats">
            <div><b>${f.launch ? money(0) : money(f.min) + '+'}</b><span>${f.launch ? 'To list during launch' : 'To list an item'}</span></div>
            <div><b>A$0</b><span>Commission on your sale</span></div>
            <div><b>100%</b><span>Astro gear</span></div>
          </div>
        </div>
        <a class="hero-card" href="#/item/${hero.id}">
          <div class="art">${art('camera', 0, 77)}</div>
          <div class="float">
            <div><div class="faint" style="font-size:12px">Featured · ${esc(hero.location)}</div><b>${esc(hero.title.split(' — ')[0])}</b></div>
            <div class="price">${money(hero.price)}</div>
          </div>
        </a>
      </div>
    </section>

    <section class="section"><div class="container">
      <div class="section-head"><h2>Shop by category</h2><a class="muted" href="#/browse">View all →</a></div>
      <div class="cat-grid">
        ${CATS.map(c => `<a class="cat-card" href="#/browse?cat=${c.id}"><div class="ico">${CAT_ICONS[c.id]}</div><b>${c.name}</b><span>${c.blurb}</span></a>`).join('')}
      </div>
    </div></section>

    ${featured.length ? `<section class="section"><div class="container">
      <div class="section-head"><h2>Featured gear</h2><a class="muted" href="#/pricing">Feature your listing →</a></div>
      <div class="grid">${featured.slice(0, 4).map(card).join('')}</div>
    </div></section>` : ''}

    <section class="section"><div class="container">
      <div class="section-head"><h2>Fresh listings</h2><a class="muted" href="#/browse">See everything →</a></div>
      <div class="grid">${fresh.map(card).join('')}</div>
    </div></section>

    <section class="section"><div class="container">
      <div class="trust">
        <div class="trust-item"><div class="ico">${I.msg}</div><div><b>Private messaging</b><span>Chat and make offers without sharing your phone or email.</span></div></div>
        <div class="trust-item"><div class="ico">${I.check}</div><div><b>Verified Australians</b><span>Every member confirms an Australian mobile number and postcode.</span></div></div>
        <div class="trust-item"><div class="ico">${I.filter}</div><div><b>Astro gear only</b><span>Listings are reviewed — no unrelated items, no clutter.</span></div></div>
        <div class="trust-item"><div class="ico">${I.shield}</div><div><b>Safe-trading guides</b><span>Tips on paying safely, meeting up and shipping delicate optics.</span></div></div>
      </div>
    </div></section>

    <section class="section"><div class="container">
      <div class="section-head"><h2>How it works</h2></div>
      <div class="steps">
        <div class="step"><h3>Create a free account</h3><p>Sign up with email, Google or Apple. Browsing and buying are always free.</p></div>
        <div class="step"><h3>List or find gear</h3><p>Sellers upload photos and specs${f.launch ? ' — free during launch' : ` — ${f.firstFree ? 'your first listing is free' : `from ${money(f.min)}`}`}. Buyers save searches and watch listings.</p></div>
        <div class="step"><h3>Message and deal directly</h3><p>Agree on price and delivery in chat, then pay the seller directly. We recommend PayPal Goods &amp; Services or paying on pickup.</p></div>
      </div>
    </div></section>

    <section class="section"><div class="container">
      <div class="cta-band">
        ${f.launch
          ? `<div><h2>Become a founding member</h2><p>List free until ${fmtDate(f.launchEnds)}, get ${f.launchCredits} free Featured upgrades, a Founding member badge and ${f.foundingDiscount}% off listing fees for life.</p></div>
             <a class="btn btn-primary btn-lg" href="${state.user ? '#/sell' : '#/register'}">${state.user ? 'List your gear' : 'Join free'}</a>`
          : `<div><h2>Gear sitting in a cupboard?</h2><p>Turn your old guide scope or spare filters into your next upgrade.${f.firstFree ? ' Your first listing is free.' : ''}</p></div>
             <a class="btn btn-primary btn-lg" href="#/sell">Start selling</a>`}
      </div>
    </div></section>`;
  }

  function pagePricing() {
    const f = state.fees;
    const ex = 749;
    const foundingRate = Math.round(f.rate * (100 - f.foundingDiscount)) / 100;
    return `${launchBar()}<div class="container">
      <div class="page-head" style="text-align:center;max-width:700px;margin:0 auto">
        <div class="eyebrow" style="justify-content:center">Simple, seller-only pricing</div>
        <h1 style="font-size:38px">Buying is always free.<br>Sellers pay a small listing fee.</h1>
        <p class="muted">Buyers pay sellers directly — Second Light never takes a cut of your sale. Sellers pay once, when a listing goes live.</p>
      </div>
      <div class="pricing">
        <div class="plan ${f.launch ? 'current' : ''}">
          ${f.launch ? '<span class="plan-flag">Now on</span>' : ''}
          <h3>Launch offer</h3><div class="plan-price">Free</div><p class="muted">Until ${fmtDate(f.launchEnds)}</p>
          <ul><li>Unlimited free listings</li><li>${f.launchCredits} free upgrade credits</li><li>Founding member badge</li><li>${f.foundingDiscount}% off listing fees for life</li></ul>
          <a class="btn btn-primary btn-block" href="${state.user ? '#/sell' : '#/register'}">${state.user ? 'List your gear' : 'Join as a founding member'}</a>
        </div>
        <div class="plan ${f.launch ? '' : 'current'}">
          ${f.launch ? '' : '<span class="plan-flag">Now on</span>'}
          <h3>Standard</h3><div class="plan-price">${f.rate}%<small> of asking price</small></div><p class="muted">Min ${money(f.min)} · max ${money(f.cap)} per listing</p>
          <ul>${f.firstFree ? '<li>Your first listing is free</li>' : ''}<li>Listing stays up until sold</li><li>Free price changes</li><li>e.g. a ${money(ex)} telescope costs ${money(baseFee(ex))} to list</li></ul>
          <a class="btn btn-block" href="#/sell">Start selling</a>
        </div>
        <div class="plan">
          <h3>Founding members</h3><div class="plan-price">${foundingRate}%<small> of asking price</small></div><p class="muted">For everyone who joins during launch</p>
          <ul><li>${f.foundingDiscount}% off every listing fee, for life</li><li>Founding member badge on your profile and listings</li><li>Early access to new features</li></ul>
          <a class="btn btn-block" href="${state.user ? '#/account' : '#/register'}">${state.user ? 'View your account' : 'Claim founding status'}</a>
        </div>
      </div>
      <section class="section"><div class="section-head"><h2>Optional upgrades</h2></div>
        <div class="panel"><div class="table-wrap"><table class="table"><thead><tr><th>Upgrade</th><th>What you get</th><th>Price</th></tr></thead><tbody>
        ${UPGRADES.map(u => `<tr><td><b>${u.name}</b></td><td class="muted">${u.desc}</td><td>${money(f[u.id])}</td></tr>`).join('')}
        </tbody></table></div></div>
      </section>
      <section class="section" style="padding-top:0"><div class="section-head"><h2>Questions</h2></div>
        <div class="steps faq">
          <div class="step"><h3>How do buyers pay?</h3><p>Directly to the seller. We recommend PayPal Goods &amp; Services for shipped items, or paying in person on pickup.</p></div>
          <div class="step"><h3>Who can join?</h3><p>Anyone living in Australia. You'll confirm an Australian mobile number and postcode when you sign up, and items must be located in Australia.</p></div>
          <div class="step"><h3>Do you take a cut of the sale?</h3><p>No. The listing fee and any upgrades you choose are the only charges.</p></div>
          <div class="step"><h3>What if it doesn't sell?</h3><p>Your listing stays up until you mark it sold or remove it. Price drops are always free.</p></div>
        </div>
      </section>
    </div>`;
  }

  function pageBrowse(params) {
    const q = (params.get('q') || '').toLowerCase();
    const cat = params.get('cat') || '';
    const conds = (params.get('cond') || '').split(',').filter(Boolean);
    const min = Number(params.get('min')) || 0;
    const max = Number(params.get('max')) || Infinity;
    const sort = params.get('sort') || 'new';
    const sts = (params.get('state') || '').split(',').filter(Boolean);

    const base = publicListings();
    let items = base.filter(l =>
      (!cat || l.cat === cat) &&
      (!q || (l.title + ' ' + l.brand + ' ' + l.seller).toLowerCase().includes(q)) &&
      (!conds.length || conds.includes(l.cond)) &&
      (!sts.length || sts.includes(stateOf(l))) &&
      l.price >= min && l.price <= max);
    if (sort === 'new') items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    if (sort === 'low') items.sort((a, b) => a.price - b.price);
    if (sort === 'high') items.sort((a, b) => b.price - a.price);
    if (sort === 'rating') items.sort((a, b) => b.rating - a.rating);

    const countCat = id => base.filter(l => l.cat === id).length;
    const countState = st => base.filter(l => stateOf(l) === st && (!cat || l.cat === cat)).length;
    const countCond = c => base.filter(l => l.cond === c && (!cat || l.cat === cat)).length;
    const title = q ? `Results for “${esc(params.get('q'))}”` : cat ? catName(cat) : 'All astrophotography gear';

    return `<div class="container">
      <div class="page-head">
        <div class="crumbs"><a href="#/">Home</a> / <a href="#/browse">Browse</a>${cat ? ' / ' + catName(cat) : ''}</div>
        <h1 style="font-size:30px">${title}</h1>
        <p class="muted" style="margin:0 0 18px">${items.length} listing${items.length === 1 ? '' : 's'}</p>
      </div>
      <div class="browse">
        <aside class="filters" id="filters">
          <div class="filter-group"><h4>Category</h4>
            <label class="check"><input type="radio" name="cat" value="" ${!cat ? 'checked' : ''}> All categories <span class="count">${base.length}</span></label>
            ${CATS.map(c => `<label class="check"><input type="radio" name="cat" value="${c.id}" ${cat === c.id ? 'checked' : ''}> ${c.name} <span class="count">${countCat(c.id)}</span></label>`).join('')}
          </div>
          <div class="filter-group"><h4>Condition</h4>
            ${['New', 'Like new', 'Good', 'Fair'].map(c => `<label class="check"><input type="checkbox" name="cond" value="${c}" ${conds.includes(c) ? 'checked' : ''}> ${c} <span class="count">${countCond(c)}</span></label>`).join('')}
          </div>
          <div class="filter-group"><h4>Price</h4>
            <div class="range-row"><input class="input" name="min" type="number" placeholder="Min" value="${params.get('min') || ''}"><input class="input" name="max" type="number" placeholder="Max" value="${params.get('max') || ''}"></div>
          </div>
          <div class="filter-group"><h4>Location</h4>
            ${STATES.map(st => `<label class="check"><input type="checkbox" name="state" value="${st}" ${sts.includes(st) ? 'checked' : ''}> ${st} <span class="count">${countState(st)}</span></label>`).join('')}
          </div>
          <div class="filter-group"><h4>Seller</h4>
            <label class="check"><input type="checkbox" checked disabled> Verified sellers only</label>
            <label class="check"><input type="checkbox"> 4.5★ and above</label>
            <label class="check"><input type="checkbox"> Open to offers</label>
          </div>
          <div class="filter-group"><h4>Delivery</h4>
            <label class="check"><input type="checkbox"> Seller will post</label>
            <label class="check"><input type="checkbox"> Local pickup</label>
          </div>
        </aside>
        <div>
          <div class="toolbar">
            <div class="active-filters">
              ${cat ? `<span class="chip active" data-clear="cat">${catName(cat)} ✕</span>` : ''}
              ${sts.map(st => `<span class="chip active" data-clear-state="${st}">${st} ✕</span>`).join('')}
              ${conds.map(c => `<span class="chip active" data-clear-cond="${c}">${c} ✕</span>`).join('')}
              ${q ? `<span class="chip active" data-clear="q">“${esc(params.get('q'))}” ✕</span>` : ''}
            </div>
            <select class="select" id="sort">
              <option value="new" ${sort === 'new' ? 'selected' : ''}>Featured, then newest</option>
              <option value="low" ${sort === 'low' ? 'selected' : ''}>Price: low to high</option>
              <option value="high" ${sort === 'high' ? 'selected' : ''}>Price: high to low</option>
              <option value="rating" ${sort === 'rating' ? 'selected' : ''}>Top-rated sellers</option>
            </select>
          </div>
          ${items.length ? `<div class="grid">${items.map(card).join('')}</div>`
            : `<div class="empty"><h3>No gear matches those filters</h3><p>Try widening the price range or clearing a filter.</p><a class="btn" href="#/browse">Clear all filters</a></div>`}
        </div>
      </div>
    </div>`;
  }

  function pageItem(id) {
    const l = byId(id);
    if (!l) return `<div class="container"><div class="empty" style="margin:40px 0"><h3>Listing not found</h3><a class="btn" href="#/browse">Back to browse</a></div></div>`;
    const sold = state.sold.includes(l.id);
    const related = publicListings().filter(x => x.cat === l.cat && x.id !== l.id).slice(0, 4);
    const nPhotos = l.photos && l.photos.length ? l.photos.length : 5;
    let actions;
    if (sold) actions = `<div class="note" style="margin:16px 0">${I.info}<span><b style="color:var(--text)">This item has been sold.</b> Browse similar gear below.</span></div>`;
    else if (l.mine) actions = `<div class="buy-actions"><a class="btn btn-primary btn-lg" href="#/account?tab=listings">Manage your listing</a></div>`;
    else actions = `
            <div class="buy-actions">
              <button class="btn btn-primary btn-lg" data-open="contact">${I.msg} Message seller</button>
              <div class="row">
                <button class="btn" data-open="offer">Make an offer</button>
                <button class="btn" data-fav="${l.id}">${I.heart} ${state.favs.includes(l.id) ? 'Saved' : 'Watch'}</button>
              </div>
            </div>
            <form class="contact-box hidden" id="box-contact" data-kind="message">
              <label for="m-text"><b style="font-size:14px">Message @${esc(l.seller)}</b></label>
              <textarea class="textarea" id="m-text" name="text" style="min-height:90px" required>Hi, is this still available? I'm in ${state.user ? 'Brisbane' : '[your suburb]'}.</textarea>
              <button class="btn btn-primary btn-block">Send message</button>
              <small class="faint">Your email and phone stay private until you choose to share them.</small>
            </form>
            <form class="contact-box hidden" id="box-offer" data-kind="offer">
              <div class="field" style="margin:0"><label for="o-amt">Your offer (AUD)</label><input class="input" id="o-amt" name="amount" type="number" min="1" required value="${Math.round(l.price * 0.9)}"></div>
              <div class="field" style="margin:0"><label for="o-note">Note (optional)</label><input class="input" id="o-note" name="text" placeholder="e.g. Can pick up this weekend"></div>
              <button class="btn btn-primary btn-block">Send offer</button>
            </form>`;
    return `<div class="container">
      <div class="page-head" style="padding-bottom:16px"><div class="crumbs"><a href="#/">Home</a> / <a href="#/browse?cat=${l.cat}">${catName(l.cat)}</a> / ${esc(l.brand)}</div></div>
      <div class="item">
        <div>
          <div class="gallery">
            <div class="main" id="mainArt">${listingArt(l, 0)}</div>
            <div class="thumbs">${Array.from({ length: Math.min(nPhotos, 5) }, (_, i) => `<button class="${i === 0 ? 'on' : ''}" data-thumb="${i}">${listingArt(l, i)}</button>`).join('')}</div>
          </div>
          <div class="tabs" id="itemTabs"><button class="on" data-tab="desc">Description</button><button data-tab="specs">Specifications</button><button data-tab="ship">Delivery &amp; payment</button><button data-tab="qa">Questions (3)</button></div>
          <div data-pane="desc"><p style="margin-top:0">${esc(l.desc)}</p><p class="muted">Located in ${esc(l.location)}. Original packaging: <b style="color:var(--text)">Yes</b>. Smoke-free, pet-free observatory.</p></div>
          <div data-pane="specs" class="hidden"><table class="specs">${Object.entries({ Brand: l.brand, Category: catName(l.cat), Condition: l.cond, ...l.specs }).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table></div>
          <div data-pane="ship" class="hidden"><dl class="kv"><dt>Seller will post</dt><dd>Australia Post Parcel Post (about ${money(25)}) or Express Post (about ${money(38)}), insured — agree with the seller</dd><dt>Local pickup</dt><dd>Available in ${esc(l.location)}</dd><dt>Delivery area</dt><dd>Australia only — members post within Australia</dd><dt>Payment</dt><dd>Paid directly to the seller. PayPal Goods &amp; Services recommended for posted items</dd><dt>Returns</dt><dd>Private sale — agree any returns with the seller before paying</dd><dt>Consumer law</dt><dd>Australian Consumer Law guarantees apply to business sellers</dd></dl></div>
          <div data-pane="qa" class="hidden">
            <div class="msg-list">
              <div class="msg"><div class="avatar">JS</div><div class="body"><b>Any tilt or backfocus issues?</b><p>Seller: None at all — round stars to the corners at 55mm.</p></div></div>
              <div class="msg"><div class="avatar">KT</div><div class="body"><b>Could you post to Perth?</b><p>Seller: Yes — Australia Post Parcel Post, fully insured.</p></div></div>
              <div class="msg"><div class="avatar">RB</div><div class="body"><b>Is the price negotiable?</b><p>Seller: Happy to consider reasonable offers.</p></div></div>
            </div>
          </div>
        </div>

        <aside class="buybox">
          <div class="panel">
            <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><span class="tag ${condClass(l.cond)}">${esc(l.cond)}</span>${l.featured ? '<span class="tag tag-featured">Featured</span>' : ''}<span class="tag tag-verified">✓ Reviewed listing</span></div>
            <h1>${esc(l.title)}</h1>
            <div class="price">${money(l.price)}${l.was ? `<s>RRP ${money(l.was)}</s>` : ''}</div>
            <div class="muted" style="font-size:13px;margin-top:4px">${esc(l.location)} · Listed ${esc(l.posted)}</div>
            ${actions}
            ${sold ? '' : `<div class="postcode-row"><input class="input" id="pc" inputmode="numeric" maxlength="4" placeholder="Your postcode"><button class="btn btn-sm" data-pc>Estimate postage time</button></div>
            <div id="pcOut" class="faint" style="font-size:13px;margin:-4px 0 12px"></div>`}
            <div class="note">${I.shield}<span><b style="color:var(--text)">You pay the seller directly.</b> Use PayPal Goods &amp; Services or pay in person on pickup. Never pay with gift cards or crypto.</span></div>
          </div>
          <div class="panel">
            <div class="seller">
              <div class="avatar">${initials(l.seller)}</div>
              <div style="flex:1"><b>@${esc(l.seller)}</b> <span class="tag tag-verified">Verified</span>${isFounding(l) ? ' <span class="tag tag-founding">Founding member</span>' : ''}<div class="faint" style="font-size:13px"><span class="stars">${stars(l.rating)}</span> ${l.rating.toFixed(1)} · ${l.sales} sales · Joined Oct 2026</div></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
              <a class="btn btn-sm" href="#/browse?q=${encodeURIComponent(l.seller)}">Seller's items</a>
              <button class="btn btn-sm" data-report>Report listing</button>
            </div>
          </div>
        </aside>
      </div>
      ${related.length ? `<section class="section" style="padding-top:0"><div class="section-head"><h2>Similar ${catName(l.cat).toLowerCase()}</h2></div><div class="grid">${related.map(card).join('')}</div></section>` : ''}
    </div>`;
  }

  function requireLogin(next) {
    return `<div class="container auth"><div class="panel auth-card" style="text-align:center">
      <div class="lock-ring">${I.lock}</div>
      <h1>Members only</h1>
      <p class="muted">You need a free Second Light account to ${next === 'sell' ? 'list equipment' : 'view your account'}.</p>
      <div style="display:grid;gap:10px;margin-top:18px"><a class="btn btn-primary" href="#/login?next=${next}">Log in</a><a class="btn" href="#/register?next=${next}">Create a free account</a></div>
    </div></div>`;
  }

  function pageSell() {
    if (!state.user) return requireLogin('sell');
    const f = state.fees, credits = state.user.credits || 0;
    return `${launchBar()}<div class="container form-wrap">
      <div class="crumbs"><a href="#/">Home</a> / Sell</div>
      <h1 style="font-size:32px">List your equipment</h1>
      <p class="muted" style="margin:0">Astrophotography gear only. Listings are reviewed before going live (usually under an hour). Buyers pay you directly — no commission on your sale.</p>
      <div class="stepper"><div class="on"></div><div class="on"></div><div></div><div></div></div>
      <form id="sellForm" class="sell-layout">
        <div>
          <div class="panel">
            <h3>Photos</h3>
            <p class="muted" style="margin-top:0;font-size:14px">Add up to 12 photos. Show the optics, sensor window and any wear. The first photo is the cover.</p>
            <label class="dropzone" id="dropzone">
              ${I.upload}
              <b>Drag photos here or click to upload</b>
              <div class="faint" style="font-size:13px">JPG, PNG or HEIC · up to 15 MB each · images are resized & stripped of location data</div>
              <input type="file" id="photoInput" accept="image/*" multiple hidden>
            </label>
            <div class="previews" id="previews"></div>
          </div>

          <div class="panel">
            <h3>Details</h3>
            <div class="field"><label for="f-title">Title</label><input class="input" id="f-title" name="title" required placeholder="e.g. ZWO ASI533MC Pro cooled colour camera"><small>Include brand, model and key spec.</small></div>
            <div class="field-row">
              <div class="field"><label for="f-cat">Category</label><select class="select" id="f-cat" name="cat">${CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
              <div class="field"><label for="f-brand">Brand</label><input class="input" id="f-brand" name="brand" placeholder="e.g. ZWO" list="brands"><datalist id="brands">${[...new Set(LISTINGS.map(l => l.brand))].map(b => `<option value="${b}">`).join('')}</datalist></div>
            </div>
            <div class="field"><label>Condition</label>
              <div class="radio-cards">
                ${[['New', 'Unopened / unused'], ['Like new', 'No visible wear'], ['Good', 'Light cosmetic wear'], ['Fair', 'Works, visible wear']].map(([c, d], i) => `<label class="radio-card"><input type="radio" name="cond" value="${c}" ${i === 1 ? 'checked' : ''}><b>${c}</b><span>${d}</span></label>`).join('')}
              </div>
            </div>
            <div class="field"><label for="f-desc">Description</label><textarea class="textarea" id="f-desc" name="desc" placeholder="Hours of use, what's included, any issues, reason for selling…"></textarea></div>
            <div class="field-row three">
              <div class="field"><label for="f-s1">Aperture / sensor</label><input class="input" id="f-s1" placeholder="e.g. 72 mm"></div>
              <div class="field"><label for="f-s2">Focal length / pixel</label><input class="input" id="f-s2" placeholder="e.g. 400 mm"></div>
              <div class="field"><label for="f-s3">Weight</label><input class="input" id="f-s3" placeholder="e.g. 3.2 kg"></div>
            </div>
          </div>

          <div class="panel">
            <h3>Price & delivery</h3>
            <div class="field-row">
              <div class="field"><label for="f-price">Asking price (AUD)</label><input class="input" id="f-price" name="price" type="number" min="1" required placeholder="0"></div>
              <div class="field"><label for="f-was">Original RRP (optional)</label><input class="input" id="f-was" name="was" type="number" placeholder="0"></div>
            </div>
            <label class="check"><input type="checkbox" checked> Open to offers</label>
            <label class="check"><input type="checkbox" checked> I can post it (buyer pays postage)</label>
            <label class="check"><input type="checkbox"> Local pickup available</label>
            <div class="field-row" style="margin-top:10px">
              <div class="field"><label for="f-loc">Suburb</label><input class="input" id="f-loc" name="suburb" placeholder="e.g. Toowoomba" value="Brisbane"></div>
              <div class="field"><label for="f-state">State / territory</label><select class="select" id="f-state" name="state">${STATES.map(st => `<option ${st === 'QLD' ? 'selected' : ''}>${st}</option>`).join('')}</select></div>
            </div>
          </div>

          <div class="panel">
            <h3>Boost your listing <span class="faint" style="font-weight:400;font-size:14px">optional</span></h3>
            ${credits ? `<p class="muted" style="margin-top:0;font-size:14px">You have <b style="color:var(--text)">${credits} free launch credit${credits > 1 ? 's' : ''}</b> — applied automatically to the upgrades you pick.</p>` : ''}
            <div class="upgrades">${UPGRADES.map(u => `<label class="upgrade"><input type="checkbox" name="up" value="${u.id}"><div><b>${u.name}</b><span>${u.desc}</span></div><em>${money(f[u.id])}</em></label>`).join('')}</div>
          </div>
        </div>

        <aside class="sell-side">
          <div class="panel">
            <h3 style="font-size:16px">Preview</h3>
            <div id="sellPreview"></div>
          </div>
          <div class="panel">
            <h3 style="font-size:16px">Your listing fee</h3>
            <div class="summary" id="feeQuote"></div>
            <div class="note" style="margin:12px 0">${I.info}<span>Only astrophotography equipment is allowed. Non-astro items are removed and the fee refunded.</span></div>
            <button class="btn btn-primary btn-block btn-lg" type="submit" id="submitBtn">Submit for review</button>
            <button class="btn btn-ghost btn-block" type="button" style="margin-top:8px" data-draft>Save draft</button>
          </div>
        </aside>
      </form>
    </div>`;
  }

  // Sign-up fields that confirm the member lives in Australia.
  function auFields() {
    return `<div class="field-row">
        <div class="field"><label for="a-state">State / territory</label><select class="select" id="a-state" name="state">${STATES.map(st => `<option ${st === 'QLD' ? 'selected' : ''}>${st}</option>`).join('')}</select></div>
        <div class="field"><label for="a-pc">Postcode</label><input class="input" id="a-pc" name="postcode" inputmode="numeric" maxlength="4" required placeholder="4000"></div>
      </div>
      <div class="field"><label for="a-mob">Australian mobile number</label>
        <div class="phone"><span>+61</span><input class="input" id="a-mob" name="mobile" inputmode="tel" required placeholder="4xx xxx xxx"></div>
        <small>We'll text you a code to confirm you're in Australia. Your number is never shown to other members.</small>
      </div>`;
  }

  function pageAuth(mode, params) {
    const next = params.get('next') || '';
    const isReg = mode === 'register';
    const f = state.fees;
    const regBlurb = 'Open to people living in Australia. ' + (f.launch
      ? `Join during launch to become a <b style="color:var(--text)">Founding member</b> — free listings until ${fmtDate(f.launchEnds)}, then ${f.foundingDiscount}% off for life.`
      : `Buying is free${f.firstFree ? ' and your first listing is on us' : ''}.`);
    return `<div class="container auth"><div class="panel auth-card">
      <h1>${isReg ? 'Create your free account' : 'Welcome back'}</h1>
      <p class="muted" style="text-align:center;margin-top:0">${isReg ? regBlurb : 'Log in to list gear, message sellers and make offers.'}</p>
      <div class="social"><button class="btn" data-social>Google</button><button class="btn" data-social> Apple</button></div>
      <div class="divider">or with email</div>
      <form id="authForm" data-mode="${mode}" data-next="${esc(next)}">
        ${isReg ? `<div class="field"><label for="a-name">Display name</label><input class="input" id="a-name" name="name" required placeholder="e.g. Carina Stargazer"></div>` : ''}
        <div class="field"><label for="a-email">Email</label><input class="input" id="a-email" name="email" type="email" required placeholder="you@example.com"></div>
        <div class="field"><label for="a-pass">Password</label><input class="input" id="a-pass" name="password" type="password" required placeholder="${isReg ? 'At least 10 characters' : '••••••••••'}"></div>
        ${isReg ? `${auFields()}<div class="field"><label for="a-ref">Referral code (optional)</label><input class="input" id="a-ref" name="ref" placeholder="e.g. NEBULA-NICK"></div><label class="check" style="margin-bottom:14px"><input type="checkbox" required> I agree to the Terms and the astro-gear-only listing policy</label>` : `<div style="text-align:right;margin:-6px 0 14px;font-size:13px"><a class="muted" href="#/login">Forgot password?</a></div>`}
        <div class="form-error hidden" id="authError"></div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">${isReg ? 'Continue' : 'Log in'}</button>
      </form>
      <p class="muted" style="text-align:center;margin:16px 0 0;font-size:14px">${isReg ? `Already a member? <a href="#/login${next ? '?next=' + next : ''}" style="color:var(--accent)">Log in</a>` : `New here? <a href="#/register${next ? '?next=' + next : ''}" style="color:var(--accent)">Create an account</a>`}</p>
    </div></div>`;
  }

  function myListings() {
    return [...state.myListings, ...LISTINGS.filter(l => l.seller === 'nebula_nick')];
  }

  function pageAccount(params) {
    if (!state.user) return requireLogin('account');
    const tab = params.get('tab') || 'overview';
    const u = state.user, f = state.fees;
    const mine = myListings();
    const queue = state.myListings.filter(l => l.status === 'review');
    const tabs = [['overview', 'Overview'], ['listings', 'My listings', mine.length], ['messages', 'Messages', 2 + state.sent.length], ['watchlist', 'Watchlist', state.favs.length], ['referrals', 'Invite friends'], ['billing', 'Billing'], ['settings', 'Settings'], ['sep'], ['admin', 'Owner admin', queue.length || null]];
    let body = '';

    if (tab === 'overview') body = `
      ${u.founding ? `<div class="founding-card"><div class="seal">${I.star}</div><div><b>You're a Founding member</b><div class="muted" style="font-size:14px">${f.launch ? `Listing is free until ${fmtDate(f.launchEnds)}. After that you` : 'You'} get ${f.foundingDiscount}% off listing fees for life.</div></div></div>` : ''}
      <div class="stat-row">
        <div class="stat"><span>Active listings</span><b>${mine.filter(l => l.status !== 'review' && !state.sold.includes(l.id)).length}</b></div>
        <div class="stat"><span>Views this week</span><b>342</b></div>
        <div class="stat"><span>Offers received</span><b>3</b></div>
        <div class="stat"><span>Upgrade credits</span><b>${u.credits || 0}</b></div>
      </div>
      <div class="panel"><h3>Recent activity</h3><div class="msg-list">
        <div class="msg"><div class="unread"></div><div class="body"><b>New offer: ${money(700)} on RedCat 51</b><p>From @widefield_will · can pick up this weekend</p></div><a class="btn btn-sm" href="#/account?tab=messages">Reply</a></div>
        <div class="msg"><div class="unread"></div><div class="body"><b>3 people are watching your Askar FRA400</b><p>Feature it to reach more buyers</p></div><a class="btn btn-sm" href="#/account?tab=listings">Feature</a></div>
        <div class="msg"><div class="body"><b>Askar FRA400 listing approved</b><p>Your listing is now live.</p></div></div>
      </div></div>`;

    if (tab === 'listings') body = `<div class="panel"><div class="section-head" style="margin-bottom:8px"><h3 style="margin:0">My listings</h3><a class="btn btn-sm btn-primary" href="#/sell">+ New listing</a></div>
      <div class="table-wrap"><table class="table"><thead><tr><th></th><th>Item</th><th>Price</th><th>Views</th><th>Status</th><th></th></tr></thead><tbody>
      ${mine.map((l, i) => {
        const sold = state.sold.includes(l.id);
        const status = sold ? ['sold', 'Sold'] : l.status === 'review' ? ['pending', 'In review'] : ['active', 'Active'];
        return `<tr><td><div class="thumb art">${listingArt(l)}</div></td>
          <td><a href="#/item/${l.id}"><b>${esc(l.title)}</b></a><div class="faint" style="font-size:12px">${catName(l.cat)} · ${esc(l.cond)}${l.featured ? ' · Featured' : ''}</div></td>
          <td>${money(l.price)}</td><td>${l.mine ? 0 : 120 + i * 37}</td><td><span class="status ${status[0]}">${status[1]}</span></td>
          <td style="white-space:nowrap">${l.status === 'review' ? '<button class="btn btn-sm">Edit</button>' : `<button class="btn btn-sm ${sold ? '' : 'btn-primary'}" data-sold="${l.id}">${sold ? 'Relist' : 'Mark as sold'}</button> ${sold || l.featured ? '' : `<button class="btn btn-sm" data-feature="${l.id}">Feature</button>`}`}</td></tr>`;
      }).join('')}
      </tbody></table></div></div>`;

    if (tab === 'messages') body = `<div class="panel"><h3>Messages</h3><div class="msg-list">
      ${state.sent.map(m => `<div class="msg"><div class="avatar">${initials(u.name)}</div><div class="body"><b>To @${esc(m.to)} · ${esc(m.item)}</b><p>${m.kind === 'offer' ? `Offer: ${money(m.amount)}${m.text ? ' — ' + esc(m.text) : ''}` : esc(m.text)}</p></div><span class="faint" style="font-size:12px">${esc(m.at)}</span></div>`).join('')}
      <div class="msg"><div class="avatar">WW</div><div class="body"><b>@widefield_will · RedCat 51</b><p>Hi! Would you take $700 if I pick up this weekend? I'm about 20 minutes away.</p></div><div class="unread"></div></div>
      <div class="msg"><div class="avatar">HH</div><div class="body"><b>@halpha_hana · L-eXtreme 2"</b><p>Posted this morning — packed in a hard case with bubble wrap. Clear skies!</p></div><div class="unread"></div></div>
      <div class="msg"><div class="avatar">PP</div><div class="body"><b>@pier_pete · CEM40</b><p>Thanks — PayPal received, very happy with the deal.</p></div></div>
    </div></div>`;

    if (tab === 'watchlist') {
      const favs = state.favs.map(byId).filter(Boolean);
      body = favs.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${favs.map(card).join('')}</div>` : `<div class="empty"><h3>No saved items yet</h3><p>Tap the heart on any listing to watch it for price drops.</p><a class="btn" href="#/browse">Browse gear</a></div>`;
    }

    if (tab === 'referrals') {
      const code = u.name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
      body = `<div class="panel"><h3>Invite fellow astrophotographers</h3>
        <p class="muted" style="margin-top:0">When a friend joins with your link and lists their first item, you <b style="color:var(--text)">both</b> get a free Featured upgrade.</p>
        <div class="ref-link"><input class="input" id="refLink" readonly value="secondlight.com.au/join?ref=${code}"><button class="btn btn-primary" data-copy>Copy link</button></div>
        <div class="stat-row" style="margin:18px 0 0">
          <div class="stat"><span>Friends invited</span><b>0</b></div>
          <div class="stat"><span>Joined</span><b>0</b></div>
          <div class="stat"><span>Listed an item</span><b>0</b></div>
          <div class="stat"><span>Credits earned</span><b>0</b></div>
        </div>
        <p class="faint" style="font-size:13px;margin:16px 0 0">Tip: share it in your astronomy club newsletter or Facebook group.</p>
      </div>`;
    }

    if (tab === 'billing') body = `<div class="panel"><h3>Your plan</h3>
        <div class="kv" style="margin-bottom:6px"><dt>Plan</dt><dd>${u.founding ? `Founding member — ${f.foundingDiscount}% off listing fees for life` : 'Standard'}</dd>
        <dt>Current pricing</dt><dd>${f.launch ? `Free listings until ${fmtDate(f.launchEnds)}` : `${f.rate}% of asking price (min ${money(f.min)}, max ${money(f.cap)})`}</dd>
        <dt>Upgrade credits</dt><dd>${u.credits || 0} remaining</dd>
        <dt>Payment method</dt><dd>None saved — you'll be asked for a card only when something costs money</dd></div>
      </div>
      <div class="panel"><h3>Receipts</h3>
        ${state.receipts.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Item</th><th>Details</th><th>Amount</th></tr></thead><tbody>
          ${state.receipts.map(r => `<tr><td>${esc(r.date)}</td><td>${esc(r.item)}</td><td class="muted">${esc(r.detail)}</td><td>${money(r.amount)}</td></tr>`).join('')}
        </tbody></table></div>` : `<p class="muted" style="margin:0">No charges yet.${f.launch ? ' Listing is free during the launch period.' : ''}</p>`}
      </div>`;

    if (tab === 'settings') body = `<div class="panel"><h3>Profile</h3>
      <div class="field-row"><div class="field"><label>Display name</label><input class="input" value="${esc(u.name)}"></div><div class="field"><label>Email</label><input class="input" value="${esc(u.email)}"></div></div>
      <div class="field"><label>Mobile</label><input class="input" value="${esc(u.mobile || '+61 412 345 678')}" disabled><small>Verified Australian mobile. Changing it needs a new code.</small></div>
      <div class="field-row"><div class="field"><label>Suburb</label><input class="input" value="Brisbane"></div><div class="field"><label>State / territory</label><select class="select">${STATES.map(st => `<option ${st === 'QLD' ? 'selected' : ''}>${st}</option>`).join('')}</select></div></div>
      <div class="field"><label>ABN (optional)</label><input class="input" placeholder="For business sellers only"><small>Business sellers are shown with a "Business" badge.</small></div>
      <h3 style="margin-top:10px">Notifications</h3>
      <label class="check"><input type="checkbox" checked> Email me about new messages and offers</label>
      <label class="check"><input type="checkbox" checked> Price drops on my watchlist</label>
      <label class="check"><input type="checkbox"> Monthly newsletter</label>
      <h3 style="margin-top:20px">Security</h3>
      <label class="check"><input type="checkbox" checked> Two-factor authentication</label>
      <div style="margin-top:16px;display:flex;gap:10px"><button class="btn btn-primary" data-saved>Save changes</button><button class="btn" data-logout>Log out</button></div>
    </div>`;

    if (tab === 'admin') {
      const rev = kind => state.receipts.reduce((s, r) => s + (r[kind] || 0), 0);
      const total = rev('listingFee') + rev('upgrades');
      const ex = 749;
      body = `<div class="note" style="margin-bottom:16px">${I.info}<span>Owner-only area. In this mockup everyone can see it; on the real site only your admin account will.</span></div>
      <div class="stat-row">
        <div class="stat"><span>Members</span><b>37</b></div>
        <div class="stat"><span>Live listings</span><b>${publicListings().length}</b></div>
        <div class="stat"><span>Awaiting review</span><b>${queue.length}</b></div>
        <div class="stat"><span>Revenue this month</span><b>${money(total)}</b></div>
      </div>
      <form class="panel" id="feeForm">
        <h3>Fee settings</h3>
        <div class="toggle-row"><div><b>Launch mode</b><div class="faint" style="font-size:13px">Listing is free for everyone. New members become Founding members.</div></div><input type="checkbox" name="launch" class="switch" ${f.launch ? 'checked' : ''}></div>
        <div class="toggle-row"><div><b>First listing free</b><div class="faint" style="font-size:13px">After launch, each new member's first listing costs nothing.</div></div><input type="checkbox" name="firstFree" class="switch" ${f.firstFree ? 'checked' : ''}></div>
        <div class="field-row three" style="margin-top:16px">
          <div class="field"><label>Launch ends</label><input class="input" type="date" name="launchEnds" value="${f.launchEnds}"></div>
          <div class="field"><label>Founding discount (%)</label><input class="input" type="number" name="foundingDiscount" min="0" max="100" value="${f.foundingDiscount}"></div>
          <div class="field"><label>Launch upgrade credits</label><input class="input" type="number" name="launchCredits" min="0" value="${f.launchCredits}"></div>
        </div>
        <div class="field-row three">
          <div class="field"><label>Listing fee (% of price)</label><input class="input" type="number" step="0.1" name="rate" min="0" value="${f.rate}"></div>
          <div class="field"><label>Minimum fee (A$)</label><input class="input" type="number" step="0.5" name="min" min="0" value="${f.min}"></div>
          <div class="field"><label>Maximum fee (A$)</label><input class="input" type="number" step="1" name="cap" min="0" value="${f.cap}"></div>
        </div>
        <div class="field-row three">
          ${UPGRADES.map(up => `<div class="field"><label>${up.name} (A$)</label><input class="input" type="number" step="0.5" name="${up.id}" min="0" value="${f[up.id]}"></div>`).join('')}
        </div>
        <div class="note" style="margin-bottom:16px">${I.info}<span>Example: a ${money(ex)} listing costs <b style="color:var(--text)">${money(baseFee(ex))}</b> at standard rates, or <b style="color:var(--text)">${money(Math.round(baseFee(ex) * (100 - f.foundingDiscount)) / 100)}</b> for a Founding member.${f.launch ? ' Currently free (launch mode).' : ''}</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Save settings</button><button class="btn" type="button" data-reset-fees>Reset to defaults</button></div>
      </form>
      <div class="panel"><h3>Review queue</h3>
        ${queue.length ? `<div class="table-wrap"><table class="table"><tbody>${queue.map(l => `<tr><td><div class="thumb art">${listingArt(l)}</div></td><td><b>${esc(l.title)}</b><div class="faint" style="font-size:12px">@${esc(l.seller)} · ${catName(l.cat)} · ${money(l.price)}</div></td><td style="white-space:nowrap"><button class="btn btn-sm btn-primary" data-approve="${l.id}">Approve</button> <button class="btn btn-sm" data-reject="${l.id}">Reject</button></td></tr>`).join('')}</tbody></table></div>`
          : '<p class="muted" style="margin:0">Nothing waiting. New listings appear here for approval before going live.</p>'}
      </div>
      <div class="panel"><h3>Revenue</h3>
        <div class="summary">
          <div class="line"><span>Listing fees</span><span>${money(rev('listingFee'))}</span></div>
          <div class="line"><span>Upgrades (featured, spotlight, bump)</span><span>${money(rev('upgrades'))}</span></div>
          <div class="line"><span>Subscriptions</span><span class="faint">Planned</span></div>
          <div class="total"><span>Total</span><span>${money(total)}</span></div>
        </div>
      </div>`;
    }

    return `<div class="container">
      <div class="page-head" style="display:flex;align-items:center;gap:16px">
        <div class="avatar" style="width:60px;height:60px;font-size:22px">${initials(u.name)}</div>
        <div><h1 style="font-size:26px;margin:0">${esc(u.name)}</h1><div class="faint" style="font-size:14px"><span class="tag tag-verified">✓ Verified</span> ${u.founding ? '<span class="tag tag-founding">Founding member</span> ' : ''}Joined Oct 2026 · ${esc(u.state || 'QLD')}, Australia</div></div>
      </div>
      <div class="account" style="margin-top:20px">
        <nav class="side-nav">${tabs.map(([k, n, c]) => k === 'sep' ? '<div class="sep"></div>' : `<a class="${tab === k ? 'on' : ''}" href="#/account?tab=${k}">${n}${c != null ? `<span class="faint">${c}</span>` : ''}</a>`).join('')}</nav>
        <div>${body}</div>
      </div>
    </div>`;
  }

  // ---------- Router ----------
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
  }

  function render() {
    artSeq = 0;
    const { parts, params } = parse();
    const [page, arg] = parts;
    const app = $('#app');
    const views = {
      undefined: () => pageHome(),
      browse: () => pageBrowse(params),
      item: () => pageItem(arg),
      sell: () => pageSell(),
      pricing: () => pagePricing(),
      login: () => pageAuth('login', params),
      register: () => pageAuth('register', params),
      account: () => pageAccount(params),
    };
    app.innerHTML = (views[page] || views.undefined)();
    renderNav();
    $$('[data-search] input[name=q]').forEach(i => { i.value = page === 'browse' ? params.get('q') || '' : ''; });
    wire(page, params);
    if (!render.keepScroll) window.scrollTo(0, 0);
    render.keepScroll = false;
  }

  function rerender() { render.keepScroll = true; render(); }

  function setParams(mut) {
    const { params } = parse();
    mut(params);
    for (const [k, v] of [...params]) if (!v) params.delete(k);
    render.keepScroll = true;
    location.hash = '#/browse' + (params.toString() ? '?' + params : '');
  }

  function findListing(id) {
    return state.myListings.find(l => l.id === id) || LISTINGS.find(l => l.id === id);
  }

  // ---------- Page wiring ----------
  function wire(page, params) {
    if (page === 'browse') {
      const f = $('#filters');
      f.addEventListener('change', e => {
        const t = e.target;
        setParams(p => {
          if (t.name === 'cat') p.set('cat', t.value);
          if (t.name === 'state') p.set('state', $$('input[name=state]:checked', f).map(i => i.value).join(','));
          if (t.name === 'cond') p.set('cond', $$('input[name=cond]:checked', f).map(i => i.value).join(','));
          if (t.name === 'min' || t.name === 'max') p.set(t.name, t.value);
        });
      });
      $('#sort').addEventListener('change', e => setParams(p => p.set('sort', e.target.value)));
      $$('[data-clear]').forEach(c => c.addEventListener('click', () => setParams(p => p.delete(c.dataset.clear))));
      $$('[data-clear-state]').forEach(c => c.addEventListener('click', () => setParams(p => p.set('state', (p.get('state') || '').split(',').filter(x => x !== c.dataset.clearState).join(',')))));
      $$('[data-clear-cond]').forEach(c => c.addEventListener('click', () => setParams(p => p.set('cond', (p.get('cond') || '').split(',').filter(x => x !== c.dataset.clearCond).join(',')))));
    }

    if (page === 'item') {
      const l = byId(parse().parts[1]);
      if (!l) return;
      $$('[data-thumb]').forEach(b => b.addEventListener('click', () => {
        $$('[data-thumb]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        $('#mainArt').innerHTML = listingArt(l, Number(b.dataset.thumb));
      }));
      $$('#itemTabs button').forEach(b => b.addEventListener('click', () => {
        $$('#itemTabs button').forEach(x => x.classList.toggle('on', x === b));
        $$('[data-pane]').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== b.dataset.tab));
      }));
      $$('[data-open]').forEach(b => b.addEventListener('click', () => {
        if (!state.user) { toast('Log in to contact sellers'); location.hash = `#/login?next=item/${l.id}`; return; }
        const box = $('#box-' + b.dataset.open);
        $$('.contact-box').forEach(x => { if (x !== box) x.classList.add('hidden'); });
        box.classList.toggle('hidden');
        const field = box.querySelector('textarea, input');
        field && field.focus();
      }));
      $$('.contact-box').forEach(form => form.addEventListener('submit', e => {
        e.preventDefault();
        const d = new FormData(form);
        state.sent.unshift({ to: l.seller, item: l.title, kind: form.dataset.kind, text: (d.get('text') || '').trim(), amount: Number(d.get('amount')) || 0, at: 'just now' });
        save();
        form.innerHTML = `<div class="note ok">${I.check}<span><b style="color:var(--text)">${form.dataset.kind === 'offer' ? 'Offer sent' : 'Message sent'}.</b> We'll let you know when @${esc(l.seller)} replies. <a href="#/account?tab=messages" style="color:var(--accent)">View messages</a></span></div>`;
      }));
      const pcBtn = $('[data-pc]');
      pcBtn && pcBtn.addEventListener('click', () => {
        const pc = $('#pc').value.trim();
        const to = postcodeState(pc);
        if (!to) { $('#pcOut').textContent = 'Enter a 4-digit Australian postcode.'; return; }
        const from = stateOf(l);
        const days = to === from ? '1–3' : ['WA', 'NT', 'TAS'].includes(to) || ['WA', 'NT', 'TAS'].includes(from) ? '4–8' : '2–5';
        $('#pcOut').textContent = `Parcel Post to ${pc} (${to}) from ${from}: about ${days} business days.`;
      });
      const rep = $('[data-report]');
      rep && rep.addEventListener('click', () => toast('Thanks — our team will review this listing'));
    }

    if (page === 'sell' && state.user) wireSell();

    if (page === 'login' || page === 'register') {
      const f = $('#authForm');
      const err = $('#authError');
      const fail = msg => { err.textContent = msg; err.classList.remove('hidden'); };
      const finish = user => {
        state.user = user;
        save();
        toast(page === 'register' ? (user.founding ? 'Welcome — you\'re a Founding member' : 'Account created — welcome aboard!') : 'Logged in');
        location.hash = '#/' + (f.dataset.next || 'account');
      };
      let pendingUser = null;
      f.addEventListener('submit', e => {
        e.preventDefault();
        if (pendingUser) {
          if (!/^\d{6}$/.test(f.code.value.trim())) return fail('Enter the 6-digit code.');
          finish(pendingUser);
          return;
        }
        const email = f.email.value.trim();
        const name = f.name ? f.name.value.trim() : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (page === 'login') { finish(newUser(name, email)); return; }
        const pc = f.postcode.value.trim();
        const st = f.state.value;
        const mobile = f.mobile.value.replace(/\D/g, '').replace(/^61/, '').replace(/^0/, '');
        const pcState = postcodeState(pc);
        if (!pcState) return fail('Enter a valid 4-digit Australian postcode.');
        if (pcState !== st && !(pcState === 'ACT' && st === 'NSW') && !(pcState === 'NSW' && st === 'ACT')) return fail(`Postcode ${pc} is in ${pcState}, not ${st}.`);
        if (!/^4\d{8}$/.test(mobile)) return fail('Enter an Australian mobile number, e.g. 0412 345 678.');
        const pretty = `+61 ${mobile.slice(0, 3)} ${mobile.slice(3, 6)} ${mobile.slice(6)}`;
        pendingUser = { ...newUser(name, email), state: st, postcode: pc, mobile: pretty };
        f.innerHTML = `<div class="field"><label for="a-code">Enter the 6-digit code sent to ${pretty}</label>
            <input class="input" id="a-code" name="code" inputmode="numeric" maxlength="6" required placeholder="123456" autocomplete="one-time-code">
            <small>Mockup: any 6 digits will work.</small></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit">Verify and create account</button>`;
        f.prepend(err);
        err.classList.add('hidden');
        f.code.focus();
      });
      $$('[data-social]').forEach(b => b.addEventListener('click', () => {
        if (page === 'login') { finish(newUser('Carina Stargazer', 'carina@example.com')); return; }
        // New members signing up with Google/Apple still confirm their Australian details.
        f.name.value = 'Carina Stargazer'; f.email.value = 'carina@example.com'; f.password.value = 'oauth-placeholder';
        toast('Account connected — now add your Australian details');
        f.postcode.focus();
      }));
    }

    if (page === 'account' && state.user) {
      const on = (sel, fn) => $$(sel).forEach(b => b.addEventListener('click', () => fn(b)));
      on('[data-logout]', () => { state.user = null; save(); toast('Logged out'); location.hash = '#/'; });
      on('[data-saved]', () => toast('Settings saved'));
      on('[data-sold]', b => {
        const id = idOf(b.dataset.sold);
        const i = state.sold.indexOf(id);
        if (i >= 0) state.sold.splice(i, 1); else state.sold.push(id);
        save(); toast(i >= 0 ? 'Listing is live again' : 'Marked as sold — congratulations!'); rerender();
      });
      on('[data-feature]', b => {
        const l = findListing(idOf(b.dataset.feature));
        const u = state.user;
        l.featured = true;
        if (u.credits > 0) { u.credits--; toast('Featured for 7 days — launch credit used'); }
        else {
          const amt = state.fees.featured;
          state.receipts.unshift({ date: today(), item: l.title, detail: 'Featured upgrade', amount: amt, listingFee: 0, upgrades: amt });
          toast(`Featured for 7 days — ${money(amt)} paid by card (mock)`);
        }
        save(); rerender();
      });
      on('[data-copy]', () => {
        const v = $('#refLink').value;
        try { navigator.clipboard.writeText('https://' + v); } catch { /* ignore */ }
        toast('Invite link copied');
      });
      on('[data-approve]', b => {
        const l = findListing(idOf(b.dataset.approve));
        l.status = 'active'; save(); toast('Listing approved and live'); rerender();
      });
      on('[data-reject]', b => {
        state.myListings = state.myListings.filter(l => l.id !== idOf(b.dataset.reject));
        save(); toast('Listing rejected — seller notified and refunded'); rerender();
      });
      on('[data-reset-fees]', () => { state.fees = { ...DEFAULT_FEES }; save(); toast('Fee settings reset'); rerender(); });
      const ff = $('#feeForm');
      ff && ff.addEventListener('submit', e => {
        e.preventDefault();
        const d = new FormData(ff);
        const num = k => Math.max(0, Number(d.get(k)) || 0);
        state.fees = {
          launch: d.get('launch') === 'on', firstFree: d.get('firstFree') === 'on', launchEnds: d.get('launchEnds') || DEFAULT_FEES.launchEnds,
          foundingDiscount: Math.min(100, num('foundingDiscount')), launchCredits: num('launchCredits'),
          rate: num('rate'), min: num('min'), cap: num('cap'), featured: num('featured'), spotlight: num('spotlight'), bump: num('bump'),
        };
        save(); toast('Fee settings saved'); rerender();
      });
    }
  }

  function wireSell() {
    const photos = [];
    const input = $('#photoInput');
    const dz = $('#dropzone');
    const previews = $('#previews');
    const form = $('#sellForm');
    const btn = $('#submitBtn');

    const locOf = d => [d.get('suburb'), d.get('state')].filter(Boolean).join(', ');
    const drawPreviews = () => {
      previews.innerHTML = photos.map((src, i) => `<div class="p" style="background-image:url('${src}')">${i === 0 ? '<span class="cover">COVER</span>' : ''}<button type="button" class="x" data-del="${i}" aria-label="Remove photo">✕</button></div>`).join('');
      draw();
    };
    const draw = () => {
      const d = new FormData(form);
      const ups = d.getAll('up');
      const l = {
        id: 'preview', title: d.get('title') || 'Your listing title', cat: d.get('cat'), brand: d.get('brand') || '—',
        price: Number(d.get('price')) || 0, was: Number(d.get('was')) || 0, cond: d.get('cond') || 'Like new',
        location: locOf(d), posted: 'just now', rating: 5, kind: (CATS.find(c => c.id === d.get('cat')) || {}).kind, hue: 0, photos,
        featured: ups.includes('featured') || ups.includes('spotlight'),
      };
      $('#sellPreview').innerHTML = card(l).replace(/href="[^"]*"/, 'href="javascript:void 0"');
      const q = quote(l.price, ups);
      $('#feeQuote').innerHTML = quoteHtml(q);
      btn.textContent = q.total ? `Pay ${money(q.total)} & submit` : 'Submit for review — free';
    };
    const addFiles = files => {
      [...files].filter(f => f.type.startsWith('image/')).slice(0, 12 - photos.length).forEach(f => {
        const rd = new FileReader();
        rd.onload = () => { photos.push(rd.result); drawPreviews(); };
        rd.readAsDataURL(f);
      });
    };

    input.addEventListener('change', () => addFiles(input.files));
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
    dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));
    previews.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { photos.splice(Number(b.dataset.del), 1); drawPreviews(); } });
    form.addEventListener('input', draw);
    form.addEventListener('change', draw);
    $('[data-draft]').addEventListener('click', () => toast('Draft saved'));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      const cat = d.get('cat');
      const ups = d.getAll('up');
      const price = Number(d.get('price'));
      const q = quote(price, ups);
      const l = {
        id: 'u' + Date.now(), mine: true, status: 'review', title: d.get('title'), cat, brand: d.get('brand') || 'Other', price,
        was: Number(d.get('was')) || undefined, cond: d.get('cond'), location: locOf(d) || 'Brisbane, QLD',
        seller: state.user.name.toLowerCase().replace(/\s+/g, '_'), rating: 5, sales: 0, posted: 'just now',
        kind: (CATS.find(c => c.id === cat) || {}).kind, hue: 0, specs: {}, desc: d.get('desc') || 'No description provided.',
        featured: ups.includes('featured') || ups.includes('spotlight'),
      };
      const u = state.user;
      u.credits = (u.credits || 0) - q.creditsUsed;
      u.listed = (u.listed || 0) + 1;
      if (q.total) {
        const listingFee = q.lines.filter(x => x.kind === 'listing').reduce((s, x) => s + x.amount, 0);
        state.receipts.unshift({ date: today(), item: l.title, detail: q.lines.filter(x => x.amount).map(x => x.label.replace(/ \(.*/, '')).join(' + '), amount: q.total, listingFee, upgrades: q.total - listingFee });
      }
      // Uploaded photos stay in memory for this mockup session only (not persisted).
      state.myListings.unshift({ ...l });
      save();
      state.myListings[0].photos = photos.slice();
      toast(q.total ? `Paid ${money(q.total)} by card (mock Stripe) — submitted for review` : 'Submitted for review');
      location.hash = '#/account?tab=listings';
    });
    draw();
  }

  // ---------- Global events ----------
  document.addEventListener('click', e => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault(); e.stopPropagation();
      const id = idOf(fav.dataset.fav);
      if (id === 'preview') return;
      const i = state.favs.indexOf(id);
      if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
      save();
      toast(i >= 0 ? 'Removed from watchlist' : 'Saved to watchlist');
      rerender();
    }
  });

  $$('[data-search]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const q = f.q.value.trim();
    const cat = f.cat ? f.cat.value : '';
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (cat) p.set('cat', cat);
    location.hash = '#/browse' + (p.toString() ? '?' + p : '');
  }));
  const catSel = $('[data-search] select[name=cat]');
  catSel.innerHTML += CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  window.addEventListener('hashchange', render);
  render();
})();
