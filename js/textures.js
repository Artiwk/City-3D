/* =========================================================
 * textures.js — โรงงานเท็กซ์เจอร์สมจริง (วาดบน canvas ทั้งหมด ทำงานออฟไลน์)
 * ทุกเท็กซ์เจอร์มี grain/noise ละเอียด + bump map แยกต่างหาก
 * ใช้: THREE.ObjTex({ color, map, bumpMap, bumpScale, roughnessMap, ... })
 * ========================================================= */
(function () {
  'use strict';

  var maxAniso = 4;
  function setAniso(v) { if (v) maxAniso = v; }

  function rng(seed) {
    var s = seed || 1;
    return function () {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  function canvasTex(cv, repX, repY) {
    var t = new THREE.CanvasTexture(cv);
    if (repX || repY) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX || 1, repY || 1);
    }
    t.anisotropy = maxAniso;
    t.encoding = THREE.sRGBEncoding; // renderer ใช้ outputEncoding = sRGB
    return t;
  }

  function linTex(cv, repX, repY) {
    var t = new THREE.CanvasTexture(cv);
    if (repX || repY) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX || 1, repY || 1);
    }
    t.anisotropy = maxAniso;
    return t; // bump/roughness map ต้องเป็น linear
  }

  /* ---------- noise เม็ดละเอียด (ใช้ซ้อนทุกเท็กซ์เจอร์) ---------- */
  function grain(g, W, H, seed, alpha, bright) {
    var rand = rng(seed);
    var n = Math.floor(W * H / 14);
    for (var i = 0; i < n; i++) {
      var v = Math.floor(rand() * 255);
      if (bright !== undefined) v = bright + Math.floor((rand() - 0.5) * 60);
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + alpha + ')';
      g.fillRect(rand() * W, rand() * H, 1 + rand() * 1.6, 1 + rand() * 1.6);
    }
  }
  // คราบ/รอยด่างใหญ่ ๆ ไม่เป็นระเบียบ
  function blotches(g, W, H, seed, count, alpha, dark) {
    var rand = rng(seed);
    for (var i = 0; i < count; i++) {
      var x = rand() * W, y = rand() * H, r = 4 + rand() * 26;
      var grd = g.createRadialGradient(x, y, 0, x, y, r);
      var v = dark ? 0 : 255;
      grd.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',' + alpha * rand() + ')');
      grd.addColorStop(1, 'rgba(' + v + ',' + v + ',' + v + ',0)');
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  /* ================= หญ้า (สนามหญ้าจริง มีปุยหยิบมีคราบ) ================= */
  function grass(size) {
    size = size || 256;
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var g = cv.getContext('2d');
    var rand = rng(101);
    g.fillStyle = '#4e7a35';
    g.fillRect(0, 0, size, size);
    // หย่อมหญ้าเขียว-เหลือง-แห้ง
    for (var p = 0; p < 90; p++) {
      var x = rand() * size, y = rand() * size, r = 6 + rand() * 30;
      var dry = rand();
      var col = dry < 0.28 ? [104, 118, 58] : dry < 0.55 ? [72, 112, 44] : [86, 130, 52];
      var grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.5)');
      grd.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // เส้นหญ้าเล็ก ๆ
    for (var b = 0; b < 2600; b++) {
      var bx = rand() * size, by = rand() * size;
      var shade = 40 + Math.floor(rand() * 70);
      g.strokeStyle = 'rgba(' + (shade + 20) + ',' + (shade + 62) + ',' + shade + ',0.5)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + (rand() - 0.5) * 3, by - 2 - rand() * 3);
      g.stroke();
    }
    grain(g, size, size, 5, 0.1);
    blotches(g, size, size, 6, 26, 0.06, true);
    var map = canvasTex(cv, 1, 1);

    // bump: เม็ดหญ้า
    var bc = document.createElement('canvas');
    bc.width = bc.height = 128;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 128, 128);
    var br = rng(102);
    for (var i = 0; i < 3000; i++) {
      var vv = br() < 0.5 ? 90 : 180;
      bg.fillStyle = 'rgba(' + vv + ',' + vv + ',' + vv + ',0.35)';
      bg.fillRect(br() * 128, br() * 128, 1, 1 + br() * 2);
    }
    var bump = linTex(bc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.35 };
  }

  /* ================= ยางมะตอย (ถนนจริง มีกรวด+รอยซ่อม) ================= */
  function asphalt() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var rand = rng(201);
    g.fillStyle = '#2e3134';
    g.fillRect(0, 0, 256, 256);
    // เม็ดกรวดในน้ำมัน
    for (var i = 0; i < 5200; i++) {
      var v = 30 + Math.floor(rand() * 80);
      g.fillStyle = 'rgba(' + v + ',' + (v + 2) + ',' + (v + 6) + ',0.7)';
      g.fillRect(rand() * 256, rand() * 256, 1 + rand() * 1.8, 1 + rand() * 1.8);
    }
    // รอยแตกเล็ก
    g.strokeStyle = 'rgba(15,15,16,0.55)';
    for (var c = 0; c < 12; c++) {
      g.lineWidth = 0.6 + rand();
      g.beginPath();
      var cx = rand() * 256, cy = rand() * 256;
      g.moveTo(cx, cy);
      for (var s = 0; s < 5; s++) {
        cx += (rand() - 0.5) * 26; cy += (rand() - 0.5) * 26;
        g.lineTo(cx, cy);
      }
      g.stroke();
    }
    // รอยซ่อมน้ำมันดำ ๆ + คราบจากรถ
    blotches(g, 256, 256, 202, 18, 0.08, true);
    blotches(g, 256, 256, 203, 10, 0.05, false);
    grain(g, 256, 256, 204, 0.08);
    var map = canvasTex(cv, 1, 1);

    var bc = document.createElement('canvas');
    bc.width = bc.height = 128;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 128, 128);
    var br = rng(205);
    for (var j = 0; j < 2400; j++) {
      var vv2 = 60 + br() * 130;
      bg.fillStyle = 'rgba(' + vv2 + ',' + vv2 + ',' + vv2 + ',0.5)';
      bg.fillRect(br() * 128, br() * 128, 1 + br() * 1.5, 1 + br() * 1.5);
    }
    var bump = linTex(bc, 1, 1);

    // roughness map: รอยลื่นจากยางรถ
    var rc = document.createElement('canvas');
    rc.width = rc.height = 128;
    var rg = rc.getContext('2d');
    rg.fillStyle = '#d8d8d8'; rg.fillRect(0, 0, 128, 128);
    blotches(rg, 128, 128, 206, 20, 0.25, false);
    var rough = linTex(rc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.22, roughnessMap: rough };
  }

  /* ================= คอนกรีต (ทางเท้า/ลาน) รอยแตกบาง ๆ ================= */
  function concrete() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var rand = rng(301);
    g.fillStyle = '#9aa0a4';
    g.fillRect(0, 0, 256, 256);
    blotches(g, 256, 256, 302, 30, 0.07, true);
    blotches(g, 256, 256, 303, 16, 0.06, false);
    // รอยแตกบาง ๆ
    g.strokeStyle = 'rgba(70,74,78,0.4)';
    for (var c = 0; c < 6; c++) {
      g.lineWidth = 0.7;
      g.beginPath();
      var cx = rand() * 256, cy = rand() * 256;
      g.moveTo(cx, cy);
      for (var s = 0; s < 4; s++) { cx += (rand() - 0.5) * 40; cy += (rand() - 0.5) * 40; g.lineTo(cx, cy); }
      g.stroke();
    }
    grain(g, 256, 256, 304, 0.14);
    var map = canvasTex(cv, 1, 1);

    var bc = document.createElement('canvas');
    bc.width = bc.height = 128;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 128, 128);
    grain(bg, 128, 128, 305, 0.3);
    var bump = linTex(bc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.15 };
  }

  /* ================= อิฐ (โทนแดงอิฐ/น้ำตาล มีรอยต่อปูนจริง) ================= */
  function brick(tone) {
    tone = tone || 0;
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var rand = rng(401 + tone);
    var mortars = ['#8f8a82', '#9a948a', '#84807a'];
    var palettes = [
      ['#9c4a32', '#8d422c', '#a85a3d', '#93462e', '#7d3d28'],   // แดงอิฐ
      ['#a3766a', '#96685c', '#ad8276', '#8e6154', '#7f5a4e'],   // ชมพูดินเผา
      ['#6e5a48', '#665241', '#796552', '#5f4d3e', '#71604e'], // น้ำตาลเก่า
      ['#b8b0a4', '#aba398', '#c2b8ac', '#a39b90', '#948c82'],   // ซีเมนต์บล็อก
    ];
    var pal = palettes[tone % palettes.length];
    g.fillStyle = mortars[tone % mortars.length];
    g.fillRect(0, 0, 256, 256);
    var bh = 16, bw = 42, gap = 3;
    for (var row = 0; row * (bh + gap) < 256 + bh; row++) {
      var off = (row % 2) * (bw / 2 + gap / 2);
      for (var col = -1; col * (bw + gap) < 256 + bw; col++) {
        var x = col * (bw + gap) + off, y = row * (bh + gap);
        var c = pal[Math.floor(rand() * pal.length)];
        g.fillStyle = c;
        g.fillRect(x, y, bw, bh);
        // ขอบด้านอิฐ (นูนเงาเล็กน้อย)
        g.fillStyle = 'rgba(255,255,255,0.10)';
        g.fillRect(x, y, bw, 1.5);
        g.fillStyle = 'rgba(0,0,0,0.16)';
        g.fillRect(x, y + bh - 1.5, bw, 1.5);
        // รอยด่างบนตัวอิฐ
        if (rand() < 0.4) {
          g.fillStyle = 'rgba(0,0,0,' + (0.05 + rand() * 0.09) + ')';
          g.fillRect(x + rand() * bw * 0.5, y + rand() * bh * 0.5, bw * (0.2 + rand() * 0.5), bh * 0.5);
        }
      }
    }
    grain(g, 256, 256, 402 + tone, 0.1);
    var map = canvasTex(cv, 1, 1);

    // bump: อิฐนูน
    var bc = document.createElement('canvas');
    bc.width = bc.height = 256;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#6a6a6a'; bg.fillRect(0, 0, 256, 256);
    var br = rng(403 + tone);
    for (var r2 = 0; r2 * 19 < 256 + 16; r2++) {
      var off2 = (r2 % 2) * 22.5;
      for (var c2 = -1; c2 * 45 < 256 + 42; c2++) {
        bg.fillStyle = '#c8c8c8';
        bg.fillRect(c2 * 45 + off2, r2 * 19, 42, 16);
        bg.fillStyle = '#ffffff';
        bg.fillRect(c2 * 45 + off2, r2 * 19, 42, 2);
        bg.fillStyle = '#5a5a5a';
        bg.fillRect(c2 * 45 + off2, r2 * 19 + 14, 42, 2);
      }
    }
    var bump = linTex(bc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.5 };
  }

  /* ================= กระเบื้องหลังคา (ทรงจั่วไทย/บ้าน) ================= */
  function roofTile(hue) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var rand = rng(501 + hue);
    var cols = [
      ['#8a3b2a', '#6e2f22', '#a04a35'],   // เเดงดินเผา
      ['#4a5a68', '#3d4a56', '#576878'],   // เทาเข้ม
      ['#5c6e46', '#4d5c3a', '#6a7d52'],   // เขียวหม่น
    ];
    var c = cols[hue % cols.length];
    g.fillStyle = c[1];
    g.fillRect(0, 0, 256, 256);
    // แถวกระเบื้องโค้งซ้อน
    var th = 22, tw = 32;
    for (var row = 0; row * (th - 4) < 256 + th; row++) {
      var off = (row % 2) * (tw / 2);
      for (var col = -1; col * tw < 256 + tw; col++) {
        var x = col * tw + off, y = row * (th - 4);
        var grd = g.createLinearGradient(x, y, x, y + th);
        grd.addColorStop(0, c[2]);
        grd.addColorStop(0.45, c[0]);
        grd.addColorStop(1, c[1]);
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + tw / 2, y + th * 0.9, x + tw, y);
        g.lineTo(x + tw, y + th);
        g.quadraticCurveTo(x + tw / 2, y + th * 1.7, x, y + th);
        g.closePath();
        g.fill();
      }
    }
    // คราบมอส/ฝุ่น
    blotches(g, 256, 256, 502 + hue, 22, 0.09, false);
    grain(g, 256, 256, 503 + hue, 0.1);
    return { map: canvasTex(cv, 1, 1), bumpScale: 0.35 };
  }

  /* ================= ปูนฉาบ (ผนังอาคาร มีรอยด่าง/รอยน้ำซึม) ================= */
  function plaster() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var rand = rng(601);
    g.fillStyle = '#d9d5cd';
    g.fillRect(0, 0, 256, 256);
    // รอยฉาบปูน
    for (var i = 0; i < 70; i++) {
      var x = rand() * 256, y = rand() * 256;
      g.fillStyle = 'rgba(' + (150 + rand() * 80 | 0) + ',' + (150 + rand() * 75 | 0) + ',' + (140 + rand() * 70 | 0) + ',0.14)';
      g.beginPath();
      g.ellipse(x, y, 6 + rand() * 30, 4 + rand() * 18, rand() * 3, 0, Math.PI * 2);
      g.fill();
    }
    // รอยน้ำซึมจากขอบบน
    for (var s = 0; s < 7; s++) {
      var sx = rand() * 256;
      var grd = g.createLinearGradient(sx, 0, sx + (rand() - 0.5) * 30, 30 + rand() * 60);
      grd.addColorStop(0, 'rgba(90,84,70,0.16)');
      grd.addColorStop(1, 'rgba(90,84,70,0)');
      g.fillStyle = grd;
      g.fillRect(sx - 6, 0, 14 + rand() * 16, 40 + rand() * 70);
    }
    grain(g, 256, 256, 602, 0.11);
    var map = canvasTex(cv, 1, 1);

    var bc = document.createElement('canvas');
    bc.width = bc.height = 128;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 128, 128);
    var br = rng(603);
    for (var n = 0; n < 40; n++) {
      var nx = br() * 128, ny = br() * 128, nr = 3 + br() * 10;
      var vv = br() < 0.5 ? 110 : 155;
      var grd2 = bg.createRadialGradient(nx, ny, 0, nx, ny, nr);
      grd2.addColorStop(0, 'rgba(' + vv + ',' + vv + ',' + vv + ',0.35)');
      grd2.addColorStop(1, 'rgba(' + vv + ',' + vv + ',' + vv + ',0)');
      bg.fillStyle = grd2;
      bg.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
    }
    grain(bg, 128, 128, 604, 0.18);
    var bump = linTex(bc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.25 };
  }

  /* ================= ผนังโรงงาน แผ่นสังกะสีเป็นร่อง ================= */
  function corrugated() {
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var g = cv.getContext('2d');
    g.fillStyle = '#b6bcc0';
    g.fillRect(0, 0, 128, 128);
    for (var x = 0; x < 128; x += 8) {
      var grd = g.createLinearGradient(x, 0, x + 8, 0);
      grd.addColorStop(0, 'rgba(255,255,255,0.22)');
      grd.addColorStop(0.5, 'rgba(0,0,0,0.02)');
      grd.addColorStop(1, 'rgba(0,0,0,0.28)');
      g.fillStyle = grd;
      g.fillRect(x, 0, 8, 128);
    }
    blotches(g, 128, 128, 701, 10, 0.1, true); // คราบสนิม/ฝุ่น
    grain(g, 128, 128, 702, 0.07);
    var map = canvasTex(cv, 1, 1);

    var bc = document.createElement('canvas');
    bc.width = 64; bc.height = 64;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 64, 64);
    for (var x2 = 0; x2 < 64; x2 += 8) {
      var grd2 = bg.createLinearGradient(x2, 0, x2 + 8, 0);
      grd2.addColorStop(0, '#e0e0e0');
      grd2.addColorStop(1, '#4a4a4a');
      bg.fillStyle = grd2;
      bg.fillRect(x2, 0, 8, 64);
    }
    var bump = linTex(bc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.4 };
  }

  /* ================= กระจกอาคาร (สะท้อนฟ้าแบบแถบชั้น) ================= */
  function glass() {
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var g = cv.getContext('2d');
    var rand = rng(801);
    var grd = g.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, '#b7d4e4');
    grd.addColorStop(0.5, '#8fb3c9');
    grd.addColorStop(1, '#7ea3ba');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    // สะท้อนเมฆ
    g.fillStyle = 'rgba(255,255,255,0.2)';
    for (var c = 0; c < 8; c++) {
      g.beginPath();
      g.ellipse(rand() * 128, rand() * 128, 10 + rand() * 22, 3 + rand() * 7, 0, 0, Math.PI * 2);
      g.fill();
    }
    // โครงกระจก
    g.strokeStyle = 'rgba(30,42,52,0.55)';
    g.lineWidth = 2;
    for (var x = 0; x <= 128; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
    for (var y = 0; y <= 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
    grain(g, 128, 128, 802, 0.05);
    return { map: canvasTex(cv, 1, 1), bumpScale: 0.08 };
  }

  /* ================= น้ำ (ทะเล/ทะเลสาบ) ================= */
  function water() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var rand = rng(901);
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#316a94');
    grd.addColorStop(0.5, '#3d7ba6');
    grd.addColorStop(1, '#2c5f86');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    // คลื่นลมเล็ก ๆ
    for (var i = 0; i < 160; i++) {
      var x = rand() * 256, y = rand() * 256, len = 6 + rand() * 26;
      g.strokeStyle = 'rgba(255,255,255,' + (0.05 + rand() * 0.13) + ')';
      g.lineWidth = 0.8 + rand();
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + len / 2, y - 1.5 - rand() * 2, x + len, y);
      g.stroke();
    }
    blotches(g, 256, 256, 902, 14, 0.05, false);
    var map = canvasTex(cv, 1, 1);

    var bc = document.createElement('canvas');
    bc.width = bc.height = 128;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 128, 128);
    var br = rng(903);
    for (var w = 0; w < 120; w++) {
      var wx = br() * 128, wy = br() * 128, wl = 8 + br() * 30;
      bg.strokeStyle = 'rgba(220,220,220,0.5)';
      bg.lineWidth = 1 + br();
      bg.beginPath();
      bg.moveTo(wx, wy);
      bg.quadraticCurveTo(wx + wl / 2, wy - 2, wx + wl, wy);
      bg.stroke();
    }
    var bump = linTex(bc, 1, 1);
    return { map: map, bumpMap: bump, bumpScale: 0.5 };
  }

  /* ================= เปลือกไม้ + ใบไม้ ================= */
  function bark() {
    var cv = document.createElement('canvas');
    cv.width = 64; cv.height = 128;
    var g = cv.getContext('2d');
    var rand = rng(1001);
    g.fillStyle = '#5d4326';
    g.fillRect(0, 0, 64, 128);
    for (var i = 0; i < 60; i++) {
      var x = rand() * 64;
      g.strokeStyle = 'rgba(' + (40 + rand() * 50 | 0) + ',' + (30 + rand() * 36 | 0) + ',' + (18 + rand() * 24 | 0) + ',0.6)';
      g.lineWidth = 1 + rand() * 2.2;
      g.beginPath();
      g.moveTo(x, -4);
      var y = 0;
      while (y < 132) { y += 10 + rand() * 16; g.lineTo(x + (rand() - 0.5) * 7, y); }
      g.stroke();
    }
    grain(g, 64, 128, 1002, 0.12);
    return { map: canvasTex(cv, 1, 1), bumpScale: 0.3 };
  }

  function leaves() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var g = cv.getContext('2d');
    var rand = rng(1101);
    g.fillStyle = '#3a6e2c';
    g.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 1600; i++) {
      var hue = rand();
      var col = hue < 0.35 ? [58, 106, 42] : hue < 0.7 ? [48, 92, 36] : [76, 118, 48];
      g.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.8)';
      g.beginPath();
      g.ellipse(rand() * 128, rand() * 128, 1.5 + rand() * 3, 1 + rand() * 2, rand() * 3, 0, Math.PI * 2);
      g.fill();
    }
    // ช่องแสง (พินัยกรรม alpha)
    var im = g.getImageData(0, 0, 128, 128);
    for (var p = 0; p < 60; p++) {
      var px = Math.floor(rand() * 128), py = Math.floor(rand() * 128), pr = 3 + rand() * 7;
      for (var dx = -pr; dx <= pr; dx++) for (var dy = -pr; dy <= pr; dy++) {
        var xx = px + dx, yy = py + dy;
        if (xx >= 0 && xx < 128 && yy >= 0 && yy < 128 && dx * dx + dy * dy < pr * pr) {
          im.data[(yy * 128 + xx) * 4 + 3] = 0;
        }
      }
    }
    g.putImageData(im, 0, 0);
    var t = new THREE.CanvasTexture(cv);
    t.anisotropy = maxAniso;
    t.encoding = THREE.sRGBEncoding;
    return { map: t, bumpScale: 0.3 };
  }

  /* ================= ฟื้นฟูไม้ (ม้านั่ง/ท่ารับรถ) ================= */
  function wood() {
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var g = cv.getContext('2d');
    var rand = rng(1201);
    g.fillStyle = '#8a6a44';
    g.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 40; i++) {
      var y = rand() * 128;
      g.strokeStyle = 'rgba(' + (90 + rand() * 60 | 0) + ',' + (66 + rand() * 44 | 0) + ',' + (38 + rand() * 28 | 0) + ',0.5)';
      g.lineWidth = 0.8 + rand() * 1.6;
      g.beginPath();
      g.moveTo(0, y);
      for (var x = 0; x <= 128; x += 16) g.lineTo(x, y + Math.sin(x * 0.1 + i) * 2);
      g.stroke();
    }
    grain(g, 128, 128, 1202, 0.09);
    return { map: canvasTex(cv, 1, 1), bumpScale: 0.2 };
  }

  /* ================= พื้นโคลน/ดิน ================= */
  function dirt() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var g = cv.getContext('2d');
    var rand = rng(1301);
    g.fillStyle = '#7a6446';
    g.fillRect(0, 0, 128, 128);
    blotches(g, 128, 128, 1302, 30, 0.12, true);
    blotches(g, 128, 128, 1303, 18, 0.08, false);
    grain(g, 128, 128, 1304, 0.16);
    var map = canvasTex(cv, 1, 1);
    var bc = document.createElement('canvas');
    bc.width = bc.height = 64;
    var bg = bc.getContext('2d');
    bg.fillStyle = '#808080'; bg.fillRect(0, 0, 64, 64);
    grain(bg, 64, 64, 1305, 0.4);
    return { map: map, bumpMap: linTex(bc, 1, 1), bumpScale: 0.3 };
  }

  /* ================= แผงโซลาร์ (เซลล์สีน้ำเงินเข้ม) ================= */
  function solar() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    var g = cv.getContext('2d');
    g.fillStyle = '#16324a';
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#c8d4dc';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 62, 62);
    g.strokeStyle = '#2e5a7a';
    g.lineWidth = 1;
    for (var i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(i * 16, 2); g.lineTo(i * 16, 62); g.stroke();
      g.beginPath(); g.moveTo(2, i * 16); g.lineTo(62, i * 16); g.stroke();
    }
    return { map: canvasTex(cv, 1, 1) };
  }

  /* ================= ท้องฟ้า (gradient + เมฆสำหรับ sky dome) ================= */
  function skyDome() {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0.0, '#2f6fb8');
    grd.addColorStop(0.45, '#7db4de');
    grd.addColorStop(0.75, '#b6d8ee');
    grd.addColorStop(1.0, '#e6eef0');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);
    // เมฆลอยแบบซ้อนวงกลม
    var rand = rng(1401);
    function puff(cx, cy, s, alpha) {
      for (var i = 0; i < 16; i++) {
        var px = cx + (rand() - 0.5) * s * 3.2;
        var py = cy + (rand() - 0.5) * s * 0.8;
        var pr = s * (0.3 + rand() * 0.55);
        var pgrd = g.createRadialGradient(px, py, 0, px, py, pr);
        pgrd.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
        pgrd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = pgrd;
        g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
    }
    for (var c = 0; c < 16; c++) {
      puff(rand() * 1024, 60 + rand() * 190, 26 + rand() * 60, 0.34 + rand() * 0.3);
    }
    var t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* ================= หิมะ/น้ำแข็ง ไม่ใช้ — เหลือ API ไว้ ================= */

  /* ---------- วัสดุสำเร็จรูป (cache ไว้ใช้ซ้ำ) ---------- */
  var cache = {};
  function get(name) {
    if (cache[name]) return cache[name];
    var f;
    switch (name) {
      case 'grass': f = grass; break;
      case 'asphalt': f = asphalt; break;
      case 'concrete': f = concrete; break;
      case 'brickRed': f = function () { return brick(0); }; break;
      case 'brickTan': f = function () { return brick(1); }; break;
      case 'brickBrown': f = function () { return brick(2); }; break;
      case 'brickGray': f = function () { return brick(3); }; break;
      case 'roofRed': f = function () { return roofTile(0); }; break;
      case 'roofGray': f = function () { return roofTile(1); }; break;
      case 'roofGreen': f = function () { return roofTile(2); }; break;
      case 'plaster': f = plaster; break;
      case 'metal': f = corrugated; break;
      case 'glass': f = glass; break;
      case 'water': f = water; break;
      case 'bark': f = bark; break;
      case 'leaves': f = leaves; break;
      case 'wood': f = wood; break;
      case 'dirt': f = dirt; break;
      case 'solar': f = solar; break;
      default: return null;
    }
    cache[name] = f();
    return cache[name];
  }

  // สร้าง MeshStandardMaterial จาก texture สำเร็จรูป + สี tint
  function ObjMat(name, opts) {
    opts = opts || {};
    var t = get(name);
    var p = {
      color: opts.color !== undefined ? opts.color : 0xffffff,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.9,
      metalness: opts.metalness !== undefined ? opts.metalness : 0,
    };
    if (t) {
      if (t.map) p.map = t.map.clone();
      if (t.bumpMap) { p.bumpMap = t.bumpMap.clone(); p.bumpScale = opts.bumpScale !== undefined ? opts.bumpScale : t.bumpScale; }
      if (t.roughnessMap) p.roughnessMap = t.roughnessMap.clone();
      if (opts.repX || opts.repY) {
        if (p.map) p.map.repeat.set(opts.repX || 1, opts.repY || 1);
        if (p.bumpMap) p.bumpMap.repeat.set(opts.repX || 1, opts.repY || 1);
        if (p.roughnessMap) p.roughnessMap.repeat.set(opts.repX || 1, opts.repY || 1);
      }
    }
    return new THREE.MeshStandardMaterial(p);
  }

  window.CityTextures = {
    get: get,
    ObjMat: ObjMat,
    setAniso: setAniso,
    skyDome: skyDome,
    grain: grain,
    blotches: blotches,
    rng: rng,
  };
})(window, THREE);
