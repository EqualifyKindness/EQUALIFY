/* EQUALIFY – router, local accounts, learn, help finder, games, community */
const $ = s => document.querySelector(s);
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => e.append(c));
  return e;
}
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
};

/* ---------- accounts (demo: stored in this browser only) ---------- */
async function hash(s) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) | 0; return 'x' + n;
}
const users = () => store.get('eq_users', {});
const me = () => { const n = store.get('eq_session', null); return n ? { name: n, ...users()[n] } : null; };
function save(name, patch) { const u = users(); u[name] = { ...u[name], ...patch }; store.set('eq_users', u); }
function award(points, badge) {
  const u = me(); if (!u) return false;
  const badges = new Set(u.badges || []); if (badge) badges.add(badge);
  save(u.name, { points: (u.points || 0) + points, badges: [...badges] });
  return true;
}
function refreshNav() { const u = me(); $('#acct').textContent = u ? u.name : 'Log in'; }

function renderAccount() {
  const box = $('#account-box'); box.replaceChildren();
  const u = me();
  if (u) {
    box.append(
      h('h1', {}, 'Hi, ' + u.name),
      h('div', { class: 'panel' },
        h('p', {}, 'Your points'), h('div', { class: 'pts' }, String(u.points || 0)),
        h('h3', {}, 'Badges'),
        h('div', { class: 'badges' }, (u.badges || []).length ? u.badges.map(b => h('span', { class: 'badge' }, b)) : h('p', { class: 'note' }, 'No badges yet. Finish a game to earn one.')),
        h('div', { class: 'row' },
          h('a', { class: 'btn', href: '#play' }, 'Play a game'),
          h('button', { class: 'btn ghost', onclick: () => { store.set('eq_session', null); refreshNav(); renderAccount(); } }, 'Log out'))));
    return;
  }
  let mode = 'login';
  const msg = h('p', { class: 'msg', role: 'alert' });
  const name = h('input', { id: 'u-name', autocomplete: 'username', maxlength: '20', required: '' });
  const pw = h('input', { id: 'u-pw', type: 'password', autocomplete: 'current-password', minlength: '6', required: '' });
  const submit = h('button', { class: 'btn', type: 'submit' }, 'Log in');
  const title = h('h1', {}, 'Log in');
  const tabLogin = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true' }, 'Log in');
  const tabSign = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, 'Create account');
  const setMode = m => {
    mode = m; msg.textContent = '';
    tabLogin.setAttribute('aria-pressed', m === 'login'); tabSign.setAttribute('aria-pressed', m === 'signup');
    submit.textContent = title.textContent = m === 'login' ? 'Log in' : 'Create account';
    pw.autocomplete = m === 'login' ? 'current-password' : 'new-password';
  };
  tabLogin.onclick = () => setMode('login'); tabSign.onclick = () => setMode('signup');
  const form = h('form', { class: 'panel' },
    h('label', { for: 'u-name' }, 'Username'), name,
    h('label', { for: 'u-pw' }, 'Password (6+ characters)'), pw,
    submit, msg,
    h('p', { class: 'note' }, 'This is a school-project demo. Accounts live only in this browser, so never reuse a real password.'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const n = name.value.trim(), all = users(), hp = await hash(pw.value);
    if (mode === 'signup') {
      if (all[n]) { msg.className = 'msg err'; msg.textContent = 'That username is taken. Try another one.'; return; }
      save(n, { pw: hp, points: 0, badges: [] });
    } else if (!all[n] || all[n].pw !== hp) {
      msg.className = 'msg err'; msg.textContent = 'Username or password is wrong. Check both and try again.'; return;
    }
    store.set('eq_session', n); refreshNav(); renderAccount();
  });
  box.append(title, h('div', { class: 'tabs' }, tabLogin, tabSign), form);
}

