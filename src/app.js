/* Blockwright — ประกอบหน้าจอ ปุ่ม กล่องโต้ตอบ และวงจรเล่น/หยุด
   ชุดเครื่องมือสร้างเกมด้วยการต่อบล็อก · สัญญาอนุญาต MIT */
(function (BW) {
  'use strict';

  var JS = BW.JS, TOOLBOX = BW.TOOLBOX;
  var createEngine = BW.createEngine, TEMPLATES = BW.TEMPLATES;

  /* =====================  ประกอบร่างแอป  ===================== */
  var $ = function(id){ return document.getElementById(id); };
  var ws = null, engine = null, loading = false, booted = false;
  var tPreview = 0, tSave = 0, tToast = 0;
  var AUTOKEY = 'blockwright.autosave.v1';
  var SLOTKEY = 'blockwright.slot.v1';

  function isDark(){
    var t = document.documentElement.getAttribute('data-theme');
    if(t === 'dark') return true;
    if(t === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  var THEMES = {};
  function themeFor(dark){
    var key = dark ? 'dark' : 'light';
    if(THEMES[key]) return THEMES[key];
    var t = null;
    try{
      t = Blockly.Theme.defineTheme('studio_' + key, {
        base: Blockly.Themes.Zelos,
        startHats: true,
        componentStyles:{
          workspaceBackgroundColour: dark ? '#10131a' : '#eef1f7',
          toolboxBackgroundColour:   dark ? '#161a22' : '#ffffff',
          toolboxForegroundColour:   dark ? '#dfe3ef' : '#20242f',
          flyoutBackgroundColour:    dark ? '#1c212b' : '#f5f7fb',
          flyoutForegroundColour:    dark ? '#a3aabd' : '#5a6076',
          flyoutOpacity: 1,
          scrollbarColour:           dark ? '#3a4254' : '#c3c9d6',
          scrollbarOpacity: 0.7,
          insertionMarkerColour:     dark ? '#ffffff' : '#101320',
          insertionMarkerOpacity: 0.35,
          markerColour:              dark ? '#9b8dff' : '#4a3ad1',
          cursorColour:              dark ? '#9b8dff' : '#4a3ad1'
        },
        fontStyle:{ family:'"IBM Plex Sans Thai", system-ui, sans-serif', weight:'500', size:11 }
      });
    }catch(err){ t = null; }
    THEMES[key] = t;
    return t;
  }
  function applyTheme(){
    if(!ws) return;
    var t = themeFor(isDark());
    if(t){ try{ ws.setTheme(t); }catch(err){} }
    try{
      var lines = document.querySelectorAll('.blocklyGridPattern line');
      for(var i = 0; i < lines.length; i++) lines[i].setAttribute('stroke', isDark() ? '#262c3b' : '#d7dce7');
    }catch(err){}
  }

  /* ---------- บันทึกข้อความลงกล่องข้อความ ---------- */
  function log(msg, lvl){
    var box = $('log');
    var line = document.createElement('div');
    if(lvl) line.className = lvl;
    line.textContent = msg;
    box.appendChild(line);
    while(box.childNodes.length > 60) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }
  function toast(msg){
    var el = document.querySelector('.toast');
    if(!el){ el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    clearTimeout(tToast);
    tToast = setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 2200);
  }
  function copyText(text, okMsg){
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); toast(okMsg); }
      catch(e){ toast('คัดลอกอัตโนมัติไม่ได้ — เลือกข้อความในกล่องแล้วกดคัดลอกเอง'); }
      document.body.removeChild(ta);
    }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){ toast(okMsg); }, fallback);
      } else fallback();
    }catch(e){ fallback(); }
  }

  /* ---------- กล่องถามชื่อ ใช้แทน prompt/confirm ของเบราว์เซอร์ ---------- */
  var askCb = null, askKind = 'text';
  function askOpen(kind, message, dflt, cb){
    askKind = kind; askCb = cb;
    $('askMsg').textContent = message;
    var inp = $('askInput');
    inp.hidden = (kind !== 'text');
    inp.value = dflt == null ? '' : String(dflt);
    $('askCancel').hidden = (kind === 'alert');
    $('ask').hidden = false;
    setTimeout(function(){
      if(kind === 'text'){ inp.focus(); inp.select(); } else $('askOk').focus();
    }, 20);
  }
  function askClose(ok){
    if($('ask').hidden) return;
    $('ask').hidden = true;
    var cb = askCb; askCb = null;
    if(!cb) return;
    if(askKind === 'text') cb(ok ? $('askInput').value : null);
    else cb(ok);
  }
  function askText(message, dflt, cb){ askOpen('text', message, dflt, cb); }

  /* ---------- โค้ดจากบล็อก ---------- */
  function codeOf(){
    try{ return trimDeclarations(JS.workspaceToCode(ws)); }
    catch(err){ log('แปลงบล็อกเป็นโค้ดไม่สำเร็จ — ' + err.message, 'err'); return ''; }
  }
  /* Blockly ประกาศตัวแปรทุกตัวไว้บรรทัดแรก รวมถึงชื่อตัวละครที่ไม่ได้ใช้เป็นตัวแปรจริง
     จึงตัดชื่อที่ไม่ถูกอ้างถึงที่ไหนเลยออก ให้แท็บโค้ดอ่านง่าย */
  function trimDeclarations(code){
    var m = /^var ([^;\n]+);\n/.exec(code);
    if(!m) return code;
    var rest = code.slice(m[0].length);
    var kept = m[1].split(',').map(function(x){ return x.trim(); }).filter(function(nm){
      if(!nm) return false;
      var esc = nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp('(^|[^A-Za-z0-9_$])' + esc + '([^A-Za-z0-9_$]|$)').test(rest);
    });
    return (kept.length ? 'var ' + kept.join(', ') + ';\n' : '') + rest;
  }
  function refreshCode(){
    var c = codeOf();
    $('viewCode').textContent = c.trim() ? c : '// ยังไม่มีบล็อกในลานต่อบล็อก';
    return c;
  }
  function refreshSprites(){
    var host = $('viewSprites');
    host.innerHTML = '';
    var st = engine ? engine.state() : null;
    var defs = st ? st.defs : {};
    var names = Object.keys(defs);
    var declared = 0;
    try{ declared = ws.getVariableMap().getVariablesOfType('Sprite').length; }catch(err){}
    if(!names.length && !declared){
      var p = document.createElement('div');
      p.className = 'empty';
      p.textContent = 'ยังไม่มีตัวละคร — กด ➕ ชื่อตัวละคร แล้ววางบล็อก “สร้างตัวละคร” ในบล็อกเริ่มเกม';
      host.appendChild(p); return;
    }
    var pending = [];
    try{
      ws.getVariableMap().getVariablesOfType('Sprite').forEach(function(v){
        var nm = v.getName ? v.getName() : v.name;
        if(names.indexOf(nm) < 0) pending.push(nm);
      });
    }catch(err){}
    names.forEach(function(name){
      var d = defs[name], n = 0, i;
      for(i = 0; i < st.ents.length; i++) if(st.ents[i].kind === name && !st.ents[i].dead) n++;
      var row = document.createElement('div'); row.className = 'sprow';
      var g = document.createElement('span'); g.className = 'glyph';
      if(d.look === 'RECT' || d.look === 'CIRC'){
        g.textContent = '';
        g.style.cssText += 'background:' + d.color + ';height:16px;border-radius:' + (d.look === 'CIRC' ? '50%' : '3px') + ';display:inline-block';
      } else g.textContent = d.look;
      var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = name;
      var meta = document.createElement('span'); meta.className = 'meta';
      meta.textContent = Math.round(d.w) + '×' + Math.round(d.h) + '  ·  ' + n + ' ตัว';
      row.appendChild(g); row.appendChild(nm); row.appendChild(meta);
      host.appendChild(row);
    });
    pending.forEach(function(name){
      var row = document.createElement('div'); row.className = 'sprow pending';
      var g = document.createElement('span'); g.className = 'glyph'; g.textContent = '○';
      var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = name;
      var meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = 'ตั้งชื่อไว้ ยังไม่ได้สร้าง';
      row.appendChild(g); row.appendChild(nm); row.appendChild(meta);
      host.appendChild(row);
    });
  }

  /* ---------- เล่น / หยุด ---------- */
  function setRunning(on){
    $('btnRun').disabled = on;
    $('btnStop').disabled = !on;
  }
  function hideOverlay(){ $('overlay').hidden = true; }
  function run(){
    hideOverlay();
    $('log').innerHTML = '';
    var code = refreshCode();
    if(!code.trim()){ log('ยังไม่มีบล็อก — ลองเลือกเกมตัวอย่างจากเมนูด้านบน', 'warn'); return; }
    if(!engine.build(code)){ setRunning(false); return; }
    engine.start();
    setRunning(true);
    log('เริ่มเล่นแล้ว', 'ok');
    refreshSprites();
    showView('stage');
  }
  function stop(){
    engine.stop();
    setRunning(false);
    hideOverlay();
    refreshSprites();
  }
  function preview(){
    if(engine.isRunning()) return;
    var code = refreshCode();
    engine.build(code);
    refreshSprites();
  }
  function schedulePreview(){ clearTimeout(tPreview); tPreview = setTimeout(preview, 450); }

  /* ---------- เก็บโปรเจกต์ ---------- */
  function projectJSON(){
    try{ return JSON.stringify(Blockly.serialization.workspaces.save(ws)); }
    catch(err){ return '{}'; }
  }
  function loadProject(obj){
    loading = true;
    try{
      Blockly.serialization.workspaces.load(obj, ws);
    }catch(err){
      log('โหลดโปรเจกต์ไม่สำเร็จ — ' + err.message, 'err');
    }
    loading = false;
    preview();
  }
  function autosave(){
    try{ localStorage.setItem(AUTOKEY, projectJSON()); }catch(err){}
  }
  function scheduleAutosave(){ clearTimeout(tSave); tSave = setTimeout(autosave, 900); }

  /* ---------- ส่งออกเป็นไฟล์เกมเดี่ยว ---------- */
  function standaloneHTML(){
    var code = codeOf();
    var parts = [];
    parts.push('<!doctype html><html lang="th"><head><meta charset="utf-8">');
    parts.push('<meta name="viewport" content="width=device-width,initial-scale=1">');
    parts.push('<title>เกมของฉัน</title><style>');
    parts.push('html,body{height:100%;margin:0;background:#0c0e14;display:grid;place-items:center;');
    parts.push('font-family:system-ui,sans-serif;color:#e8eaf2}');
    parts.push('canvas{width:min(96vw,720px);aspect-ratio:4/3;image-rendering:auto;border-radius:10px;');
    parts.push('box-shadow:0 20px 60px -20px #000;touch-action:none}');
    parts.push('p{font-size:13px;color:#8b91a6;margin:12px}');
    parts.push('</style></head><body>');
    parts.push('<div><canvas id="cv" width="480" height="360"></canvas>');
    parts.push('<p>คลิกที่เวทีหนึ่งครั้งก่อน แล้วใช้ปุ่มลูกศรหรือเมาส์เล่นได้เลย<br>สร้างด้วย Blockwright</p></div>');
    parts.push('<scr' + 'ipt>');
    parts.push(createEngine.toString());
    parts.push('\nvar CODE = ' + JSON.stringify(code) + ';');
    parts.push('\nvar g = createEngine(document.getElementById("cv"), { log:function(m){ console.log(m); },');
    parts.push(' ended:function(r,s){ alert(r === "win" ? "ชนะ! คะแนน " + s : "แพ้ คะแนน " + s); },');
    parts.push(' restart:function(){ g.build(CODE); g.start(); } });');
    parts.push('\ng.build(CODE); g.start();');
    parts.push('\n</scr' + 'ipt></body></html>');
    return parts.join('');
  }

  /* ---------- แผ่นข้อมูล (คู่มือ / โปรเจกต์ / ลิขสิทธิ์) ---------- */
  function openSheet(title, html, after){
    $('sheetTitle').textContent = title;
    $('sheetBody').innerHTML = html;
    $('sheet').hidden = false;
    if(after) after();
    $('sheetClose').focus();
  }
  function closeSheet(){ $('sheet').hidden = true; }

  var HELP_HTML =
    '<p>ต่อบล็อกทางซ้าย แล้วกด <b>▶ เล่น</b> เพื่อทดสอบทันที เวทีมีขนาด 480 × 360 จุด โดย x เพิ่มไปทางขวา และ y เพิ่มลงล่าง</p>' +
    '<h3>ลำดับที่แนะนำ</h3>' +
    '<ul>' +
    '<li>เริ่มจากบล็อก <code>🎬 เมื่อเริ่มเกม</code> แล้ววางบล็อกสร้างฉากกับตัวละครไว้ข้างใน</li>' +
    '<li>ตั้ง <code>แรงโน้มถ่วง</code> เป็น 0 สำหรับเกมมองจากด้านบน หรือประมาณ 1400 สำหรับเกมแนวข้าง</li>' +
    '<li>การเคลื่อนที่ด้วยปุ่มค้าง ให้วาง <code>ให้ … เดินด้วย …</code> ไว้ในบล็อก <code>🔁 ทำซ้ำทุกเฟรม</code></li>' +
    '<li>สิ่งที่ทำครั้งเดียวต่อการกด เช่น กระโดดหรือยิง ให้ใช้บล็อก <code>⌨️ เมื่อกดปุ่ม</code></li>' +
    '</ul>' +
    '<h3>เรื่องชื่อตัวละคร</h3>' +
    '<p>ช่องชื่อในบล็อกเป็นรายการให้เลือก ไม่ต้องพิมพ์เอง จึงไม่มีทางสะกดผิด วิธีเพิ่มชื่อใหม่คือกดปุ่ม <b>➕ ชื่อตัวละคร</b> เหนือลานบล็อก ตั้งชื่อครั้งเดียวแล้วชื่อนั้นจะโผล่ในทุกบล็อกที่ต้องใช้</p>' +
    '<p>ถ้าอยากเปลี่ยนชื่อทีหลัง ให้กดที่ช่องชื่อในบล็อกไหนก็ได้ แล้วเลือก <b>เปลี่ยนชื่อ</b> ระบบจะแก้ให้พร้อมกันทุกบล็อกที่ใช้ชื่อนั้น ส่วน <b>ลบชื่อ</b> จะเอาชื่อออกจากรายการ</p>' +
    '<p>ตัวละครที่ชื่อเหมือนกันถือเป็นกลุ่มเดียวกัน บล็อกอย่าง <code>ตั้ง … ของ …</code> จึงมีผลกับทุกตัวในกลุ่มนั้น ส่วนคำว่า <b>ตัวนี้</b> ใช้ได้เฉพาะในบล็อก “เมื่อชน”, “เมื่อคลิก”, “เมื่อถึงขอบ” และ “ทำกับ … ทุกตัว” ซึ่งหมายถึงตัวละครทีละตัว แท็บ <b>ตัวละคร</b> แสดงทั้งตัวที่สร้างแล้วและชื่อที่ตั้งไว้แต่ยังไม่ได้สร้าง</p>' +
    '<h3>พื้นและแท่นยืน</h3>' +
    '<p>ใช้ <code>ให้ … ยืนบน … ได้</code> เพื่อให้ชนแล้วหยุด และบล็อก <code>ให้ … กระโดด</code> จะทำงานเมื่อยืนอยู่บนพื้นเท่านั้น ส่วน <code>ให้ … หยุดที่ขอบ</code> กันตัวละครหลุดออกนอกเวที</p>' +
    '<p>แรงโน้มถ่วงดึงทุกตัวละครรวมถึงพื้นเอง ฉากที่ต้องอยู่นิ่ง ๆ อย่างพื้น แท่น และเหรียญลอย จึงต้องใส่บล็อก <code>📌 ตรึงไว้กับที่</code> ไม่งั้นจะร่วงหายไปทั้งฉาก ตัวที่ถูกตรึงยังตั้งความเร็วให้เลื่อนเองได้ ใช้ทำแท่นเลื่อนได้สบาย</p>' +
    '<h3>เล็งและยิง</h3>' +
    '<p>มุมหมุน 0 องศาคือชี้ไปทางขวา แล้วเพิ่มตามเข็มนาฬิกา บล็อก <code>🧭 หัน … ไปทางเมาส์</code> ปรับมุมให้เอง ส่วน <code>🔫 ยิง … ออกจาก …</code> จะสร้างกระสุนที่ตัวผู้ยิงแล้วพุ่งไปตามมุมนั้น ใช้สองบล็อกนี้คู่กันก็ได้เกมเล็งด้วยเมาส์แล้ว ลองดูเกมตัวอย่าง “เอาตัวรอด”</p>' +
    '<h3>เมื่อเกมไม่เป็นอย่างที่คิด</h3>' +
    '<p>กล่องบันทึกใต้เวทีจะบอกชื่อตัวละครที่พิมพ์ผิดและข้อผิดพลาดขณะเล่น ส่วนแท็บ <b>โค้ด</b> แสดง JavaScript ที่บล็อกแปลงออกมา ใช้ตรวจสอบหรือเรียนรู้ต่อได้</p>';

  var ABOUT_HTML =
    '<h3>ที่มาของชื่อ</h3>' +
    '<p>คำว่า <i>wright</i> ในภาษาอังกฤษแปลว่าช่างผู้สร้าง อยู่ตระกูลเดียวกับ shipwright และ playwright <b>Blockwright</b> จึงหมายถึงช่างผู้ก่อสิ่งต่าง ๆ ขึ้นจากบล็อก ตรงกับสามจังหวะการใช้งาน คือ เรียง · ต่อ · ก่อ</p>' +
    '<h3>ส่วนประกอบ</h3>' +
    '<p>Blockwright ประกอบขึ้นจากซอฟต์แวร์โอเพนซอร์สที่อนุญาตให้นำไปใช้และดัดแปลงเชิงพาณิชย์ได้ โดยต้องคงประกาศลิขสิทธิ์ไว้</p>' +
    '<table class="lic"><thead><tr><th>ส่วนประกอบ</th><th>บทบาท</th><th>สัญญาอนุญาต</th></tr></thead><tbody>' +
    '<tr><td>Blockly 13.3.0 (Google)</td><td>ตัวแก้ไขแบบบล็อกและตัวแปลงเป็น JavaScript</td><td>Apache-2.0</td></tr>' +
    '<tr><td>ไอคอนชุด media ของ Blockly</td><td>ถังขยะและลูกศรในกล่องเครื่องมือ</td><td>Apache-2.0</td></tr>' +
    '<tr><td>IBM Plex Sans Thai / IBM Plex Mono</td><td>แบบอักษรเนื้อหาและโค้ด</td><td>SIL OFL 1.1</td></tr>' +
    '<tr><td>Chakra Petch (Cadson Demak)</td><td>แบบอักษรหัวข้อ</td><td>SIL OFL 1.1</td></tr>' +
    '<tr><td>ชุดบล็อกภาษาไทยและเอนจินเกมของ Blockwright</td><td>ตรรกะเกม ฟิสิกส์ การวาดภาพ เสียง</td><td>เขียนขึ้นใหม่</td></tr>' +
    '</tbody></table>' +
    '<h3>ข้อความสัญญาอนุญาตของ Blockly</h3>' +
    '<p>สำเนาฉบับเต็มอยู่ที่ <code>blockly-media/LICENSE.txt</code> ซึ่งแนบมากับหน้านี้ · Copyright Google LLC, Apache License 2.0</p>' +
    '<h3>ถ้าจะขยายต่อเป็นระบบจริง</h3>' +
    '<ul>' +
    '<li><b>Blockly</b> (Apache-2.0) — เหมาะที่สุดเมื่อต้องการออกแบบชุดบล็อกเองทั้งหมด เหมือนที่ทำในหน้านี้</li>' +
    '<li><b>scratch-blocks</b> (BSD-3-Clause) — หน้าตาแบบ Scratch ที่เด็กคุ้นเคย แต่ผูกกับรูปแบบของ Scratch มากกว่า</li>' +
    '<li><b>MakeCode Arcade</b> (MIT) — ระบบสร้างเกมแบบบล็อกที่ครบตั้งแต่ต้นจนจบ นำไปติดตั้งเองได้</li>' +
    '<li><b>GDevelop</b> (MIT) — เอนจินเกมแบบไม่ต้องเขียนโค้ด ใช้ระบบเหตุการณ์แทนบล็อก</li>' +
    '<li><b>Phaser</b> (MIT) หรือ <b>KAPLAY</b> (MIT) — ใช้แทนเอนจินในไฟล์นี้ เมื่อต้องการฟิสิกส์ แอนิเมชัน และระบบฉากที่สมบูรณ์กว่า</li>' +
    '</ul>';

  function projectHTML(){
    return '<p>โปรเจกต์คือรายการบล็อกทั้งหมดในรูปแบบ JSON คัดลอกเก็บไว้ หรือวางของเดิมกลับเข้ามาก็ได้</p>' +
      '<textarea class="io" id="ioBox" spellcheck="false"></textarea>' +
      '<div class="rowbtns">' +
      '<button class="btn primary" type="button" id="pCopy">คัดลอกโปรเจกต์</button>' +
      '<button class="btn" type="button" id="pLoad">โหลดจากช่องนี้</button>' +
      '<button class="btn" type="button" id="pSave">บันทึกในเครื่อง</button>' +
      '<button class="btn" type="button" id="pOpen">เปิดที่บันทึกไว้</button>' +
      '</div>' +
      '<h3>ส่งออกเป็นเกมเดี่ยว</h3>' +
      '<p>คัดลอกไฟล์ HTML ที่เล่นได้ด้วยตัวเอง ไม่ต้องพึ่งหน้านี้ นำไปวางในโปรแกรมแก้ไขข้อความแล้วบันทึกเป็นไฟล์ <code>.html</code></p>' +
      '<div class="rowbtns"><button class="btn" type="button" id="pExport">คัดลอกไฟล์เกม HTML</button></div>';
  }
  function wireProject(){
    $('ioBox').value = projectJSON();
    $('pCopy').onclick = function(){ copyText($('ioBox').value, 'คัดลอกโปรเจกต์แล้ว'); };
    $('pLoad').onclick = function(){
      try{ loadProject(JSON.parse($('ioBox').value)); closeSheet(); toast('โหลดโปรเจกต์แล้ว'); }
      catch(err){ toast('ข้อความใน JSON ไม่ถูกต้อง'); }
    };
    $('pSave').onclick = function(){
      try{ localStorage.setItem(SLOTKEY, projectJSON()); toast('บันทึกในเครื่องแล้ว'); }
      catch(err){ toast('บันทึกไม่ได้ — เบราว์เซอร์ปิดการเก็บข้อมูลไว้'); }
    };
    $('pOpen').onclick = function(){
      var raw = null;
      try{ raw = localStorage.getItem(SLOTKEY); }catch(err){}
      if(!raw){ toast('ยังไม่มีโปรเจกต์ที่บันทึกไว้'); return; }
      try{ loadProject(JSON.parse(raw)); closeSheet(); toast('เปิดโปรเจกต์ที่บันทึกไว้แล้ว'); }
      catch(err){ toast('ไฟล์ที่บันทึกไว้เสียหาย'); }
    };
    $('pExport').onclick = function(){ copyText(standaloneHTML(), 'คัดลอกไฟล์เกมแล้ว — วางในโปรแกรมแก้ไขข้อความ บันทึกเป็น .html'); };
  }

  /* ---------- แท็บและมุมมอง ---------- */
  function showView(which){
    $('work').setAttribute('data-view', which);
    $('vtBlocks').setAttribute('aria-pressed', String(which === 'blocks'));
    $('vtStage').setAttribute('aria-pressed', String(which === 'stage'));
    if(ws) setTimeout(function(){ Blockly.svgResize(ws); }, 30);
  }
  function showTab(which){
    var map = { play:'viewPlay', sprites:'viewSprites', code:'viewCode' };
    var tabs = { play:'tabPlay', sprites:'tabSprites', code:'tabCode' };
    for(var k in map){
      $(map[k]).hidden = (k !== which);
      $(tabs[k]).setAttribute('aria-selected', String(k === which));
    }
    if(which === 'code') refreshCode();
    if(which === 'sprites') refreshSprites();
  }

  /* ---------- เริ่มต้น ---------- */
  function newSpriteName(){
    askText('ตั้งชื่อตัวละครใหม่', '', function(name){
      if(name == null) return;
      name = String(name).trim();
      if(!name){ toast('ต้องใส่ชื่อก่อน'); return; }
      var map = ws.getVariableMap();
      if(map.getVariable(name, 'Sprite')){ toast('มีตัวละครชื่อ “' + name + '” อยู่แล้ว'); return; }
      map.createVariable(name, 'Sprite');
      try{ ws.refreshToolboxSelection(); }catch(err){}
      scheduleAutosave();
      refreshSprites();
      toast('เพิ่มชื่อ “' + name + '” แล้ว เลือกได้จากช่องชื่อในบล็อก');
    });
  }

  function init(data){
    /* artifact ไม่รองรับ prompt/confirm/alert ของเบราว์เซอร์ จึงต่อกล่องของหน้าเองเข้าไปแทน */
    try{
      Blockly.dialog.setPrompt(function(message, dflt, cb){ askOpen('text', message, dflt, cb); });
      Blockly.dialog.setConfirm(function(message, cb){ askOpen('confirm', message, '', cb); });
      Blockly.dialog.setAlert(function(message, cb){ askOpen('alert', message, '', function(){ if(cb) cb(); }); });
    }catch(err){}
    /* ถ้อยคำกลาง ๆ ให้ใช้ได้ทั้งกับชื่อตัวละครและตัวแปรทั่วไป */
    Blockly.Msg['RENAME_VARIABLE'] = 'เปลี่ยนชื่อ “%1”';
    Blockly.Msg['DELETE_VARIABLE'] = 'ลบชื่อ “%1”';
    Blockly.Msg['RENAME_VARIABLE_TITLE'] = 'เปลี่ยนชื่อ “%1” ทุกที่ที่ใช้ เป็น:';

    engine = createEngine($('cv'), {
      log: log,
      ended: function(result, score){
        setRunning(false);
        $('ovTitle').textContent = result === 'win' ? '🏆 ชนะแล้ว!' : '💀 แพ้แล้ว';
        $('ovText').textContent = 'คะแนนรวม ' + score;
        $('overlay').hidden = false;
        log(result === 'win' ? 'จบเกม: ชนะ คะแนน ' + score : 'จบเกม: แพ้ คะแนน ' + score, result === 'win' ? 'ok' : 'warn');
      },
      restart: function(){ setTimeout(run, 0); }
    });

    var opts = {
      toolbox: TOOLBOX,
      renderer: 'zelos',
      media: 'vendor/blockly-media/',
      sounds: false,
      comments: false,
      trashcan: true,
      grid: { spacing:28, length:3, colour: isDark() ? '#262c3b' : '#d7dce7', snap:true },
      zoom: { controls:true, wheel:true, startScale:0.8, minScale:0.35, maxScale:1.8 },
      move: { scrollbars:true, drag:true, wheel:false }
    };
    var theme0 = themeFor(isDark());
    if(theme0) opts.theme = theme0;
    ws = Blockly.inject('blocklyDiv', opts);

    ws.addChangeListener(function(ev){
      if(loading || (ev && ev.isUiEvent)) return;
      scheduleAutosave();
      schedulePreview();
    });

    /* เมนูเกมตัวอย่าง */
    var sel = $('tplPicker');
    Object.keys(TEMPLATES).forEach(function(k){
      var o = document.createElement('option');
      o.value = k; o.textContent = TEMPLATES[k].label;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function(){
      var k = sel.value;
      if(!k) return;
      stop();
      loadProject(TEMPLATES[k].build());
      $('log').innerHTML = '';
      log('โหลด “' + TEMPLATES[k].label + '” แล้ว — กด ▶ เล่น ได้เลย', 'ok');
      sel.value = '';
    });

    $('btnRun').onclick = run;
    $('btnStop').onclick = stop;
    $('ovBtn').onclick = run;
    $('btnClearLog').onclick = function(){ $('log').innerHTML = ''; };
    $('btnUndo').onclick = function(){ ws.undo(false); };
    $('btnRedo').onclick = function(){ ws.undo(true); };
    $('btnTidy').onclick = function(){ try{ ws.cleanUp(); }catch(err){} };
    $('btnNewSprite').onclick = newSpriteName;
    $('askOk').onclick = function(){ askClose(true); };
    $('askCancel').onclick = function(){ askClose(false); };
    $('askInput').addEventListener('keydown', function(ev){
      if(ev.key === 'Enter'){ ev.preventDefault(); askClose(true); }
      else if(ev.key === 'Escape'){ ev.preventDefault(); askClose(false); }
    });
    $('ask').addEventListener('click', function(ev){ if(ev.target === $('ask')) askClose(false); });
    $('btnClear').onclick = function(){
      stop();
      loading = true; ws.clear(); loading = false;
      preview(); toast('ล้างบล็อกทั้งหมดแล้ว');
    };
    $('btnHelp').onclick = function(){ openSheet('คู่มือใช้งาน', HELP_HTML); };
    $('btnAbout').onclick = function(){ openSheet('ที่มาและสัญญาอนุญาต', ABOUT_HTML); };
    $('btnProject').onclick = function(){ openSheet('โปรเจกต์ของฉัน', projectHTML(), wireProject); };
    $('sheetClose').onclick = closeSheet;
    $('sheet').addEventListener('click', function(ev){ if(ev.target === $('sheet')) closeSheet(); });
    document.addEventListener('keydown', function(ev){
      if(ev.key !== 'Escape') return;
      if(!$('ask').hidden) askClose(false);
      else if(!$('sheet').hidden) closeSheet();
    });

    $('tabPlay').onclick = function(){ showTab('play'); };
    $('tabSprites').onclick = function(){ showTab('sprites'); };
    $('tabCode').onclick = function(){ showTab('code'); };
    $('vtBlocks').onclick = function(){ showView('blocks'); };
    $('vtStage').onclick = function(){ showView('stage'); };

    window.addEventListener('resize', function(){ if(ws) Blockly.svgResize(ws); });
    if(window.matchMedia){
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if(mq.addEventListener) mq.addEventListener('change', applyTheme);
    }
    try{
      new MutationObserver(applyTheme).observe(document.documentElement,
        { attributes:true, attributeFilter:['data-theme'] });
    }catch(err){}

    /* โหลดงานล่าสุด หรือเกมตัวอย่างเริ่มต้น */
    var startDoc = null;
    if(data && data.ws) startDoc = data.ws;
    if(!startDoc){
      try{
        var raw = localStorage.getItem(AUTOKEY);
        if(raw) startDoc = JSON.parse(raw);
      }catch(err){ startDoc = null; }
    }
    if(!startDoc) startDoc = TEMPLATES.platformer.build();
    loadProject(startDoc);

    setRunning(false);
    showTab('play');
    showView(window.innerWidth <= 920 ? 'blocks' : 'blocks');
    log('Blockwright พร้อมใช้งาน — เวทีคือภาพตอนเริ่มเกม กด ▶ เล่น เพื่อเริ่ม', 'ok');

    var hot = window.claude && window.claude.hot;
    if(hot && typeof hot.snapshot === 'function'){
      try{ hot.snapshot(function(){ return { ws: Blockly.serialization.workspaces.save(ws) }; }); }catch(err){}
    }
  }

  function boot(data){ if(booted) return; booted = true; init(data || {}); }
  var hotHook = window.claude && window.claude.hot;
  if(hotHook && typeof hotHook.ready === 'function'){
    try{ hotHook.ready(boot); }catch(err){ boot({}); }
    setTimeout(function(){ boot({}); }, 1500);
  } else {
    boot((hotHook && hotHook.data) || {});
  }
})(window.Blockwright = window.Blockwright || {});
