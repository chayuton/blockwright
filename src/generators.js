/* Blockwright — แปลงบล็อกเป็น JavaScript และประกอบกล่องเครื่องมือ
   ชุดเครื่องมือสร้างเกมด้วยการต่อบล็อก · สัญญาอนุญาต MIT */
(function (BW) {
  'use strict';

  var C = BW.C;

  /* =====================  ตัวแปลงบล็อก → JavaScript  ===================== */
  var JS = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;

  function gen(type, fn){ JS.forBlock[type] = fn; }
  function V(b, g, name, dflt){ var c = g.valueToCode(b, name, 0); return (c === '' || c == null) ? dflt : c; }
  function F(b, name){ return JSON.stringify(b.getFieldValue(name) || ''); }
  /* ชื่อตัวละครเก็บเป็นตัวแปรชนิด Sprite — ค่าในช่องคือรหัสตัวแปร ไม่ใช่ชื่อ */
  function SN(b, name){
    var f = b.getField(name);
    if(!f) return '""';
    var v = f.getVariable ? f.getVariable() : null;
    var nm = v ? (v.getName ? v.getName() : v.name) : (f.getText ? f.getText() : '');
    return JSON.stringify(nm || '');
  }
  function NUM(b, name, dflt){ var n = Number(b.getFieldValue(name)); return isFinite(n) ? n : dflt; }
  function ST(b, g, name){ return g.statementToCode(b, name); }

  gen('game_setup', function(b,g){ return 'G.onStart(function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('game_background', function(b){ return 'G.setBackground(' + F(b,'COL') + ');\n'; });
  gen('game_title', function(b){ return 'G.setTitle(' + F(b,'TXT') + ');\n'; });
  gen('game_gravity', function(b,g){ return 'G.setGravity(' + V(b,g,'N','0') + ');\n'; });

  gen('sprite_create', function(b,g){
    return 'G.create(' + SN(b,'NAME') + ',' + F(b,'LOOK') + ',' + NUM(b,'SIZE',32) +
           ',' + V(b,g,'X','240') + ',' + V(b,g,'Y','180') + ');\n'; });
  gen('sprite_define', function(b){
    return 'G.define(' + SN(b,'NAME') + ',' + F(b,'LOOK') + ',' + NUM(b,'SIZE',16) + ');\n'; });
  gen('sprite_spawn', function(b,g){
    return 'G.spawn(' + SN(b,'NAME') + ',' + V(b,g,'X','240') + ',' + V(b,g,'Y','180') + ');\n'; });
  gen('sprite_color', function(b){ return 'G.setColor(' + SN(b,'NAME') + ',' + F(b,'COL') + ');\n'; });
  gen('sprite_size', function(b,g){
    return 'G.setSize(' + SN(b,'NAME') + ',' + V(b,g,'W','40') + ',' + V(b,g,'H','40') + ');\n'; });
  gen('sprite_goto', function(b,g){
    return 'G.goTo(' + SN(b,'NAME') + ',' + V(b,g,'X','240') + ',' + V(b,g,'Y','180') + ');\n'; });
  gen('sprite_move', function(b,g){
    return 'G.moveBy(' + SN(b,'NAME') + ',' + V(b,g,'DX','0') + ',' + V(b,g,'DY','0') + ');\n'; });
  gen('sprite_set', function(b,g){
    return 'G.setProp(' + SN(b,'NAME') + ',' + F(b,'PROP') + ',' + V(b,g,'V','0') + ');\n'; });
  gen('sprite_get', function(b){ return ['G.getProp(' + SN(b,'NAME') + ',' + F(b,'PROP') + ')', 0]; });
  gen('sprite_count', function(b){ return ['G.count(' + SN(b,'NAME') + ')', 0]; });
  gen('sprite_each', function(b,g){
    return 'G.each(' + SN(b,'NAME') + ', function(me){\n' + ST(b,g,'DO') + '});\n'; });
  gen('sprite_removeall', function(b){ return 'G.removeAll(' + SN(b,'NAME') + ');\n'; });
  gen('me_set', function(b,g){ return 'G.setE(me,' + F(b,'PROP') + ',' + V(b,g,'V','0') + ');\n'; });
  gen('me_get', function(b){ return ['G.getE(me,' + F(b,'PROP') + ')', 0]; });
  gen('me_remove', function(){ return 'G.destroy(me);\n'; });
  gen('other_remove', function(){ return 'G.destroy(other);\n'; });

  gen('on_key', function(b,g){ return 'G.onKey(' + F(b,'K') + ', function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('key_down', function(b){ return ['G.keyDown(' + F(b,'K') + ')', 0]; });
  gen('on_click', function(b,g){
    return 'G.onClick(' + SN(b,'NAME') + ', function(me){\n' + ST(b,g,'DO') + '});\n'; });
  gen('on_click_stage', function(b,g){
    return 'G.onStageClick(function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('ctrl_move', function(b,g){
    return 'G.moveWith(' + SN(b,'NAME') + ',' + F(b,'MODE') + ',' + V(b,g,'SPD','160') + ');\n'; });
  gen('ctrl_jump', function(b,g){ return 'G.jump(' + SN(b,'NAME') + ',' + V(b,g,'P','500') + ');\n'; });
  gen('ctrl_follow', function(b,g){
    return 'G.follow(' + SN(b,'NAME') + ',' + SN(b,'TARGET') + ',' + V(b,g,'SPD','80') + ');\n'; });

  gen('on_tick', function(b,g){ return 'G.onTick(function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('on_every', function(b,g){
    return 'G.onEvery(' + V(b,g,'SEC','1') + ', function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('after_delay', function(b,g){
    return 'G.after(' + V(b,g,'SEC','1') + ', function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('timer_set', function(b,g){ return 'G.setTimer(' + V(b,g,'SEC','30') + ');\n'; });
  gen('on_timeout', function(b,g){ return 'G.onTimeout(function(){\n' + ST(b,g,'DO') + '});\n'; });
  gen('time_left', function(){ return ['G.timeLeft()', 0]; });

  gen('on_collide', function(b,g){
    return 'G.onCollide(' + SN(b,'A') + ',' + SN(b,'B') + ', function(me, other){\n' + ST(b,g,'DO') + '});\n'; });
  gen('on_edge', function(b,g){
    return 'G.onEdge(' + SN(b,'NAME') + ', function(me){\n' + ST(b,g,'DO') + '});\n'; });
  gen('set_edge', function(b){ return 'G.setEdge(' + SN(b,'NAME') + ',' + F(b,'MODE') + ');\n'; });
  gen('set_solid', function(b){ return 'G.setSolid(' + SN(b,'A') + ',' + SN(b,'B') + ');\n'; });
  gen('touching', function(b){ return ['G.touching(' + SN(b,'A') + ',' + SN(b,'B') + ')', 0]; });

  gen('score_change', function(b,g){ return 'G.addScore(' + V(b,g,'N','1') + ');\n'; });
  gen('score_set', function(b,g){ return 'G.setScore(' + V(b,g,'N','0') + ');\n'; });
  gen('score_get', function(){ return ['G.getScore()', 0]; });
  gen('lives_change', function(b,g){ return 'G.addLives(' + V(b,g,'N','-1') + ');\n'; });
  gen('lives_get', function(){ return ['G.getLives()', 0]; });
  gen('show_msg', function(b,g){
    return 'G.say(' + V(b,g,'TXT','""') + ',' + V(b,g,'SEC','2') + ');\n'; });
  gen('play_sound', function(b){ return 'G.sound(' + F(b,'S') + ');\n'; });
  gen('game_win', function(){ return 'G.win();\n'; });
  gen('game_lose', function(){ return 'G.lose();\n'; });
  gen('game_restart', function(){ return 'G.restart();\n'; });

  /* ---------- บล็อกรุ่นที่สอง ---------- */
  gen('sprite_fixed', function(b){ return 'G.setFixed(' + SN(b,'NAME') + ');\n'; });
  gen('sprite_look', function(b){ return 'G.setLook(' + SN(b,'NAME') + ',' + F(b,'LOOK') + ');\n'; });
  gen('sprite_turn', function(b,g){ return 'G.turn(' + SN(b,'NAME') + ',' + V(b,g,'DEG','15') + ');\n'; });
  gen('sprite_point', function(b){ return 'G.pointAt(' + SN(b,'NAME') + ',' + SN(b,'TARGET') + ');\n'; });
  gen('sprite_point_mouse', function(b){ return 'G.pointMouse(' + SN(b,'NAME') + ');\n'; });
  gen('sprite_forward', function(b,g){ return 'G.forward(' + SN(b,'NAME') + ',' + V(b,g,'SPD','150') + ');\n'; });
  gen('distance', function(b){ return ['G.distance(' + SN(b,'A') + ',' + SN(b,'B') + ')', 0]; });
  gen('shoot', function(b,g){
    return 'G.shoot(' + SN(b,'BULLET') + ',' + SN(b,'FROM') + ',' + V(b,g,'SPD','400') + ');\n'; });
  gen('lives_set', function(b,g){ return 'G.setLives(' + V(b,g,'N','3') + ');\n'; });
  gen('pad_show', function(b){ return 'G.showPad(' + F(b,'MODE') + ');\n'; });
  gen('pad_button', function(b){ return 'G.screenButton(' + F(b,'LABEL') + ',' + F(b,'K') + ');\n'; });
  gen('ctrl_jump_key', function(b,g){
    return 'G.jumpWith(' + SN(b,'NAME') + ',' + F(b,'K') + ',' + V(b,g,'P','520') + ');\n'; });

  /* =====================  กล่องเครื่องมือ  ===================== */
  function tb(type, shadows){
    var o = { kind:'block', type:type };
    if (shadows){
      o.inputs = {};
      for (var k in shadows){
        var v = shadows[k];
        o.inputs[k] = { shadow: (typeof v === 'string')
          ? { type:'text', fields:{ TEXT:v } }
          : { type:'math_number', fields:{ NUM:v } } };
      }
    }
    return o;
  }

  var TOOLBOX = { kind:'categoryToolbox', contents:[
    { kind:'category', name:'🎬 เริ่มเกม', colour:String(C.setup), contents:[
      tb('game_setup'), tb('game_background'), tb('game_title'), tb('game_gravity',{N:1200})
    ]},
    { kind:'category', name:'🧍 ตัวละคร', colour:String(C.sprite), contents:[
      tb('sprite_create',{X:240,Y:180}), tb('sprite_define'), tb('sprite_spawn',{X:240,Y:40}),
      tb('sprite_color'), tb('sprite_size',{W:120,H:20}),
      tb('sprite_goto',{X:240,Y:180}), tb('sprite_move',{DX:5,DY:0}),
      tb('sprite_set',{V:0}), tb('sprite_get'), tb('sprite_count'),
      tb('sprite_fixed'), tb('sprite_look'),
      tb('sprite_turn',{DEG:15}), tb('sprite_point'), tb('sprite_point_mouse'),
      tb('sprite_forward',{SPD:160}), tb('distance'),
      tb('sprite_each'), tb('me_set',{V:0}), tb('me_get'),
      tb('me_remove'), tb('other_remove'), tb('sprite_removeall')
    ]},
    { kind:'category', name:'🎮 การควบคุม', colour:String(C.input), contents:[
      tb('on_key'), tb('key_down'), tb('on_click'), tb('on_click_stage'),
      tb('pad_show'), tb('pad_button'),
      tb('ctrl_move',{SPD:180}), tb('ctrl_jump',{P:520}), tb('ctrl_jump_key',{P:520}),
      tb('ctrl_follow',{SPD:70}), tb('shoot',{SPD:420})
    ]},
    { kind:'category', name:'⏱️ เวลา', colour:String(C.time), contents:[
      tb('on_tick'), tb('on_every',{SEC:1}), tb('after_delay',{SEC:2}),
      tb('timer_set',{SEC:30}), tb('on_timeout'), tb('time_left')
    ]},
    { kind:'category', name:'💥 การชน', colour:String(C.hit), contents:[
      tb('on_collide'), tb('on_edge'), tb('set_edge'), tb('set_solid'), tb('touching')
    ]},
    { kind:'category', name:'🏅 คะแนนและเสียง', colour:String(C.score), contents:[
      tb('score_change',{N:10}), tb('score_set',{N:0}), tb('score_get'),
      tb('lives_change',{N:-1}), tb('lives_set',{N:3}), tb('lives_get'),
      tb('show_msg',{TXT:'เยี่ยมมาก!',SEC:2}), tb('play_sound')
    ]},
    { kind:'category', name:'🏁 จบเกม', colour:String(C.end), contents:[
      tb('game_win'), tb('game_lose'), tb('game_restart')
    ]},
    { kind:'sep' },
    { kind:'category', name:'🔀 ตรรกะ', colour:'210', contents:[
      tb('controls_if'), tb('logic_compare'), tb('logic_operation'),
      tb('logic_negate'), tb('logic_boolean')
    ]},
    { kind:'category', name:'🔁 ทำซ้ำ', colour:'120', contents:[
      tb('controls_repeat_ext',{TIMES:10}), tb('controls_whileUntil'),
      tb('controls_for',{FROM:1,TO:10,BY:1}), tb('controls_flow_statements')
    ]},
    { kind:'category', name:'🔢 ตัวเลข', colour:'230', contents:[
      tb('math_number'), tb('math_arithmetic',{A:1,B:1}),
      tb('math_random_int',{FROM:1,TO:100}), tb('math_single',{NUM:9}),
      tb('math_modulo',{DIVIDEND:64,DIVISOR:10}), tb('math_number_property',{DIVISOR:2})
    ]},
    { kind:'category', name:'🔤 ข้อความ', colour:'160', contents:[
      tb('text'), tb('text_join')
    ]},
    { kind:'category', name:'📦 ตัวแปร', colour:'330', custom:'VARIABLE' },
    { kind:'category', name:'🧩 ฟังก์ชัน', colour:'290', custom:'PROCEDURE' }
  ]};

  BW.JS = JS;
  BW.TOOLBOX = TOOLBOX;
})(window.Blockwright = window.Blockwright || {});