/* ---------- learn ---------- */
const TOPICS = [
  ['What is gender equality?', ['Gender equality means people of every gender have the same rights, respect and chances in school, work, politics and home.', 'It does not mean everyone is the same. It means your gender does not decide what you are allowed to do or become.']],
  ['SDG 5: the global goal', ['Sustainable Development Goal 5 is the United Nations goal to achieve gender equality and empower all women and girls.', 'It covers ending discrimination and violence, fair pay, shared care work, and equal voice in decisions.']],
  ['Gender stereotypes', ['A stereotype is a fixed idea about how a gender should look, act or work. Examples: "boys don\'t cry" or "girls are bad at math."', 'Stereotypes limit choices. They push people away from careers, hobbies and feelings that suit them.', 'How to challenge one: ask "who says?", share a counter-example, and judge people by skills, not gender.']],
  ['Equal pay and opportunity', ['Equal pay means the same pay for work of equal value. Equal opportunity means hiring, promotion and training are based on ability.', 'Unequal pay often comes from bias, unpaid care work falling mostly on women, and fewer women being promoted.']],
  ['Safe spaces and harassment', ['Gender-based harassment includes catcalling, unwanted comments, sexist jokes, unwanted touching and online abuse.', 'In the Philippines, the Safe Spaces Act (RA 11313) covers harassment in streets, workplaces, schools and online. The Magna Carta of Women (RA 9710) protects women\'s rights.']],
  ['How to be an ally', ['Listen without arguing. Believe people who share their experiences.', 'Speak up when you see unfair treatment, safely and calmly. Support the person targeted, not just the conversation.', 'Check your own habits: who do you interrupt, and who do you assume will do which job?']]
];
function renderTopics() {
  $('#topics').append(...TOPICS.map(([t, ps]) => h('details', {}, h('summary', {}, t), h('div', {}, ps.map(p => h('p', {}, p))))));
}

/* ---------- help finder ---------- */
const HELP = {
  School: { steps: ['Write down what happened: date, place, what was said or done, and who saw it.', 'Tell a trusted adult: a teacher, guidance counselor or the school head. You can bring a friend or parent.', 'Ask what the school\'s anti-bullying or gender-sensitivity policy says and how to file a complaint.', 'Follow up in writing if nothing happens within a week or two.'], who: ['Guidance counselor or school head', 'Parent or guardian', 'Department of Education (DepEd) division office, for unresolved school cases'] },
  Work: { steps: ['Keep records: messages, emails, dates, witnesses. Save copies somewhere private.', 'Check your company\'s policy and report to HR or a supervisor you trust.', 'If the company does not act, you can go to outside bodies.', 'Do not sign anything you do not understand. Ask for a copy of whatever you submit.'], who: ['HR or a Committee on Decorum and Investigation', 'Department of Labor and Employment (DOLE)', 'Commission on Human Rights (CHR)', 'A licensed lawyer or free legal aid office'] },
  Online: { steps: ['Do not reply to the abuser. Take screenshots with the date and username showing.', 'Block the account and report the post or profile to the platform.', 'Lock down your privacy settings and change passwords if someone is hacking or stalking you.', 'Share what happened with someone you trust. You do not have to handle it alone.'], who: ['The platform\'s report tool', 'PNP Anti-Cybercrime Group', 'NBI Cybercrime Division'] },
  Home: { steps: ['Your safety comes first. If you are in danger now, call emergency services.', 'Tell someone you trust and make a plan for where you could go.', 'Keep important documents and contact numbers somewhere you can grab them fast.', 'Ask a barangay official or social worker about protection orders. Violence against women and children is covered by RA 9262.'], who: ['Emergency number 911', 'Barangay Violence Against Women and Children (VAWC) desk', 'PNP Women and Children Protection Desk', 'DSWD or your local social welfare office'] },
  'Not sure': { steps: ['Ask yourself: was someone treated worse, blocked, mocked or threatened because of gender?', 'Write down what happened in your own words while it is fresh.', 'Talk it over with someone you trust. A second view helps.', 'Come back here and pick the place it happened to see steps for it.'], who: ['A trusted friend, relative or teacher', 'Commission on Gender and Development contacts through the Philippine Commission on Women (PCW)'] }
};
function renderHelp() {
  const chips = $('#situations'), out = $('#help-out');
  Object.keys(HELP).forEach(k => {
    const b = h('button', { class: 'chip', 'aria-pressed': 'false' }, k === 'Not sure' ? 'I\'m not sure' : (k === 'Online' ? 'Online' : k === 'Home' ? 'At home' : k === 'Work' ? 'At work' : 'At school'));
    b.onclick = () => {
      chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true');
      const d = HELP[k]; out.hidden = false; out.replaceChildren(
        h('h3', {}, 'What you can do'), h('ol', {}, d.steps.map(s => h('li', {}, s))),
        h('h3', {}, 'Who can help'), h('ul', {}, d.who.map(s => h('li', {}, s))),
        h('p', { class: 'note' }, 'Office names and procedures change. Check each office\'s official website or ask your barangay for current contact details.'));
      out.focus?.();
    };
    chips.append(b);
  });
}

