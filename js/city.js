/* =========================================================
 * city.js — ผังเมืองจำลอง + ผู้สร้างแลนด์มาร์ก (~80 แบบ)
 * ทุกประเภทมีรูปทรงเฉพาะตัว มองปุ๊บรู้เลยว่าคืออะไร
 * ========================================================= */
(function () {
  'use strict';

  var City = (window.City = { makers: {} });

  // ---------- shared helpers (ใช้เท็กซ์เจอร์จริงจาก textures.js) ----------
  var TX = window.CityTextures || { ObjMat: function () { return new THREE.MeshStandardMaterial({ color: 0xffffff }); } };

  // วัสดุพื้นฐาน (สร้างครั้งเดียว แชร์ทั้งเมือง — ประหยัด GPU)
  var plasterMat = TX.ObjMat('plaster', { roughness: 0.9, repX: 2, repY: 2 });
  var brickMats = [
    TX.ObjMat('brickRed', { roughness: 0.95, repX: 2, repY: 2 }),
    TX.ObjMat('brickTan', { roughness: 0.95, repX: 2, repY: 2 }),
    TX.ObjMat('brickBrown', { roughness: 0.95, repX: 2, repY: 2 }),
    TX.ObjMat('brickGray', { roughness: 0.95, repX: 2, repY: 2 }),
  ];
  var metalMat = TX.ObjMat('metal', { roughness: 0.6, metalness: 0.35, repX: 2, repY: 1 });
  var roofMats = [
    TX.ObjMat('roofRed', { roughness: 0.85, repX: 2, repY: 2 }),
    TX.ObjMat('roofGray', { roughness: 0.85, repX: 2, repY: 2 }),
    TX.ObjMat('roofGreen', { roughness: 0.85, repX: 2, repY: 2 }),
  ];
  var glassMat = TX.ObjMat('glass', { roughness: 0.15, metalness: 0.55 });
  var woodMat = TX.ObjMat('wood', { roughness: 0.9 });
  var barkMat = TX.ObjMat('bark', { roughness: 0.95 });
  var leafMats = [
    TX.ObjMat('leaves', { roughness: 0.95, color: 0xa8d8a0, transparent: true }),
    TX.ObjMat('leaves', { roughness: 0.95, color: 0xd8e8b0, transparent: true }),
    TX.ObjMat('leaves', { roughness: 0.95, color: 0x88c890, transparent: true }),
  ];
  var asphaltMat = TX.ObjMat('asphalt', { roughness: 0.92 });
  var concreteMat = TX.ObjMat('concrete', { roughness: 0.95 });
  var solarMat = TX.ObjMat('solar', { roughness: 0.3, metalness: 0.4 });
  var sidingMats = [
    TX.ObjMat('siding', { roughness: 0.85, repX: 2, repY: 1 }),
    TX.ObjMat('sidingOld', { roughness: 0.9, repX: 2, repY: 1 }),
    TX.ObjMat('sidingCream', { roughness: 0.85, repX: 2, repY: 1 }),
  ];
  var metalRoofMats = [
    TX.ObjMat('metalRed', { roughness: 0.45, metalness: 0.35, repX: 2, repY: 2 }),
    TX.ObjMat('metalBlue', { roughness: 0.45, metalness: 0.35, repX: 2, repY: 2 }),
    TX.ObjMat('metalGreen', { roughness: 0.45, metalness: 0.35, repX: 2, repY: 2 }),
  ];
  var awningMats = [
    TX.ObjMat('awningRed', { roughness: 0.8 }),
    TX.ObjMat('awningBlue', { roughness: 0.8 }),
    TX.ObjMat('awningGreen', { roughness: 0.8 }),
    TX.ObjMat('awningYellow', { roughness: 0.8 }),
  ];
  var hazardMat = TX.ObjMat('hazard', { roughness: 0.7, repX: 2, repY: 1 });
  var medicalMat = TX.ObjMat('medical', { roughness: 0.5, metalness: 0.05 });
  var paddyMat = TX.ObjMat('paddy', { roughness: 0.95 });
  var goldMat = TX.ObjMat('gold', { roughness: 0.3, metalness: 0.75 });
  var emissiveRedMat = new THREE.MeshStandardMaterial({ color: 0xd94f4f, emissive: 0xd93425, emissiveIntensity: 0.55, roughness: 0.4 });
  var emissiveYellowMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xffc830, emissiveIntensity: 0.5, roughness: 0.4 });

  City.wallTex = plasterMat.map;   // เก็บไว้เผื่ออ้างอิงจาก main.js
  City.mats = {
    plaster: plasterMat, brick: brickMats, metal: metalMat, roof: roofMats,
    glass: glassMat, wood: woodMat, bark: barkMat, leaf: leafMats,
    asphalt: asphaltMat, concrete: concreteMat, solar: solarMat,
    siding: sidingMats, metalRoof: metalRoofMats, awning: awningMats,
    hazard: hazardMat, medical: medicalMat, paddy: paddyMat, gold: goldMat,
    emissiveRed: emissiveRedMat, emissiveYellow: emissiveYellowMat,
  };

  // ป้ายชื่อไทย (สองหน้า ยื่นหน้าอาคาร — มองแป๊บเดียวรู้เลยว่าคืออะไร)
  function signBoard(w, h, text, bg, fg) {
    var g = new THREE.Group();
    var map = TX.signTex ? TX.signTex(text, { bg: bg, fg: fg }) : null;
    var mat = map
      ? new THREE.MeshStandardMaterial({ map: map, roughness: 0.6 })
      : tintMat(0xf5f0e8, 0.7);
    var board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), [
      mat, mat, mat, mat, mat, mat,
    ]);
    board.castShadow = true;
    g.add(board);
    return g;
  }
  City.signBoard = signBoard;

  // เลือกวัสดุผนังจากสี/ตัวเลข (0=ปูน, 1-4=อิฐ)
  function wallPick(c, R) {
    if (c === 'brick') return brickMats[Math.floor(R() * brickMats.length)];
    if (typeof c === 'number' && c >= 1 && c <= 4) return brickMats[c - 1];
    return plasterMat;
  }

  // กล่องสีธรรมดา (วัสดุเดิมเพื่อความเข้ากัน) — ใช้สี tint บนปูนฉาบ
  var tintCache = {};
  function tintMat(hex, rough, metal) {
    var key = hex + '_' + (rough || 0) + '_' + (metal || 0);
    if (!tintCache[key]) {
      var m = plasterMat.clone();
      m.color = new THREE.Color(hex);
      m.roughness = rough != null ? rough : 0.85;
      m.metalness = metal || 0;
      tintCache[key] = m;
    }
    return tintCache[key];
  }

  var box = function (w, h, d, c, o) {
    o = o || {};
    var mat;
    if (o.mat) mat = o.mat;
    else if (c && c.isMaterial) mat = c;   // ส่ง Material ตรงๆ ได้เลย
    else if (c === 'brick') mat = wallPick('brick', o.R || Math.random);
    else if (c === 'metal') mat = metalMat;
    else if (c === 'glass') mat = glassMat;
    else if (c === 'wood') mat = woodMat;
    else if (c === 'asphalt') mat = asphaltMat;
    else if (c === 'concrete') mat = concreteMat;
    else if (c === 'solar') mat = solarMat;
    else if (typeof c === 'number') mat = tintMat(c, o.rough, o.metal);
    else mat = plasterMat;
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    if (o.x) m.position.x = o.x;
    m.position.y = (o.y || 0) + h / 2;
    if (o.z) m.position.z = o.z;
    if (o.rx) m.rotation.x = o.rx;
    if (o.rz) m.rotation.z = o.rz;
    if (o.ry) m.rotation.y = o.ry;
    return m;
  };
  var cyl = function (rt, rb, h, c, o) {
    o = o || {};
    var mat = o.mat || (typeof c === 'number' ? tintMat(c, o.rough, o.metal) : plasterMat);
    var m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, o.seg || 12),
      mat
    );
    m.position.set(o.x || 0, (o.y || 0) + h / 2, o.z || 0);
    return m;
  };
  var cone = function (r, h, c, o) {
    o = o || {};
    var mat = o.mat || (typeof c === 'number' ? tintMat(c, 0.7) : plasterMat);
    var m = new THREE.Mesh(new THREE.ConeGeometry(r, h, o.seg || 12), mat);
    m.position.set(o.x || 0, (o.y || 0) + h / 2, o.z || 0);
    return m;
  };
  var sphere = function (r, c, o) {
    o = o || {};
    var mat = o.mat || (typeof c === 'number' ? tintMat(c, 0.8) : plasterMat);
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
    m.position.set(o.x || 0, (o.y || 0) + r, o.z || 0);
    return m;
  };
  var dome = function (r, c, o) {
    o = o || {};
    var mat = o.mat || (typeof c === 'number' ? tintMat(c, 0.7) : plasterMat);
    var m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mat
    );
    m.position.set(o.x || 0, o.y || 0, o.z || 0);
    return m;
  };
  var pyramid = function (w, h, c, o) {
    o = o || {};
    var mat = o.mat || (typeof c === 'number' ? tintMat(c, 0.7) : plasterMat);
    var m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 4), mat);
    m.position.set(o.x || 0, (o.y || 0) + h / 2, o.z || 0);
    m.rotation.y = Math.PI / 4;
    return m;
  };

  // ================= ตัวช่วยเพิ่มความหลากหลายของอาคาร =================
  // ตึกฐานแคบกว่ายอดหรือยอดแคบกว่าฐาน (ทำเป็นส่วนๆ แทนทั้งก้อนเดียว)
  function taperedTower(w, h, d, segs, topScale, mat, topMat) {
    var g = new THREE.Group();
    var sh = h / segs;
    var cw = w, cd = d;
    for (var i = 0; i < segs; i++) {
      var t = i / (segs - 1);
      var s = 1 - (1 - topScale) * t;
      var body = new THREE.Mesh(new THREE.BoxGeometry(cw, sh, cd), mat);
      body.position.y = sh * i + sh / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
      cw *= s; cd *= s;
    }
    if (topMat) {
      var cap = new THREE.Mesh(new THREE.BoxGeometry(cw * 1.02, sh * 0.4, cd * 1.02), topMat);
      cap.position.y = h + sh * 0.2;
      cap.castShadow = true;
      g.add(cap);
    }
    return g;
  }
  // ตึกขั้นบันได (ตั้งแต่เก่าถึงใหม่ เงาตกขั้นเป็นชั้นๆ)
  function steppedTower(w, h, d, segs, mat, R) {
    var g = new THREE.Group();
    var sh = h / segs;
    for (var i = 0; i < segs; i++) {
      var k = 1 - i * (0.55 / segs);
      var body = new THREE.Mesh(new THREE.BoxGeometry(w * k, sh, d * k), mat);
      body.position.y = sh * i + sh / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
    }
    if (R && R() < 0.7) {   // เสาคลุมดาดฟ้า
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, h * 0.3, 6), metalMat);
      mast.position.y = h + h * 0.15;
      g.add(mast);
    }
    return g;
  }
  // ตึกเว้า (สองปีด + แกนกลาง) ทรงสัญลักษณ์ของเมืองใหญ่
  function concaveCrown(w, h, d, mat, gold) {
    var g = new THREE.Group();
    var sh = h / 5;
    for (var i = 0; i < 5; i++) {
      var t = i / 4;
      var inner = 0.35 + 0.65 * Math.abs(t - 0.5) * 2;   // แคบสุดตรงกลาง
      var body = new THREE.Mesh(new THREE.BoxGeometry(w * inner, sh, d * inner), mat);
      body.position.y = sh * i + sh / 2;
      body.castShadow = true;
      g.add(body);
    }
    var spire = new THREE.Mesh(new THREE.ConeGeometry(w * 0.12, h * 0.5, 6), gold || goldMat);
    spire.position.y = h + h * 0.25;
    g.add(spire);
    return g;
  }
  // ตึก L / U / บวก — ตัดมุมอาคาร ให้ผังเมืองไม่เป็นตารางเดียวกันหมด
  function lShape(w, d, h, armW, c, o) {
    o = o || {};
    var g = new THREE.Group();
    var a = box(w, h, armW, c, { rough: o.rough });
    a.position.y = h / 2; a.position.z = -d / 2 + armW / 2;
    var b = box(armW, h, d - armW, c, { rough: o.rough });
    b.position.set(-w / 2 + armW / 2, h / 2, armW / 2);
    g.add(a); g.add(b);
    return g;
  }
  function uShape(w, d, h, armW, c, o) {
    o = o || {};
    var g = new THREE.Group();
    var back = box(w, h, armW, c, { rough: o.rough });
    back.position.y = h / 2; back.position.z = -d / 2 + armW / 2;
    var l1 = box(armW, h, d - armW, c, { rough: o.rough });
    l1.position.set(-w / 2 + armW / 2, h / 2, armW / 2);
    var l2 = box(armW, h, d - armW, c, { rough: o.rough });
    l2.position.set(w / 2 - armW / 2, h / 2, armW / 2);
    g.add(back); g.add(l1); g.add(l2);
    return g;
  }
  // กล่องโรงเรือนบนดาดฟ้า (กล่องบันได/ลิฟต์) ทำให้เส้นขอบฟ้าไม่เรียบ
  function roofBox(w, h, d, c, o) {
    o = o || {};
    var g = new THREE.Group();
    var b = box(w, h, d, c, o);
    g.add(b);
    return g;
  }

  // หลังคาทรงจั่ว (สองเฉียง) ใช้กระเบื้องจริง — ใช้แทนกล่องหลังคาแบน
  function gableRoof(w, d, h, hue, o) {
    o = o || {};
    var g = new THREE.Group();
    var mat = roofMats[hue % roofMats.length];
    // พีระมิด 4 เหลี่ยม: ความยาวด้าน = R*√2 → ตั้ง R = w/√2 เพื่อให้ฐานกว้างเท่าตัวอาคาร
    var geo = new THREE.CylinderGeometry(0.02, w * 0.707, h, 4, 1);
    var m = new THREE.Mesh(geo, mat);
    m.rotation.y = Math.PI / 4;
    m.scale.z = d / w;   // ปรับสัดส่วนทรงจั่วตามแผน
    m.position.y = (o.y || 0) + h / 2;
    if (o.x) m.position.x = o.x;
    if (o.z) m.position.z = o.z;
    m.castShadow = true;
    g.add(m);
    return g;
  }

  // ของบนดาดฟ้า: แอร์ + ถังน้ำ + เสาอากาศ + แผงโซลาร์ (สุ่มใส่ให้ตึกดูมีชีวิต)
  function rooftopClutter(w, d, h, R) {
    var g = new THREE.Group();
    var nAC = 1 + Math.floor(R() * 3);
    for (var i = 0; i < nAC; i++) {
      var ac = box(1.1 + R() * 0.6, 0.8, 0.9, 0xb8bec4, { metal: 0.4, rough: 0.5 });
      ac.position.set((R() - 0.5) * (w - 2), h + 0.4, (R() - 0.5) * (d - 2));
      ac.position.y = h + 0.4;
      g.add(ac);
    }
    if (R() < 0.5) {
      var tank = cyl(0.9, 0.9, 1.8, 0x4a6a8a, { x: (R() - 0.5) * w * 0.5, y: h, z: (R() - 0.5) * d * 0.5, rough: 0.5, metal: 0.2 });
      g.add(tank);
    }
    if (R() < 0.45) {
      var ant = cyl(0.05, 0.08, 2.4 + R() * 1.6, 0x8a9298, { x: (R() - 0.5) * w * 0.6, y: h, z: (R() - 0.5) * d * 0.6, metal: 0.5, rough: 0.4 });
      g.add(ant);
    }
    if (R() < 0.4) {
      var sp = box(w * 0.35, 0.12, d * 0.28, 0xffffff, { mat: solarMat, x: (R() - 0.5) * w * 0.3, y: h + 0.25, z: (R() - 0.5) * d * 0.3, rx: -0.35 });
      g.add(sp);
    }
    return g;
  }

  // ต้นไม้สมจริง (ลำต้น bark + พุ่มใบ leaves texture + สุ่มสี)
  var tree = function (scale, R) {
    R = R || Math.random;
    var g = new THREE.Group();
    var th = 2.2 + R() * 0.8;
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, th, 7), barkMat);
    trunk.position.y = th / 2;
    trunk.castShadow = true;
    g.add(trunk);
    var leafMat = leafMats[Math.floor(R() * leafMats.length)];
    var c1 = new THREE.Mesh(new THREE.SphereGeometry(1.4 + R() * 0.5, 9, 7), leafMat);
    c1.position.y = th + 0.9;
    c1.rotation.y = R() * 3;
    c1.castShadow = true;
    g.add(c1);
    var c2 = new THREE.Mesh(new THREE.SphereGeometry(0.95 + R() * 0.35, 8, 6), leafMat);
    c2.position.set(0.55 + R() * 0.2, th + 1.7, 0.3);
    c2.castShadow = true;
    g.add(c2);
    if (R() < 0.7) {
      var c3 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 7, 6), leafMat);
      c3.position.set(-0.6, th + 1.3, -0.4);
      g.add(c3);
    }
    g.scale.setScalar(scale || 1);
    return g;
  };
  City.tree = tree;

  // พุ่มไม้เตี้ย (ล้อมสวน/ใต้ต้นไม้)
  var bush = function (scale, R) {
    R = R || Math.random;
    var g = new THREE.Group();
    var leafMat = leafMats[Math.floor(R() * leafMats.length)];
    var b = new THREE.Mesh(new THREE.SphereGeometry(0.6 + R() * 0.3, 8, 6), leafMat);
    b.scale.y = 0.7;
    b.position.y = 0.35;
    b.castShadow = true;
    g.add(b);
    if (R() < 0.6) {
      var b2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 5), leafMat);
      b2.scale.y = 0.7;
      b2.position.set(0.5, 0.28, 0.2);
      g.add(b2);
    }
    g.scale.setScalar(scale || 1);
    return g;
  };
  City.bush = bush;

  // ก้อนหิน (ตกแต่งริมถนน/สวน)
  var rock = function (scale) {
    var g = new THREE.Group();
    var m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.95 })
    );
    m.scale.set(1 + Math.random() * 0.4, 0.6 + Math.random() * 0.3, 1 + Math.random() * 0.4);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.position.y = 0.22;
    m.castShadow = true;
    g.add(m);
    g.scale.setScalar(scale || 1);
    return g;
  };
  City.rock = rock;

  // ---------- ยานพาหนะสมจริง (รถเก๋ง/กระบะ/ตู้/บัส/รถบรรทุก) ----------
  var wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 10);
  var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.9 });
  var rimGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.26, 8);
  var rimMat = new THREE.MeshStandardMaterial({ color: 0xb8bec6, roughness: 0.35, metalness: 0.8 });
  var glassDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e2a34, roughness: 0.15, metalness: 0.6 });

  function carPaintMat(hex) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.32, metalness: 0.55 });
  }
  var carPaintCache = {};
  function paint(hex) {
    if (!carPaintCache[hex]) carPaintCache[hex] = carPaintMat(hex);
    return carPaintCache[hex];
  }

  function addWheels(g, axZ, axY, halfTrack, wheelR) {
    [[-halfTrack, axZ[0]], [halfTrack, axZ[0]], [-halfTrack, axZ[1]], [halfTrack, axZ[1]]].forEach(function (p) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.scale.setScalar(wheelR / 0.32);
      w.position.set(p[0], axY, p[1]);
      var rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.scale.setScalar(wheelR / 0.32);
      rim.position.set(p[0] * 1.02, axY, p[1]);
      g.add(w, rim);
    });
  }

  // ประเภท: 'sedan' | 'pickup' | 'van' | 'bus' | 'truck' | 'taxi' | 'tuk'
  function makeVehicle(type, R) {
    R = R || Math.random;
    var g = new THREE.Group();
    var colors = [0xc23b2e, 0x2e5fa3, 0xdfe2e6, 0x2b2e33, 0xd9a13b, 0x3f7a4e, 0x8a9298, 0x6b4a8a];
    var bodyMat;
    if (type === 'taxi') bodyMat = paint(0xe8b830);
    else if (type === 'bus') bodyMat = paint([0xc23b2e, 0x2e7d5b, 0xd9a13b][Math.floor(R() * 3)]);
    else bodyMat = paint(colors[Math.floor(R() * colors.length)]);

    var L, W, H;
    if (type === 'sedan' || type === 'taxi') { L = 4.4; W = 1.9; H = 0.75; }
    else if (type === 'pickup') { L = 5.0; W = 2.0; H = 0.85; }
    else if (type === 'van') { L = 5.2; W = 2.1; H = 1.6; }
    else if (type === 'bus') { L = 11.5; W = 2.5; H = 2.3; }
    else if (type === 'truck') { L = 8.5; W = 2.5; H = 1.8; }
    else { L = 2.8; W = 1.7; H = 0.8; } // tuk-tuk

    // ตัวรถชั้นล่าง
    var body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), bodyMat);
    body.position.y = 0.55 + H / 2 - 0.25;
    body.castShadow = true;
    g.add(body);

    var wheelR = type === 'bus' || type === 'truck' ? 0.5 : 0.34;
    var axY = wheelR;

    if (type === 'sedan' || type === 'taxi') {
      var cab = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.62, L * 0.5), bodyMat);
      cab.position.set(0, body.position.y + H / 2 + 0.28, -L * 0.05);
      cab.castShadow = true;
      g.add(cab);
      var winL = new THREE.Mesh(new THREE.BoxGeometry(W * 0.94, 0.42, L * 0.46), glassDarkMat);
      winL.position.set(0, cab.position.y + 0.08, -L * 0.05);
      g.add(winL);
    } else if (type === 'pickup') {
      var cab2 = new THREE.Mesh(new THREE.BoxGeometry(W * 0.95, 0.7, L * 0.32), bodyMat);
      cab2.position.set(0, body.position.y + H / 2 + 0.32, L * 0.1);
      g.add(cab2);
      var win2 = new THREE.Mesh(new THREE.BoxGeometry(W * 0.97, 0.42, L * 0.28), glassDarkMat);
      win2.position.set(0, cab2.position.y + 0.1, L * 0.1);
      g.add(win2);
      var bed = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.5, L * 0.5), bodyMat);
      bed.position.set(0, body.position.y + H / 2 + 0.1, -L * 0.24);
      g.add(bed);
    } else if (type === 'van') {
      var vtop = new THREE.Mesh(new THREE.BoxGeometry(W, 0.9, L * 0.92), bodyMat);
      vtop.position.set(0, body.position.y + H / 2 + 0.42, -L * 0.02);
      vtop.castShadow = true;
      g.add(vtop);
      var vwin = new THREE.Mesh(new THREE.BoxGeometry(W * 1.01, 0.5, L * 0.3), glassDarkMat);
      vwin.position.set(0, vtop.position.y, L * 0.32);
      g.add(vwin);
    } else if (type === 'bus') {
      var bt = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 1.3, L * 0.96), bodyMat);
      bt.position.y = body.position.y + H / 2 + 0.6;
      bt.castShadow = true;
      g.add(bt);
      // แถบหน้าต่างยาวสองข้าง
      [-1, 1].forEach(function (s) {
        var band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, L * 0.85), glassDarkMat);
        band.position.set(s * W / 2, bt.position.y, 0);
        g.add(band);
      });
      var wband = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.85, 0.06), glassDarkMat);
      wband.position.set(0, bt.position.y, L * 0.48);
      g.add(wband);
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(W * 1.01, 0.22, L * 0.97), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
      stripe.position.y = body.position.y + 0.1;
      g.add(stripe);
    } else if (type === 'truck') {
      var cab3 = new THREE.Mesh(new THREE.BoxGeometry(W, 1.7, 2.2), bodyMat);
      cab3.position.set(0, 1.55, L * 0.38);
      cab3.castShadow = true;
      g.add(cab3);
      var cwin = new THREE.Mesh(new THREE.BoxGeometry(W * 1.01, 0.6, 1.8), glassDarkMat);
      cwin.position.set(0, 2.15, L * 0.38);
      g.add(cwin);
      var box3 = new THREE.Mesh(new THREE.BoxGeometry(W, 2.4, L * 0.58), metalMat);
      box3.position.set(0, 2.0, -L * 0.15);
      box3.castShadow = true;
      g.add(box3);
    } else { // tuk-tuk
      var roof = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, L * 0.7), bodyMat);
      roof.position.set(0, 1.75, 0);
      g.add(roof);
      [-1, 1].forEach(function (s) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), bodyMat);
        post.position.set(s * W * 0.42, 1.15, -L * 0.25);
        g.add(post);
      });
      var front = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.7, 0.1), glassDarkMat);
      front.position.set(0, 1.35, L * 0.33);
      g.add(front);
      addWheels(g, [0.9, -0.9], 0.3, 0.75, 0.3);
      var engine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6, metalness: 0.4 }));
      engine.position.set(0, 0.55, L * 0.42);
      g.add(engine);
      addLights(g, L, W);
      g.userData.vehicleType = type;
      return g;
    }

    addWheels(g, [L * 0.32, -L * 0.32], axY, W / 2 - 0.05, wheelR);
    addLights(g, L, W);
    g.userData.vehicleType = type;
    return g;

    function addLights(grp, len, wid) {
      var headMat = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffedb0, emissiveIntensity: 0.7, roughness: 0.3 });
      var tailMat = new THREE.MeshStandardMaterial({ color: 0x8a1c14, emissive: 0xd93425, emissiveIntensity: 0.8, roughness: 0.3 });
      var zf = len / 2 - 0.05;
      [-1, 1].forEach(function (s) {
        var h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), headMat);
        h.position.set(s * wid * 0.32, 0.75, zf);
        grp.add(h);
        var t = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), tailMat);
        t.position.set(s * wid * 0.32, 0.78, -zf);
        grp.add(t);
      });
    }
  }
  City.makeVehicle = makeVehicle;
  City.rooftopClutter = rooftopClutter;
  City.gableRoof = gableRoof;

  // ป้ายบิลบอร์ด (ใช้ใน main.js เติมริมถนน)
  var billboard = function (R) {
    R = R || Math.random;
    var g = new THREE.Group();
    [-1.6, 1.6].forEach(function (x) {
      g.add(cyl(0.09, 0.11, 5.2, 0x5a6268, { x: x, y: 0, metal: 0.4, rough: 0.5 }));
    });
    var adColors = [0xd94f4f, 0x42a5f5, 0xffca28, 0x66bb6a, 0xef5350, 0x26c6da];
    var c1 = adColors[Math.floor(R() * adColors.length)];
    var c2 = adColors[Math.floor(R() * adColors.length)];
    var panel = box(6, 3, 0.18, c1, { y: 5.2, rough: 0.6 });
    g.add(panel);
    g.add(box(5.2, 0.9, 0.2, c2, { y: 6.2, rough: 0.6 }));
    g.add(box(1.4, 0.6, 0.2, 0xffffff, { x: -1.4, y: 5.6, rough: 0.6 }));
    return g;
  };
  City.billboard = billboard;

  // ---------- landmark registry ----------
  var MAKERS = (City.makers);
  // ตัวช่วยขยายตัวอาคารเด่น (โบสถ์/ปล่องโรงงาน/หอคอยฯ) ให้เห็นชัดจากระยะไกล
  function boostTall(o, k, f) { o.scale.y = Math.max(1, Math.pow(f, k)); return o; }
  function def(key, label, cat, height, builder) {
    var builders = {
      temple:       function (R) { return boostTall(builder(R), 1, 1.55); },
      mosque:       function (R) { return boostTall(builder(R), 1, 1.5); },
      church:       function (R) { return boostTall(builder(R), 1, 1.6); },
      factory:      function (R) { return boostTall(builder(R), 0.6, 1.7); },
      powerPlant:   function (R) { return boostTall(builder(R), 0.7, 1.6); },
      waterWorks:   function (R) { return boostTall(builder(R), 0.8, 1.5); },
      tower:        function (R) { return boostTall(builder(R), 1, 1.7); },
      university:   function (R) { return boostTall(builder(R), 0.4, 1.4); },
      hospital:     function (R) { return boostTall(builder(R), 0.4, 1.35); },
      mall:         function (R) { return boostTall(builder(R), 0.3, 1.4); },
      office:       function (R) { return boostTall(builder(R), 0.5, 1.4); },
      hotel:        function (R) { return boostTall(builder(R), 0.4, 1.45); },
      condo:        function (R) { return boostTall(builder(R), 0.35, 1.4); },
      landmark:     function (R) { return boostTall(builder(R), 1, 1.5); },
      cinema:       function (R) { return boostTall(builder(R), 0.3, 1.35); },
    };
    MAKERS[key] = {
      key: key, label: label, cat: cat, height: height,
      build: builders[key] || builder,
    };
  }
  City.def = def;

  // =====================================================================
  // ที่อยู่อาศัย
  // =====================================================================
  def('house', 'บ้านเดี่ยว', 'ที่อยู่อาศัย', 6, function (R) {
    var g = new THREE.Group();
    var wall = sidingMats[Math.floor(R() * sidingMats.length)];   // ฝาไม้แผ่น
    // สุ่ม 3 แบบ: ตัวเดี่ยว / ชั้นลอย / ต่อเติมหลังคาคลุมรถ — บ้านไม่ซ้ำกัน
    var style = Math.floor(R() * 3);
    var wall2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4.5), wall);
    wall2.position.y = 1.5;
    g.add(wall2);
    g.add(box(6.6, 0.35, 5.1, 0x8a4a2e, { y: 3 }));
    g.add(gableRoof(6.6, 5.1, 2.2, R() < 0.6 ? 0 : (R() < 0.5 ? 1 : 2), { y: 3.35 }));
    if (style >= 1) {
      g.add(box(3, 2.8, 3, wall, { x: 4.4, y: 0 }));   // ห้องชั้นลอยด้านข้าง
      g.add(gableRoof(3.4, 3.4, 1.8, 1, { y: 3.35, x: 4.4 }));
    }
    if (style === 2) {
      g.add(box(3.4, 0.18, 5, 0x8a939c, { x: -4.6, y: 2.2 }));  // หลังคาคลุมรถ
      g.add(cyl(0.1, 0.1, 2.2, 0x8a939c, { x: -6, y: 0, z: 2.2 }));
      g.add(cyl(0.1, 0.1, 2.2, 0x8a939c, { x: -6, y: 0, z: -2.2 }));
      g.add(box(3, 0.14, 5, 0x555a60, { x: -4.6, y: 0 }));      // ลานจอด
    }
    g.add(box(1.2, 2.1, 0.15, 0x5a3a22, { x: 1.5, y: 0, z: 2.28 }));
    g.add(box(1.4, 1.1, 0.12, 0x9fd4e8, { x: -1.6, y: 0.9, z: 2.26 }));
    g.add(box(1.4, 1.1, 0.12, 0x9fd4e8, { x: 1.6, y: 0.9, z: 2.26 }));
    g.add(box(0.5, 1.6, 0.5, 0xb0aca4, { x: 0, y: 3.55, z: 0 }));
    g.add(signBoard(1.8, 0.42, 'บ้าน', '#f5efe0', '#5a3a22').translateY(2.35).translateZ(2.3));
    if (R() < 0.35) g.add(tree(0.55, R));
    return g;
  });

  def('twinhouse', 'บ้านแฝด', 'ที่อยู่อาศัย', 6, function (R) {
    var g = new THREE.Group();
    for (var s = -1; s <= 1; s += 2) {
      var side = sidingMats[s < 0 ? 0 : 2];
      var half = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3, 4.5), side);
      half.position.x = s * 1.5; half.position.y = 1.5;
      g.add(half);
      var rf = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.8, 5), metalRoofMats[s < 0 ? 0 : 1]);
      rf.position.set(s * 1.5, 3.9, 0);
      rf.castShadow = true;
      g.add(rf);
      g.add(signBoard(1.4, 0.36, 'แฝด', '#e8dcc0', '#5a4a2e').translateX(s * 1.5).translateY(2.5).translateZ(2.3));
    }
    g.add(box(0.15, 2, 4.5, 0x8a7a5a, { y: 0 })); // ผนังกั้นกลาง
    return g;
  });

  def('townhouse', 'ทาวน์โฮม', 'ที่อยู่อาศัย', 7, function (R) {
    var g = new THREE.Group();
    for (var i = 0; i < 4; i++) {
      var u = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.2, 4), brickMats[i % brickMats.length]); // แต่ละหลังอิฐคนละโทน
      u.position.set(-3.45 + i * 2.3, 2.1, 0);
      g.add(u);
      var roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 4.4), metalRoofMats[i % metalRoofMats.length]);
      roof.position.set(-3.45 + i * 2.3, 4.45, 0);
      roof.castShadow = true;
      g.add(roof);
      var door = box(0.9, 1.9, 0.12, 0x6b4a2e, { x: -3.45 + i * 2.3, y: 0, z: 2.02 });
      g.add(door);
      // หลังคาค้างเหนือประตู
      var awn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), awningMats[i % awningMats.length]);
      awn.position.set(-3.45 + i * 2.3, 2.35, 2.35);
      awn.rotation.x = 0.35;
      g.add(awn);
    }
    g.add(signBoard(3.4, 0.45, 'ทาวน์โฮม', '#f5efe0', '#8a4a2e').translateY(4.85));
    return g;
  });

  def('condo', 'คอนโดมิเนียม', 'ที่อยู่อาศัย', 32, function (R) {
    var g = new THREE.Group();
    // เกฐานจอดรถร่วม + หอคู่สูงต่างระดับ (คอนโดยุคใหม่ ไม่ใช่กล่องเดียว)
    g.add(box(12, 4, 9, 0x9aa4ae, { y: 0 }));
    g.add(box(12.4, 0.5, 9.4, 0x7d8894, { y: 4 }));
    var t1 = new THREE.Mesh(new THREE.BoxGeometry(5.4, 30, 5.4), glassMat);
    t1.position.set(-2.6, 19, 0);
    t1.castShadow = true;
    g.add(t1);
    var t2 = new THREE.Mesh(new THREE.BoxGeometry(5.4, 22, 5.4), glassMat);
    t2.position.set(2.8, 15, 1.4);
    t2.castShadow = true;
    g.add(t2);
    g.add(box(5.8, 0.5, 5.8, 0x7d8894, { x: -2.6, y: 34 }));
    g.add(box(5.8, 0.5, 5.8, 0x7d8894, { x: 2.8, y: 26, z: 1.4 }));
    // ระเบียงแถบคอนกรีตทั้งสองหอ
    for (var f = 0; f < 9; f++) {
      var balc = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.22, 5.9), concreteMat);
      balc.position.set(-2.6, 6 + f * 3, 0);
      balc.castShadow = true;
      g.add(balc);
      var balc2 = balc.clone();
      balc2.position.set(2.8, 6 + f * 2.4, 1.4);
      g.add(balc2);
    }
    g.add(signBoard(4.5, 0.7, 'คอนโด', '#37474f', '#4fc3f7').translateY(4.6).translateZ(4.8));
    return g;
  });

  def('apartment', 'อพาร์ตเมนต์', 'ที่อยู่อาศัย', 17, function (R) {
    var g = new THREE.Group();
    // ทรงยูเปิดลานด้านใน + บันไดฉุกเฉินยื่นหน้าอาคาร (อพาร์ตเมนต์จริง)
    g.add(uShape(12, 9, 15, 3, brickMats[3]));
    g.add(box(12.4, 0.5, 9.4, 0x7d8894, { y: 15 }));
    g.add(box(1.6, 12, 1.6, 0x9aa4ae, { x: 4.6, y: 0, z: 4.2 }));
    g.add(box(1.8, 0.4, 1.8, 0x7d8894, { x: 4.6, y: 12.4, z: 4.2 }));
    for (var f = 0; f < 5; f++) {
      g.add(box(1.3, 1.4, 0.15, 0x8fd0e8, { x: -1.5, y: 1 + f * 3, z: 4.58 }));
      g.add(box(1.3, 1.4, 0.15, 0x8fd0e8, { x: 1.5, y: 1 + f * 3, z: 4.58 }));
    }
    g.add(signBoard(3.6, 0.55, 'อพาร์ตเมนต์', '#7d8894', '#ffffff').translateY(1.6).translateZ(4.6));
    return g;
  });

  def('oldcommunity', 'ชุมชนเก่า', 'ที่อยู่อาศัย', 5, function (R) {
    var g = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6 + (i % 2) * 0.8, 3.2), brickMats[2]); // อิฐโทนน้ำตาลเก่า
      b.position.set(-4 + i * 2.1, (2.6 + (i % 2) * 0.8) / 2, (i % 2) * 1.2);
      g.add(b);
      var rf = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 3.5), metalRoofMats[2]);
      rf.position.set(-4 + i * 2.1, 2.6 + (i % 2) * 0.8 + 0.175, (i % 2) * 1.2);
      g.add(rf);
    }
    return g;
  });

  def('hotel', 'โรงแรม', 'บริการ', 36, function (R) {
    var g = new THREE.Group();
    // ตัวตึกขั้นบันได 3 ชั้น + สระว่ายน้ำบนยอด (แบบรีสอร์ตเมือง)
    g.add(box(10, 14, 10, 0xf5efe0, { y: 0 }));
    g.add(box(8.2, 10, 8.2, 0xf2e9d6, { y: 14 }));
    g.add(box(6.4, 8, 6.4, 0xefe2cc, { y: 24 }));
    g.add(box(10.4, 0.5, 10.4, 0x8a939c, { y: 14 }));
    g.add(box(8.6, 0.5, 8.6, 0x8a939c, { y: 24 }));
    g.add(box(9.6, 0.5, 9.6, 0x8a939c, { y: 32 }));
    g.add(box(4.4, 0.35, 3.4, 0x4fc3f7, { y: 32.5, x: 0.6, rough: 0.12, metal: 0.1 })); // สระบนยอด
    g.add(box(6, 2.2, 0.4, 0x3f8ea8, { y: 0, z: 5.05 }));          // หน้าต่างล็อบบี้
    g.add(box(7, 0.4, 3, 0xd94f4f, { y: 4.4, z: 5.9 }));           // ซุ้มทางเข้า
    g.add(box(1.6, 2.4, 0.3, 0xd94f4f, { x: 2.6, y: 26.5, z: 4.8 })); // ป้ายตั้ง
    return g;
  });

  def('resort', 'รีสอร์ต', 'บริการ', 5, function (R) {
    var g = new THREE.Group();
    for (var i = 0; i < 4; i++) {
      var v = box(4.5, 2.8, 3.6, 0xf0e0c0);
      v.position.set(-5.5 + (i % 2) * 11, 0, -2.5 + Math.floor(i / 2) * 6.5);
      v.rotation.y = (i % 2) * 0.12;
      g.add(v);
      var roof = box(5, 0.3, 4.1, 0x7a5230, { x: -5.5 + (i % 2) * 11, y: 2.8, z: -2.5 + Math.floor(i / 2) * 6.5 });
      g.add(roof);
    }
    var pool = box(6, 0.4, 4, 0x4fc3f7, { y: 0.05, x: 0, z: 1 });
    pool.material = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.15, metalness: 0.1 });
    g.add(pool);
    g.add(tree(0.9, R));
    g.children[g.children.length - 1].position.set(6, 0, -4);
    g.add(tree(0.8, R));
    g.children[g.children.length - 1].position.set(-6.5, 0, -4.5);
    return g;
  });

  // =====================================================================
  // การศึกษา
  // =====================================================================
  def('kindergarten', 'โรงเรียนอนุบาล', 'การศึกษา', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(8, 3.2, 5, 0xffe082));                       // ตัวอาคารสีเหลืองสด
    g.add(new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.4, 5.4), metalRoofMats[0]));   // หลังคาเมทัลสีแดง
    g.children[g.children.length - 1].position.y = 3.4;
    g.add(box(2, 1.5, 0.2, 0x4fc3f7, { x: -2, y: 1, z: 2.6 }));
    g.add(box(1.2, 2, 0.15, 0xef5350, { x: 2, y: 0, z: 2.55 }));
    g.add(signBoard(4.5, 0.55, 'อนุบาล', '#ff7043', '#ffffff').translateY(3.9));
    // ม้าโยก + ชิงช้าสีสดใส
    var horse = box(1.4, 0.7, 0.4, 0x66bb6a, { y: 0.4, x: 0, z: 3.6 });
    g.add(horse);
    g.add(box(0.15, 1, 0.15, 0x8d6e63, { x: -0.5, y: 0, z: 3.6 }));
    g.add(box(0.15, 1, 0.15, 0x8d6e63, { x: 0.5, y: 0, z: 3.6 }));
    g.add(tree(0.7, R));
    g.children[g.children.length - 1].position.set(-5, 0, 0);
    return g;
  });

  def('primarySchool', 'โรงเรียนประถม', 'การศึกษา', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(12, 6.4, 6, 0xf5f0dc));
    for (var f = 0; f < 2; f++) {
      for (var w = -2; w <= 2; w++) {
        g.add(box(1.2, 1.3, 0.15, 0x9fd4e8, { x: w * 2.2, y: 1.2 + f * 3.2, z: 3.08 }));
      }
    }
    g.add(box(12.4, 0.4, 6.4, 0xc9a86a, { y: 6.4 }));
    g.add(box(1.6, 2.2, 0.2, 0x6b4a2e, { y: 0, z: 3.1 })); // ประตูกลาง
    g.add(signBoard(5, 0.6, 'โรงเรียนประถม', '#42a5f5', '#ffffff').translateY(7.1));
    g.add(box(0.4, 4.5, 0.4, 0xdddddd, { x: 7, y: 0, z: 0 })); // เสาธง
    var flag = box(1.2, 0.7, 0.06, 0xd94f4f, { x: 7.6, y: 4.2, z: 0 });
    g.add(flag);
    return g;
  });

  def('highSchool', 'โรงเรียนมัธยม', 'การศึกษา', 11, function (R) {
    var g = new THREE.Group();
    g.add(box(14, 9.6, 7, 0xece5d2));
    for (var f = 0; f < 3; f++) {
      g.add(box(14.2, 0.2, 7.2, 0xb5ab8e, { y: 3.2 * f }));
      for (var w = -3; w <= 3; w++) {
        g.add(box(1.2, 1.4, 0.15, 0x8fc5e0, { x: w * 1.9, y: 1.4 + f * 3.2, z: 3.6 }));
      }
    }
    g.add(box(14.6, 0.5, 7.4, 0x8a939c, { y: 9.6 }));
    g.add(signBoard(5.5, 0.6, 'โรงเรียนมัธยม', '#1a3a6a', '#ffffff').translateY(10.3));
    g.add(box(0.4, 6, 0.4, 0xdddddd, { x: 9, y: 0, z: 2 })); // เสาธงชาติ
    // สนามบาสหน้าโรงเรียน
    var court = box(8, 0.15, 5, 0xc76b4a, { x: 0, y: 0, z: 6.5 });
    court.material.color = new THREE.Color(0xc76b4a);
    g.add(court);
    g.add(box(3, 2.4, 0.15, 0x666666, { y: 0.15, x: 3.4, z: 8.8 })); // โครงห่วง
    return g;
  });

  def('university', 'มหาวิทยาลัย', 'การศึกษา', 14, function (R) {
    var g = new THREE.Group();
    // อาคารทรงยู + หอนาฬิกากลางลาน (มหาวิทยาลัยคลาสสิก)
    g.add(uShape(16, 12, 8, 3.6, brickMats[3]));
    g.add(box(16.4, 0.5, 12.4, 0x8a939c, { y: 8 }));
    g.add(box(3, 13, 3, brickMats[0], { y: 0, x: 0, z: 2 }));
    g.add(box(3.4, 0.5, 3.4, 0x8a939c, { y: 13, x: 0, z: 2 }));
    var clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 14), tintMat(0xf5f0e0, 0.6));
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 11.4, 3.6);
    g.add(clockFace);
    g.add(signBoard(4.6, 0.6, 'มหาวิทยาลัย', '#1a3a6a', '#ffd54f').translateY(9).translateZ(6.4));
    return g;
  });

  def('library', 'ห้องสมุดประชาชน', 'การศึกษา', 10, function (R) {
    var g = new THREE.Group();
    g.add(box(11, 7, 8, 0xf0ead8));
    g.add(box(11.5, 0.5, 8.5, 0x4a6a8a, { y: 7 }));
    g.add(box(2.4, 3.4, 0.3, 0x4fc3f7, { y: 0, z: 4.1 }));   // กระจกหน้าใหญ่
    g.add(cyl(0.4, 0.4, 7, 0xd9d2bd, { x: -6.5, y: 0 }));     // เสาแกะสลัก
    g.add(cyl(0.4, 0.4, 7, 0xd9d2bd, { x: 6.5, y: 0 }));
    g.add(signBoard(5.5, 0.9, 'ห้องสมุด', '#4a6a8a', '#ffffff').translateY(8.1));
    return g;
  });

  def('learningCenter', 'ศูนย์การเรียนรู้', 'การศึกษา', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(9, 5.5, 6, 0xdcead8));
    g.add(box(9.4, 0.4, 6.4, 0x66a06a, { y: 5.5 }));
    g.add(box(2, 2.4, 0.2, 0x4fc3f7, { y: 0, z: 3.1 }));
    g.add(signBoard(4, 0.55, 'ศูนย์การเรียนรู้', '#2e7d32', '#ffffff').translateY(6.2));
    return g;
  });

  // =====================================================================
  // สาธารณสุข
  // =====================================================================
  def('hospital', 'โรงพยาบาลหลัก', 'สาธารณสุข', 26, function (R) {
    var g = new THREE.Group();
    g.add(box(14, 24, 10, 0xf4f7f9));                          // ตึกสูงขาว
    g.add(box(16, 4, 12, 0xe2ebee, { y: 0 }));                 // ฐานฉุกเฉิน
    g.add(box(3.2, 2.6, 0.3, 0xd94f4f, { y: 0, z: 6.15 }));    // ประตูฉุกเฉินแดง
    g.add(signBoard(7, 0.8, 'โรงพยาบาล', '#ffffff', '#d94f4f').translateY(4.6).translateZ(6.05));
    // กาชาดเรืองแสงบนยอด (สัญลักษณ์ชัดสุด)
    var cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 0.4), medicalMat);
    cross.position.set(5, 25, 0);
    g.add(cross);
    var crossGlow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), emissiveRedMat);
    crossGlow.position.set(5, 25, 0.26);
    g.add(crossGlow);
    for (var f = 0; f < 8; f++) {
      g.add(box(14.2, 0.2, 10.2, 0xcfd8dc, { y: 4 + f * 2.8 }));
    }
    g.add(box(2, 1, 2, 0xd94f4f, { y: 26, z: 0 }));            // เฮลิแพด
    return g;
  });

  def('privateHospital', 'โรงพยาบาลเอกชน', 'สาธารณสุข', 22, function (R) {
    var g = new THREE.Group();
    // หอทรงกระบอกยอดมน + ปีก OPD ต่อเตี้ย (โรงพยาบาลเอกชนสมัยใหม่)
    var tower = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, 18, 14), tintMat(0xeef3f6, 0.8));
    tower.position.y = 9;
    tower.castShadow = true;
    g.add(tower);
    var cap = new THREE.Mesh(new THREE.SphereGeometry(4.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), tintMat(0x4fc3f7, 0.3));
    cap.position.y = 18;
    g.add(cap);
    g.add(box(8, 5, 6, 0xe2ebee, { x: 7, y: 0 }));
    g.add(box(8.4, 0.4, 6.4, 0xb8ccd8, { x: 7, y: 5 }));
    g.add(box(4, 2, 0.3, 0x1565c0, { y: 0, z: 4.6 }));
    g.add(signBoard(5, 0.7, 'โรงพยาบาลเอกชน', '#1565c0', '#ffffff').translateY(20.4));
    return g;
  });

  def('clinic', 'คลินิกทั่วไป', 'สาธารณสุข', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(6, 3.5, 5, 0xf7f4ee));
    g.add(box(6.4, 0.4, 5.4, 0x90a4ae, { y: 3.5 }));
    g.add(signBoard(3.4, 0.5, 'คลินิก', '#ffffff', '#d94f4f').translateY(3.95));
    g.add(box(1.2, 2, 0.15, 0x8fc5e0, { x: -1.5, y: 0, z: 2.55 }));
    return g;
  });

  def('pharmacy', 'ร้านขายยา', 'สาธารณสุข', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0xeef7ee));
    g.add(box(5.4, 0.35, 4.4, 0x66bb6a, { y: 3 }));
    g.add(signBoard(3, 0.5, 'ร้านยา', '#2e7d32', '#ffffff').translateY(3.45));
    g.add(box(1.2, 0.6, 0.3, 0xffffff, { x: 1.5, y: 3.4, z: 0.16 })); // กากบาท
    return g;
  });

  def('vetClinic', 'โรงพยาบาลสัตว์', 'สาธารณสุข', 4.5, function (R) {
    var g = new THREE.Group();
    g.add(box(6, 3, 5, 0xf3ece0));
    g.add(box(6.4, 0.35, 5.4, 0xa1887f, { y: 3 }));
    g.add(signBoard(3.4, 0.5, 'คลินิกสัตว์', '#5d4037', '#ffca28').translateY(3.35));
    g.add(box(0.5, 0.4, 0.3, 0xffca28, { x: 1.2, y: 3.3, z: 0.16 })); // อุ้งเท้า
    return g;
  });

  // =====================================================================
  // ราชการ
  // =====================================================================
  def('police', 'สถานีตำรวจ', 'ราชการ', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(10, 6, 7, 0xe8e0d0));
    g.add(box(10.4, 0.4, 7.4, 0x4a5a6a, { y: 6 }));
    g.add(signBoard(4.5, 0.7, 'สถานีตำรวจ', '#1a3a6a', '#ffffff').translateY(6.55));
    g.add(box(2, 2.4, 0.2, 0x8fc5e0, { y: 0, z: 3.6 }));
    g.add(cyl(0.25, 0.25, 7, 0x9aa7b0, { x: -6, y: 0 }));      // เสาธงตำรวจ
    g.add(box(1.4, 0.9, 0.08, 0x1a3a6a, { x: -5.3, y: 5.6, z: 0 }));
    return g;
  });

  def('fireStation', 'สถานีดับเพลิง', 'ราชการ', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(11, 5.5, 7, 0xd94f4f));                          // ตัวแดงโดดเด่น
    g.add(new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.4, 7.4), metalRoofMats[0]));
    g.children[g.children.length - 1].position.y = 5.7;
    g.add(box(3, 3.2, 0.3, 0x333333, { x: -3, y: 0, z: 3.6 })); // ประตูรถดับเพลิง
    g.add(box(3, 3.2, 0.3, 0x333333, { x: 1, y: 0, z: 3.6 }));
    // แถบเตือนขาว-ดำขอบประตู (สัญลักษณ์สถานีดับเพลิง)
    [-3, 1].forEach(function (dx) {
      g.add(box(0.18, 3.2, 0.12, 0xffffff, { x: dx - 1.6, y: 0, z: 3.78 }));
      g.add(box(0.18, 3.2, 0.12, 0x222222, { x: dx + 1.6, y: 0, z: 3.78 }));
    });
    g.add(signBoard(4.5, 0.6, 'ดับเพลิง', '#d94f4f', '#ffffff').translateY(6.2));
    g.add(cyl(0.3, 0.3, 9, 0xcccccc, { x: 6.5, y: 0 }));
    g.add(box(0.5, 0.5, 0.5, 0xd94f4f, { x: 6.5, y: 9, z: 0 })); // หอสูง
    return g;
  });

  def('court', 'ศาล', 'ราชการ', 12, function (R) {
    var g = new THREE.Group();
    g.add(box(12, 8, 8, 0xf0ece0));
    g.add(box(12.6, 1, 8.6, 0xd9d2bd, { y: 8 }));              // ทับหลังแบบคลาสสิก
    for (var i = 0; i < 6; i++) {
      g.add(cyl(0.45, 0.45, 8, 0xf7f4ec, { x: -5 + i * 2, y: 0, z: 4.2 }));
    }
    g.add(signBoard(3.6, 0.65, 'ศาล', '#8a6d3b', '#ffd54f').translateY(9.4));
    g.add(box(2.5, 2.2, 0.4, 0xd9d2bd, { y: 9, x: 0, z: 0 }));  // ขอบฟ้า
    return g;
  });

  def('districtOffice', 'ที่ว่าการอำเภอ', 'ราชการ', 9, function (R) {
    var g = new THREE.Group();
    g.add(box(11, 6.5, 7, 0xe8e4d4));
    g.add(box(11.4, 0.4, 7.4, 0x8a939c, { y: 6.5 }));
    g.add(signBoard(4.5, 0.6, 'ที่ว่าการอำเภอ', '#8a6d3b', '#ffffff').translateY(7.1));
    g.add(box(6, 3, 0.2, 0x9fd4e8, { y: 0.8, z: 3.6 }));
    return g;
  });

  // =====================================================================
  // ค้าขาย
  // =====================================================================
  def('mall', 'ห้างสรรพสินค้า', 'ค้าขาย', 18, function (R) {
    var g = new THREE.Group();
    // กล่องเตี้ยใหญ่ + หอคอยออฟฟิศยื่นพ้นตัวห้าง + โดมกระจกหน้าอาคาร (ห้างใหญ่จริง)
    g.add(box(18, 12, 12, 0xe8d5e0));
    g.add(box(18.5, 0.6, 12.5, 0x9c6a8a, { y: 12 }));
    g.add(box(5, 20, 5, 0xd8c2d4, { x: -7.5, y: 0, z: 5 }));
    g.add(box(5.4, 0.5, 5.4, 0x9c6a8a, { x: -7.5, y: 20, z: 5 }));
    var dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    dome.position.set(2, 12.3, 0);
    g.add(dome);
    g.add(box(6, 4, 0.4, 0x4fc3f7, { y: 0, z: 6.2 }));
    var mallAw = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 2), awningMats[3]);
    mallAw.position.set(0, 4.6, 7);
    mallAw.rotation.x = 0.3;
    g.add(mallAw);
    g.add(signBoard(7, 1, 'ห้างสรรพสินค้า', '#9c27b0', '#ffffff').translateY(13.4).translateZ(6.4));
    return g;
  });

  def('supermarket', 'ซูเปอร์มาร์เก็ต', 'ค้าขาย', 7, function (R) {
    var g = new THREE.Group();
    g.add(box(14, 5, 9, 0xdceee8));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.4, 9.5), metalRoofMats[2]));
    g.children[g.children.length - 1].position.y = 5.2;
    g.add(box(5, 2, 0.3, 0x4fc3f7, { y: 0, z: 4.6 }));
    g.add(signBoard(6, 0.7, 'ซูเปอร์มาร์เก็ต', '#1b5e20', '#ffffff').translateY(5.8));
    // ลานจอดหน้าร้าน
    var lot = box(14, 0.1, 4, 0x555a60, { y: 0, z: 6.5 });
    g.add(lot);
    return g;
  });

  def('market', 'ตลาดสด', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    // หลังคาโค้งคลุมทั้งตลาด — ผ้าใบสีแดงมี texture
    var roof = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 16, 16, 1, true, 0, Math.PI),
      TX.ObjMat('awningRed', { roughness: 0.7, side: THREE.DoubleSide, repX: 4, repY: 1 })
    );
    roof.rotation.z = Math.PI / 2;
    roof.position.y = 3.6;
    roof.castShadow = true;
    g.add(roof);
    for (var s = -1; s <= 1; s += 2) {
      g.add(box(0.4, 3.6, 0.4, 0x8d9ca8, { x: 0, y: 0, z: s * 3.8 }));
    }
    // แผงขายสองแถวกลางตลาด + รถเข็น/ลังไม้หน้าแผง (ตลาดสดจริง)
    var stallCols = [0xffca28, 0x66bb6a, 0xef5350, 0x42a5f5, 0xffe14f, 0xab47bc];
    for (var i = 0; i < 6; i++) {
      var zz = (i < 3 ? -1.6 : 1.6);
      var xx = -5.2 + (i % 3) * 5.2;
      g.add(box(2.2, 1.6, 1.4, stallCols[i], { x: xx, y: 0.6, z: zz }));
      g.add(box(1.2, 0.9, 0.9, 0xb08d57, { x: xx + 1.7, y: 0, z: zz }));   // ลังไม้
      g.add(box(0.9, 0.9, 0.7, 0xc8503c, { x: xx - 1.6, y: 0, z: zz + 0.8, rough: 0.9 })); // ถังผลไม้
    }
    var sb = signBoard(4.5, 0.6, 'ตลาดสด', '#ef5350', '#ffffff');
    sb.position.y = 6.2;
    g.add(sb);
    return g;
  });

  def('shops', 'ร้านค้าหลากหลาย', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    var colors = [0xef5350, 0x42a5f5, 0xffca28, 0x66bb6a, 0xab47bc, 0xff7043];
    for (var i = 0; i < 5; i++) {
      var sh = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), brickMats[i % brickMats.length]);   // ผนังอิฐคนละโทน
      sh.position.set(-6 + i * 3, 1.5, 0);
      g.add(sh);
      // ผ้าใบกันแดดสลับสี — เห็นชัดว่าเป็นแถวร้านค้า
      var awn = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 1.1), awningMats[i % awningMats.length]);
      awn.position.set(-6 + i * 3, 2.1, 2.4);
      awn.rotation.x = 0.4;
      g.add(awn);
      g.add(box(2, 1.4, 0.15, 0xfff8e1, { x: -6 + i * 3, y: 0.8, z: 2.08 }));
    }
    return g;
  });

  def('foodStall', 'ร้านอาหารตามสั่ง', 'ค้าขาย', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 2.8, 4, 0xffe0b2));
    g.add(box(5.4, 0.3, 4.4, 0xef6c00, { y: 2.8 }));
    g.add(signBoard(2.8, 0.45, 'อาหารตามสั่ง', '#ef6c00', '#ffffff').translateY(3.2));
    g.add(box(1.2, 1.8, 0.15, 0x8d6e63, { y: 0, z: 2.05 }));
    return g;
  });

  def('noodleShop', 'ร้านก๋วยเตี๋ยว', 'ค้าขาย', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(4.5, 2.6, 3.5, 0xfff3e0));
    g.add(box(4.9, 0.3, 3.9, 0xd84315, { y: 2.6 }));
    g.add(signBoard(2.4, 0.45, 'ก๋วยเตี๋ยว', '#d84315', '#fff3e0').translateY(3.05));
    g.add(box(1.6, 0.9, 0.8, 0xffca28, { y: 0.4, x: 3, z: 0.5 })); // โต๊ะนอก
    g.add(cyl(0.08, 0.08, 0.8, 0x8d9ca8, { x: 3, y: 0, z: 1.2 }));
    return g;
  });

  def('cafe', 'คาเฟ่', 'ค้าขาย', 4.5, function (R) {
    var g = new THREE.Group();
    g.add(box(6, 3, 4.5, 0xe8d5c0));
    g.add(box(6.4, 0.35, 4.9, 0x6d4c41, { y: 3 }));
    g.add(signBoard(2.6, 0.5, 'คาเฟ่', '#4e342e', '#d7ccc8').translateY(3.45));
    // ร่มกับโต๊ะนอกอาคาร (ผ้าใบลายสลับ)
    for (var i = 0; i < 2; i++) {
      var umbrella = new THREE.Mesh(
        new THREE.ConeGeometry(1.3, 0.7, 8),
        TX.ObjMat(i ? 'awningRed' : 'awningBlue', { roughness: 0.75 })
      );
      umbrella.position.set(2 + i * 2.4, 2.1, 3.2);
      umbrella.castShadow = true;
      g.add(umbrella);
      g.add(cyl(0.06, 0.06, 2, 0x8d9ca8, { x: 2 + i * 2.4, y: 0.1, z: 3.2 }));
      g.add(cyl(0.5, 0.5, 0.08, 0x6d4c41, { x: 2 + i * 2.4, y: 0.6, z: 3.2 }));
      g.add(cyl(0.06, 0.06, 0.6, 0x8d9ca8, { x: 2 + i * 2.4, y: 0, z: 3.2 }));
    }
    return g;
  });

  def('bakery', 'ร้านขนม/เบเกอรี่', 'ค้าขาย', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 2.8, 4, 0xfde8d0));
    g.add(box(5.4, 0.3, 4.4, 0xe8a87c, { y: 2.8 }));
    g.add(signBoard(2.6, 0.45, 'เบเกอรี่', '#e8a87c', '#5d3a1a').translateY(3.15));
    g.add(box(0.8, 0.5, 0.3, 0xd94f4f, { x: 1.2, y: 3.2, z: 0.16 })); // คัพเค้ก
    return g;
  });

  def('iceCream', 'ร้านไอศกรีม', 'ค้าขาย', 4.5, function (R) {
    var g = new THREE.Group();
    g.add(box(4.5, 2.6, 3.5, 0xfce4ec));
    g.add(box(4.9, 0.3, 3.9, 0xf06292, { y: 2.6 }));
    g.add(signBoard(2.4, 0.45, 'ไอศกรีม', '#f06292', '#ffffff').translateY(3.05));
    // โคนไอศกรีมยักษ์บนหลังคา
    g.add(cone(0.8, 1.8, 0xf8bbd0, { y: 2.9, x: 0, z: 0 }));
    g.add(sphere(0.55, 0xf48fb1, { y: 4.5, x: 0, z: 0 }));
    return g;
  });

  def('fastFood', 'ฟาสต์ฟู้ด', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(7, 3, 5, 0xf5e6d0));
    g.add(box(7.4, 0.4, 5.4, 0xd94330, { y: 3 }));
    g.add(box(2.4, 1.6, 0.3, 0xffca28, { y: 0.6, z: 2.6 }));   // M สีเหลือง
    g.add(signBoard(3.4, 0.55, 'ฟาสต์ฟู้ด', '#d94330', '#ffca28').translateY(3.6));
    // ผ้าใบกันแดดเหนือหน้าต่างสั่งของ
    var ffAw = new THREE.Mesh(new THREE.BoxGeometry(5, 0.08, 1.2), awningMats[3]);
    ffAw.position.set(0, 1.7, 3.1);
    ffAw.rotation.x = 0.35;
    g.add(ffAw);
    return g;
  });

  def('bank', 'ธนาคาร', 'ค้าขาย', 9, function (R) {
    var g = new THREE.Group();
    // ทรงเรือนหิน (โรมัน) + หน้าจั่ว + เสาโรมัน — ธนาคารคลาสสิก
    g.add(box(10, 6, 8, 0xe0e8e0));
    var ped = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 7.4, 2.2, 4, 1), tintMat(0xd8e0d4, 0.8));
    ped.rotation.y = Math.PI / 4;
    ped.position.y = 7.1;
    ped.castShadow = true;
    g.add(ped);
    g.add(box(7.2, 0.5, 1.8, 0xd8dcd0, { y: 0, z: 4.6 }));   // ธรณีประตู
    for (var i = 0; i < 4; i++) {
      g.add(cyl(0.5, 0.55, 6, 0xf0f4ec, { x: -3.6 + i * 2.4, y: 0, z: 4.2 }));
    }
    g.add(signBoard(3, 0.6, 'ธนาคาร', '#1a3a6a', '#ffd54f').translateY(9.4));
    g.add(box(1, 1.8, 0.8, 0x1a3a6a, { x: 6.5, y: 0, z: 2 }));
    g.add(box(0.7, 0.5, 0.2, 0x4fc3f7, { x: 6.5, y: 1, z: 2.4 }));
    return g;
  });

  def('office', 'อาคารสำนักงาน', 'ค้าขาย', 30, function (R) {
    var g = new THREE.Group();
    // สุ่ม 3 แบบ: ยอดเว้า/ขั้นบันได/ฐานบาน — ไม่ใช่กล่องกระจกซ้ำกันทุกหลัง
    var h = 18 + Math.floor(R() * 4) * 3;
    var kind = Math.floor(R() * 3);
    var glassTower = new THREE.MeshStandardMaterial({ color: 0xbfd8e2, roughness: 0.18, metalness: 0.6, envMapIntensity: 1.2 });
    var grp2;
    if (kind === 0) {
      grp2 = concaveCrown(10, h, 10, glassTower);
    } else if (kind === 1) {
      grp2 = steppedTower(10, h, 10, 3, glassTower, R);
    } else {
      g.add(box(13, 4, 13, 0x8a97a2, { y: 0 }));
      var pod = new THREE.Mesh(new THREE.BoxGeometry(10, h - 4, 10), glassTower);
      pod.position.y = 4 + (h - 4) / 2;
      pod.castShadow = true;
      grp2 = new THREE.Group();
      grp2.add(pod);
    }
    g.add(grp2);
    for (var f = 0; f < h / 3; f++) {
      g.add(box(10.2, 0.3, 10.2, 0x6a7680, { y: f * 3, metal: 0.3, rough: 0.5 }));
    }
    g.add(signBoard(4, 0.7, 'สำนักงาน', '#546e7a', '#ffffff').translateY(1).translateZ(5.1));
    return g;
  });

  def('coworking', 'Co-working Space', 'ค้าขาย', 10, function (R) {
    var g = new THREE.Group();
    g.add(box(9, 8, 7, 0xd0e0e8));
    g.add(box(9.4, 0.4, 7.4, 0x37474f, { y: 8 }));
    g.add(box(3.5, 2.5, 0.3, 0x4fc3f7, { y: 0, z: 3.6 }));
    g.add(signBoard(3.8, 0.55, 'Co-Working', '#00838f', '#ffffff').translateY(8.5));
    return g;
  });

  // =====================================================================
  // โรงแรม/ที่พัก (อยู่บน)
  // =====================================================================
  def('souvenir', 'ร้านของฝาก', 'ค้าขาย', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(4.5, 2.8, 3.5, 0xf0e0c8));
    g.add(box(4.9, 0.3, 3.9, 0xc0392b, { y: 2.8 }));
    g.add(signBoard(2.4, 0.45, 'ของฝาก', '#c0392b', '#ffe082').translateY(3.15));
    return g;
  });

  def('landmark', 'จุดถ่ายรูป', 'บริการ', 12, function (R) {
    var g = new THREE.Group();
    g.add(cyl(2.2, 2.6, 8, 0xe8e0d0, { y: 0 }));               // เสาหินโค้ง
    g.add(box(6, 0.5, 6, 0xd9d2bd, { y: 8 }));                  // ยอด
    g.add(signBoard(3.6, 0.5, 'จุดถ่ายรูป', '#4a6a8a', '#ffffff').translateY(9.2));
    g.add(box(0.3, 2, 0.3, 0x8d9ca8, { y: 8.5, x: 0, z: 0 }));
    g.add(box(1.6, 1, 0.06, 0xd94f4f, { x: 0.9, y: 9, z: 0 })); // ธง
    g.add(tree(0.8, R));
    g.children[g.children.length - 1].position.set(4, 0, 3);
    return g;
  });

  def('laundry', 'ร้านซักรีด', 'บริการ', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 2.8, 4, 0xe3f2fd));
    g.add(box(5.4, 0.3, 4.4, 0x1976d2, { y: 2.8 }));
    g.add(signBoard(2.6, 0.45, 'ซักรีด', '#0d47a1', '#ffffff').translateY(3.15));
    g.add(sphere(0.4, 0xffffff, { x: 1.2, y: 3.2, z: 0.16 }));  // ฟองสบู่
    return g;
  });

  // =====================================================================
  // ศาสนสถาน
  // =====================================================================
  def('temple', 'วัด', 'ศาสนสถาน', 16, function (R) {
    var g = new THREE.Group();
    // อุโบสถหลังใหญ่หลังคาซ้อน
    g.add(box(10, 4, 6, 0xf5efe0));
    g.add(box(10.8, 0.5, 6.8, 0xc9a86a, { y: 4 }));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(9, 1.2, 5.2), goldMat));   // หลังคาซ้อนทองเปลว
    g.children[g.children.length - 1].position.y = 5.1;
    g.add(box(9.6, 0.4, 5.6, 0xc9a86a, { y: 5.7 }));
    g.add(signBoard(3.6, 0.55, 'วัด', '#d4af37', '#5d4037').translateY(6.4));
    // เจดีย์ทรงไทย
    var chediBase = box(3.2, 2.4, 3.2, 0xf0e6c8, { x: 0, y: 0, z: 0 });
    chediBase.position.set(8, 0, 0);
    g.add(chediBase);
    g.add(new THREE.Mesh(new THREE.ConeGeometry(2, 6, 12), goldMat));      // ยอดเจดีย์ทองเปลว
    g.children[g.children.length - 1].position.set(8, 5.4, 0);
    g.add(sphere(0.5, 0xffe082, { x: 8, y: 8.4, z: 0 }));       // ปลียอด
    // เสาธง
    g.add(cyl(0.15, 0.15, 9, 0xd9d2bd, { x: -7, y: 0 }));
    g.add(cone(0.5, 1.2, 0xd4af37, { x: -7, y: 9, z: 0 }));
    return g;
  });

  def('mosque', 'มัสยิด', 'ศาสนสถาน', 12, function (R) {
    var g = new THREE.Group();
    g.add(box(9, 5, 7, 0xf0ead6));
    g.add(box(9.6, 0.5, 7.6, 0x2e7d32, { y: 5 }));
    // โดมใหญ่ (ทองเปลว สะท้อนแสงเด่นกลางเมือง)
    g.add(dome(2.8, 0x2e7d32, { y: 5.5, x: 0, z: 0 }));
    var mdome = new THREE.Mesh(
      new THREE.SphereGeometry(2.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      goldMat
    );
    mdome.position.set(0, 6.2, 0);
    mdome.castShadow = true;
    g.add(mdome);
    g.add(cyl(0.1, 0.1, 1.5, 0xd4af37, { x: 0, y: 8, z: 0 }));  // เสาเรือนธง
    g.add(sphere(0.25, 0xd4af37, { x: 0, y: 9.5, z: 0 }));
    g.add(signBoard(2.6, 0.5, 'มัสยิด', '#2e7d32', '#ffffff').translateY(4.2).translateZ(3.6));
    // หออะซานสองข้าง
    g.add(cyl(0.8, 0.9, 10, 0xf0ead6, { x: -6.5, y: 0, z: 0 }));
    g.add(dome(1.1, 0x2e7d32, { x: -6.5, y: 10, z: 0 }));
    g.add(cyl(0.8, 0.9, 10, 0xf0ead6, { x: 6.5, y: 0, z: 0 }));
    return g;
  });

  def('church', 'โบสถ์', 'ศาสนสถาน', 14, function (R) {
    var g = new THREE.Group();
    g.add(box(7, 5, 10, 0xf5f0e8));
    var roof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 2, 10.4), metalRoofMats[1]);
    roof.position.y = 6;
    roof.castShadow = true;
    g.add(roof);
    // หอระฆังสูง
    g.add(box(2.4, 9, 2.4, 0xf5f0e8, { x: 0, y: 0, z: -6.5 }));
    g.add(pyramid(1.9, 3, 0x8a6d3b, { x: 0, y: 9, z: -6.5 }));
    g.add(box(0.35, 0.5, 0.2, 0xd4af37, { x: 0, y: 10.4, z: -5.3 })); // กางเขนทอง
    g.add(box(0.2, 0.8, 0.2, 0xd4af37, { x: 0, y: 10, z: -5.3 }));
    g.add(signBoard(2.2, 0.45, 'โบสถ์', '#f5f0e8', '#6d4c41').translateY(4).translateZ(5.1));
    return g;
  });

  // =====================================================================
  // อุตสาหกรรม/สาธารณูปโภค
  // ====
  def('factory', 'โรงงาน', 'อุตสาหกรรม', 9, function (R) {
    var g = new THREE.Group();
    // เหมืองโรงงานจริง: ตัวโรงงาน + หอซิโลเงิน 2 ต้น + สะพานลำเลียงเชื่อม + ปล่องไฟ
    var shed = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 9), metalMat);
    shed.position.set(-2.5, 2.5, 0);
    shed.castShadow = true;
    g.add(shed);
    for (var i = 0; i < 4; i++) {
      var saw = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 9.4), metalRoofMats[0]);
      saw.position.set(-6.4 + i * 3.5, 5.9, 0);
      saw.castShadow = true;
      g.add(saw);
    }
    for (var s2 = 0; s2 < 2; s2++) {
      var silo = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 9, 12), tintMat(0xd9dde2, 0.75));
      silo.position.set(6.4, 4.5, -2.6 + s2 * 3.6);
      silo.castShadow = true;
      g.add(silo);
      var coneTop = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1.2, 12), metalRoofMats[1]);
      coneTop.position.set(6.4, 9.6, -2.6 + s2 * 3.6);
      g.add(coneTop);
    }
    g.add(box(4.5, 0.9, 1.4, 0x8d9298, { x: 4.2, y: 6.2, z: -0.8 }));  // สะพานลำเลียง
    var hb = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.7, 9.2), hazardMat);
    hb.position.set(-2.5, 0.35, 0);
    g.add(hb);
    g.add(signBoard(4, 0.6, 'โรงงาน', '#37474f', '#ffca28').translateY(3.6).translateZ(4.6));
    g.add(cyl(1, 1.1, 14, 0xc9c2b8, { x: -8.4, y: 0, z: -3 }));
    g.add(box(0.5, 2, 0.5, 0xd94f4f, { x: -8.4, y: 14, z: -3 }));
    g.add(box(3.5, 3.5, 0.3, 0x607d8b, { x: -2.5, y: 0, z: 4.6 }));
    return g;
  });

  def('warehouse', 'โกดัง', 'อุตสาหกรรม', 7, function (R) {
    var g = new THREE.Group();
    g.add(box(12, 5, 8, 0x9aa8b0));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.4, 8.5), metalRoofMats[1]));
    g.children[g.children.length - 1].position.y = 5.2;
    g.add(box(4, 3.8, 0.3, 0x546e7a, { y: 0, z: 4.1 }));        // ประตูม้วนใหญ่
    g.add(signBoard(3.6, 0.55, 'โกดัง', '#455a64', '#ffffff').translateY(5.6));
    return g;
  });

  def('distribution', 'ศูนย์กระจายสินค้า', 'อุตสาหกรรม', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(16, 6, 10, 0xb8c4cc));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.5, 10.5), metalRoofMats[2]));
    g.children[g.children.length - 1].position.y = 6.25;
    g.add(box(4.5, 4, 0.3, 0x78909c, { x: -4, y: 0, z: 5.1 }));
    g.add(box(4.5, 4, 0.3, 0x78909c, { x: 2, y: 0, z: 5.1 }));
    g.add(signBoard(5.5, 0.6, 'ศูนย์กระจายสินค้า', '#0d47a1', '#ffffff').translateY(6.9));
    // รถเฮลที่จอด
    var truck = box(4, 2.2, 2.2, 0xffffff, { x: 10, y: 0, z: 6 });
    g.add(truck);
    g.add(box(1.6, 1.8, 2.2, 0xd94f4f, { x: 12.6, y: 0, z: 6 }));
    return g;
  });

  def('truckLot', 'ลานจอดรถบรรทุก', 'อุตสาหกรรม', 2, function (R) {
    var g = new THREE.Group();
    g.add(box(18, 0.15, 12, 0x4a4f55, { y: 0 }));
    for (var i = 0; i < 3; i++) {
      var t1 = box(5, 2.4, 2.4, 0xe0e0e0, { y: 0.15, x: -5 + i * 5, z: -2.5 });
      g.add(t1);
      g.add(box(1.8, 2, 2.4, 0x37474f, { x: -5 + i * 5 + 3.2, y: 0.15, z: -2.5 }));
      var t2 = box(5, 2.4, 2.4, 0xcfd8dc, { y: 0.15, x: -5 + i * 5, z: 2.5 });
      g.add(t2);
      g.add(box(1.8, 2, 2.4, 0x455a64, { x: -5 + i * 5 + 3.2, y: 0.15, z: 2.5 }));
    }
    return g;
  });

  def('powerPlant', 'โรงไฟฟ้า', 'อุตสาหกรรม', 15, function (R) {
    var g = new THREE.Group();
    g.add(box(10, 8, 8, 0xb0bec5));
    // แถบเตือนส้ม-ดำรอบฐาน
    var hb = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.7, 8.2), hazardMat);
    hb.position.y = 0.35;
    g.add(hb);
    g.add(cyl(1.4, 1.6, 16, 0xe0e0e0, { x: -6, y: 0, z: -2 }));  // ปล่องสูง
    g.add(box(0.6, 2.5, 0.6, 0xd94f4f, { x: -6, y: 16, z: -2 })); // แถบแดงบนปล่อง
    g.add(cyl(2.5, 2.5, 0.5, 0x78909c, { y: 8, x: 3, z: 3 }));    // หอหล่อเย็น
    g.add(cone(2.6, 3, 0x90a4ae, { y: 8.5, x: 3, z: 3 }));
    g.add(signBoard(3.4, 0.6, 'โรงไฟฟ้า', '#ffca28', '#263238').translateY(8.6));
    return g;
  });

  def('waterWorks', 'โรงผลิตน้ำประปา', 'อุตสาหกรรม', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(8, 5, 6, 0xd0e8f0));
    g.add(cyl(2.2, 2.2, 7, 0x8ac6e0, { x: 7, y: 0, z: 0 }));    // ถังน้ำกลม
    g.add(cone(2.4, 1.6, 0x5aa0c0, { x: 7, y: 7, z: 0 }));
    g.add(signBoard(3.2, 0.55, 'ประปา', '#0277bd', '#ffffff').translateY(5.7));
    return g;
  });

  def('waterTreatment', 'ระบบบำบัดน้ำเสีย', 'อุตสาหกรรม', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(6, 3, 4, 0xdce8d8));
    g.add(cyl(2.5, 2.5, 1.2, 0x4a7a5a, { x: 0, y: 0, z: 5 }));  // บ่อบำบัดกลม
    g.add(cyl(2.5, 2.5, 1.2, 0x5a8a6a, { x: 6, y: 0, z: 5 }));
    g.add(cyl(2.5, 2.5, 1.2, 0x3f6a4f, { x: 3, y: 0, z: 9 }));
    g.add(signBoard(3.4, 0.5, 'บำบัดน้ำเสีย', '#2e7d32', '#ffffff').translateY(3.5));
    return g;
  });

  def('tower', 'เสาสัญญาณ', 'อุตสาหกรรม', 24, function (R) {
    var g = new THREE.Group();
    var mast = cyl(0.35, 0.7, 20, 0xd0d4d8, { y: 0 });
    g.add(mast);
    for (var i = 0; i < 3; i++) {
      g.add(box(3 - i * 0.7, 0.35, 3 - i * 0.7, 0xffffff, { y: 8 + i * 4 })); // วงแหวนขาว
    }
    g.add(box(0.4, 3, 0.4, 0xb0b8bc, { y: 20 }));
    // ไฟแดงยอดเรืองแสง (เห็นชัดกลางคืน)
    g.add(sphere(0.45, 0xd94f4f, { x: 0, y: 23.4, z: 0 }));
    var beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), emissiveRedMat);
    beacon.position.set(0, 23.4, 0);
    g.add(beacon);
    return g;
  });

  // =====================================================================
  // เกษตรกรรม
  // =====================================================================
  def('riceField', 'นาข้าว', 'เกษตรกรรม', 1.5, function (R) {
    var g = new THREE.Group();
    // ต้นข้าวเป็นแถว (texture จริง เห็นชัดว่าเป็นนา)
    var field = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 18), paddyMat);
    field.position.y = 0.2;
    field.receiveShadow = true;
    g.add(field);
    for (var i = 0; i < 5; i++) {
      g.add(box(24, 0.12, 0.5, 0x86a03a, { y: 0.4, z: -7.2 + i * 3.6 }));
    }
    // กระทงหลังนา
    g.add(box(3, 2, 2.5, 0x8d6e63, { x: 9, y: 0, z: 8 }));
    var hutRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 3), metalRoofMats[2]);
    hutRoof.position.set(9, 2.2, 8);
    g.add(hutRoof);
    return g;
  });

  def('vegetableGarden', 'สวนผัก', 'เกษตรกรรม', 1.5, function (R) {
    var g = new THREE.Group();
    var rows = [0x66bb6a, 0x81c784, 0x4caf50, 0x7cb342, 0x9ccc65];
    for (var i = 0; i < 6; i++) {
      g.add(box(20, 0.35, 1.6, rows[i % rows.length], { y: 0, z: -6.5 + i * 2.6 }));
    }
    g.add(box(2.5, 2, 2, 0x8d6e63, { x: 11, y: 0, z: 0 }));    // เพาะชำ
    g.add(box(3, 0.3, 2.4, 0x5d4037, { x: 11, y: 2, z: 0 }));
    return g;
  });

  def('farm', 'ฟาร์ม', 'เกษตรกรรม', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(9, 4, 6, 0xd4763a));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.5, 6.6), metalRoofMats[0]));   // หลังคาเมทัลแดง
    g.children[g.children.length - 1].position.y = 4.25;
    g.add(signBoard(2.6, 0.45, 'ฟาร์ม', '#8d4e2a', '#ffe0b2').translateY(4.8));
    g.add(cyl(0.18, 0.18, 4, 0x8d9ca8, { x: 6, y: 0, z: 4 }));
    // รั้วลวดหนาม
    for (var i = 0; i < 6; i++) {
      g.add(box(0.15, 1.2, 0.15, 0x6d4c41, { x: -7.5 + i * 3, y: 0, z: 6 }));
    }
    g.add(tree(0.9, R));
    g.children[g.children.length - 1].position.set(-9, 0, -4);
    return g;
  });

  // =====================================================================
  // ขนส่งสาธารณะ
  // =====================================================================
  def('gasStation', 'ปั๊มน้ำมัน', 'บริการ', 6, function (R) {
    var g = new THREE.Group();
    // หลังคาปั๊มแบนยกสูง (ขาวสะอาด มีขอบแดง)
    g.add(box(12, 0.5, 8, 0xf5f5f5, { y: 4.5 }));
    g.add(box(12.4, 0.15, 8.4, 0xd94f4f, { y: 5 }));
    for (var i = 0; i < 3; i++) {
      g.add(cyl(0.25, 0.25, 4.5, 0xd0d4d8, { x: -4 + i * 4, y: 0, z: 2 }));
    }
    g.add(box(4, 3, 3, 0xf0f0f0, { x: 0, y: 0, z: -3.5 }));     // หลักเซียน
    g.add(signBoard(4.2, 0.7, 'ปั๊มน้ำมัน', '#d94f4f', '#ffffff').translateY(3.6).translateZ(-3.4));
    g.add(signBoard(3.4, 0.55, 'ปั๊มน้ำมัน', '#d94f4f', '#ffffff').translateY(5.4));
    g.add(box(1.2, 0.8, 0.5, 0xffca28, { x: -2, y: 0.8, z: 0 })); // ปั๊ม
    g.add(box(1.2, 0.8, 0.5, 0xffca28, { x: 2, y: 0.8, z: 0 }));
    g.add(cyl(0.9, 0.9, 1.4, 0xe0e0e0, { x: 7, y: 0, z: 3 }));   // ถังใต้ดินหมายเหตุ: ที่เห็นคือถังเหนือดิน
    return g;
  });

  def('evStation', 'สถานีชาร์จรถไฟฟ้า', 'บริการ', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(8, 0.35, 6, 0x4fc3f7, { y: 3.5 }));
    for (var i = 0; i < 2; i++) {
      g.add(cyl(0.22, 0.22, 3.5, 0x90a4ae, { x: -2 + i * 4, y: 0, z: 1 }));
    }
    g.add(box(0.7, 1.4, 0.5, 0x263238, { x: -1.5, y: 0, z: 0 }));
    var led1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), emissiveYellowMat);   // จอ LED เรืองแสง
    led1.position.set(-1.5, 0.87, 0.3);
    g.add(led1);
    g.add(box(0.7, 1.4, 0.5, 0x263238, { x: 1.5, y: 0, z: 0 }));
    var led2 = led1.clone(); led2.position.set(1.5, 0.87, 0.3);
    g.add(led2);
    g.add(signBoard(3.2, 0.5, 'EV ชาร์จ', '#00838f', '#b2ebf2').translateY(3.9));
    return g;
  });

  def('carRepair', 'ร้านซ่อมรถ', 'บริการ', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(8, 4, 6, 0x90a4ae));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.4, 6.4), metalRoofMats[1]));
    g.children[g.children.length - 1].position.y = 4.2;
    g.add(box(3, 2.8, 0.3, 0x455a64, { y: 0, z: 3.1 }));        // ประตูโรงรถ
    // แถบเตือนขอบประตูโรงรถ (เข้าทางรถ)
    var hz = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 0.12), hazardMat);
    hz.position.set(0, 2.9, 3.24);
    g.add(hz);
    g.add(signBoard(3, 0.5, 'ซ่อมรถ', '#ffca28', '#263238').translateY(4.6));
    // ยางรถกองหน้าร้าน
    g.add(cyl(0.7, 0.7, 0.5, 0x263238, { x: 5.5, y: 0, z: 3.5 }));
    g.add(cyl(0.7, 0.7, 0.5, 0x263238, { x: 5.5, y: 0.5, z: 3.5 }));
    return g;
  });

  def('buildingSupply', 'ร้านวัสดุก่อสร้าง', 'บริการ', 6, function (R) {
    var g = new THREE.Group();
    g.add(box(10, 4.5, 7, 0xffcc80));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.5, 7.4), metalRoofMats[0]));
    g.children[g.children.length - 1].position.y = 4.75;
    g.add(box(3, 2.5, 0.3, 0x8d6e63, { y: 0, z: 3.6 }));
    g.add(signBoard(4.5, 0.55, 'วัสดุก่อสร้าง', '#e65100', '#ffffff').translateY(5.3));
    // กองทราย+อิฐ (อิฐใช้ texture จริง)
    g.add(box(2, 1, 2, 0xd9c98a, { x: 7, y: 0, z: 3 }));
    var brickPile = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1), brickMats[0]);
    brickPile.position.set(7, 1.6, 3);
    g.add(brickPile);
    return g;
  });

  // =====================================================================
  // กีฬา
  // =====================================================================
  def('footballField', 'สนามฟุตบอล', 'กีฬา', 2, function (R) {
    var g = new THREE.Group();
    var pitch = box(24, 0.25, 16, 0x4caf50, { y: 0 });
    pitch.material = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.95 });
    g.add(pitch);
    // ลายสนาม (เส้นขาว)
    var line = function (w, d, x, z) {
      g.add(box(w, 0.04, d, 0xf5f5f5, { y: 0.27, x: x, z: z }));
    };
    line(23, 0.15, 0, -7.5); line(23, 0.15, 0, 7.5);
    line(0.15, 15, -11.5, 0); line(0.15, 15, 11.5, 0);
    line(0.15, 3, -11.5, 0); line(0.15, 3, 11.5, 0);   // กรอบเขตโทษ
    line(9, 0.15, 0, 0);                               // เส้นกลาง
    // แถบหญ้าสลับ
    for (var i = -3; i <= 3; i++) {
      g.add(box(24, 0.02, 1.1, 0x3f9a43, { y: 0.25, z: i * 2.1 }));
    }
    // ประตูสองข้าง
    for (var s = -1; s <= 1; s += 2) {
      g.add(box(0.2, 2.4, 0.2, 0xffffff, { x: s * 12.2, y: 1.2, z: -2.4 }));
      g.add(box(0.2, 2.4, 0.2, 0xffffff, { x: s * 12.2, y: 1.2, z: 2.4 }));
      g.add(box(0.2, 0.15, 4.8, 0xffffff, { x: s * 12.2, y: 2.4, z: 0 }));
    }
    return g;
  });

  def('basketballCourt', 'สนามบาสเกตบอล', 'กีฬา', 2, function (R) {
    var g = new THREE.Group();
    var court = box(14, 0.2, 10, 0xc76b4a, { y: 0 });
    court.material = new THREE.MeshStandardMaterial({ color: 0xc76b4a, roughness: 0.95 });
    g.add(court);
    g.add(box(0.15, 10, 0.1, 0xffffff, { x: -6.9, y: 0.1, z: 0 }));
    g.add(box(0.15, 10, 0.1, 0xffffff, { x: 6.9, y: 0.1, z: 0 }));
    g.add(box(14, 0.1, 0.15, 0xffffff, { x: 0, y: 0.1, z: -4.9 }));
    g.add(box(14, 0.1, 0.15, 0xffffff, { x: 0, y: 0.1, z: 4.9 }));
    // เสา + แป้น + ห่วง
    for (var s = -1; s <= 1; s += 2) {
      g.add(box(0.25, 4.5, 0.25, 0x607d8b, { x: s * 6.4, y: 0, z: 0 }));
      g.add(box(1.7, 0.15, 0.15, 0xffffff, { x: s * 6.4, y: 4.5, z: 0 }));
      g.add(cyl(0.09, 0.09, 0.25, 0xef5350, { x: s * 5.9, y: 4.2, z: 0 }));
    }
    return g;
  });

  def('tennisCourt', 'สนามเทนนิส', 'กีฬา', 2, function (R) {
    var g = new THREE.Group();
    g.add(box(14, 0.2, 8, 0x1e88e5, { y: 0 }));
    g.add(box(0.12, 7.4, 0.1, 0xffffff, { x: -6.9, y: 0.1, z: 0 }));
    g.add(box(0.12, 7.4, 0.1, 0xffffff, { x: 6.9, y: 0.1, z: 0 }));
    g.add(box(14, 0.1, 0.12, 0xffffff, { x: 0, y: 0.1, z: -3.9 }));
    g.add(box(14, 0.1, 0.12, 0xffffff, { x: 0, y: 0.1, z: 3.9 }));
    g.add(box(0.12, 0.12, 6, 0xffffff, { x: 0, y: 0.12, z: 0 }));
    // ตาข่ายกลาง
    g.add(cyl(0.05, 0.05, 1, 0xeeeeee, { x: 0, y: 0, z: -3.5 }));
    g.add(cyl(0.05, 0.05, 1, 0xeeeeee, { x: 0, y: 0, z: 3.5 }));
    g.add(box(0.06, 0.95, 7.2, 0xe8e8e8, { x: 0, y: 0.5, z: 0 }));
    // กั้นลมรอบสนาม (เขียวหม่น)
    var fence = new THREE.Mesh(new THREE.BoxGeometry(14.4, 2.2, 0.1), metalRoofMats[2]);
    fence.position.set(0, 1.2, -4.2);
    g.add(fence);
    var fence2 = fence.clone(); fence2.position.z = 4.2;
    g.add(fence2);
    return g;
  });

  def('swimmingPool', 'สระว่ายน้ำ', 'กีฬา', 3, function (R) {
    var g = new THREE.Group();
    var pool = box(9, 1.1, 5, 0x4fc3f7, { y: 0 });
    pool.material = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.1, metalness: 0.15 });
    g.add(pool);
    g.add(box(9.8, 0.25, 5.8, 0x90a4ae, { y: 0.1 }));  // ขอบสระ
    g.add(box(0.5, 1.2, 5.8, 0xb0bec5, { x: -5.2, y: 0, z: 0 }));
    for (var i = -2; i <= 2; i++) {
      g.add(box(9, 0.06, 0.12, 0xffffff, { y: 0.16, z: i * 1.05 }));  // เส้นเลน
    }
    g.add(box(4.5, 2.8, 3.5, 0xeef3f6, { x: 6.5, y: 0, z: 0 }));   // อาคารห้องเปลี่ยน
    g.add(box(4.9, 0.35, 3.9, 0x546e7a, { x: 6.5, y: 2.8, z: 0 }));
    return g;
  });

  def('gym', 'ฟิตเนส', 'กีฬา', 7, function (R) {
    var g = new THREE.Group();
    g.add(box(10, 5, 8, 0xb0bec5));
    g.add(box(10.4, 0.5, 8.4, 0x546e7a, { y: 5 }));
    g.add(box(3, 2.4, 0.3, 0x4fc3f7, { y: 0, z: 4.2 }));
    g.add(signBoard(2.8, 0.55, 'ฟิตเนส', '#d94f4f', '#ffffff').translateY(5.7));
    for (var w = -2; w <= 2; w++) {
      g.add(box(0.8, 3.4, 0.15, 0x8fc5e0, { x: w * 1.7, y: 1, z: 4.08 }));
    }
    return g;
  });

  // =====================================================================
  // วัฒนธรรม
  // =====================================================================
  def('cinema', 'โรงภาพยนตร์', 'วัฒนธรรม', 12, function (R) {
    var g = new THREE.Group();
    g.add(box(14, 9, 11, 0x4a4a52));
    g.add(box(14.4, 0.5, 11.4, 0x2a2a30, { y: 9 }));
    var marquee = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.9, 0.5), emissiveYellowMat);   // ป้ายไฟเรืองแสง
    marquee.position.set(0, 1.2, 5.55);
    g.add(marquee);
    g.add(signBoard(4.5, 0.7, 'โรงภาพยนตร์', '#212121', '#ffd54f').translateY(3.2).translateZ(5.6));
    g.add(box(1.1, 1.3, 0.4, 0x212121, { x: 2, y: 1.15, z: 5.6 }));
    g.add(box(1.1, 1.3, 0.4, 0x212121, { x: 4, y: 1.15, z: 5.6 }));
    g.add(box(6, 2.6, 0.3, 0x8d6e63, { y: 0, z: 5.65 }));
    var roofSign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 3.1), emissiveRedMat);   // ป้ายหลังคาเรืองแสง
    roofSign.position.set(0, 10.5, 0);
    g.add(roofSign);
    return g;
  });

  def('theater', 'โรงละคร', 'วัฒนธรรม', 14, function (R) {
    var g = new THREE.Group();
    g.add(box(13, 10, 11, 0xc9a86a));
    g.add(box(13.4, 1, 11.4, 0x8a6d3b, { y: 10 }));
    g.add(box(13.5, 3, 4, 0xd94f4f, { y: 0, z: 7.6 }));        // เวทียื่น
    g.add(box(0.4, 1.4, 0.4, 0xf0ead8, { x: -5, y: 2.2, z: 7.6 }));
    g.add(box(0.4, 1.4, 0.4, 0xf0ead8, { x: 5, y: 2.2, z: 7.6 }));
    g.add(signBoard(4.5, 0.7, 'โรงละคร', '#8a2a2a', '#ffd54f').translateY(3.4).translateZ(9.5));
    return g;
  });

  def('museum', 'พิพิธภัณฑ์', 'วัฒนธรรม', 10, function (R) {
    var g = new THREE.Group();
    g.add(box(12, 7, 8, 0xf0ead8));
    g.add(box(12.6, 1, 8.6, 0xb8a06a, { y: 7 }));
    for (var i = 0; i < 5; i++) {
      g.add(cyl(0.5, 0.5, 7, 0xf7f4ec, { x: -4.5 + i * 2.25, y: 0, z: 4.4 }));
    }
    g.add(signBoard(3.8, 0.6, 'พิพิธภัณฑ์', '#8a6d3b', '#ffffff').translateY(8.4));
    return g;
  });

  def('artGallery', 'หอศิลป์', 'วัฒนธรรม', 8, function (R) {
    var g = new THREE.Group();
    g.add(box(9, 5.5, 7, 0xf5f5f0));
    g.add(box(9.4, 0.5, 7.4, 0xe0e0d8, { y: 5.5 }));
    g.add(box(5, 3, 0.25, 0x9e9e9e, { y: 1.4, z: 3.62 }));
    g.add(signBoard(2.8, 0.5, 'หอศิลป์', '#37474f', '#ffffff').translateY(6.2));
    g.add(cyl(0.3, 0.5, 2, 0x90a4ae, { x: -3, y: 0, z: 4 }));   // ประติมากรรม
    g.add(sphere(0.45, 0xb0bec5, { x: -3, y: 2, z: 4 }));
    return g;
  });

  def('concertHall', 'คอนเสิร์ตฮอลล์', 'วัฒนธรรม', 13, function (R) {
    var g = new THREE.Group();
    g.add(cyl(6, 6, 9, 0xcfd8dc, { y: 0 }));
    g.add(cyl(6.2, 6.2, 0.6, 0x78909c, { y: 9 }));
    g.add(box(6, 3.4, 0.4, 0x4fc3f7, { y: 0, z: 6.2 }));
    g.add(signBoard(4, 0.65, 'คอนเสิร์ต', '#263238', '#ffd54f').translateY(10.2));
    return g;
  });

  // =====================================================================
  // พื้นที่สีเขียว
  // =====================================================================
  def('flowerGarden', 'สวนดอกไม้', 'พื้นที่สีเขียว', 1.5, function (R) {
    var g = new THREE.Group();
    var cols = [0xf06292, 0xffca28, 0xef5350, 0xba68c8, 0xff8a65, 0x4fc3f7];
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        g.add(box(2.6, 0.35, 2.6, cols[(i * 3 + j) % cols.length], { x: -5 + i * 3.4, z: -3 + j * 3 }));
        g.add(box(2.6, 0.15, 2.6, 0x6d4c41, { x: -5 + i * 3.4, y: 0.05, z: -3 + j * 3 }));
      }
    }
    for (var t = 0; t < 3; t++) {
      g.add(tree(0.7, R));
      g.children[g.children.length - 1].position.set(-6 + t * 6, 0, 5);
    }
    return g;
  });

  def('playground', 'สนามเด็กเล่น', 'พื้นที่สีเขียว', 2, function (R) {
    var g = new THREE.Group();
    g.add(box(8, 0.2, 6, 0xd7b47a, { y: 0 }));   // พื้นทราย
    // ชิงช้า
    g.add(box(0.2, 2.4, 0.2, 0xd94f4f, { x: -3, y: 0, z: -1.5 }));
    g.add(box(0.2, 2.4, 0.2, 0xd94f4f, { x: -3, y: 0, z: 1.5 }));
    g.add(box(2.6, 0.15, 0.15, 0xd94f4f, { x: -3, y: 2.4, z: 0 }));
    g.add(box(0.08, 1.5, 0.08, 0x8d6e63, { x: -3, y: 0.8, z: -1.5 }));
    g.add(box(0.08, 1.5, 0.08, 0x8d6e63, { x: -3, y: 0.8, z: 1.5 }));
    // สไลเดอร์
    g.add(cyl(0.12, 0.12, 1.8, 0x42a5f5, { x: 1.5, y: 0, z: -1.5 }));
    g.add(box(1.6, 0.2, 1.6, 0x42a5f5, { x: 1.5, y: 1.8, z: -1.5 }));
    g.add(box(0.9, 1.3, 0.6, 0x66bb6a, { x: 1.5, y: 0.9, z: -1.5 }));
    // ม้าโยก
    g.add(box(1.2, 0.8, 0.5, 0xff8a65, { x: 0, y: 0.4, z: 2 }));
    g.add(box(0.1, 0.5, 0.6, 0x8d6e63, { x: -0.7, y: 0.1, z: 2 }));
    g.add(box(0.1, 0.5, 0.6, 0x8d6e63, { x: 0.7, y: 0.1, z: 2 }));
    return g;
  });

  def('fountain', 'ลานน้ำพุ', 'พื้นที่สีเขียว', 3, function (R) {
    var g = new THREE.Group();
    g.add(cyl(3.2, 3.4, 0.9, 0xb0bec5, { y: 0 }));
    g.add(cyl(2.6, 2.6, 0.7, 0x4fc3f7, { y: 0.9 }));
    g.add(cyl(0.3, 0.3, 2.2, 0x78909c, { y: 1.6, z: 0 }));
    g.add(sphere(0.6, 0x4fc3f7, { x: 0, y: 3.8, z: 0 }));
    return g;
  });

  def('bench', 'ม้านั่ง', 'พื้นที่สีเขียว', 1, function (R) {
    var g = new THREE.Group();
    g.add(box(2.2, 0.12, 0.6, 0x8d6e63, { y: 0.5 }));
    g.add(box(0.1, 0.5, 0.55, 0x5d4037, { x: -0.9, y: 0.25, z: 0 }));
    g.add(box(0.1, 0.5, 0.55, 0x5d4037, { x: 0.9, y: 0.25, z: 0 }));
    g.add(box(2.2, 0.08, 0.5, 0xa1887f, { y: 0.85 }));
    return g;
  });

  // =====================================================================
  // ร้านค้าเฉพาะทาง (ย่านการค้า)
  // =====================================================================
  def('clothingShop', 'ร้านเสื้อผ้า', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0xf8bbd0));
    g.add(box(5.4, 0.35, 4.4, 0xad1457, { y: 3 }));
    g.add(box(2.4, 1.2, 0.15, 0xfff8e1, { y: 0.6, z: 2.08 }));
    g.add(signBoard(2.4, 0.45, 'เสื้อผ้า', '#ad1457', '#ffffff').translateY(3.4));
    // เสื้อค้างหน้าร้าน 3 ตัว
    for (var i = -1; i <= 1; i++) {
      g.add(box(0.4, 1.6, 0.15, [0xef5350, 0x42a5f5, 0xffca28][i + 1], { x: 2.2 + i * 1.1, y: 0, z: 2.9 }));
    }
    return g;
  });

  def('shoeShop', 'ร้านรองเท้า', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0xe3f2fd));
    g.add(box(5.4, 0.35, 4.4, 0x1565c0, { y: 3 }));
    g.add(box(2.6, 1.3, 0.15, 0xbbdefb, { y: 0.65, z: 2.08 }));
    g.add(signBoard(2.4, 0.45, 'รองเท้า', '#1565c0', '#ffffff').translateY(3.4));
    g.add(box(1.6, 0.7, 1.1, 0x1565c0, { x: 1.2, y: 3.4, z: 0 }));   // รองเท้ายักษ์บนหลังคา
    g.add(box(0.4, 0.5, 0.5, 0x0d47a1, { x: 0.3, y: 3.5, z: 0 }));
    return g;
  });

  def('phoneShop', 'ร้านโทรศัพท์', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0x212121));
    g.add(box(5.4, 0.35, 4.4, 0x424242, { y: 3 }));
    g.add(box(2.8, 1.4, 0.2, 0x4fc3f7, { y: 0.7, z: 2.1 }));
    g.add(signBoard(2.2, 0.45, 'มือถือ', '#4fc3f7', '#212121').translateY(3.4));
    return g;
  });

  def('bookShop', 'ร้านหนังสือ', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0xffe0b2));
    g.add(box(5.4, 0.35, 4.4, 0x8d5524, { y: 3 }));
    g.add(box(2.6, 1.2, 0.15, 0xfff3e0, { y: 0.6, z: 2.08 }));
    g.add(signBoard(2.4, 0.45, 'หนังสือ', '#8d5524', '#fff3e0').translateY(3.4));
    var bookCols = [[0xef5350, 0xffca28], [0x42a5f5, 0x66bb6a], [0xab47bc, 0x8d6e63]];
    for (var i = 0; i < 3; i++) {
      g.add(box(1.2, 1.8, 0.4, 0x6d4c41, { x: -2 + i * 2, y: 0.9, z: -0.4 }));
      g.add(box(1.1, 0.12, 0.35, bookCols[i][0], { x: -2 + i * 2, y: 0.5, z: -0.4 }));
      g.add(box(1.1, 0.12, 0.35, bookCols[i][1], { x: -2 + i * 2, y: 1.2, z: -0.4 }));
    }
    return g;
  });

  def('flowerShop', 'ร้านดอกไม้', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0xc8e6c9));
    g.add(box(5.4, 0.35, 4.4, 0x2e7d32, { y: 3 }));
    g.add(box(2.4, 1.1, 0.15, 0xe8f5e9, { y: 0.55, z: 2.08 }));
    g.add(signBoard(2.4, 0.45, 'ดอกไม้', '#2e7d32', '#ffe082').translateY(3.4));
    var cols = [0xf06292, 0xffca28, 0xef5350, 0xba68c8, 0xff8a65];
    for (var i = 0; i < 5; i++) {
      g.add(cyl(0.22, 0.18, 0.7, 0x8d6e63, { x: -1.8 + i * 0.95, y: 0, z: 2.7 }));
      g.add(sphere(0.22, cols[i], { x: -1.8 + i * 0.95, y: 0.85, z: 2.7 }));
    }
    return g;
  });

  def('barberShop', 'ร้านตัดผม', 'ค้าขาย', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3, 4, 0xf5f5f5));
    g.add(box(5.4, 0.35, 4.4, 0x616161, { y: 3 }));
    g.add(box(2.4, 1.2, 0.15, 0xe0e0e0, { y: 0.6, z: 2.08 }));
    g.add(signBoard(2.4, 0.45, 'ตัดผม', '#616161', '#ffffff').translateY(3.4));
    // เสาสลากเรืองแสง (สัญลักษณ์ร้านตัดผม)
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.8, 8), emissiveRedMat);
    pole.position.set(-1.8, 0.9, 2.8);
    g.add(pole);
    g.add(box(0.32, 0.2, 0.32, 0xffffff, { x: -1.8, y: 0.5, z: 2.8 }));
    g.add(box(0.32, 0.2, 0.32, 0xffffff, { x: -1.8, y: 0.9, z: 2.8 }));
    g.add(box(0.32, 0.2, 0.32, 0xffffff, { x: -1.8, y: 1.3, z: 2.8 }));
    g.add(sphere(0.18, 0xef5350, { x: -1.8, y: 2, z: 2.8 }));
    return g;
  });

  // =====================================================================
  // คมนาคม
  // =====================================================================
  def('parking', 'ที่จอดรถ', 'คมนาคม', 1, function (R) {
    var g = new THREE.Group();
    var lot = box(16, 0.16, 10, 0x4a4f55, { y: 0 });
    lot.material = new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.95 });
    g.add(lot);
    for (var i = -3; i <= 3; i++) {
      g.add(box(0.12, 0.05, 8.6, 0xfff3d6, { y: 0.19, x: i * 2.4, z: 0 }));
    }
    g.add(box(15, 0.05, 0.12, 0xfff3d6, { y: 0.19, x: 0, z: -4.7 }));
    g.add(box(15, 0.05, 0.12, 0xfff3d6, { y: 0.19, x: 0, z: 4.7 }));
    var carCols = [0xd94f4f, 0x4f7fd9, 0xe8e8e8];
    for (var c = 0; c < 3; c++) {
      g.add(box(3.2, 1, 1.8, carCols[c], { x: -5.2 + c * 5.2, y: 0.16, z: -2 }));
    }
    return g;
  });

  City.bridgeLevel = 4.5;   // ระดับสะพานเริ่มต้น (main.js ตั้งค่าใหม่ก่อนสร้างสะพานเส้นที่ 2)
  def('bridge', 'สะพานข้ามคลอง', 'คมนาคม', 5, function (R) {
    var g = new THREE.Group();
    var deckC = 0x4a4f55;     // สีผิวถนน
    var railC = 0xb0bec5;     // สีราวสะพาน
    var pierC = 0x8d9ca8;     // สีเสาตอม่อ
    var deckTop = City.bridgeLevel || 4.5;   // ระดับดาดฟ้า (ต่างระดับตามสะพาน)
    var rampLen = deckTop >= 8 ? 40 : 30;    // ทางลาดยาวขึ้นตามความสูงสะพาน (สูง→ชันน้อยลง)
    var rampC = 41 + rampLen / 2;            // ศูนย์กลางทางลาด (ดาดฟ้ายาว 82 → ขอบที่ 41)
    var rampEnd = 41 + rampLen;              // ปลายทางลาดถึงพื้นถนน
    var theta = Math.atan(deckTop / rampLen); // มุมทางลาด
    var rampY = deckTop / 2 - 0.25 / Math.cos(theta) - 0.25;   // จุดกึ่งกลางทางลาด
    var railY = deckTop / 2 + 0.05;          // ราวตามทางลาด (สูงกว่าพื้นผิว 0.6)
    var pierH = deckTop - 0.2;               // เสาสูงถึงใต้ดาดฟ้า
    var capY = deckTop - 0.6;                // หัวเสา

    // ---- ดาดฟ้าสะพานยกระดับ (ช่วงข้ามทะเลสาบ) ----
    g.add(box(16, 0.5, 82, deckC, { y: deckTop - 0.5 }));
    g.add(box(0.15, 0.08, 82, 0xfff3d6, { y: deckTop + 0.02 }));  // เส้นเลน

    // ---- ทางลาดขึ้น-ลงสองฝั่ง (ค่อย ๆ สูงขึ้นจากพื้นถนน) ----
    g.add(box(16, 0.5, rampLen, deckC, { y: rampY, z: rampC, rx: theta }));
    g.add(box(16, 0.5, rampLen, deckC, { y: rampY, z: -rampC, rx: -theta }));

    // ---- เสาตอม่อในน้ำ + หัวเสา (ถอยห่างจากจุดตัดกลาง เพื่อไม่เบียดกัน) ----
    [-34, -14, 14, 34].forEach(function (pz) {
      g.add(box(1.1, pierH, 1.1, pierC, { y: 0, z: pz }));
      g.add(box(2.3, 0.5, 2.3, 0x9aa7b0, { y: capY, z: pz }));
    });

    // ---- เสาค้ำทางลาดขึ้น-ลง (ช่วงข้ามน้ำ/ช่วงลอยสูง) ----
    [0.42, 0.74].forEach(function (f) {
      var pz = 41 + rampLen * f;
      var h = Math.max(0.7, deckTop * (rampEnd - pz) / rampLen - 0.35);
      g.add(box(0.8, h, 0.8, pierC, { y: 0, z: pz }));
      g.add(box(0.8, h, 0.8, pierC, { y: 0, z: -pz }));
    });

    // ---- ราวสะพาน (ดาดฟ้า + ตามทางลาด) ----
    for (var s = -1; s <= 1; s += 2) {
      g.add(box(0.15, 1.1, 84, railC, { x: s * 7.6, y: deckTop + 0.05 }));
      for (var p = -3; p <= 3; p++) {
        g.add(box(0.15, 1.1, 0.15, railC, { x: s * 7.6, y: deckTop + 0.05, z: p * 12 }));
      }
      g.add(box(0.15, 1.1, rampLen, railC, { x: s * 7.6, y: railY, z: rampC, rx: theta }));
      g.add(box(0.15, 1.1, rampLen, railC, { x: s * 7.6, y: railY, z: -rampC, rx: -theta }));
    }
    return g;
  });

  def('trafficLight', 'สัญญาณไฟจราจร', 'คมนาคม', 5, function (R) {
    var g = new THREE.Group();
    g.add(cyl(0.18, 0.24, 5.5, 0x37474f, { y: 0 }));
    g.add(box(0.9, 2.4, 0.5, 0x263238, { x: 0, y: 5.5, z: 0.25 }));
    g.add(sphere(0.18, 0xef5350, { x: 0, y: 7.2, z: 0.52 }));
    g.add(sphere(0.18, 0xffca28, { x: 0, y: 6.4, z: 0.52 }));
    g.add(sphere(0.18, 0x66bb6a, { x: 0, y: 5.6, z: 0.52 }));
    g.add(box(1.6, 0.25, 0.25, 0x263238, { x: 0, y: 7.7, z: 0.25 }));
    return g;
  });

  def('crosswalk', 'ทางม้าลาย', 'คมนาคม', 0.3, function (R) {
    var g = new THREE.Group();
    for (var i = 0; i < 8; i++) {
      g.add(box(0.6, 0.03, 15, 0xf5f5f5, { x: -3.5 + i, y: 0.05 }));
    }
    return g;
  });

  // =====================================================================
  // อาคารย่อยประจำย่าน (เติมความหนาแน่นแบบเมืองจริง)
  // =====================================================================
  def('wclinic', 'คลินิกในซอย', 'สาธารณสุข', 4, function (R) {
    var g = new THREE.Group();
    g.add(box(4.5, 2.8, 3.5, 0xf7f4ee));
    g.add(box(4.9, 0.3, 3.9, 0x90a4ae, { y: 2.8 }));
    g.add(signBoard(2.2, 0.4, 'คลินิก', '#ffffff', '#d94f4f').translateY(3.15));
    return g;
  });

  def('monkhouse', 'กุฏิสงฆ์', 'ศาสนสถาน', 4, function (R) {
    var g = new THREE.Group();
    var hut = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 3.6), woodMat);
    hut.position.y = 1.3;
    g.add(hut);
    g.add(gableRoof(5, 4, 1.4, 0, { y: 2.6 }));
    g.add(box(4.9, 0.5, 4, 0x8a6d3b, { y: 0.25 }));   // ฐานคิดหิน
    return g;
  });

  def('pavilion', 'ศาลาการเปรียญ', 'ศาสนสถาน', 6, function (R) {
    var g = new THREE.Group();
    g.add(box(8, 3, 6, 0xf5efe0));
    g.add(box(9, 1, 7, 0xd4af37, { y: 3 }));
    g.add(box(9.6, 0.4, 7.6, 0xc9a86a, { y: 4 }));
    for (var i = 0; i < 4; i++) {
      g.add(cyl(0.25, 0.25, 3, 0xc9a86a, { x: -3 + i * 2, y: 0, z: 3.2 }));
    }
    return g;
  });

  def('gallery', 'อาคารจัดแสดงงาน', 'วัฒนธรรม', 5, function (R) {
    var g = new THREE.Group();
    g.add(box(6, 4, 5, 0xf5f5f0));
    g.add(box(6.4, 0.4, 5.4, 0xe0e0d8, { y: 4 }));
    g.add(box(3, 2, 0.25, 0x9e9e9e, { y: 1.2, z: 2.6 }));
    g.add(signBoard(2.4, 0.45, 'แกลเลอรี', '#37474f', '#ffffff').translateY(4.5));
    return g;
  });

  def('oldcinema', 'โรงหนังเก่า', 'วัฒนธรรม', 7, function (R) {
    var g = new THREE.Group();
    g.add(box(9, 6, 7, 0xd8c8b0));
    g.add(box(9.4, 0.5, 7.4, 0x8a6d3b, { y: 6 }));
    var sign = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 0.4), emissiveYellowMat);
    sign.position.set(0, 4.6, 3.6);
    g.add(sign);
    g.add(box(2.4, 2.6, 0.3, 0x4fc3f7, { y: 0.6, z: 3.55 }));
    return g;
  });

  def('artstudio', 'สตูดิโอศิลปะ', 'วัฒนธรรม', 4.5, function (R) {
    var g = new THREE.Group();
    g.add(box(5, 3.4, 4.5, 0xe8eaf0));
    // หลังคาเอียงเลี้ยวเดียว (สตูดิโอแสง)
    var sl = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, 4.9), metalRoofMats[1]);
    sl.position.set(0, 3.55, -0.2);
    sl.rotation.x = 0.12;
    g.add(sl);
    g.add(box(2.6, 1.6, 0.2, 0xb3e5fc, { y: 1.4, z: 2.3 }));   // หน้าต่างบานใหญ่
    return g;
  });

  // =====================================================================
  // กลุ่มอาคารเรียงแถว (ทำให้ย่านแน่นเหมือนเมืองจริง — ใช้ 1 จุดวางได้หลายหลัง)
  // =====================================================================
  function cluster(kind) {
    var g = new THREE.Group();
    var i;
    if (kind === 'estate') {          // หมู่บ้านจัดสรร: บ้านเดี่ยว/แฝดเรียง 2 แถว
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 4; c++) {
          var twin = (r === 1 && c % 2 === 0);
          var h = City.makers[twin ? 'twinhouse' : 'house'].build(Math.random);
          h.position.set(-7.5 + c * 5, 0, -4.5 + r * 9);
          h.rotation.y = (c % 2) ? Math.PI : 0;
          g.add(h);
        }
      }
    } else if (kind === 'townhouses') {   // แถวทาวน์โฮม 2 ฝั่งหันหน้าเข้าหาถนน
      for (i = 0; i < 12; i++) {
        var t = City.makers.townhouse.build(Math.random);
        t.position.set(-13.8 + (i % 6) * 5.5, 0, i < 6 ? -5 : 5);
        t.rotation.y = i < 6 ? 0 : Math.PI;
        g.add(t);
      }
    } else if (kind === 'shophouses') {   // ตึกแถวย่านการค้า 2 แถว
      for (i = 0; i < 10; i++) {
        var shop = City.makers.shops.build(Math.random);
        shop.position.set(-13.5 + (i % 5) * 6.75, 0, i < 5 ? -4 : 4);
        shop.rotation.y = i < 5 ? 0 : Math.PI;
        g.add(shop);
      }
    } else if (kind === 'foodStreet') {   // ย่านร้านอาหารข้างทาง
      var keys = ['foodStall', 'noodleShop', 'cafe', 'bakery'];
      for (i = 0; i < 8; i++) {
        var f = City.makers[keys[i % keys.length]].build(Math.random);
        f.position.set(-10.5 + (i % 4) * 7, 0, i < 4 ? -3.5 : 3.5);
        f.rotation.y = i < 4 ? 0 : Math.PI;
        g.add(f);
      }
    } else if (kind === 'campus') {       // กลุ่มอาคารเรียนรอบลานกว้าง
      var mains = ['primarySchool', 'highSchool', 'library'];
      for (i = 0; i < 3; i++) {
        var b = City.makers[mains[i]].build(Math.random);
        var ang = -0.5 + i * 1.05;
        b.position.set(Math.cos(ang) * 12, 0, Math.sin(ang) * 12);
        b.rotation.y = -ang + Math.PI / 2;
        g.add(b);
      }
    }
    return g;
  }
  City.cluster = cluster;

  City.helpers = { box: box, cyl: cyl, cone: cone, lShape: lShape, uShape: uShape, steppedTower: steppedTower, taperedTower: taperedTower, concaveCrown: concaveCrown };
})(window, document, THREE);
