/* The loop. Every one of these is a thing that actually went wrong on a phone,
 * or a promise the app makes to the crew. Run before every deploy:
 *     node test/run.js
 */
const path = require('path');
const { loadApp, check, done } = require('./harness');
const INDEX = path.join(__dirname, '..', 'index.html');

console.log('CREW QUEST — pre-deploy loop\n');

/* ── 1. the tape itself ─────────────────────────────────────────────────── */
console.log('THE TAPE');
{
  const app = loadApp(INDEX);
  const M = app.M;
  check('15 steps', M.length === 15, M.length);
  check('the letters still spell BESTDAYTOGETHER',
        M.map(s => s.l).join('') === 'BESTDAYTOGETHER', M.map(s => s.l).join(''));
  check('8 code steps (one per watch code)',
        M.filter(s => s.k === 'code').length === 8, M.filter(s => s.k === 'code').length);
  const codes = M.filter(s => s.ch).map(s => s.ch);
  const expected = [259241, 262006, 258344, 261288, 257416, 262995, 263983, 260240];
  check('every watch code is unchanged',
        JSON.stringify(codes) === JSON.stringify(expected), codes.join(','));
  check('every step has words for the commander to say',
        M.every(s => s.say && s.wait), 'a step is missing say/wait');
}

/* ── 2. the destination list — THE BUG THAT COST ZEV THE AFTERNOON ──────── */
console.log('\nDESTINATIONS (derived from the tape, never hand-written)');
{
  const app = loadApp(INDEX);
  const STOPS = app.STOPS, M = app.M;
  const stopsInTape = [...new Set(M.filter(m => m.stop).map(m => m.stop))].sort((a, b) => a - b);
  check('a destination card exists for every stop in the tape',
        STOPS.length === stopsInTape.length,
        'cards=' + STOPS.length + ' tape=' + stopsInTape.length);
  check('no destination is invented that the tape does not have',
        STOPS.every(s => stopsInTape.includes(s.n)), STOPS.map(s => s.n).join(','));
  check('every destination has a real name',
        STOPS.every(s => s.name && !/^\s*$/.test(s.name)), JSON.stringify(STOPS.map(s => s.name)));
  check('no destination name still contains a {placeholder}',
        STOPS.every(s => !/\{[CFD]\}/.test(s.name)), JSON.stringify(STOPS.map(s => s.name)));
  // the afternoon Zev actually asked for
  const names = STOPS.map(s => s.name).join(' | ');
  check('the Dollar Tree is a destination', /Dollar Tree/.test(names), names);
  check('Altitude is a destination', /Altitude/.test(names), names);
  check('the day ends back at base camp',
        /Base camp/i.test(STOPS[STOPS.length - 1].name), STOPS[STOPS.length - 1].name);
  check('the dollar store carries its address',
        (STOPS.find(s => /Dollar Tree/.test(s.name)) || {}).addr, 'no address');
  check('Altitude carries its address',
        (STOPS.find(s => /Altitude/.test(s.name)) || {}).addr, 'no address');
  console.log('    -> ' + STOPS.map(s => s.n + ':' + s.name).join('  '));
}

/* ── 3. what the crew actually SEES at a given point in the day ─────────── */
console.log('\nWHAT THE PHONE SHOWS AT STEP 8 (the dollar store)');
{
  const app = loadApp(INDEX);
  app.document.getElementById('inCmd').value = 'Havi';
  app.document.getElementById('inField').value = 'Parker';
  app.document.getElementById('inDrv').value = 'Dad';
  app.saveCrew();
  app.document.getElementById('jump').value = '8';
  app.jumpTo();
  check('the app is on step 8', app.S.i === 7, 'i=' + app.S.i);

  // Read what the app ACTUALLY RENDERED. Recomputing the reveal rule here would
  // make this test agree with itself instead of with the app -- which is the
  // exact defect that let the destination list ship wrong three times.
  const stops = app.document.getElementById('stops');
  stops.innerHTML = ''; stops.children = [];
  app.renderStops();
  const html = stops.innerHTML;
  const cards = (html.match(/DESTINATION \d/g) || []);
  const sealed = (html.match(/SEALED/g) || []);
  check('six destination cards are drawn', cards.length === 6, cards.length + ' drawn');
  check('the dollar store is named on screen', /Dollar Tree/.test(html), 'not rendered');
  check('Altitude is NOT revealed yet', !/Altitude/.test(html), 'revealed too early');
  check('the destination they are standing in is not locked',
        !new RegExp('DESTINATION 4 · SEALED').test(html.replace(/\\u00b7/g, '·')),
        'destination 4 still reads SEALED');
  check('exactly 2 destinations are still ahead', sealed.length === 2, sealed.length + ' sealed');
  console.log('    -> cards=' + cards.length + ' sealed=' + sealed.length);
}

