/* Blockwright — ชุดทดสอบแบบไม่ต้องเปิดเบราว์เซอร์
 *
 * โหลดไฟล์ใน src/ (ยกเว้น app.js ที่ต้องใช้ DOM) เข้าไปใน Node ตรง ๆ
 * แล้วเดินครบสายของจริง: เทมเพลต → บล็อก → โค้ด JavaScript → เอนจิน → เล่นจริง
 * โดยมีนักบินอัตโนมัติกดปุ่ม เลื่อนเมาส์ และคลิกแทนผู้เล่น
 *
 *   node test/run.mjs
 */
import { readFile } from 'node:fs/promises';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

const SRC = ['blocks', 'generators', 'engine', 'templates'];
const STAGE = { W: 480, H: 360 };

/* ---------- โหลด src/ เข้าสู่ขอบเขตจำลองของเบราว์เซอร์ ---------- */
const win = { javascript: { javascriptGenerator }, addEventListener() {} };
let rafCallback = null;
globalThis.window = win;
globalThis.requestAnimationFrame = (cb) => { rafCallback = cb; return 1; };
globalThis.cancelAnimationFrame = () => { rafCallback = null; };

for (const name of SRC) {
  const code = await readFile(new URL(`../src/${name}.js`, import.meta.url), 'utf8');
  new Function('window', 'Blockly', code)(win, Blockly);
}
const { TEMPLATES, createEngine } = win.Blockwright;

/* ---------- เครื่องมือช่วยทดสอบ ---------- */
const canvasStub = () => ({
  width: STAGE.W,
  height: STAGE.H,
  getContext: () => new Proxy({}, { get: (_, k) => (k === 'measureText' ? () => ({ width: 40 }) : () => {}) }),
  addEventListener() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: STAGE.W, height: STAGE.H }),
});

function compile(key) {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(TEMPLATES[key].build(), ws);
  const blocks = ws.getAllBlocks(false).length;
  const code = javascriptGenerator.workspaceToCode(ws);
  ws.dispose();
  return { blocks, code };
}

/* เทียบการบังคับที่ตรวจจับได้ กับที่ควรเป็น */
function checkControls(key, engine) {
  const want = CONTROLS[key];
  if (!want) return [`ยังไม่ได้ระบุการบังคับของ “${key}” ในตาราง CONTROLS`];
  const got = engine.controls();
  const gotKeys = Object.keys(got.keys || {}).sort().join(',');
  const wantKeys = want.keys.slice().sort().join(',');
  const out = [];
  if (gotKeys !== wantKeys) out.push(`ปุ่มที่ตรวจได้ [${gotKeys || '—'}] ไม่ตรงกับที่ควรเป็น [${wantKeys || '—'}]`);
  if (!!got.pointer !== want.pointer) out.push(`การบังคับด้วยเมาส์ตรวจได้ ${!!got.pointer} ควรเป็น ${want.pointer}`);
  if (!!got.tap !== want.tap) out.push(`การแตะบนเวทีตรวจได้ ${!!got.tap} ควรเป็น ${want.tap}`);
  return out;
}

function play(key, code, pilot, maxFrames) {
  const logs = [];
  let ended = null;
  const engine = createEngine(canvasStub(), {
    log: (m, level) => logs.push({ level: level || 'info', m }),
    ended: (result, score) => { ended = { result, score }; },
    restart() {},
  });
  const built = engine.build(code);
  const controlProblems = checkControls(key, engine);
  engine.start();
  const st = engine.state();
  let t = 0, frames = 0;
  while (rafCallback && frames < maxFrames) {
    frames++; t += 1000 / 60;
    pilot(st, frames);
    const cb = rafCallback; rafCallback = null;
    cb(t);
    if (!st.running) break;
  }
  return { built, logs, ended, frames, state: st, controlProblems };
}

const nearest = (from, list) =>
  list.slice().sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
const alive = (st, kind) => st.ents.filter((e) => e.kind === kind && !e.dead);

