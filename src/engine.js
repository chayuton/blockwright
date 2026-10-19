/* Blockwright — เอนจินเกม — ลูป ฟิสิกส์ การชน การวาดภาพ และเสียง
   ชุดเครื่องมือสร้างเกมด้วยการต่อบล็อก · สัญญาอนุญาต MIT */
(function (BW) {
  'use strict';

  /* =====================  เอนจินเกม  ===================== */
  function createEngine(canvas, hooks){
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var raf = 0, last = 0, acc = 0, actx = null;
    var S = null;

    function reset(){
      S = {
        bg:'#a8dcf5', title:'', gravity:0,
        ents:[], defs:{}, seq:0, warned:{},
        score:0, lives:3, livesShown:false, timer:null, timerOn:false,
        msg:null, msgT:0, time:0,
        keys:{}, keyQueue:[], clickQueue:[],
        mouse:{ x:W/2, y:H/2 },
        h:{ start:[], tick:[], key:{}, click:{}, stage:[], collide:[], edge:{}, timeout:[], every:[], after:[] },
        need:{ keys:{}, buttons:[], pointer:false, tap:false, forced:false },
        solids:[], running:false, over:null, errors:0
      };
    }
    reset();

    function log(m, lvl){ if(hooks && hooks.log) hooks.log(m, lvl); }
    function fail(err){
      S.errors++;
      log('ผิดพลาดขณะเล่น — ' + ((err && err.message) || err), 'err');
      if(S.errors >= 5){ log('หยุดเกมอัตโนมัติ เพราะเจอข้อผิดพลาดซ้ำหลายครั้ง', 'err'); stop(); }
    }
    function safe(fn, a, b){ try{ fn(a, b); }catch(err){ fail(err); } }
    function num(v, d){ v = Number(v); return isFinite(v) ? v : (d || 0); }

    function defOf(name){
      var d = S.defs[name];
      if(!d){
        if(!S.warned[name]){ S.warned[name] = 1; log('ยังไม่มีตัวละครชื่อ “' + name + '” — ตรวจชื่อในบล็อกอีกครั้ง', 'warn'); }
        d = S.defs[name] = { look:'⚪', w:22, h:22, color:'#8b91a6', edge:'none', fixed:false };
      }
      return d;
    }
    function list(name){
      var out = [], i;
      for(i = 0; i < S.ents.length; i++) if(S.ents[i].kind === name && !S.ents[i].dead) out.push(S.ents[i]);
      if(!out.length && !S.defs[name] && !S.warned[name]){
        S.warned[name] = 1; log('ยังไม่มีตัวละครชื่อ “' + name + '”', 'warn');
      }
      return out;
    }
    function add(name, x, y){
      var d = defOf(name);
      var e = { id:++S.seq, kind:name, look:d.look, color:d.color, w:d.w, h:d.h,
                x:num(x,0), y:num(y,0), vx:0, vy:0, rot:0, edge:d.edge || 'none',
                fixed:!!d.fixed, onGround:false, entered:false, dead:false };
      if(S.ents.length > 600){ log('ตัวละครเยอะเกิน 600 ตัว — ลบตัวเก่าที่สุดทิ้ง', 'warn'); S.ents.shift(); }
      S.ents.push(e);
      return e;
    }
    function overlap(a, b){
      return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
    }
    function kd(k){ return !!S.keys[k]; }

    /* ---------- API ที่บล็อกเรียกใช้ ---------- */
    var G = {
      onStart:function(f){ S.h.start.push(f); },
      setBackground:function(c){ S.bg = c; },
      setTitle:function(t){ S.title = String(t); },
      setGravity:function(n){ S.gravity = num(n, 0); },

      define:function(name, look, size){
        size = Math.max(4, num(size, 24));
        var old = S.defs[name];
        S.defs[name] = { look:look, w:size, h:size,
          color:(old && old.color) || '#3fb77a', edge:(old && old.edge) || 'none',
          fixed:!!(old && old.fixed) };
      },
      create:function(name, look, size, x, y){ G.define(name, look, size); return add(name, x, y); },
      spawn:function(name, x, y){ return add(name, x, y); },
      setColor:function(name, col){
        defOf(name).color = col;
        list(name).forEach(function(e){ e.color = col; });
      },
      setSize:function(name, w, h){
        var d = defOf(name); d.w = Math.max(1, num(w, d.w)); d.h = Math.max(1, num(h, d.h));
        list(name).forEach(function(e){ e.w = d.w; e.h = d.h; });
      },
      setEdge:function(name, mode){
        defOf(name).edge = mode;
        list(name).forEach(function(e){ e.edge = mode; });
      },
      setFixed:function(name){
        defOf(name).fixed = true;
        list(name).forEach(function(e){ e.fixed = true; e.vy = 0; });
      },
      setLook:function(name, look){
        defOf(name).look = look;
        list(name).forEach(function(e){ e.look = look; });
      },
      turn:function(name, deg){ list(name).forEach(function(e){ e.rot += num(deg, 0); }); },
      pointAt:function(name, target){
        var t = list(target)[0]; if(!t) return;
        list(name).forEach(function(e){
          if(e !== t) e.rot = Math.atan2(t.y - e.y, t.x - e.x) * 180 / Math.PI;
        });
      },
      pointMouse:function(name){
        list(name).forEach(function(e){
          e.rot = Math.atan2(S.mouse.y - e.y, S.mouse.x - e.x) * 180 / Math.PI;
        });
      },
      forward:function(name, spd){
        var sp = num(spd, 0);
        list(name).forEach(function(e){
          var r = e.rot * Math.PI / 180;
          e.vx = Math.cos(r) * sp; e.vy = Math.sin(r) * sp;
        });
      },
      shoot:function(bullet, from, spd){
        var sp = num(spd, 300);
        list(from).forEach(function(src){
          var e = add(bullet, src.x, src.y);
          e.rot = src.rot;
          var r = e.rot * Math.PI / 180;
          e.vx = Math.cos(r) * sp; e.vy = Math.sin(r) * sp;
        });
      },
      distance:function(a, b){
        var A = list(a), B = list(b), best = 99999, i, j, d;
        for(i = 0; i < A.length; i++) for(j = 0; j < B.length; j++){
          if(A[i] === B[j]) continue;
          d = Math.sqrt((A[i].x - B[j].x) * (A[i].x - B[j].x) + (A[i].y - B[j].y) * (A[i].y - B[j].y));
          if(d < best) best = d;
        }
        return Math.round(best);
      },
      goTo:function(name, x, y){ list(name).forEach(function(e){ e.x = num(x, e.x); e.y = num(y, e.y); }); },
      moveBy:function(name, dx, dy){ list(name).forEach(function(e){ e.x += num(dx, 0); e.y += num(dy, 0); }); },
      setProp:function(name, p, v){ list(name).forEach(function(e){ G.setE(e, p, v); }); },
      getProp:function(name, p){ var a = list(name); return a.length ? G.getE(a[0], p) : 0; },
      setE:function(e, p, v){
        if(!e) return;
        v = num(v, 0);
        if(p === 'w' || p === 'h') e[p] = Math.max(1, v); else e[p] = v;
      },
      getE:function(e, p){ return e ? num(e[p], 0) : 0; },
      count:function(name){ return list(name).length; },
      each:function(name, f){ list(name).slice().forEach(function(e){ if(!e.dead) safe(f, e); }); },
      removeAll:function(name){ list(name).forEach(function(e){ e.dead = true; }); },
      destroy:function(e){ if(e) e.dead = true; },

      onKey:function(k, f){ (S.h.key[k] = S.h.key[k] || []).push(f); },
      keyDown:function(k){ return kd(k); },
      onClick:function(name, f){ (S.h.click[name] = S.h.click[name] || []).push(f); },
      onStageClick:function(f){ S.h.stage.push(f); },
      moveWith:function(name, mode, spd){
        var s = num(spd, 0);
        list(name).forEach(function(e){
          if(mode === 'mouse'){
            var dx = S.mouse.x - e.x, dy = S.mouse.y - e.y;
            e.vx = dx * 6; e.vy = dy * 6;
            if(s > 0){ var d = Math.sqrt(e.vx * e.vx + e.vy * e.vy); if(d > s){ e.vx = e.vx / d * s; e.vy = e.vy / d * s; } }
            return;
          }
          if(mode === 'mousex'){
            e.vx = (S.mouse.x - e.x) * 10;
            if(s > 0) e.vx = Math.max(-s, Math.min(s, e.vx));
            return;
          }
          var ax = 0, ay = 0;
          if(mode === 'wasd'){ ax = (kd('d') ? 1 : 0) - (kd('a') ? 1 : 0); ay = (kd('s') ? 1 : 0) - (kd('w') ? 1 : 0); }
          else if(mode === 'lr'){ ax = (kd('ArrowRight') ? 1 : 0) - (kd('ArrowLeft') ? 1 : 0); }
          else if(mode === 'ud'){ ay = (kd('ArrowDown') ? 1 : 0) - (kd('ArrowUp') ? 1 : 0); }
          else { ax = (kd('ArrowRight') ? 1 : 0) - (kd('ArrowLeft') ? 1 : 0);
                 ay = (kd('ArrowDown') ? 1 : 0) - (kd('ArrowUp') ? 1 : 0); }
          if(mode !== 'ud') e.vx = ax * s;
          if(mode !== 'lr') e.vy = ay * s;
        });
      },
      /* ปุ่มบังคับบนหน้าจอที่ผู้สร้างเกมสั่งเอง
         ปุ่มบนหน้าจอเป็นร่างแฝงของปุ่มคีย์บอร์ด บล็อกเดิมจึงใช้ได้ทั้งหมด */
      showPad:function(mode){
        var ks = MODE_KEYS[mode] || MODE_KEYS.arrows, i;
        for(i = 0; i < ks.length; i++) S.need.keys[ks[i]] = true;
        S.need.forced = true;
      },
      screenButton:function(label, key){
        S.need.keys[key] = true;
        S.need.forced = true;
        for(var i = 0; i < S.need.buttons.length; i++){
          if(S.need.buttons[i].key === key){ S.need.buttons[i].label = String(label || key); return; }
        }
        S.need.buttons.push({ label:String(label || key), key:key });
      },
      jumpWith:function(name, key, power){
        S.need.keys[key] = true;
        G.onKey(key, function(){ G.jump(name, power); });
      },
      jump:function(name, p){
        list(name).forEach(function(e){
          if(e.onGround || S.gravity === 0){ e.vy = -Math.abs(num(p, 400)); e.onGround = false; }
        });
      },
      follow:function(name, target, spd){
        var t = list(target)[0]; if(!t) return;
        var s = num(spd, 60);
        list(name).forEach(function(e){
          var dx = t.x - e.x, dy = t.y - e.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          e.vx = dx / d * s; e.vy = dy / d * s;
        });
      },

      onTick:function(f){ S.h.tick.push(f); },
      onEvery:function(sec, f){ S.h.every.push({ sec:Math.max(0.05, num(sec, 1)), acc:0, fn:f }); },
      after:function(sec, f){ S.h.after.push({ at:S.time + Math.max(0, num(sec, 1)), fn:f, done:false }); },
      setTimer:function(sec){ S.timer = Math.max(0, num(sec, 0)); S.timerOn = true; },
      onTimeout:function(f){ S.h.timeout.push(f); },
      timeLeft:function(){ return S.timerOn ? Math.max(0, Math.round(S.timer * 10) / 10) : 0; },

      onCollide:function(a, b, f){ S.h.collide.push({ a:a, b:b, fn:f }); },
      onEdge:function(name, f){ (S.h.edge[name] = S.h.edge[name] || []).push(f); },
      setSolid:function(a, b){ S.solids.push({ a:a, b:b }); },
      touching:function(a, b){
        var A = list(a), B = list(b), i, j;
        for(i = 0; i < A.length; i++) for(j = 0; j < B.length; j++) if(A[i] !== B[j] && overlap(A[i], B[j])) return true;
        return false;
      },

      addScore:function(n){ S.score += num(n, 0); },
      setScore:function(n){ S.score = num(n, 0); },
      getScore:function(){ return S.score; },
      addLives:function(n){ S.livesShown = true; S.lives += num(n, 0); if(S.lives <= 0){ S.lives = 0; G.lose(); } },
      setLives:function(n){ S.livesShown = true; S.lives = Math.max(0, num(n, 3)); },
      getLives:function(){ return S.lives; },
      say:function(t, sec){ S.msg = String(t); S.msgT = Math.max(0.2, num(sec, 2)); },
      sound:play,
      win:function(){ if(!S.over){ S.over = 'win'; play('win'); finish(); } },
      lose:function(){ if(!S.over){ S.over = 'lose'; play('lose'); finish(); } },
      restart:function(){ if(hooks && hooks.restart) hooks.restart(); }
    };

    /* ---------- เสียง ---------- */
    var TONES = { pickup:[660,1100,0.09,'triangle'], jump:[320,620,0.13,'triangle'],
      hit:[220,80,0.18,'square'], shoot:[900,380,0.07,'square'],
      win:[523,1200,0.35,'triangle'], lose:[320,90,0.45,'sawtooth'], beep:[440,440,0.08,'sine'] };
    function play(kind){
      try{
        if(!actx){ var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; actx = new AC(); }
        if(actx.state === 'suspended') actx.resume();
        var m = TONES[kind] || TONES.beep, t0 = actx.currentTime;
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = m[3];
        o.frequency.setValueAtTime(m[0], t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(40, m[1]), t0 + m[2]);
        g.gain.setValueAtTime(0.13, t0);
        g.gain.exponentialRampToValueAtTime(0.0008, t0 + m[2]);
        o.connect(g); g.connect(actx.destination);
        o.start(t0); o.stop(t0 + m[2] + 0.03);
      }catch(err){ /* เสียงเล่นไม่ได้ ไม่ใช่เรื่องใหญ่ */ }
    }

    /* ---------- ฟิสิกส์และเหตุการณ์ ---------- */
    function solidPass(a0, b0){
      var A = list(a0), B = list(b0), i, j, a, b, dx, dy, ox, oy;
      for(i = 0; i < A.length; i++) for(j = 0; j < B.length; j++){
        a = A[i]; b = B[j];
        if(a === b) continue;
        dx = a.x - b.x; dy = a.y - b.y;
        ox = (a.w + b.w) / 2 - Math.abs(dx);
        oy = (a.h + b.h) / 2 - Math.abs(dy);
        if(ox <= 0 || oy <= 0) continue;
        if(ox < oy){ a.x += dx > 0 ? ox : -ox; a.vx = 0; }
        else { a.y += dy > 0 ? oy : -oy; if(dy < 0) a.onGround = true; a.vy = 0; }
      }
    }
    function edgePass(e){
      var hw = e.w / 2, hh = e.h / 2, hit = false, m = e.edge || 'none';
      /* ตัวละครที่เกิดนอกจอ เช่น ศัตรูที่ร่วงลงมาจากด้านบน ยังไม่นับว่าถึงขอบ
         จนกว่าจะเข้ามาในเวทีสักครั้ง */
      if(e.x + hw > 0 && e.x - hw < W && e.y + hh > 0 && e.y - hh < H) e.entered = true;
      if(m === 'bounce'){
        if(e.x - hw < 0){ e.x = hw; e.vx = Math.abs(e.vx); hit = true; }
        if(e.x + hw > W){ e.x = W - hw; e.vx = -Math.abs(e.vx); hit = true; }
        if(e.y - hh < 0){ e.y = hh; e.vy = Math.abs(e.vy); hit = true; }
        if(e.y + hh > H){ e.y = H - hh; e.vy = -Math.abs(e.vy); hit = true; }
      } else if(m === 'stop'){
        if(e.x - hw < 0){ e.x = hw; if(e.vx < 0) e.vx = 0; hit = true; }
        if(e.x + hw > W){ e.x = W - hw; if(e.vx > 0) e.vx = 0; hit = true; }
        if(e.y - hh < 0){ e.y = hh; if(e.vy < 0) e.vy = 0; hit = true; }
        if(e.y + hh > H){ e.y = H - hh; if(e.vy > 0) e.vy = 0; e.onGround = true; hit = true; }
      } else if(m === 'wrap'){
        if(e.x - hw > W){ e.x = -hw; hit = true; }
        if(e.x + hw < 0){ e.x = W + hw; hit = true; }
        if(e.y - hh > H){ e.y = -hh; hit = true; }
        if(e.y + hh < 0){ e.y = H + hh; hit = true; }
      } else if(e.entered){
        if(e.x + hw < 0 || e.x - hw > W || e.y + hh < 0 || e.y - hh > H){
          hit = true;
          if(m === 'remove') e.dead = true;
        }
      }
      if(e.x < -900 || e.x > W + 900 || e.y < -900 || e.y > H + 900) e.dead = true;
      if(hit && S.h.edge[e.kind]) S.h.edge[e.kind].forEach(function(f){ safe(f, e); });
    }
    function clickPass(p){
      var name, arr, i, e;
      for(i = 0; i < S.h.stage.length; i++) safe(S.h.stage[i], null);
      for(name in S.h.click){
        arr = list(name);
        for(i = arr.length - 1; i >= 0; i--){
          e = arr[i];
          if(Math.abs(p.x - e.x) <= e.w / 2 && Math.abs(p.y - e.y) <= e.h / 2){
            S.h.click[name].forEach(function(f){ safe(f, e); });
            break;
          }
        }
      }
    }
    function step(dt){
      var i, j, k, h, A, B, a, b;
      S.time += dt;
      if(S.timerOn && S.timer > 0){
        S.timer -= dt;
        if(S.timer <= 0){ S.timer = 0; S.h.timeout.forEach(function(f){ safe(f); }); }
      }
      for(i = 0; i < S.h.every.length; i++){
        h = S.h.every[i]; h.acc += dt; k = 0;
        while(h.acc >= h.sec && k++ < 4){ h.acc -= h.sec; safe(h.fn); }
      }
      for(i = 0; i < S.h.after.length; i++){
        h = S.h.after[i];
        if(!h.done && S.time >= h.at){ h.done = true; safe(h.fn); }
      }
      for(i = 0; i < S.h.tick.length; i++) safe(S.h.tick[i]);
      while(S.keyQueue.length){
        k = S.keyQueue.shift();
        if(S.h.key[k]) S.h.key[k].forEach(function(f){ safe(f); });
      }
      while(S.clickQueue.length) clickPass(S.clickQueue.shift());

      for(i = 0; i < S.ents.length; i++){
        var e = S.ents[i];
        if(e.dead) continue;
        if(!e.fixed) e.vy += S.gravity * dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.onGround = false;
      }
      for(i = 0; i < S.solids.length; i++) solidPass(S.solids[i].a, S.solids[i].b);
      for(i = 0; i < S.ents.length; i++) if(!S.ents[i].dead) edgePass(S.ents[i]);

      for(i = 0; i < S.h.collide.length; i++){
        h = S.h.collide[i]; A = list(h.a); B = list(h.b);
        for(j = 0; j < A.length; j++) for(k = 0; k < B.length; k++){
          a = A[j]; b = B[k];
          if(a === b || a.dead || b.dead) continue;
          if(overlap(a, b)) safe(h.fn, a, b);
        }
      }
      if(S.msgT > 0){ S.msgT -= dt; if(S.msgT <= 0) S.msg = null; }
      if(S.ents.length) S.ents = S.ents.filter(function(x){ return !x.dead; });
    }

    /* ---------- วาดภาพ ---------- */
    var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
    function drawEnt(e){
      ctx.save();
      ctx.translate(e.x, e.y);
      if(e.rot) ctx.rotate(e.rot * Math.PI / 180);
      if(e.look === 'RECT'){ ctx.fillStyle = e.color; ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h); }
      else if(e.look === 'CIRC'){
        ctx.fillStyle = e.color; ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, e.w / 2), Math.max(1, e.h / 2), 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.font = Math.max(8, e.h) + 'px ' + EMOJI;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.look, 0, 1);
      }
      ctx.restore();
    }
    function hud(){
      ctx.save();
      ctx.fillStyle = 'rgba(8,10,18,.34)';
      ctx.fillRect(0, 0, W, 26);
      ctx.font = '600 13px "IBM Plex Sans Thai", system-ui, sans-serif';
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(S.title || 'เกมของฉัน', 10, 14);
      ctx.textAlign = 'right';
      var bits = ['คะแนน ' + S.score];
      if(S.livesShown || S.lives !== 3) bits.push('❤️ ' + S.lives);
      if(S.timerOn) bits.push('⏳ ' + Math.ceil(S.timer) + 'วิ');
      ctx.fillText(bits.join('   '), W - 10, 14);
      if(S.msg){
        ctx.font = '600 15px "IBM Plex Sans Thai", system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var tw = ctx.measureText(S.msg).width;
        ctx.fillStyle = 'rgba(8,10,18,.66)';
        ctx.fillRect(W / 2 - tw / 2 - 14, H - 52, tw + 28, 30);
        ctx.fillStyle = '#fff';
        ctx.fillText(S.msg, W / 2, H - 37);
      }
      ctx.restore();
    }
    function draw(){
      ctx.fillStyle = S.bg; ctx.fillRect(0, 0, W, H);
      for(var i = 0; i < S.ents.length; i++) if(!S.ents[i].dead) drawEnt(S.ents[i]);
      hud();
    }

    /* ---------- วงจรหลัก ---------- */
    function frame(ts){
      raf = requestAnimationFrame(frame);
      if(!last) last = ts;
      var dt = Math.min(0.1, (ts - last) / 1000); last = ts;
      if(S.running){
        acc += dt;
        var guard = 0;
        while(acc >= 1 / 60 && guard++ < 5){ step(1 / 60); acc -= 1 / 60; }
      }
      draw();
    }
    function finish(){
      S.running = false;
      if(hooks && hooks.ended) hooks.ended(S.over, S.score);
    }
    function stop(){
      S.running = false;
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      last = 0; acc = 0;
      draw();
    }

    /* ---------- ตรวจว่าเกมนี้ต้องบังคับด้วยอะไร ----------
       อ่านจากข้อความโค้ดที่บล็อกแปลงออกมา จึงรู้ผลก่อนเริ่มเล่น
       หน้าจอนำไปสร้างปุ่มบังคับให้ตรงกับเกม ไม่ขึ้นปุ่มที่เกมไม่ได้ใช้ */
    var RE_KEY = /G\.(?:onKey|keyDown)\("((?:[^"\\]|\\.)*)"/g;
    var RE_MOVE = /G\.moveWith\("(?:[^"\\]|\\.)*",\s*"([a-z]+)"/g;
    var MODE_KEYS = {
      arrows:['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'],
      lr:['ArrowLeft','ArrowRight'],
      ud:['ArrowUp','ArrowDown'],
      wasd:['a','d','w','s']
    };
    var RE_PAD = /G\.showPad\("([a-z]+)"\)/g;
    var RE_BTN = /G\.screenButton\(("(?:[^"\\]|\\.)*"),\s*("(?:[^"\\]|\\.)*")\)/g;
    var RE_JUMPKEY = /G\.jumpWith\("(?:[^"\\]|\\.)*",\s*("(?:[^"\\]|\\.)*")/g;
    function scanControls(code){
      var need = { keys:{}, buttons:[], pointer:false, tap:false, forced:false }, m, i, ks;
      code = String(code || '');

      RE_KEY.lastIndex = 0;
      while((m = RE_KEY.exec(code))){
        try{ need.keys[JSON.parse('"' + m[1] + '"')] = true; }catch(err){}
      }

      RE_MOVE.lastIndex = 0;
      while((m = RE_MOVE.exec(code))){
        ks = MODE_KEYS[m[1]];
        if(ks){ for(i = 0; i < ks.length; i++) need.keys[ks[i]] = true; }
        else if(m[1] === 'mouse' || m[1] === 'mousex') need.pointer = true;
      }

      /* ปุ่มที่ผู้สร้างเกมสั่งไว้เอง อ่านได้ตั้งแต่ยังไม่เริ่มเล่น */
      RE_PAD.lastIndex = 0;
      while((m = RE_PAD.exec(code))){
        ks = MODE_KEYS[m[1]];
        if(ks){ for(i = 0; i < ks.length; i++) need.keys[ks[i]] = true; }
        need.forced = true;
      }
      RE_BTN.lastIndex = 0;
      while((m = RE_BTN.exec(code))){
        try{
          var label = JSON.parse(m[1]), key = JSON.parse(m[2]), found = false;
          need.keys[key] = true;
          need.forced = true;
          for(i = 0; i < need.buttons.length; i++) if(need.buttons[i].key === key) found = true;
          if(!found) need.buttons.push({ label:label || key, key:key });
        }catch(err){}
      }
      RE_JUMPKEY.lastIndex = 0;
      while((m = RE_JUMPKEY.exec(code))){
        try{ need.keys[JSON.parse(m[1])] = true; }catch(err){}
      }

      if(/G\.pointMouse\(/.test(code)) need.pointer = true;
      if(/G\.onStageClick\(|G\.onClick\(/.test(code)) need.tap = true;
      return need;
    }

    /* ---------- สร้างเกมจากโค้ด ---------- */
    function build(code){
      stop(); reset();
      S.need = scanControls(code);
      var fn;
      try{ fn = new Function('G', '"use strict";\nvar me = null, other = null;\n' + code); }
      catch(err){ log('โค้ดจากบล็อกยังไม่สมบูรณ์ — ' + err.message, 'err'); draw(); return false; }
      try{ fn(G); }
      catch(err){ log('ตั้งค่าเกมไม่สำเร็จ — ' + err.message, 'err'); draw(); return false; }
      for(var i = 0; i < S.h.start.length; i++) safe(S.h.start[i]);
      draw();
      return true;
    }
    function start(){
      S.running = true; S.over = null; last = 0; acc = 0;
      if(!raf) raf = requestAnimationFrame(frame);
    }

    /* ---------- อินพุตจากผู้ใช้ ---------- */
    function keyName(ev){
      if(ev.key === ' ' || ev.code === 'Space') return 'Space';
      if(ev.key && ev.key.length === 1) return ev.key.toLowerCase();
      return ev.key;
    }
    window.addEventListener('keydown', function(ev){
      var k = keyName(ev);
      if(S.running && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].indexOf(k) >= 0) ev.preventDefault();
      if(!S.keys[k]) S.keyQueue.push(k);
      S.keys[k] = true;
    });
    window.addEventListener('keyup', function(ev){ S.keys[keyName(ev)] = false; });
    window.addEventListener('blur', function(){ S.keys = {}; });

    function toStage(ev){
      var r = canvas.getBoundingClientRect();
      return { x:(ev.clientX - r.left) * W / r.width, y:(ev.clientY - r.top) * H / r.height };
    }
    canvas.addEventListener('pointermove', function(ev){ var p = toStage(ev); S.mouse.x = p.x; S.mouse.y = p.y; });
    canvas.addEventListener('pointerdown', function(ev){
      ev.preventDefault();
      var p = toStage(ev); S.mouse.x = p.x; S.mouse.y = p.y;
      if(S.running) S.clickQueue.push(p);
    });

    return { build:build, start:start, stop:stop, draw:draw,
             isRunning:function(){ return S.running; },
             state:function(){ return S; },
             controls:function(){ return S.need; },
             /* ปุ่มบังคับบนหน้าจอเรียกสองตัวนี้ ให้ผลเหมือนกดคีย์บอร์ดจริง */
             press:function(k){ if(!S.keys[k]) S.keyQueue.push(k); S.keys[k] = true; },
             release:function(k){ S.keys[k] = false; } };
  }

  BW.createEngine = createEngine;
})(window.Blockwright = window.Blockwright || {});