/* ── 4. names — jumping must never drop the crew into a nameless run ────── */
console.log('\nNAMES');
{
  const app = loadApp(INDEX);
  app.document.getElementById('jump').value = '8';
  app.jumpTo();
  check('jumping with no names does NOT start the run',
        app.S.crewOK !== true || (app.S.cmd && app.S.field),
        'crewOK=' + app.S.crewOK + ' cmd="' + app.S.cmd + '" field="' + app.S.field + '"');
  check('the app says what is missing',
        /name/i.test(app.document.getElementById('jumpv').textContent || ''),
        'msg="' + app.document.getElementById('jumpv').textContent + '"');
}
{
  const app = loadApp(INDEX);
  app.document.getElementById('inCmd').value = 'Havi';
  app.document.getElementById('inField').value = 'Parker';
  app.document.getElementById('inDrv').value = 'Dad';
  app.saveCrew();
  app.document.getElementById('jump').value = '8';
  app.jumpTo();
  check('with names entered, the jump works', app.S.i === 7, 'i=' + app.S.i);
  check('the names are stored', app.S.cmd === 'Havi' && app.S.field === 'Parker' && app.S.drv === 'Dad',
        JSON.stringify([app.S.cmd, app.S.field, app.S.drv]));
  check('step text substitutes the real names',
        app.N(app.M[7].say).indexOf('Parker') >= 0 && app.N(app.M[7].say).indexOf('{F}') < 0,
        app.N(app.M[7].say).slice(0, 60));
  check('no screen still shows the word "Field Agent" placeholder',
        app.F() === 'Parker', app.F());
}

/* ── 5. progress survives a reload (it is the whole point of saving) ────── */
console.log('\nPROGRESS SURVIVES A RELOAD');
{
  const app = loadApp(INDEX);
  app.document.getElementById('inCmd').value = 'Havi';
  app.document.getElementById('inField').value = 'Parker';
  app.document.getElementById('inDrv').value = 'Dad';
  app.saveCrew();
  app.document.getElementById('jump').value = '8';
  app.jumpTo();
  const saved = app.__store;
  const app2 = loadApp(INDEX, { localStorage: saved });
  check('the step survives', app2.S.i === 7, 'i=' + app2.S.i);
  check('the names survive', app2.S.field === 'Parker', app2.S.field);
}

/* ── 6. the watch and the phone must agree ──────────────────────────────── */
console.log('\nPHONE AND WATCH AGREE');
{
  const fs = require('fs');
  const cards = path.join(process.env.HOME, 'dev/parker-watch-apps/Apps/CrewQuest/Sources/Cards.swift');
  if (!fs.existsSync(cards)) { check('watch source is readable', false, cards); }
  else {
    const swift = fs.readFileSync(cards, 'utf8');
    const ids = [...swift.matchAll(/Step\(id:\s*(\d+)/g)].map(m => +m[1]);
    const app = loadApp(INDEX);
    check('the watch has one beat per phone step',
          ids.length === app.M.length, 'watch=' + ids.length + ' phone=' + app.M.length);
    check('the watch beats are numbered 0..n with no gaps',
          ids.every((v, i) => v === i), ids.join(','));
    const spoken = swift;
    check('the watch knows about the dollar store',
          /dollar/i.test(spoken), 'no dollar-store line on the watch');
    check('the watch no longer talks about lunch at home',
          !/one part of lunch|runs the kitchen/i.test(spoken), 'stale lunch text still on the watch');
    check('the watch finale happens at base camp',
          /base camp/i.test(spoken), 'finale does not mention base camp');
  }
}

done('CREW QUEST');
