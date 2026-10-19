/* Blockwright — นิยามบล็อกทั้งหมด ทั้งรายการตัวเลือกและสีประจำหมวด
   ชุดเครื่องมือสร้างเกมด้วยการต่อบล็อก · สัญญาอนุญาต MIT */
(function (BW) {
  'use strict';

  /* =====================================================================
     Blockwright — เรียง · ต่อ · ก่อ
     แกนตัวต่อ: Blockly 13.3.0 (Google, Apache-2.0) โหลดจาก CDN
     ชุดบล็อกภาษาไทยและเอนจินเกม: เขียนขึ้นใหม่

     ป้ายในรายการเลือกเขียนไทยควบอังกฤษ คั่นด้วย · เพื่อให้ผู้เรียน
     เห็นศัพท์อังกฤษที่ใช้จริงในวงการไปพร้อมกัน ส่วน “ค่า” ที่เก็บจริง
     ไม่เปลี่ยน โปรเจกต์เก่าจึงยังโหลดได้ตามปกติ
     ===================================================================== */

  /* ช่องเลือกชื่อตัวละคร ใช้ซ้ำในบล็อกใหม่ด้านล่าง */
  function SPR(name){
    return { type:'field_variable', name:name, variable:'ผู้เล่น',
             variableTypes:['Sprite'], defaultType:'Sprite' };
  }

  var LOOKS = [
    ['▭ สี่เหลี่ยม · Rect','RECT'], ['● วงกลม · Circle','CIRC'],
    ['🧍 คน · Person','🧍'], ['🐱 แมว · Cat','🐱'], ['🐶 หมา · Dog','🐶'], ['🐦 นก · Bird','🐦'],
    ['👾 มอนสเตอร์ · Monster','👾'], ['🛸 จานบิน · UFO','🛸'], ['🚀 จรวด · Rocket','🚀'], ['🚗 รถ · Car','🚗'],
    ['⭐ ดาว · Star','⭐'], ['💎 เพชร · Gem','💎'], ['🪙 เหรียญ · Coin','🪙'], ['🍎 แอปเปิล · Apple','🍎'],
    ['🏀 ลูกบอล · Ball','🏀'], ['🧱 อิฐ · Brick','🧱'], ['💣 ระเบิด · Bomb','💣'], ['❤️ หัวใจ · Heart','❤️'],
    ['🎯 เป้า · Target','🎯'], ['🌵 ต้นไม้ · Cactus','🌵'], ['🔥 ไฟ · Fire','🔥'], ['⚪ จุด · Dot','⚪']
  ];
  var COLORS = [
    ['แดง · Red','#e2443b'], ['ส้ม · Orange','#f08a24'], ['เหลือง · Yellow','#f2c53d'], ['เขียว · Green','#3fb77a'],
    ['ฟ้า · Sky','#36a3e0'], ['น้ำเงิน · Blue','#3a5bd1'], ['ม่วง · Purple','#8456d6'], ['ชมพู · Pink','#e866a6'],
    ['น้ำตาล · Brown','#8a5a3b'], ['เทา · Grey','#8b91a6'], ['ขาว · White','#f4f6fb'], ['ดำ · Black','#1b1f29']
  ];
  var BGS = [
    ['ฟ้าสว่าง · Sky','#a8dcf5'], ['ฟ้าเข้ม · Deep sea','#12284d'], ['เขียวหญ้า · Grass','#8ed08a'],
    ['ทราย · Sand','#f0dfb4'], ['ดำอวกาศ · Space','#07080f'], ['ม่วงกลางคืน · Night','#1b1038'],
    ['เทาอ่อน · Light grey','#dfe3ec'], ['ขาว · White','#ffffff']
  ];
  var KEYS = [
    ['◀ ลูกศรซ้าย · Left','ArrowLeft'], ['▶ ลูกศรขวา · Right','ArrowRight'],
    ['▲ ลูกศรขึ้น · Up','ArrowUp'], ['▼ ลูกศรลง · Down','ArrowDown'],
    ['เว้นวรรค · Space','Space'], ['W','w'], ['A','a'], ['S','s'], ['D','d'], ['Enter','Enter']
  ];
  var PROPS = [
    ['ตำแหน่ง x · x','x'], ['ตำแหน่ง y · y','y'],
    ['ความเร็วแนวนอน · vx','vx'], ['ความเร็วแนวตั้ง · vy','vy'],
    ['ความกว้าง · width','w'], ['ความสูง · height','h'], ['มุมหมุน · angle','rot']
  ];
  var MOVES = [
    ['ลูกศร 4 ทิศ · Arrows','arrows'], ['ลูกศร ซ้าย-ขวา · Left/Right','lr'], ['ลูกศร ขึ้น-ลง · Up/Down','ud'],
    ['ปุ่ม WASD · WASD','wasd'], ['ตามเมาส์ · Mouse','mouse'], ['ตามเมาส์ แนวนอน · Mouse X','mousex']
  ];
  var EDGES = [
    ['เด้งกลับ · Bounce','bounce'], ['หยุดที่ขอบ · Stop','stop'], ['วนไปอีกฝั่ง · Wrap','wrap'],
    ['หายไป · Remove','remove'], ['ผ่านออกไปได้ · Pass','none']
  ];
  var SOUNDS = [
    ['เก็บของ · Pickup','pickup'], ['กระโดด · Jump','jump'], ['ชน · Hit','hit'],
    ['ยิง · Shoot','shoot'], ['ชนะ · Win','win'], ['แพ้ · Lose','lose'], ['บี๊บ · Beep','beep']
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

  /* =====================================================================
     บล็อกรุ่นที่สอง — การหมุน การเล็ง การยิง และการตรึงไว้กับที่
     ===================================================================== */
  Blockly.defineBlocksWithJsonArray([

  { type:'sprite_fixed', message0:'📌 ตรึง %1 ไว้กับที่',
    args0:[SPR('NAME')],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ไม่ให้ตกตามแรงโน้มถ่วง ใช้กับพื้น แท่น และของที่ต้องลอยนิ่ง ๆ (ยังกำหนดความเร็วให้เคลื่อนที่เองได้)' },

  { type:'sprite_look', message0:'เปลี่ยนรูป %1 เป็น %2',
    args0:[SPR('NAME'), {type:'field_dropdown', name:'LOOK', options:LOOKS}],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'เปลี่ยนหน้าตาระหว่างเล่น เช่น โดนแล้วกลายเป็นไฟ' },

  { type:'sprite_turn', message0:'🔄 หมุน %1 ไป %2 องศา',
    args0:[SPR('NAME'), {type:'input_value', name:'DEG', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'บวกคือหมุนตามเข็มนาฬิกา วางในบล็อกทำซ้ำทุกเฟรมจะหมุนต่อเนื่อง' },

  { type:'sprite_point', message0:'🧭 หัน %1 ไปทาง %2',
    args0:[SPR('NAME'), SPR('TARGET')],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ปรับมุมหมุนให้ชี้ไปหาตัวละครอีกตัว' },

  { type:'sprite_point_mouse', message0:'🧭 หัน %1 ไปทางเมาส์',
    args0:[SPR('NAME')],
    previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'ใช้คู่กับบล็อกยิง เพื่อเล็งด้วยเมาส์' },

  { type:'sprite_forward', message0:'➡️ ให้ %1 พุ่งไปข้างหน้า ความเร็ว %2',
    args0:[SPR('NAME'), {type:'input_value', name:'SPD', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.sprite,
    tooltip:'เคลื่อนที่ตามมุมที่หันอยู่ ใช้คู่กับบล็อกหัน' },

  { type:'distance', message0:'📏 ระยะห่างระหว่าง %1 กับ %2',
    args0:[SPR('A'), SPR('B')],
    output:'Number', colour:C.sprite,
    tooltip:'ระยะที่ใกล้ที่สุดระหว่างสองกลุ่ม หน่วยเป็นจุดบนเวที' },

  { type:'shoot', message0:'🔫 ยิง %1 ออกจาก %2 ความเร็ว %3',
    args0:[SPR('BULLET'), SPR('FROM'), {type:'input_value', name:'SPD', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.input,
    tooltip:'สร้างกระสุนที่ตำแหน่งผู้ยิง แล้วพุ่งออกไปตามมุมที่ผู้ยิงหันอยู่' },

  { type:'lives_set', message0:'❤️ ตั้งพลังชีวิตเป็น %1',
    args0:[{type:'input_value', name:'N', check:'Number'}],
    inputsInline:true, previousStatement:null, nextStatement:null, colour:C.score,
    tooltip:'ใส่ไว้ในบล็อกเริ่มเกม เพื่อให้แถบพลังชีวิตแสดงบนเวที' }

  ]);

  BW.C = C;
})(window.Blockwright = window.Blockwright || {});
