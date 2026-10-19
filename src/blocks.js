/* Blockwright — นิยามบล็อกทั้งหมด ทั้งรายการตัวเลือกและสีประจำหมวด
   ชุดเครื่องมือสร้างเกมด้วยการต่อบล็อก · สัญญาอนุญาต MIT */
(function (BW) {
  'use strict';

  /* =====================================================================
     สตูดิโอเกมบล็อก
     แกนตัวต่อ: Blockly 13.3.0 (Google, Apache-2.0) โหลดจาก CDN
     เอนจินเกม + ชุดบล็อกภาษาไทย: เขียนขึ้นใหม่ในไฟล์นี้
     ===================================================================== */

  var LOOKS = [
    ['▭ สี่เหลี่ยม','RECT'], ['● วงกลม','CIRC'],
    ['🧍 คน','🧍'], ['🐱 แมว','🐱'], ['🐶 หมา','🐶'], ['🐦 นก','🐦'],
    ['👾 มอนสเตอร์','👾'], ['🛸 จานบิน','🛸'], ['🚀 จรวด','🚀'], ['🚗 รถ','🚗'],
    ['⭐ ดาว','⭐'], ['💎 เพชร','💎'], ['🪙 เหรียญ','🪙'], ['🍎 แอปเปิล','🍎'],
    ['🏀 ลูกบอล','🏀'], ['🧱 อิฐ','🧱'], ['💣 ระเบิด','💣'], ['❤️ หัวใจ','❤️'],
    ['🎯 เป้า','🎯'], ['🌵 ต้นไม้','🌵'], ['🔥 ไฟ','🔥'], ['⚪ จุด','⚪']
  ];
  var COLORS = [
    ['แดง','#e2443b'], ['ส้ม','#f08a24'], ['เหลือง','#f2c53d'], ['เขียว','#3fb77a'],
    ['ฟ้า','#36a3e0'], ['น้ำเงิน','#3a5bd1'], ['ม่วง','#8456d6'], ['ชมพู','#e866a6'],
    ['น้ำตาล','#8a5a3b'], ['เทา','#8b91a6'], ['ขาว','#f4f6fb'], ['ดำ','#1b1f29']
  ];
  var BGS = [
    ['ฟ้าสว่าง','#a8dcf5'], ['ฟ้าเข้ม','#12284d'], ['เขียวหญ้า','#8ed08a'],
    ['ทราย','#f0dfb4'], ['ดำอวกาศ','#07080f'], ['ม่วงกลางคืน','#1b1038'],
    ['เทาอ่อน','#dfe3ec'], ['ขาว','#ffffff']
  ];
  var KEYS = [
    ['◀ ลูกศรซ้าย','ArrowLeft'], ['▶ ลูกศรขวา','ArrowRight'],
    ['▲ ลูกศรขึ้น','ArrowUp'], ['▼ ลูกศรลง','ArrowDown'],
    ['เว้นวรรค','Space'], ['W','w'], ['A','a'], ['S','s'], ['D','d'], ['Enter','Enter']
  ];
  var PROPS = [
    ['ตำแหน่ง x','x'], ['ตำแหน่ง y','y'],
    ['ความเร็วแนวนอน','vx'], ['ความเร็วแนวตั้ง','vy'],
    ['ความกว้าง','w'], ['ความสูง','h'], ['มุมหมุน','rot']
  ];
  var MOVES = [
    ['ลูกศร 4 ทิศ','arrows'], ['ลูกศร ซ้าย-ขวา','lr'], ['ลูกศร ขึ้น-ลง','ud'],
    ['ปุ่ม WASD','wasd'], ['ตามเมาส์','mouse'], ['ตามเมาส์ แนวนอน','mousex']
  ];
  var EDGES = [
    ['เด้งกลับ','bounce'], ['หยุดที่ขอบ','stop'], ['วนไปอีกฝั่ง','wrap'],
    ['หายไป','remove'], ['ผ่านออกไปได้','none']
  ];
  var SOUNDS = [
    ['เก็บของ','pickup'], ['กระโดด','jump'], ['ชน','hit'],
    ['ยิง','shoot'], ['ชนะ','win'], ['แพ้','lose'], ['บี๊บ','beep']
  ];

  var C = { setup:20, sprite:205, input:285, time:50, hit:0, score:160, end:330 };

  Blockly.defineBlocksWithJsonArray([

  /* ---------- 🎬 เริ่มเกมและฉาก ---------- */
  { type:'game_setup', message0:'🎬 เมื่อเริ่มเกม', message1:'%1',
    args1:[{type:'input_statement', name:'DO'}], colour:C.setup,
    tooltip:'ทำงานครั้งเดียวตอนกดเล่น ใช้สร้างฉากและตัวละคร' },

  { type:'game_background', message0:'พื้นหลัง %1',
    args0:[{type:'field_dropdown', name:'COL', options:BGS}],
    previousStatement:null, nextStatement:null, colour:C.setup,
    tooltip:'เปลี่ยนสีพื้นหลังของเวที' },

  { type:'game_title', message0:'ชื่อเกม %1',
    args0:[{type:'field_input', name:'TXT', text:'เกมของฉัน'}],
    previousStatement:null, nextStatement:null, colour:C.setup,
    tooltip:'ข้อความที่แสดงมุมบนซ้ายของเวที' },

  { type:'game_gravity', message0:'แรงโน้มถ่วง %1',
    args0:[{type:'input_value', name:'N', check:'Number'}],
    previousStatement:null, nextStatement:null, colour:C.setup, inputsInline:true,
    tooltip:'0 = มองจากด้านบน, 1200 = เกมแนวข้างที่ตกลงพื้น' },

  /* ---------- 🧍 ตัวละคร ---------- */
  { type:'sprite_create', message0:'🧍 สร้างตัวละคร %1 รูป %2 ขนาด %3', message1:'ที่ x %1 y %2',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_dropdown', name:'LOOK', options:LOOKS},
           {type:'field_number', name:'SIZE', value:32, min:4, max:480}],
    args1:[{type:'input_value', name:'X', check:'Number'},
           {type:'input_value', name:'Y', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'สร้างตัวละคร 1 ตัว ชื่อเดียวกันถือเป็นกลุ่มเดียวกัน' },

  { type:'sprite_define', message0:'📐 เตรียมแบบตัวละคร %1 รูป %2 ขนาด %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_dropdown', name:'LOOK', options:LOOKS},
           {type:'field_number', name:'SIZE', value:12, min:4, max:480}],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'กำหนดหน้าตาไว้ก่อน ยังไม่สร้างตัวจริง แล้วค่อยใช้บล็อก “เกิดเพิ่ม”' },

  { type:'sprite_spawn', message0:'✨ เกิด %1 เพิ่มที่ x %2 y %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'X', check:'Number'},
           {type:'input_value', name:'Y', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'สร้างตัวละครเพิ่มอีกตัวจากแบบเดิม' },

  { type:'sprite_color', message0:'ระบายสี %1 เป็น %2',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_dropdown', name:'COL', options:COLORS}],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ใช้กับรูปสี่เหลี่ยมและวงกลม' },

  { type:'sprite_size', message0:'ตั้งขนาด %1 กว้าง %2 สูง %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'W', check:'Number'},
           {type:'input_value', name:'H', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ทำพื้น แท่น หรือไม้ตีให้เป็นแท่งยาว' },

  { type:'sprite_goto', message0:'ย้าย %1 ไปที่ x %2 y %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'X', check:'Number'},
           {type:'input_value', name:'Y', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite },

  { type:'sprite_move', message0:'เลื่อน %1 ไป x %2 y %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'DX', check:'Number'},
           {type:'input_value', name:'DY', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite },

  { type:'sprite_set', message0:'ตั้ง %1 ของ %2 เป็น %3',
    args0:[{type:'field_dropdown', name:'PROP', options:PROPS},
           {type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'V', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ใช้กับตัวละครทุกตัวที่ชื่อนี้' },

  { type:'sprite_get', message0:'%1 ของ %2',
    args0:[{type:'field_dropdown', name:'PROP', options:PROPS},
           {type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    output:'Number', colour:C.sprite },

  { type:'sprite_count', message0:'จำนวน %1 ที่เหลือ',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    output:'Number', colour:C.sprite },

  { type:'sprite_each', message0:'ทำกับ %1 ทุกตัว',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ภายในบล็อกนี้ ใช้คำว่า “ตัวนี้” เพื่ออ้างถึงตัวละครทีละตัว' },

  { type:'sprite_removeall', message0:'🗑️ ลบ %1 ทั้งหมด',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    previousStatement:null, nextStatement:null, colour:C.sprite },

  { type:'me_set', message0:'ตั้ง %1 ของตัวนี้ เป็น %2',
    args0:[{type:'field_dropdown', name:'PROP', options:PROPS},
           {type:'input_value', name:'V', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ใช้ได้ในบล็อก “ทำกับ…ทุกตัว”, “เมื่อชน” และ “เมื่อคลิก”' },

  { type:'me_get', message0:'%1 ของตัวนี้',
    args0:[{type:'field_dropdown', name:'PROP', options:PROPS}],
    output:'Number', colour:C.sprite },

  { type:'me_remove', message0:'🗑️ ลบตัวนี้',
    previousStatement:null, nextStatement:null, colour:C.sprite },

  { type:'other_remove', message0:'🗑️ ลบตัวที่ชน',
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ใช้ในบล็อก “เมื่อ … ชน …” เท่านั้น' }

  ]);

  Blockly.defineBlocksWithJsonArray([

  /* ---------- 🎮 การควบคุม ---------- */
  { type:'on_key', message0:'⌨️ เมื่อกดปุ่ม %1',
    args0:[{type:'field_dropdown', name:'K', options:KEYS}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}],
    colour:C.input, tooltip:'ทำงานหนึ่งครั้งทุกครั้งที่กดปุ่ม' },

  { type:'key_down', message0:'กดปุ่ม %1 ค้างอยู่',
    args0:[{type:'field_dropdown', name:'K', options:KEYS}],
    output:'Boolean', colour:C.input },

  { type:'on_click', message0:'🖱️ เมื่อคลิกที่ %1',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}],
    colour:C.input, tooltip:'ทำงานเมื่อคลิกโดนตัวละครที่เลือก' },

  { type:'on_click_stage', message0:'🖱️ เมื่อคลิกบนเวที', message1:'%1',
    args1:[{type:'input_statement', name:'DO'}],
    colour:C.input, tooltip:'รับคลิกทุกจุดบนเวที ไม่ว่าจะโดนตัวละครหรือไม่' },

  { type:'ctrl_move', message0:'ให้ %1 เดินด้วย %2 ความเร็ว %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_dropdown', name:'MODE', options:MOVES},
           {type:'input_value', name:'SPD', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.input,
    tooltip:'วางไว้ในบล็อก “ทำซ้ำทุกเฟรม”' },

  { type:'ctrl_jump', message0:'ให้ %1 กระโดด แรง %2',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'P', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.input,
    tooltip:'กระโดดได้เมื่อยืนอยู่บนพื้นเท่านั้น' },

  { type:'ctrl_follow', message0:'ให้ %1 ไล่ตาม %2 ความเร็ว %3',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_variable', name:'TARGET', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'input_value', name:'SPD', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.input },

  /* ---------- ⏱️ เวลาและการทำซ้ำ ---------- */
  { type:'on_tick', message0:'🔁 ทำซ้ำทุกเฟรม', message1:'%1',
    args1:[{type:'input_statement', name:'DO'}], colour:C.time,
    tooltip:'ทำงานประมาณ 60 ครั้งต่อวินาที' },

  { type:'on_every', message0:'⏱️ ทุก ๆ %1 วินาที',
    args0:[{type:'input_value', name:'SEC', check:'Number'}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}],
    inputsInline:true, colour:C.time },

  { type:'after_delay', message0:'หลังจาก %1 วินาที',
    args0:[{type:'input_value', name:'SEC', check:'Number'}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.time },

  { type:'timer_set', message0:'⏳ ตั้งเวลาถอยหลัง %1 วินาที',
    args0:[{type:'input_value', name:'SEC', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.time },

  { type:'on_timeout', message0:'⏳ เมื่อหมดเวลา', message1:'%1',
    args1:[{type:'input_statement', name:'DO'}], colour:C.time },

  { type:'time_left', message0:'เวลาที่เหลือ', output:'Number', colour:C.time },

  /* ---------- 💥 การชน ---------- */
  { type:'on_collide', message0:'💥 เมื่อ %1 ชนกับ %2',
    args0:[{type:'field_variable', name:'A', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_variable', name:'B', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}],
    colour:C.hit, tooltip:'“ตัวนี้” คือตัวแรก “ตัวที่ชน” คือตัวที่สอง' },

  { type:'on_edge', message0:'🧱 เมื่อ %1 ถึงขอบเวที',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    message1:'%1', args1:[{type:'input_statement', name:'DO'}], colour:C.hit },

  { type:'set_edge', message0:'ให้ %1 %2 เมื่อถึงขอบ',
    args0:[{type:'field_variable', name:'NAME', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_dropdown', name:'MODE', options:EDGES}],
    previousStatement:null, nextStatement:null, colour:C.hit },

  { type:'set_solid', message0:'ให้ %1 ยืนบน %2 ได้',
    args0:[{type:'field_variable', name:'A', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_variable', name:'B', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    previousStatement:null, nextStatement:null, colour:C.hit,
    tooltip:'ทำให้ชนแล้วหยุด ใช้กับพื้นและแท่นในเกมแนวข้าง' },

  { type:'touching', message0:'%1 แตะ %2 อยู่',
    args0:[{type:'field_variable', name:'A', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'},
           {type:'field_variable', name:'B', variable:'ผู้เล่น', variableTypes:['Sprite'], defaultType:'Sprite'}],
    output:'Boolean', colour:C.hit },

  /* ---------- 🏅 คะแนนและเสียง ---------- */
  { type:'score_change', message0:'🏅 เพิ่มคะแนน %1',
    args0:[{type:'input_value', name:'N', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.score },

  { type:'score_set', message0:'ตั้งคะแนนเป็น %1',
    args0:[{type:'input_value', name:'N', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.score },

  { type:'score_get', message0:'คะแนน', output:'Number', colour:C.score },

  { type:'lives_change', message0:'❤️ เพิ่มพลังชีวิต %1',
    args0:[{type:'input_value', name:'N', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.score,
    tooltip:'ใส่ -1 เพื่อลดพลังชีวิต' },

  { type:'lives_get', message0:'พลังชีวิต', output:'Number', colour:C.score },

  { type:'show_msg', message0:'💬 แสดงข้อความ %1 นาน %2 วินาที',
    args0:[{type:'input_value', name:'TXT'},
           {type:'input_value', name:'SEC', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.score },

  { type:'play_sound', message0:'🔊 เล่นเสียง %1',
    args0:[{type:'field_dropdown', name:'S', options:SOUNDS}],
    previousStatement:null, nextStatement:null, colour:C.score },

  /* ---------- 🏁 จบเกม ---------- */
  { type:'game_win', message0:'🏆 ชนะเกม', previousStatement:null, colour:C.end },
  { type:'game_lose', message0:'💀 แพ้เกม', previousStatement:null, colour:C.end },
  { type:'game_restart', message0:'🔄 เริ่มเกมใหม่', previousStatement:null, colour:C.end }

  ]);

  BW.C = C;
})(window.Blockwright = window.Blockwright || {});
