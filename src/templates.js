/* Blockwright — เกมตัวอย่างห้าแนว เขียนเป็นโครงสร้างบล็อกของ Blockly
   ชุดเครื่องมือสร้างเกมด้วยการต่อบล็อก · สัญญาอนุญาต MIT */
(function (BW) {
  'use strict';

  /* =====================  เกมตัวอย่าง  ===================== */
  function B(type, fields, inputs){
    var o = { type:type };
    if(fields) o.fields = fields;
    if(inputs){ o.inputs = {}; for(var k in inputs) o.inputs[k] = { block:inputs[k] }; }
    return o;
  }
  function N(v){ return { type:'math_number', fields:{ NUM:v } }; }
  function TXT(s){ return { type:'text', fields:{ TEXT:s } }; }
  function RND(a, b){ return B('math_random_int', null, { FROM:N(a), TO:N(b) }); }
  function CMP(op, a, b){ return B('logic_compare', { OP:op }, { A:a, B:b }); }
  function MATH(op, a, b){ return B('math_arithmetic', { OP:op }, { A:a, B:b }); }
  function IF(cond, body){ return B('controls_if', null, { IF0:cond, DO0:seq(body) }); }
  function REPEAT(times, body){ return B('controls_repeat_ext', null, { TIMES:N(times), DO:seq(body) }); }
  function seq(arr){
    arr = arr.filter(Boolean);
    for(var i = arr.length - 1; i > 0; i--) arr[i - 1].next = { block:arr[i] };
    return arr[0];
  }
  function SETUP(body){ return B('game_setup', null, { DO:seq(body) }); }
  function TICK(body){ return B('on_tick', null, { DO:seq(body) }); }
  function KEY(k, body){ return B('on_key', { K:k }, { DO:seq(body) }); }
  function HIT(a, b, body){ return B('on_collide', { A:a, B:b }, { DO:seq(body) }); }
  function EVERY(sec, body){ return B('on_every', null, { SEC:N(sec), DO:seq(body) }); }
  function CLICK(name, body){ return B('on_click', { NAME:name }, { DO:seq(body) }); }
  function TIMEOUT(body){ return B('on_timeout', null, { DO:seq(body) }); }
  function EDGEOF(name, body){ return B('on_edge', { NAME:name }, { DO:seq(body) }); }
  function GET(prop, name){ return B('sprite_get', { PROP:prop, NAME:name }); }
  function ME(prop){ return B('me_get', { PROP:prop }); }
  function COUNT(name){ return B('sprite_count', { NAME:name }); }
  function SND(s){ return B('play_sound', { S:s }); }
  function SPAWN(name, x, y){ return B('sprite_spawn', { NAME:name }, { X:N(x), Y:N(y) }); }
  function SET(prop, name, v){ return B('sprite_set', { PROP:prop, NAME:name }, { V:v }); }
  /* ช่องที่เก็บชื่อตัวละคร ใช้ตอนแปลงเทมเพลตให้อ้างถึงตัวแปรชนิด Sprite */
  var SPRITE_FIELDS = {
    sprite_create:['NAME'], sprite_define:['NAME'], sprite_spawn:['NAME'], sprite_color:['NAME'],
    sprite_size:['NAME'], sprite_goto:['NAME'], sprite_move:['NAME'], sprite_set:['NAME'],
    sprite_get:['NAME'], sprite_count:['NAME'], sprite_each:['NAME'], sprite_removeall:['NAME'],
    on_click:['NAME'], ctrl_move:['NAME'], ctrl_jump:['NAME'], ctrl_follow:['NAME','TARGET'],
    on_collide:['A','B'], on_edge:['NAME'], set_edge:['NAME'], set_solid:['A','B'], touching:['A','B']
  };
  var VARREG = {}, VARSEQ = 0;
  function SV(name){
    if(!VARREG[name]){ VARSEQ++; VARREG[name] = 'spriteVar' + ('00' + VARSEQ).slice(-3); }
    return { id:VARREG[name] };
  }
  function markVars(b){
    if(!b || typeof b !== 'object') return;
    var fs = SPRITE_FIELDS[b.type], k;
    if(fs && b.fields) for(k = 0; k < fs.length; k++){
      if(typeof b.fields[fs[k]] === 'string') b.fields[fs[k]] = SV(b.fields[fs[k]]);
    }
    if(b.inputs) for(k in b.inputs){ markVars(b.inputs[k].block); markVars(b.inputs[k].shadow); }
    if(b.next) markVars(b.next.block);
  }
  function doc(blocks){
    blocks.forEach(markVars);
    var vars = [], n;
    for(n in VARREG) vars.push({ name:n, id:VARREG[n], type:'Sprite' });
    VARREG = {}; VARSEQ = 0;
    return { variables:vars, blocks:{ languageVersion:0, blocks:blocks } };
  }
  function at(block, x, y){ block.x = x; block.y = y; return block; }

  var TEMPLATES = {

  'platformer': { label:'🧍 แพลตฟอร์ม — เก็บเหรียญ', build:function(){ return doc([
    at(SETUP([
      B('game_background', { COL:'#a8dcf5' }),
      B('game_title', { TXT:'ผจญภัยเก็บเหรียญ' }),
      B('game_gravity', null, { N:N(1400) }),
      B('sprite_create', { NAME:'พื้น', LOOK:'RECT', SIZE:30 }, { X:N(240), Y:N(346) }),
      B('sprite_size', { NAME:'พื้น' }, { W:N(480), H:N(28) }),
      B('sprite_color', { NAME:'พื้น', COL:'#8a5a3b' }),
      B('sprite_create', { NAME:'แท่น', LOOK:'RECT', SIZE:30 }, { X:N(140), Y:N(252) }),
      B('sprite_size', { NAME:'แท่น' }, { W:N(120), H:N(18) }),
      B('sprite_color', { NAME:'แท่น', COL:'#3fb77a' }),
      SPAWN('แท่น', 360, 192),
      SPAWN('แท่น', 240, 126),
      B('sprite_create', { NAME:'ผู้เล่น', LOOK:'🧍', SIZE:32 }, { X:N(60), Y:N(300) }),
      B('set_edge', { NAME:'ผู้เล่น', MODE:'stop' }),
      B('set_solid', { A:'ผู้เล่น', B:'พื้น' }),
      B('set_solid', { A:'ผู้เล่น', B:'แท่น' }),
      B('sprite_create', { NAME:'เหรียญ', LOOK:'🪙', SIZE:22 }, { X:N(140), Y:N(224) }),
      SPAWN('เหรียญ', 360, 164),
      SPAWN('เหรียญ', 240, 98),
      SPAWN('เหรียญ', 440, 312),
      B('sprite_create', { NAME:'ศัตรู', LOOK:'👾', SIZE:28 }, { X:N(400), Y:N(300) }),
      B('set_solid', { A:'ศัตรู', B:'พื้น' }),
      B('set_edge', { NAME:'ศัตรู', MODE:'bounce' }),
      SET('vx', 'ศัตรู', N(-70))
    ]), 24, 24),
    at(TICK([ B('ctrl_move', { NAME:'ผู้เล่น', MODE:'lr' }, { SPD:N(190) }) ]), 24, 700),
    at(KEY('Space', [
      B('ctrl_jump', { NAME:'ผู้เล่น' }, { P:N(640) }),
      SND('jump')
    ]), 24, 830),
    at(HIT('ผู้เล่น', 'เหรียญ', [
      B('other_remove'), B('score_change', null, { N:N(10) }), SND('pickup'),
      IF(CMP('EQ', COUNT('เหรียญ'), N(0)), [ B('show_msg', null, { TXT:TXT('เก็บครบแล้ว!'), SEC:N(2) }), B('game_win') ])
    ]), 430, 700),
    at(HIT('ผู้เล่น', 'ศัตรู', [ SND('hit'), B('game_lose') ]), 430, 950)
  ]); }},

  'shooter': { label:'🚀 ยานอวกาศ — ยิงศัตรู', build:function(){ return doc([
    at(SETUP([
      B('game_background', { COL:'#07080f' }),
      B('game_title', { TXT:'ป้องกันกาแล็กซี' }),
      B('game_gravity', null, { N:N(0) }),
      B('sprite_create', { NAME:'ยาน', LOOK:'🚀', SIZE:34 }, { X:N(240), Y:N(322) }),
      B('set_edge', { NAME:'ยาน', MODE:'stop' }),
      B('sprite_define', { NAME:'กระสุน', LOOK:'CIRC', SIZE:9 }),
      B('sprite_color', { NAME:'กระสุน', COL:'#f2c53d' }),
      B('set_edge', { NAME:'กระสุน', MODE:'remove' }),
      B('sprite_define', { NAME:'ศัตรู', LOOK:'👾', SIZE:30 }),
      B('set_edge', { NAME:'ศัตรู', MODE:'remove' }),
      B('show_msg', null, { TXT:TXT('เว้นวรรค = ยิง · ทำ 100 คะแนนให้ได้'), SEC:N(3) })
    ]), 24, 24),
    at(TICK([ B('ctrl_move', { NAME:'ยาน', MODE:'lr' }, { SPD:N(240) }) ]), 24, 560),
    at(KEY('Space', [
      B('sprite_spawn', { NAME:'กระสุน' }, { X:GET('x', 'ยาน'), Y:N(292) }),
      SET('vy', 'กระสุน', N(-430)),
      SND('shoot')
    ]), 24, 690),
    at(EVERY(1.1, [
      B('sprite_spawn', { NAME:'ศัตรู' }, { X:RND(40, 440), Y:N(-20) }),
      SET('vy', 'ศัตรู', N(115))
    ]), 440, 560),
    at(HIT('กระสุน', 'ศัตรู', [
      B('me_remove'), B('other_remove'), B('score_change', null, { N:N(10) }), SND('hit'),
      IF(CMP('GTE', B('score_get'), N(100)), [ B('game_win') ])
    ]), 440, 790),
    at(HIT('ยาน', 'ศัตรู', [ SND('lose'), B('game_lose') ]), 440, 1040)
  ]); }},

  'collector': { label:'🐱 เก็บแอปเปิลแข่งกับเวลา', build:function(){ return doc([
    at(SETUP([
      B('game_background', { COL:'#8ed08a' }),
      B('game_title', { TXT:'เก็บแอปเปิลให้ทัน' }),
      B('game_gravity', null, { N:N(0) }),
      B('sprite_create', { NAME:'แมว', LOOK:'🐱', SIZE:34 }, { X:N(240), Y:N(190) }),
      B('set_edge', { NAME:'แมว', MODE:'stop' }),
      B('sprite_define', { NAME:'แอปเปิล', LOOK:'🍎', SIZE:24 }),
      REPEAT(8, [ B('sprite_spawn', { NAME:'แอปเปิล' }, { X:RND(40, 440), Y:N(0) }) ]),
      SET('y', 'แอปเปิล', RND(50, 320)),
      B('timer_set', null, { SEC:N(20) }),
      B('show_msg', null, { TXT:TXT('ใช้ปุ่มลูกศรเก็บให้ครบใน 20 วินาที'), SEC:N(3) })
    ]), 24, 24),
    at(TICK([ B('ctrl_move', { NAME:'แมว', MODE:'arrows' }, { SPD:N(215) }) ]), 24, 560),
    at(HIT('แมว', 'แอปเปิล', [
      B('other_remove'), B('score_change', null, { N:N(5) }), SND('pickup'),
      IF(CMP('EQ', COUNT('แอปเปิล'), N(0)), [ B('game_win') ])
    ]), 440, 560),
    at(TIMEOUT([ SND('lose'), B('game_lose') ]), 440, 810)
  ]); }},

  'breakout': { label:'🧱 ทุบอิฐ', build:function(){
    var xs = [45, 105, 165, 225, 285, 345, 405], out = [], i;
    for(i = 0; i < xs.length; i++) out.push(SPAWN('อิฐ', xs[i], 72));
    for(i = 0; i < xs.length; i++) out.push(SPAWN('อิฐ', xs[i], 98));
    return doc([
    at(SETUP([
      B('game_background', { COL:'#12284d' }),
      B('game_title', { TXT:'ทุบอิฐ' }),
      B('game_gravity', null, { N:N(0) }),
      B('sprite_create', { NAME:'ไม้ตี', LOOK:'RECT', SIZE:20 }, { X:N(240), Y:N(338) }),
      B('sprite_size', { NAME:'ไม้ตี' }, { W:N(92), H:N(14) }),
      B('sprite_color', { NAME:'ไม้ตี', COL:'#36a3e0' }),
      B('set_edge', { NAME:'ไม้ตี', MODE:'stop' }),
      B('sprite_create', { NAME:'ลูกบอล', LOOK:'CIRC', SIZE:14 }, { X:N(240), Y:N(300) }),
      B('sprite_color', { NAME:'ลูกบอล', COL:'#f2c53d' }),
      B('set_edge', { NAME:'ลูกบอล', MODE:'bounce' }),
      SET('vx', 'ลูกบอล', N(150)),
      SET('vy', 'ลูกบอล', N(-260)),
      B('sprite_define', { NAME:'อิฐ', LOOK:'RECT', SIZE:20 }),
      B('sprite_size', { NAME:'อิฐ' }, { W:N(52), H:N(18) }),
      B('sprite_color', { NAME:'อิฐ', COL:'#f08a24' })
    ].concat(out)), 24, 24),
    at(TICK([ B('ctrl_move', { NAME:'ไม้ตี', MODE:'mousex' }, { SPD:N(0) }) ]), 24, 900),
    at(HIT('ลูกบอล', 'ไม้ตี', [
      SET('vy', 'ลูกบอล', N(-285)),
      SET('vx', 'ลูกบอล', MATH('MULTIPLY', MATH('MINUS', GET('x', 'ลูกบอล'), GET('x', 'ไม้ตี')), N(5))),
      SND('beep')
    ]), 480, 24),
    at(HIT('ลูกบอล', 'อิฐ', [
      B('other_remove'), B('score_change', null, { N:N(10) }), SND('hit'),
      SET('vy', 'ลูกบอล', N(285)),
      IF(CMP('EQ', COUNT('อิฐ'), N(0)), [ B('game_win') ])
    ]), 480, 300),
    at(EDGEOF('ลูกบอล', [
      IF(CMP('GT', ME('y'), N(340)), [ SND('lose'), B('game_lose') ])
    ]), 480, 580)
  ]); }},

  'clicker': { label:'🎯 คลิกเป้าให้ไว', build:function(){ return doc([
    at(SETUP([
      B('game_background', { COL:'#1b1038' }),
      B('game_title', { TXT:'คลิกเป้าให้ไว' }),
      B('game_gravity', null, { N:N(0) }),
      B('sprite_create', { NAME:'เป้า', LOOK:'🎯', SIZE:48 }, { X:N(240), Y:N(190) }),
      B('timer_set', null, { SEC:N(15) }),
      B('show_msg', null, { TXT:TXT('คลิกเป้าให้ได้มากที่สุดใน 15 วินาที'), SEC:N(3) })
    ]), 24, 24),
    at(CLICK('เป้า', [
      B('score_change', null, { N:N(1) }), SND('pickup'),
      B('sprite_goto', { NAME:'เป้า' }, { X:RND(45, 435), Y:N(0) }),
      SET('y', 'เป้า', RND(55, 320))
    ]), 24, 430),
    at(EVERY(3, [
      SET('w', 'เป้า', MATH('MULTIPLY', GET('w', 'เป้า'), N(0.88))),
      SET('h', 'เป้า', MATH('MULTIPLY', GET('h', 'เป้า'), N(0.88)))
    ]), 440, 430),
    at(TIMEOUT([ B('show_msg', null, { TXT:TXT('หมดเวลา!'), SEC:N(2) }), B('game_win') ]), 440, 680)
  ]); }}

  };

  BW.TEMPLATES = TEMPLATES;
})(window.Blockwright = window.Blockwright || {});