/* ---------- games ---------- */
const stage = () => $('#stage');
function finish(title, points, total, badge) {
  const saved = award(points, badge);
  stage().replaceChildren(
    h('h3', {}, title), h('p', { class: 'fb' }, `You earned ${points} points (${total}).`),
    h('p', { class: 'note' }, saved ? (badge ? `Badge unlocked: ${badge}` : 'Points saved to your account.') : 'Log in next time to keep your points and badges.'),
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => startGame(window.__last) }, 'Play again'), h('button', { class: 'btn ghost', onclick: () => { stage().hidden = true; } }, 'Back to games')));
}
function startGame(name) {
  window.__last = name; stage().hidden = false; stage().replaceChildren();
  ({ myth: mythGame, scenario: scenarioGame, match: matchGame, word: wordGame })[name]();
  stage().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const MYTHS = [
  ['Boys and men should never show emotions.', false, 'Everyone has feelings. Hiding them harms health and relationships.'],
  ['Girls are just as capable as boys in math and science.', true, 'Research shows no inborn difference in ability. Differences come from encouragement and opportunity.'],
  ['Cooking and childcare are "women\'s work."', false, 'Care work is a skill for everyone. Sharing it gives everyone more freedom.'],
  ['Women still earn less than men on average worldwide.', true, 'The global gender pay gap is real, driven by bias, unequal care duties and fewer promotions.'],
  ['Men cannot be nurses or teachers.', false, 'Any gender can excel in any profession. Skill and passion matter.'],
  ['Gender equality benefits men and boys too.', true, 'Equal societies tend to have better health, less violence and more flexible roles for everyone.'],
  ['Leaders have to be loud and aggressive, which is a male trait.', false, 'Good leadership includes listening and collaboration. Style is not tied to gender.'],
  ['Sexist jokes are harmless because "it\'s just humor."', false, 'Jokes that demean a gender normalize disrespect and can lead to harassment.']
];
function mythGame() {
  const qs = shuffle(MYTHS); let i = 0, sc = 0;
  const draw = () => {
    const [t, isFact, why] = qs[i]; let done = false;
    const fb = h('p', { class: 'fb' }), next = h('button', { class: 'btn', hidden: '' }, i === qs.length - 1 ? 'See result' : 'Next');
    const pick = (v, btn) => {
      if (done) return; done = true;
      const ok = v === isFact; if (ok) sc++;
      btn.classList.add(ok ? 'right' : 'wrong');
      fb.textContent = (ok ? 'Correct. ' : 'Not quite. ') + why; next.hidden = false; next.focus();
    };
    const bm = h('button', { class: 'opt' }, 'Myth'), bf = h('button', { class: 'opt' }, 'Fact');
    bm.onclick = () => pick(false, bm); bf.onclick = () => pick(true, bf);
    next.onclick = () => { i++; i < qs.length ? draw() : finish('Myth or fact: done', sc * 10, `${sc}/${qs.length} correct`, sc === qs.length ? 'Myth Buster' : null); };
    stage().replaceChildren(h('div', { class: 'bar' }, h('span', {}, `Statement ${i + 1} of ${qs.length}`), h('span', {}, `Score ${sc}`)), h('h3', {}, t), h('div', { class: 'opts' }, bm, bf), fb, next);
  };
  draw();
}

const SCEN = [
  ['In class, a teacher says "girls don\'t need to take the robotics elective." A classmate looks upset. What do you do?',
    [['Stay quiet. It\'s not your problem.', 0, 'Silence leaves the classmate alone and the comment unchallenged.'],
    ['Respectfully tell the teacher that anyone can join, then encourage your classmate to sign up.', 1, 'You challenged the stereotype calmly and supported the person affected.'],
    ['Laugh it off with friends later.', 0, 'Joking about it later does nothing to change the rule.']]],
  ['Online, a group chat keeps sharing jokes that mock women. Some friends are laughing. What helps most?',
    [['Say you don\'t find it funny, and ask them to stop. Report it if it continues.', 1, 'Speaking up shifts what the group treats as normal.'],
    ['Leave the chat without a word.', 0, 'Leaving protects you, but the behavior goes on. Speaking up first is stronger.'],
    ['Send a joke back to fit in.', 0, 'Joining in encourages it.']]],
  ['At a part-time job, a coworker is told she can\'t train for a technician role "because it\'s a man\'s job." What is a good step?',
    [['Tell her it\'s the boss\'s call and move on.', 0, 'Decisions based on gender are not just the boss\'s call.'],
    ['Suggest she document it and raise it with HR, and offer to go with her.', 1, 'Records plus support give her a real path to a fair decision.'],
    ['Post about it angrily with the boss\'s name.', 0, 'A public attack can backfire. Use proper channels first.']]]
];
function scenarioGame() {
  let i = 0, sc = 0;
  const draw = () => {
    const [t, opts] = SCEN[i]; let done = false;
    const fb = h('p', { class: 'fb' }), next = h('button', { class: 'btn', hidden: '' }, i === SCEN.length - 1 ? 'See result' : 'Next situation');
    const buttons = opts.map(([txt, good, why]) => {
      const b = h('button', { class: 'opt' }, txt);
      b.onclick = () => {
        if (done) return; done = true; if (good) sc++;
        b.classList.add(good ? 'right' : 'wrong'); fb.textContent = why; next.hidden = false; next.focus();
      };
      return b;
    });
    next.onclick = () => { i++; i < SCEN.length ? draw() : finish('What would you do: done', sc * 15, `${sc}/${SCEN.length} best choices`, sc === SCEN.length ? 'Brave Ally' : null); };
    stage().replaceChildren(h('div', { class: 'bar' }, h('span', {}, `Situation ${i + 1} of ${SCEN.length}`), h('span', {}, `Score ${sc}`)), h('h3', {}, t), h('div', { class: 'opts' }, buttons), fb, next);
  };
  draw();
}

const PAIRS = [['SDG 5', 'UN goal for gender equality'], ['Stereotype', 'Fixed idea about how a gender should act'], ['Equal pay', 'Same pay for work of equal value'], ['Consent', 'A clear, freely given yes'], ['Ally', 'Someone who supports people facing unfair treatment'], ['Bias', 'Unfair leaning toward or against a group']];
function matchGame() {
  let selT = null, matched = 0, misses = 0; const start = Date.now();
  const status = h('p', { class: 'fb' }, 'Pick a term, then its meaning.');
  const mk = (txt, side, id) => h('button', { class: 'opt', 'data-id': id, 'data-side': side }, txt);
  const terms = shuffle(PAIRS.map((p, i) => mk(p[0], 't', i))), defs = shuffle(PAIRS.map((p, i) => mk(p[1], 'd', i)));
  const click = b => {
    if (b.classList.contains('done')) return;
    if (b.dataset.side === 't') { terms.forEach(x => x.classList.remove('sel')); selT = b; b.classList.add('sel'); return; }
    if (!selT) { status.textContent = 'Pick a term first.'; return; }
    if (selT.dataset.id === b.dataset.id) {
      [selT, b].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); x.disabled = true; });
      selT = null; matched++; status.textContent = 'Match!';
      if (matched === PAIRS.length) {
        const s = Math.round((Date.now() - start) / 1000), pts = Math.max(10, 50 - misses * 5 - Math.floor(s / 10));
        finish('Match the terms: done', pts, `${s}s, ${misses} wrong tries`, misses === 0 ? 'Word Wizard' : null);
      }
    } else { misses++; status.textContent = 'Not a match. Try again.'; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); }
  };
  [...terms, ...defs].forEach(b => b.addEventListener('click', () => click(b)));
  stage().replaceChildren(h('div', { class: 'bar' }, h('span', {}, 'Match all 6 pairs')), h('div', { class: 'pair' }, h('div', { class: 'opts' }, terms), h('div', { class: 'opts' }, defs)), status);
}