/* ---------- นักบินอัตโนมัติประจำเกม ---------- */
const PILOTS = {
  platformer(st) {
    const p = alive(st, 'ผู้เล่น')[0];
    st.keys = {};
    if (!p) return;
    const foe = nearest(p, alive(st, 'ศัตรู'));
    if (foe && Math.abs(foe.x - p.x) < 85 && Math.abs(foe.y - p.y) < 60) {
      st.keys[foe.x > p.x ? 'ArrowLeft' : 'ArrowRight'] = true;   // หนีศัตรูก่อน
      if (p.onGround) st.keyQueue.push('Space');
      return;
    }
    const coin = nearest(p, alive(st, 'เหรียญ'));
    if (!coin) return;
    st.keys['ArrowLeft'] = coin.x < p.x - 6;
    st.keys['ArrowRight'] = coin.x > p.x + 6;
    if (coin.y < p.y - 12 && p.onGround) st.keyQueue.push('Space');
  },
  shooter(st, f) {
    const ship = alive(st, 'ยาน')[0];
    const foe = alive(st, 'ศัตรู').sort((a, b) => b.y - a.y)[0];
    if (ship && foe) {
      st.keys['ArrowLeft'] = foe.x < ship.x - 6;
      st.keys['ArrowRight'] = foe.x > ship.x + 6;
    }
    if (f % 14 === 0) st.keyQueue.push('Space');
  },
  collector(st) {
    const cat = alive(st, 'แมว')[0];
    const apple = cat && nearest(cat, alive(st, 'แอปเปิล'));
    st.keys = {};
    if (!cat || !apple) return;
    st.keys['ArrowLeft'] = apple.x < cat.x - 4;
    st.keys['ArrowRight'] = apple.x > cat.x + 4;
    st.keys['ArrowUp'] = apple.y < cat.y - 4;
    st.keys['ArrowDown'] = apple.y > cat.y + 4;
  },
  breakout(st) {
    const ball = alive(st, 'ลูกบอล')[0];
    if (ball) st.mouse.x = ball.x;
  },
  clicker(st, f) {
    const target = alive(st, 'เป้า')[0];
    if (target && f % 12 === 0 && st.running) st.clickQueue.push({ x: target.x, y: target.y });
  },
  survivor(st, f) {
    const ship = alive(st, 'ยาน')[0];
    if (!ship) return;
    const foe = nearest(ship, alive(st, 'ศัตรู'));
    st.keys = {};
    if (foe) {
      st.mouse.x = foe.x; st.mouse.y = foe.y;          // เล็งด้วย "เมาส์"
      if (Math.hypot(foe.x - ship.x, foe.y - ship.y) < 110) {   // ใกล้ไปแล้ว ถอยหนี
        st.keys['ArrowLeft'] = foe.x > ship.x;
        st.keys['ArrowRight'] = foe.x < ship.x;
        st.keys['ArrowUp'] = foe.y > ship.y;
        st.keys['ArrowDown'] = foe.y < ship.y;
      }
    }
    if (f % 10 === 0 && st.running) st.clickQueue.push({ x: st.mouse.x, y: st.mouse.y });
  },
};

/* ---------- สิ่งที่แต่ละเกมต้องทำได้ ---------- */
/* การบังคับที่แต่ละเกมต้องใช้ หน้าจอสร้างปุ่มจากข้อมูลนี้
   ถ้าตารางนี้เพี้ยน ผู้เล่นบนมือถือจะได้ปุ่มผิดหรือไม่ได้ปุ่มเลย */
const CONTROLS = {
  platformer: { keys: ['ArrowLeft', 'ArrowRight', 'Space'], pointer: false, tap: false },
  shooter:    { keys: ['ArrowLeft', 'ArrowRight', 'Space'], pointer: false, tap: false },
  collector:  { keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], pointer: false, tap: false },
  breakout:   { keys: [], pointer: true, tap: false },
  clicker:    { keys: [], pointer: false, tap: true },
  survivor:   { keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], pointer: true, tap: true },
};

const EXPECT = {
  platformer: { frames: 3000, minScore: 10, survive: ['พื้น', 'แท่น'],
                note: 'กระโดดขึ้นแท่นเก็บเหรียญได้ และฉากต้องไม่ร่วงตามแรงโน้มถ่วง' },
  shooter:    { frames: 3000, minScore: 30, note: 'ยิงโดนศัตรูได้' },
  collector:  { frames: 2000, minScore: 40, win: true, note: 'เก็บแอปเปิลครบและชนะ' },
  breakout:   { frames: 3000, minScore: 30, note: 'รับลูกบอลและทุบอิฐได้' },
  clicker:    { frames: 1200, minScore: 5,  note: 'คลิกเป้าแล้วได้คะแนน' },
  survivor:   { frames: 2200, minScore: 60, survive: ['ทุ่นระเบิด'],
                note: 'เล็งด้วยเมาส์แล้วยิงโดนศัตรูได้' },
};

/* ---------- เดินทดสอบ ---------- */
let failed = 0;
console.log('Blockwright — ทดสอบเทมเพลตทั้งหมด\n');