const WORDS = [['EQUALITY', 'Equal rights and chances for everyone.'], ['RESPECT', 'Valuing every person.'], ['INCLUSION', 'Making sure everyone belongs.'], ['FAIRNESS', 'Treating people justly.'], ['ALLY', 'Someone who stands up for others.'], ['RIGHTS', 'What every person is entitled to.']];
function wordGame() {
  const N = 10, DIRS = [[1, 0], [0, 1], [1, 1]];
  let grid, found = 0, first = null, misses = 0;
  const build = () => {
    const g = Array.from({ length: N }, () => Array(N).fill(''));
    for (const [w] of shuffle(WORDS)) {
      for (let tries = 0; tries < 200; tries++) {
        const [dx, dy] = DIRS[Math.floor(Math.random() * DIRS.length)];
        const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
        const ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
        if (ex >= N || ey >= N) continue;
        let ok = true;
        for (let k = 0; k < w.length; k++) { const c = g[y + dy * k][x + dx * k]; if (c && c !== w[k]) { ok = false; break; } }
        if (!ok) continue;
        for (let k = 0; k < w.length; k++) g[y + dy * k][x + dx * k] = w[k];
        break;
      }
    }
    const L = 'ABCDEFGHIJKLMNOPRSTUVWY';
    return g.map(r => r.map(c => c || L[Math.floor(Math.random() * L.length)]));
  };
  grid = build();
  const status = h('p', { class: 'fb' }, 'Tap the first letter of a word, then its last letter.');
  const list = h('div', { class: 'badges' }, WORDS.map(([w]) => h('span', { class: 'badge', 'data-w': w }, w)));
  const cells = [];
  const board = h('div', { class: 'ws', role: 'group', 'aria-label': 'Word search grid' });
  const clear = () => { cells.forEach(c => c.classList.remove('sel')); first = null; };
  grid.forEach((row, y) => row.forEach((ch, x) => {
    const b = h('button', { class: 'wc', 'aria-label': `Letter ${ch}, row ${y + 1}, column ${x + 1}` }, ch);
    b.onclick = () => {
      if (!first) { first = [x, y]; b.classList.add('sel'); return; }
      const [x0, y0] = first, dx = x - x0, dy = y - y0, len = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
      const straight = (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && len > 1;
      let hit = null, path = [];
      if (straight) {
        const sx = Math.sign(dx), sy = Math.sign(dy); let s = '';
        for (let k = 0; k < len; k++) { path.push([x0 + sx * k, y0 + sy * k]); s += grid[y0 + sy * k][x0 + sx * k]; }
        hit = WORDS.find(([w]) => (w === s || w === [...s].reverse().join('')) && !list.querySelector(`[data-w="${w}"].done`));
      }
      clear();
      if (hit) {
        path.forEach(([px, py]) => cells[py * N + px].classList.add('found'));
        list.querySelector(`[data-w="${hit[0]}"]`).classList.add('done');
        found++; status.textContent = `Found ${hit[0]}: ${hit[1]}`;
        if (found === WORDS.length) finish('Word search: done', found * 10 - Math.min(misses, 5) * 2, `${misses} wrong tries`, misses === 0 ? 'Puzzle Master' : null);
      } else { misses++; status.textContent = 'No word there. Try another line.'; }
    };
    cells.push(b);
  }));
  board.append(...cells);
  stage().replaceChildren(h('div', { class: 'bar' }, h('span', {}, 'Find all 6 words. Words run across, down or diagonally.')), list, board, status);
}

/* ---------- community ---------- */
function renderWall() {
  const wall = $('#wall'); wall.replaceChildren();
  const posts = store.get('eq_posts', []);
  if (!posts.length) { wall.append(h('p', { class: 'note' }, 'No reflections yet. Be the first to post.')); return; }
  wall.append(...posts.slice().reverse().map(p => h('div', { class: 'post' }, h('p', {}, p.text), h('small', {}, '– ' + p.name))));
}
function setupCommunity() {
  $('#pledge-btn').onclick = () => {
    const m = $('#pledge-msg'), u = me();
    if (!u) { m.className = 'msg err'; m.innerHTML = ''; m.append('Log in to take the pledge. ', h('a', { href: '#account' }, 'Go to log in')); return; }
    if ((u.badges || []).includes('Pledge Taker')) { m.className = 'msg ok'; m.textContent = 'You have already taken the pledge. Thank you.'; return; }
    award(20, 'Pledge Taker'); m.className = 'msg ok'; m.textContent = 'Pledge taken. +20 points and a new badge.';
  };
  $('#reflect').addEventListener('submit', e => {
    e.preventDefault(); const m = $('#r-msg'), u = me(), t = $('#r-text').value.trim();
    if (!u) { m.className = 'msg err'; m.textContent = 'Log in to post a reflection.'; return; }
    if (!t) return;
    const posts = store.get('eq_posts', []); posts.push({ name: u.name, text: t }); store.set('eq_posts', posts.slice(-50));
    $('#r-text').value = ''; m.className = 'msg ok'; m.textContent = 'Posted.'; renderWall();
  });
}

/* ---------- router & init ---------- */
function route() {
  let id = location.hash.slice(1) || 'home';
  const views = [...document.querySelectorAll('.view')];
  if (!views.some(v => v.id === 'v-' + id)) id = 'home';
  views.forEach(v => v.hidden = v.id !== 'v-' + id);
  document.querySelectorAll('.links a').forEach(a => a.getAttribute('href') === '#' + id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $('#links').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false');
  if (id === 'account') renderAccount();
  if (id === 'community') renderWall();
  window.scrollTo(0, 0);
}
renderTopics(); renderHelp(); setupCommunity(); refreshNav();
document.querySelectorAll('[data-game]').forEach(b => b.onclick = () => startGame(b.dataset.game));
$('#burger').onclick = () => { const o = $('#links').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); };
window.addEventListener('hashchange', route); route();

/* ---------- Equa: in-site assistant ---------- */
/* Works offline with the built-in answers below. To connect a real AI model, set AI_ENDPOINT to
   your own server URL. It receives {message, history} and must reply {reply: "..."}.
   Keep any API key on that server, never in this file. */
const AI_ENDPOINT = '';
const KB = [
  [['what is gender equality', 'gender equality', 'meaning of equality'], 'Gender equality means people of every gender have the same rights, respect and chances in education, work, politics and home. It doesn\'t mean everyone is the same. It means gender doesn\'t decide what you can do or become.'],
  [['equity', 'difference between equality'], 'Equality means giving everyone the same rights and treatment. Equity means giving people what they need to reach a fair outcome, because they may start from different places. Gender equality uses both: same rights, plus support that removes unfair barriers.'],
  [['sdg', 'sdg 5', 'sustainable development', 'united nations', 'un goal'], 'SDG 5 is the United Nations goal to achieve gender equality and empower all women and girls. It targets ending discrimination and violence, fair pay, shared care work, and equal voice in decisions.'],
  [['stereotype', 'stereotypes', 'boys dont cry', 'girls are bad'], 'A gender stereotype is a fixed idea about how a gender should look, act or work, like "boys don\'t cry." Stereotypes limit choices. To challenge one, ask "who says?", share a counter-example, and judge people by skills, not gender.'],
  [['pay gap', 'equal pay', 'salary', 'earn less', 'wage'], 'The gender pay gap is the difference in average earnings between men and women. UN Women estimates women earn roughly a fifth less than men worldwide, though it varies by country. Causes include bias, unequal unpaid care work, and fewer women being promoted.'],
  [['harass', 'harassment', 'catcall', 'safe spaces', '11313'], 'Gender-based harassment includes catcalling, unwanted comments, sexist jokes, unwanted touching and online abuse. In the Philippines the Safe Spaces Act (RA 11313) covers streets, workplaces, schools and online spaces. See the <a href="#help">Get help</a> page for steps.'],
  [['magna carta', '9710', 'laws philippines', 'law'], 'The Magna Carta of Women (RA 9710) is the Philippine law protecting women\'s rights and ending discrimination. Related laws include RA 11313 (Safe Spaces Act) and RA 9262 (violence against women and children).'],
  [['9262', 'vawc', 'domestic violence', 'abuse'], 'RA 9262 is the Philippine law against violence against women and their children. It allows protection orders, which you can ask about at your barangay (VAWC desk). If you\'re in danger now, call 911. See <a href="#help">Get help</a>.'],
  [['ally', 'allyship', 'how can i help', 'what can i do', 'support'], 'Be an ally by listening and believing people, speaking up calmly when you see unfair treatment, supporting the person affected, and checking your own habits, like who you interrupt or who you assume does which job.'],
  [['men', 'boys', 'hurt men', 'benefit men', 'masculinity'], 'Gender equality benefits men and boys too. It frees them from rules like "never show emotion," supports fathers who want to care for children, and is linked to healthier, safer communities for everyone.'],
  [['feminism', 'feminist'], 'Feminism is the belief in equal rights and opportunities for all genders, and the movements working toward that. People hold different views on how to get there, but the core idea is fairness.'],
  [['leader', 'leadership', 'politics', 'ceo', 'boss'], 'Women are still underrepresented in leadership and politics in most countries. Barriers include bias about "leadership style," fewer mentors, and care duties. Fair hiring, mentoring and flexible work help close the gap.'],
  [['care work', 'housework', 'chores', 'unpaid'], 'Unpaid care and housework still fall mostly on women worldwide. That leaves less time for school, paid work and rest. Sharing it more evenly at home is one of the most practical equality steps.'],
  [['education', 'school', 'girls education', 'girls school'], 'Education is a basic right for everyone. Girls can be held back by cost, early marriage, safety fears or old ideas about "who needs school." Equal access to schooling raises incomes and health for whole communities.'],
  [['online', 'cyber', 'social media', 'bullying'], 'Online abuse can be gender-based, like sexist harassment or threats. Don\'t reply, take screenshots, block and report the account, and tell someone you trust. See <a href="#help">Get help</a> for more.'],
  [['gender identity', 'lgbt', 'lgbtq', 'transgender', 'nonbinary', 'sogie'], 'Everyone deserves respect and safety no matter their gender identity or expression. Equality work includes challenging stereotypes about how any person "should" be. For legal protections where you live, check official sources or a legal aid office.'],
  [['report', 'discrimination', 'complain', 'where to go'], 'Write down what happened (date, place, who saw it), tell a trusted adult, teacher or HR, and ask about the official complaint process. Our <a href="#help">Get help</a> page gives steps for school, work, online and home.'],
  [['teach kids', 'children', 'parent', 'raise'], 'Children learn equality from what adults model. Offer all toys, jobs and feelings to every child, share chores fairly, call out stereotypes kindly, and praise effort and kindness, not gender-based traits.'],
  [['equalify', 'who made', 'about this site', 'group 5'], 'EQUALIFY is a student project by Group 5 that teaches about gender equality, helps people find next steps, and offers games to practice. Try the <a href="#play">games</a> or <a href="#learn">Learn</a> page.'],
  [['game', 'play', 'points', 'badge'], 'You can earn points and badges in the <a href="#play">Play</a> section. Log in from the top menu so your score is saved.']
];
const DANGER = ['kill myself', 'suicide', 'want to die', 'hurting me', 'hits me', 'beats me', 'raped', 'rape', 'forced me', 'in danger', 'abusing me'];
const norm = t => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function localAnswer(q) {
  const t = ' ' + norm(q) + ' ';
  if (DANGER.some(d => t.includes(' ' + d + ' ') || t.includes(d))) return 'I\'m really sorry this is happening. Your safety comes first. If you are in danger now, call 911. Please tell a trusted person near you. For safe next steps, see <a href="#help">Get help</a>. I\'m a website assistant and can\'t replace a real person who can support you.';
  if (/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q.toLowerCase())) return 'Hi! I\'m Equa. Ask me anything about gender equality, stereotypes, equal pay, laws in the Philippines, or how to be an ally.';
  let best = null, top = 0;
  for (const [keys, ans] of KB) {
    const s = keys.reduce((n, k) => n + (t.includes(' ' + k + ' ') || t.includes(k) ? k.split(' ').length : 0), 0);
    if (s > top) { top = s; best = ans; }
  }
  return best || 'I don\'t have a good answer for that yet. I know about gender equality basics, stereotypes, equal pay, harassment, Philippine laws, and being an ally. Try one of those, or open <a href="#help">Get help</a> if something happened to you.';
}
function setupAssistant() {
  const log = $('#ai-log'), input = $('#ai-input'), panel = $('#ai-panel'), fab = $('#ai-fab');
  const history = [];
  const say = (html, who) => {
    const b = h('div', { class: 'msg-b ' + who });
    if (who === 'bot') b.innerHTML = html; else b.textContent = html; /* bot text is written by us; user text stays plain */
    log.append(b); log.scrollTop = log.scrollHeight; return b;
  };
  const ask = async q => {
    q = q.trim(); if (!q) return;
    say(q, 'you'); input.value = ''; history.push({ role: 'user', content: q });
    let reply = null;
    if (AI_ENDPOINT) {
      const wait = say('Thinking...', 'bot');
      try {
        const r = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, history: history.slice(-8) }) });
        const d = await r.json(); if (d && d.reply) { wait.textContent = d.reply; reply = d.reply; }
      } catch { }
      if (!reply) { reply = localAnswer(q); wait.innerHTML = reply; }
    } else { reply = localAnswer(q); say(reply, 'bot'); }
    history.push({ role: 'assistant', content: reply });
  };
  const open = o => { panel.hidden = !o; fab.setAttribute('aria-expanded', o); if (o) input.focus(); };
  fab.onclick = () => open(panel.hidden);
  $('#ai-close').onclick = () => { open(false); fab.focus(); };
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { open(false); fab.focus(); } });
  $('#ai-form').addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  ['What is gender equality?', 'Equality vs equity', 'What is SDG 5?', 'How can I be an ally?', 'Where do I report discrimination?'].forEach(q => {
    const b = h('button', { type: 'button' }, q); b.onclick = () => ask(q); $('#ai-sugg').append(b);
  });
  say('Hi, I\'m Equa. Ask me about gender equality, stereotypes, equal pay, Philippine laws, or how to help.', 'bot');
}
setupAssistant();