for (const key of Object.keys(TEMPLATES)) {
  const want = EXPECT[key];
  const label = key.padEnd(11);
  let blocks, code;
  try {
    ({ blocks, code } = compile(key));
  } catch (err) {
    console.log(`✗ ${label} แปลงบล็อกเป็นโค้ดไม่ได้ — ${err.message}`);
    failed++; continue;
  }

  const run = play(key, code, PILOTS[key] || (() => {}), want.frames);
  const errors = run.logs.filter((l) => l.level === 'err');
  const score = run.state.score;
  const problems = [];

  if (!run.built) problems.push('เอนจินสร้างเกมจากโค้ดไม่สำเร็จ');
  for (const p of run.controlProblems) problems.push(p);
  if (errors.length) problems.push(`มีข้อผิดพลาดขณะเล่น ${errors.length} ครั้ง`);
  if (score < want.minScore) problems.push(`คะแนน ${score} ต่ำกว่าที่ควรได้ ${want.minScore} (${want.note})`);
  if (want.win && (!run.ended || run.ended.result !== 'win')) problems.push('เล่นจนจบแล้วไม่ชนะ');
  for (const kind of want.survive || []) {
    if (!alive(run.state, kind).length) problems.push(`“${kind}” หายไปจากเวทีทั้งที่ควรอยู่จนจบ`);
  }

  const mark = problems.length ? '✗' : '✓';
  const outcome = run.ended ? `จบ:${run.ended.result}` : 'ยังเล่นอยู่';
  console.log(`${mark} ${label} บล็อก ${String(blocks).padStart(3)} · โค้ด ${String(code.length).padStart(4)} ตัวอักษร · ` +
              `เล่น ${String(run.frames).padStart(4)} เฟรม · คะแนน ${String(score).padStart(3)} · ${outcome}`);
  for (const p of problems) console.log(`    ↳ ${p}`);
  for (const l of run.logs.filter((x) => x.level !== 'info').slice(0, 3)) console.log(`    · ${l.level}: ${l.m}`);
  if (problems.length) failed++;
}

/* ---------- เล่นด้วยปุ่มบนหน้าจอ ----------
   ไม่แตะ st.keys เลย ใช้ engine.press/release อย่างเดียว
   ซึ่งเป็นทางเดียวกับที่ปุ่มบังคับบนมือถือใช้ */
console.log('\nเล่นด้วยปุ่มบนหน้าจอ (ไม่ใช้คีย์บอร์ด)');
{
  const { code } = compile('platformer');
  const logs = [];
  const engine = createEngine(canvasStub(), { log: (m, l) => logs.push({ level: l || 'info', m }), ended() {}, restart() {} });
  engine.build(code);
  engine.start();
  const st = engine.state();
  const held = {};
  const hold = (k, want) => {
    if (want === !!held[k]) return;
    held[k] = want;
    if (want) engine.press(k); else engine.release(k);
  };
  let t = 0, frames = 0;
  while (rafCallback && frames < 3000) {
    frames++; t += 1000 / 60;
    const p = alive(st, 'ผู้เล่น')[0];
    if (p) {
      const foe = nearest(p, alive(st, 'ศัตรู'));
      const coin = nearest(p, alive(st, 'เหรียญ'));
      const flee = foe && Math.abs(foe.x - p.x) < 85 && Math.abs(foe.y - p.y) < 60;
      const goal = flee ? { x: foe.x > p.x ? 0 : 480, y: p.y } : coin;
      hold('ArrowLeft', !!goal && goal.x < p.x - 6);
      hold('ArrowRight', !!goal && goal.x > p.x + 6);
      if (p.onGround && (flee || (coin && coin.y < p.y - 12))) engine.press('Space');
      else engine.release('Space');
    }
    const cb = rafCallback; rafCallback = null;
    cb(t);
    if (!st.running) break;
  }
  const errors = logs.filter((l) => l.level === 'err');
  const ok = st.score >= 10 && !errors.length;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} platformer  กดปุ่มบนหน้าจอ ${frames} เฟรม · คะแนน ${st.score}` +
              (errors.length ? ` · ข้อผิดพลาด ${errors.length}` : ''));
  if (!ok && st.score < 10) console.log('    ↳ กดผ่านปุ่มบนหน้าจอแล้วทำคะแนนไม่ได้ ผู้เล่นบนมือถือจะเล่นเกมนี้ไม่ได้');
}

console.log(failed ? `\nไม่ผ่าน ${failed} รายการ` : '\nผ่านครบทุกรายการ');
process.exit(failed ? 1 : 0);
