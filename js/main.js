/* =========================================================
 * ผังเมือง 3D — Three.js City Plan Viewer (plain JS, offline)
 * เวอร์ชันสมจริง: เท็กซ์เจอร์จริงทั้งเมือง (หญ้า/ยางมะตอย/อิฐ/ปูน),
 * ทางเท้ายกสูง, ท้องฟ้า+เมฆ+ดวงอาทิตย์/ดวงจันทร์, แสง IBL สะท้อนฟ้าจริง,
 * รถหลายแบบ (เก๋ง/แท็กซี่/บัส/ตุ๊กตุ๊ก), ต้นไม้+พุ่มไม้+หิน,
 * ของบนดาดฟ้า (แอร์/ถังน้ำ/โซลาร์), ป้ายบิลบอร์ด, ป้ายรถเมล์
 * ========================================================= */

(function () {
  'use strict';

  // ============ ตั้งค่าเท็กซ์เจอร์ (เรียกก่อนสร้างวัสดุทั้งหมด) ============
  // three.js จะ clamp ค่า anisotropy ให้ไม่เกินที่ GPU รองรับเอง
  if (window.CityTextures) CityTextures.setAniso(8);

  // ================= โซนผังเมือง (17 หมวด) =================
  var ZONES = [
    { id: 'res',        color: 0xffe14f, label: 'ที่อยู่อาศัย (สีเหลือง)',           floors: [3, 6] },
    { id: 'edu',        color: 0x42a5f5, label: 'สถานศึกษา (สีฟ้า)',                 floors: [2, 5] },
    { id: 'health',     color: 0xef5350, label: 'สาธารณสุข (สีแดง/ชมพู)',            floors: [5, 10] },
    { id: 'safety',     color: 0x283593, label: 'ความปลอดภัย (สีน้ำเงินเข้ม)',        floors: [2, 4] },
    { id: 'commerce',   color: 0xb45ce8, label: 'ย่านการค้า (สีม่วง/ชมพู)',          floors: [5, 12] },
    { id: 'food',       color: 0xff9a3c, label: 'ร้านอาหาร (สีส้ม)',                 floors: [2, 3] },
    { id: 'business',   color: 0x90a4ae, label: 'ธนาคารและธุรกิจ (สีเทา)',           floors: [7, 16] },
    { id: 'transport',  color: 0x37474f, label: 'คมนาคม (ถนน/สะพาน/ไฟจราจร)',      floors: [1, 1] },
    { id: 'green',      color: 0x66bb6a, label: 'พื้นที่สีเขียว (สวน/สนามเด็กเล่น)',  floors: [1, 1] },
    { id: 'sports',     color: 0x8bc34a, label: 'กีฬา (สีเขียวอ่อน)',                floors: [1, 2] },
    { id: 'culture',    color: 0xd4af37, label: 'วัฒนธรรม (สีทอง)',                  floors: [4, 9] },
    { id: 'religion',   color: 0xe8d5a0, label: 'ศาสนา (สีขาว/ทอง)',                floors: [2, 6] },
    { id: 'industry',   color: 0x546e7a, label: 'อุตสาหกรรม (สีเทาเข้ม) — ชานเมือง', floors: [2, 4] },
    { id: 'utility',    color: 0xe65100, label: 'สาธารณูปโภค (สีส้มเข้ม) — ชานเมือง', floors: [1, 3] },
    { id: 'agriculture', color: 0x9db84a, label: 'เกษตร (สีเขียวเหลือง) — รอบนอก',  floors: [1, 1] },
    { id: 'tourism',    color: 0xf48fb1, label: 'การท่องเที่ยว (สีชมพู)',            floors: [5, 12] },
    { id: 'everyday',   color: 0x26c6da, label: 'ชีวิตประจำวัน (บริการ)',            floors: [2, 4] },
  ];

  // ก้อนโซน (x, z, กว้าง w, ลึก d) หน่วย = เมตร บนพื้น 780x780
  // กติกา: บล็อกต้องอยู่ในช่องระหว่างถนนเสมอ (ถนนแนว x: ±70/±140/±240, แนว z: ±70/±140/±240)
  // ขอบบล็อก (±w/2, ±d/2) ต้องไม่เข้ารัศมีถนน±8 ม. — ช่อง 70 กว้างได้ ≤54, ช่อง 100 กว้างได้ ≤84
  var ZONE_BLOCKS = [
    { zone: 'res',         x:  105, z:  105, w:  52, d:  52 },   // ชานเมืองตะวันออกเฉียงใต้ (บ้าน)
    { zone: 'res',         x:  -35, z: -105, w:  54, d:  52 },
    { zone: 'edu',         x:   35, z: -105, w:  54, d:  52 },
    { zone: 'industry',    x: -105, z: -105, w:  52, d:  52 },
    { zone: 'agriculture', x:  105, z: -105, w:  52, d:  52 },   // รอบนอก NE (นาข้าว)
    { zone: 'utility',     x: -105, z:  105, w:  52, d:  52 },
    { zone: 'safety',      x: -105, z:  -36, w:  52, d:  54 },
    { zone: 'commerce',    x:  105, z:  -36, w:  52, d:  54 },
    { zone: 'religion',    x: -105, z:   35, w:  52, d:  54 },
    { zone: 'sports',      x:   36, z:  -42, w:  50, d:  26 },
    { zone: 'tourism',     x:  -36, z:  -42, w:  50, d:  26 },
    { zone: 'food',        x:  -36, z:   42, w:  50, d:  26 },
    { zone: 'business',    x:   34, z:   40, w:  48, d:  20 },
    { zone: 'health',      x:   34, z:   95, w:  48, d:  32 },
    { zone: 'everyday',    x:  -34, z:   95, w:  48, d:  32 },
  ];

  // บล็อกเติมช่องว่าง (ทำให้เมืองแน่นขึ้น ไม่โล่ง)
  // ตำแหน่งคำนวณแล้วว่าไม่ทับถนน/ทางเท้า/ทะเลสาบ/บล็อกเดิม
  var INFILL_BLOCKS = [
    { zone: 'commerce', x:  51, z: -18, w: 22, d: 20 },   // ริมทะเลสาบฝั่งตะวันออก
    { zone: 'food',     x: -51, z: -18, w: 22, d: 20 },   // ริมทะเลสาบฝั่งตะวันตก
    { zone: 'res',      x:  51, z:  18, w: 22, d: 20 },
    { zone: 'everyday', x: -51, z:  18, w: 22, d: 20 },
  ];

  // ย่านชั้นนอกระหว่างแนว ±140 กับถนนรอบนอก ±240 (ช่องกว้าง ≤84)
  ZONE_BLOCKS.push(
    { zone: 'commerce', x:  190, z:   36, w: 80, d: 52 },
    { zone: 'tourism',  x:  190, z:  -36, w: 80, d: 52 },
    { zone: 'health',   x: -190, z:  -36, w: 80, d: 52 },
    { zone: 'everyday', x: -190, z:   36, w: 80, d: 52 },
    { zone: 'safety',   x: -190, z: -108, w: 80, d: 48 },
    { zone: 'tourism',  x:  190, z: -108, w: 80, d: 48 },
    { zone: 'commerce', x:  190, z:  108, w: 80, d: 48 },
    { zone: 'everyday', x: -190, z:  108, w: 80, d: 48 }
  );

  // สิ่งปลูกสร้างจำลองต่อโซน (จาก City.makers ใน city.js)
  var ZONE_MAKERS = {
    res: ['house', 'twinhouse', 'townhouse', 'condo', 'apartment', 'oldcommunity'],
    edu: ['kindergarten', 'primarySchool', 'highSchool', 'university', 'library', 'learningCenter'],
    health: ['hospital', 'privateHospital', 'clinic', 'pharmacy', 'vetClinic'],
    safety: ['police', 'fireStation', 'court', 'districtOffice'],
    commerce: ['mall', 'supermarket', 'market', 'shops', 'clothingShop', 'shoeShop', 'phoneShop', 'bookShop', 'flowerShop', 'barberShop', 'parking'],
    food: ['foodStall', 'noodleShop', 'cafe', 'bakery', 'iceCream', 'fastFood'],
    business: ['bank', 'office', 'coworking', 'gym', 'parking'],
    sports: ['footballField', 'basketballCourt', 'tennisCourt', 'swimmingPool', 'gym'],
    culture: ['cinema', 'theater', 'museum', 'artGallery', 'concertHall'],
    religion: ['temple', 'mosque', 'church'],
    industry: ['factory', 'warehouse', 'distribution', 'truckLot'],
    utility: ['powerPlant', 'waterWorks', 'waterTreatment', 'tower'],
    agriculture: ['riceField', 'vegetableGarden', 'farm'],
    tourism: ['hotel', 'resort', 'souvenir', 'landmark'],
    everyday: ['laundry', 'gasStation', 'evStation', 'carRepair', 'buildingSupply'],
    green: ['flowerGarden', 'playground', 'fountain', 'bench'],
  };

  // จำนวนสิ่งปลูกสร้างต่อบล็อกโซน (เมืองแน่น — ใช้จุดกระจายแบบเต็มพื้นที่)
  var ZONE_COUNTS = {
    res: 20, edu: 15, health: 12, safety: 10, commerce: 26, food: 16, business: 11,
    sports: 9, culture: 11, religion: 7, industry: 8, utility: 8, agriculture: 8,
    tourism: 11, everyday: 12,
  };

  // โซนชานเมือง/เกษตรไม่ต้องมีขอบทางเท้ารอบบล็อก
  var NO_CURB = { industry: 1, agriculture: 1, utility: 1 };

  // โซนที่เติมตึกยกเมือง (สูง) เพิ่ม — ให้เห็นแนวนครชัดจากระยะไกล
  var DENSE_ZONES = { res: 1, business: 1, commerce: 1, tourism: 1, culture: 1, health: 1 };

  var GROUND_SIZE = 620;   // พื้น 620x620 หน่วย (ย่อพื้นที่รอบเมืองลง — ตัวเมืองกะทัดรัดขึ้น)
  var CITY_ROADS = [-240, -140, -70, 0, 70, 140, 240];   // แนวถนนทั้งหมด (กึ่งกลาง)
  var EDGE_ROAD = 280;     // ถนนริมเมือง (±280) เหลือขอบพื้นที่ว่าง 30 หน่วยจากขอบพื้น
  var FLOOR_H = 5.2;       // ความสูงชั้นละ 5.2 ม. (ตึกใหญ่/สูงเด่น)
  var ROAD_W = 16;         // ความกว้างถนนหลัก
  var SIDEWALK_W = 3.2;    // ความกว้างทางเท้า
  var SIDEWALK_H = 0.28;   // ความสูงทางเท้ายกพื้น
  var GROUND_H = 26;       // ความหนาของชั้นดินใต้พื้นผิว (เห็นตอนกดมุมต่ำ)
  var BRIDGE_LOW = 4.5;    // ระดับสะพานข้ามทะเลสาบ (แนว x=0)
  var BRIDGE_HIGH = 12;    // ระดับสะพานยกระดับสูง (แนว z=0) ตัดต่างระดับชัดเจน

  // ================= ฉากพื้นฐาน =================
  var canvas = document.getElementById('scene');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;   // สว่างขึ้นนิด ให้เมืองชัดแบบภาพดาวเทียม

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbfd9ea, 450, 2400);   // หมอกบางๆ — เมืองเล็กลง ปรับระยะให้พอดี

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 9000);
  camera.position.set(340, 300, 340);   // มุมเฉียงสูง (ถอยเข้ามาตามเมืองที่เล็กลง)

  var controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minDistance = 25;
  controls.maxDistance = 2000;
  controls.target.set(0, 0, 0);

  // ---------- Environment map จากท้องฟ้า (IBL) ----------
  // ทำให้กระจก/น้ำ/โลหะสะท้อนท้องฟ้าจริง และเติมแสงอ้อมทั้งฉาก = ภาพสมจริงขึ้นมาก
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envRT = pmrem.fromEquirectangular(CityTextures.skyDome());
  scene.environment = envRT.texture;
  pmrem.dispose();

  // ================= ท้องฟ้า (sky dome) + เมฆ =================
  var skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(4200, 32, 18),
    new THREE.MeshBasicMaterial({ map: CityTextures.skyDome(), side: THREE.BackSide, fog: false })
  );
  scene.add(skyDome);

  var cloudGroup = new THREE.Group();
  (function makeClouds() {
    var rand = CityTextures.rng(4321);
    // ปุ่มเมฆสำหรับ sprite (รวมหลายก้อนใน 1 เท็กซ์เจอร์ ดูมีปริมาตรมากกว่าแผ่นเรียบ)
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 256;
    var g = cv.getContext('2d');
    for (var p = 0; p < 22; p++) {
      var px = 40 + rand() * 176, py = 78 + rand() * 100, pr = 16 + rand() * 34;
      var grd = g.createRadialGradient(px, py, 0, px, py, pr);
      grd.addColorStop(0, 'rgba(255,255,255,0.92)');
      grd.addColorStop(0.55, 'rgba(250,252,255,0.5)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
    var cloudTex = new THREE.CanvasTexture(cv);
    cloudTex.encoding = THREE.sRGBEncoding;
    var cloudMat = new THREE.SpriteMaterial({
      map: cloudTex, transparent: true,
      depthWrite: false, fog: false, opacity: 0.85,
    });
    for (var c = 0; c < 26; c++) {
      var s = 110 + rand() * 260;
      var sp = new THREE.Sprite(cloudMat.clone());
      sp.scale.set(s, s * (0.42 + rand() * 0.2), 1);
      sp.position.set((rand() - 0.5) * 3600, 270 + rand() * 230, (rand() - 0.5) * 3600);
      sp.material.rotation = rand() * Math.PI;
      cloudGroup.add(sp);
    }
  })();
  scene.add(cloudGroup);

  // ================= แสง =================
  var sun = new THREE.DirectionalLight(0xfff2dc, 1.25);
  sun.position.set(200, 300, 140);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);   // ความละเอียดเงาสูงขึ้นตามเมืองที่ใหญ่ขึ้น
  sun.shadow.camera.left = -340;
  sun.shadow.camera.right = 340;
  sun.shadow.camera.top = 340;
  sun.shadow.camera.bottom = -340;
  sun.shadow.camera.far = 1300;
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.02;   // ลบเส้นเงาแปลกๆ บนผนัง/ดาดฟ้า
  scene.add(sun);

  var ambient = new THREE.AmbientLight(0xbfd4e0, 0.5);
  scene.add(ambient);

  var hemi = new THREE.HemisphereLight(0x9fc5e8, 0x3a4a3f, 0.55);
  scene.add(hemi);

  // ---------- ดวงอาทิตย์แบบมีแสงฟุ้ง + ดวงจันทร์ (ติดตามกล้อง อยู่บนท้องฟ้า) ----------
  var skyBillboardGroup = new THREE.Group();
  scene.add(skyBillboardGroup);
  var sunSprite = null, moonSprite = null;
  (function makeSunGlow() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,250,1)');
    grd.addColorStop(0.12, 'rgba(255,250,225,0.95)');
    grd.addColorStop(0.3, 'rgba(255,225,160,0.4)');
    grd.addColorStop(1, 'rgba(255,210,120,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding;
    var sm = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.95 });
    sunSprite = new THREE.Sprite(sm);
    sunSprite.scale.set(520, 520, 1);
    sunSprite.visible = false;
    skyBillboardGroup.add(sunSprite);

    var cv2 = document.createElement('canvas');
    cv2.width = cv2.height = 128;
    var g2 = cv2.getContext('2d');
    var moonGrd = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    moonGrd.addColorStop(0, 'rgba(235,240,250,1)');
    moonGrd.addColorStop(0.22, 'rgba(225,232,245,0.95)');
    moonGrd.addColorStop(0.35, 'rgba(200,215,240,0.25)');
    moonGrd.addColorStop(1, 'rgba(200,215,240,0)');
    g2.fillStyle = moonGrd;
    g2.fillRect(0, 0, 128, 128);
    var mt = new THREE.CanvasTexture(cv2);
    mt.encoding = THREE.sRGBEncoding;
    var mm = new THREE.SpriteMaterial({ map: mt, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
    moonSprite = new THREE.Sprite(mm);
    moonSprite.scale.set(300, 300, 1);
    moonSprite.visible = false;
    skyBillboardGroup.add(moonSprite);
  })();
  var sunDir = new THREE.Vector3();
  function updateSkyBillboards() {
    if (!sunSprite) return;
    var D = 3400;
    sunDir.copy(sun.position).normalize().multiplyScalar(D);
    sunSprite.position.copy(camera.position).add(sunDir);
    moonSprite.position.copy(camera.position).addScaledVector(sunDir, -1);
  }

  // ================= พื้น: วาดผังบน canvas แล้วใช้เป็น texture =================
  function makeGroundTexture() {
    var S = 3072;                 // ความละเอียด canvas (เมืองใหญ่ขึ้น ต้องคมขึ้น)
    var px = S / GROUND_SIZE;     // pixel ต่อเมตร
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');
    var r = 12345;
    function rnd() { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; }

    // พื้นฐาน: หาดทรายรอบขอบ → หญ้าด้านใน (เมืองติดทะเล)
    g.fillStyle = '#cfc09a';
    g.fillRect(0, 0, S, S);
    var beachGrd = g.createRadialGradient(S / 2, S / 2, 158 * px, S / 2, S / 2, 200 * px);
    beachGrd.addColorStop(0, 'rgba(90,125,60,0)');
    beachGrd.addColorStop(0.45, 'rgba(110,140,66,0.85)');
    beachGrd.addColorStop(1, 'rgba(118,148,72,1)');
    g.fillStyle = beachGrd;
    g.fillRect(0, 0, S, S);

    // หย่อมหญ้าเขียว/แห้ง + คราบดิน ให้ผิวไม่แบน
    for (var i = 0; i < 1400; i++) {
      var dry = rnd();
      var col = dry < 0.3 ? [104, 118, 58] : dry < 0.6 ? [72, 112, 44] : [88, 130, 52];
      g.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.3)';
      var rr = 14 + rnd() * 70;
      g.beginPath();
      g.arc(rnd() * S, rnd() * S, rr, 0, Math.PI * 2);
      g.fill();
    }

    // แปลงที่ดินตามโซน (พร้อมเส้นเขต)
    ZONE_BLOCKS.forEach(function (b) {
      var zone = null;
      for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === b.zone) zone = ZONES[i];
      var cx = (b.x + GROUND_SIZE / 2) * px;
      var cy = (b.z + GROUND_SIZE / 2) * px;
      var w = b.w * px, d = b.d * px;

      var hex = '#' + ('00000' + zone.color.toString(16)).slice(-6);
      g.fillStyle = hex + '55'; // โปร่งบนพื้น
      g.fillRect(cx - w / 2, cy - d / 2, w, d);
      g.strokeStyle = hex;
      g.lineWidth = 4;
      g.strokeRect(cx - w / 2, cy - d / 2, w, d);

      // เส้นแบ่งแปลงย่อย
      g.strokeStyle = 'rgba(255,255,255,0.3)';
      g.lineWidth = 2;
      var nx = Math.max(2, Math.round(b.w / 30));
      var nz = Math.max(2, Math.round(b.d / 30));
      for (var ix = 1; ix < nx; ix++) {
        g.beginPath();
        g.moveTo(cx - w / 2 + (w / nx) * ix, cy - d / 2);
        g.lineTo(cx - w / 2 + (w / nx) * ix, cy + d / 2);
        g.stroke();
      }
      for (var iz = 1; iz < nz; iz++) {
        g.beginPath();
        g.moveTo(cx - w / 2, cy - d / 2 + (d / nz) * iz);
        g.lineTo(cx + w / 2, cy - d / 2 + (d / nz) * iz);
        g.stroke();
      }
      // เนื้อพื้นโซนจุด ๆ (ไม่ให้แบน)
      g.fillStyle = 'rgba(0,0,0,0.07)';
      for (var sp = 0; sp < 110; sp++) {
        g.fillRect(cx - w / 2 + rnd() * w, cy - d / 2 + rnd() * d, 3, 3);
      }
    });

    // แถวนาข้าว NE (วาดเฉพาะในบล็อก 52x52)
    (function riceRows() {
      var b = { x: 105, z: -105, w: 52, d: 52 };
      var cx = (b.x + GROUND_SIZE / 2) * px, cy = (b.z + GROUND_SIZE / 2) * px;
      for (var ry = 0; ry < 10; ry++) {
        g.fillStyle = ry % 2 ? 'rgba(150,180,80,0.5)' : 'rgba(120,160,60,0.5)';
        g.fillRect(cx - b.w / 2 * px, cy - b.d / 2 * px + ry * (b.d / 10) * px, b.w * px, (b.d / 10) * px - 2);
      }
      // คันนาสีน้ำตาล
      g.strokeStyle = 'rgba(120,96,60,0.8)';
      g.lineWidth = 3;
      for (var k = 0; k <= 3; k++) {
        g.beginPath();
        g.moveTo(cx - b.w / 2 * px, cy - b.d / 2 * px + k * (b.d / 3) * px);
        g.lineTo(cx + b.w / 2 * px, cy - b.d / 2 * px + k * (b.d / 3) * px);
        g.stroke();
      }
    })();

    // ===== ถนน: ทางเท้า + ผิวถนน + เส้นเลน =====
    var roadW = ROAD_W * px;
    var sw = SIDEWALK_W * px;
    var roads = [-70, 0, 70]; // ถนนหลักกลางเมือง (เมตร)
    var edge = EDGE_ROAD;              // ถนนริมเมือง
    var allRoads = CITY_ROADS;          // ถนนทุกสาย (แนวเดียวกันทั้งแกน x/z)

    // ทางเท้าสีคอนกรีต (กว้าง SIDEWALK_W) ข้างถนนสายหลัก+รอง
    g.fillStyle = '#a8adb2';
    allRoads.forEach(function (pos) {
      var off = (pos + GROUND_SIZE / 2) * px;
      g.fillRect(off - (roadW / 2 + sw), 0, sw, S);
      g.fillRect(off + roadW / 2, 0, sw, S);
      g.fillRect(0, off - (roadW / 2 + sw), S, sw);
      g.fillRect(0, off + roadW / 2, S, sw);
    });
    // ทางเท้าถนนริมเมือง (ด้านใน)
    [-edge + 9.5, edge - 9.5].forEach(function (cx2) {
      g.fillRect((cx2 + GROUND_SIZE / 2) * px - sw / 2, 0, sw, S);
    });
    [-edge + 9.5, edge - 9.5].forEach(function (cz2) {
      g.fillRect(0, (cz2 + GROUND_SIZE / 2) * px - sw / 2, S, sw);
    });
    // รอยแตก/คราบบนทางเท้า
    for (var cr = 0; cr < 500; cr++) {
      g.fillStyle = 'rgba(0,0,0,' + (0.04 + rnd() * 0.07) + ')';
      g.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 1 + rnd() * 2);
    }

    // ผิวถนนยางมะตอย (มีจุดเนื้อละเอียด)
    allRoads.forEach(function (pos) {
      var c = (pos + GROUND_SIZE / 2) * px;
      g.fillStyle = '#33363a';
      g.fillRect(c - roadW / 2, 0, roadW, S);
      g.fillRect(0, c - roadW / 2, S, roadW);
      g.fillStyle = 'rgba(255,255,255,0.05)';
      for (var i = 0; i < 500; i++) {
        var y = rnd() * S;
        var x = c - roadW / 2 + rnd() * roadW;
        g.fillRect(x, y, 2, 2);
        g.fillRect(y, x, 2, 2);
      }
      // รอยลื่นจากล้อรถ (สองแนวเลน)
      g.fillStyle = 'rgba(0,0,0,0.08)';
      g.fillRect(c - roadW * 0.28, 0, roadW * 0.14, S);
      g.fillRect(c + roadW * 0.14, 0, roadW * 0.14, S);
      g.fillRect(0, c - roadW * 0.28, S, roadW * 0.14);
      g.fillRect(0, c + roadW * 0.14, S, roadW * 0.14);
    });
    // ถนนริมเมือง
    [[-edge, 0], [edge, 0], [0, -edge], [0, edge]].forEach(function (p) {
      g.fillStyle = '#33363a';
      g.fillRect((p[0] + GROUND_SIZE / 2) * px - roadW / 2, 0, roadW, S);
      g.fillRect(0, (p[1] + GROUND_SIZE / 2) * px - roadW / 2, S, roadW);
    });

    // เส้นแบ่งเลน + เส้นขอบถนน
    allRoads.forEach(function (pos) {
      var c = (pos + GROUND_SIZE / 2) * px;
      g.fillStyle = 'rgba(250,245,225,0.75)';
      for (var y = 0; y < S; y += 64) {
        g.fillRect(c - 2.5, y, 5, 28);               // แนวตั้ง
        g.fillRect(y, c - 2.5, 28, 5);               // แนวนอน
      }
      g.fillStyle = 'rgba(250,245,225,0.3)';
      g.fillRect(c - roadW / 2, 0, 2, S);
      g.fillRect(c + roadW / 2 - 2, 0, 2, S);
      g.fillRect(0, c - roadW / 2, S, 2);
      g.fillRect(0, c + roadW / 2 - 2, S, 2);
    });

    // ลานจอดรถ 2 แห่ง (วาดช่องจอด)
    [[50, 88], [-50, -88]].forEach(function (lot) {
      var lx = (lot[0] + GROUND_SIZE / 2) * px, lz = (lot[1] + GROUND_SIZE / 2) * px;
      var lw = 20 * px, ld = 14 * px;
      g.fillStyle = '#3a3d42';
      g.fillRect(lx - lw / 2, lz - ld / 2, lw, ld);
      g.strokeStyle = 'rgba(250,245,225,0.55)';
      g.lineWidth = 2;
      for (var s = 0; s <= 8; s++) {
        g.beginPath();
        g.moveTo(lx - lw / 2 + s * (lw / 8), lz - ld / 2);
        g.lineTo(lx - lw / 2 + s * (lw / 8), lz - ld / 2 + 6 * px);
        g.stroke();
        g.beginPath();
        g.moveTo(lx - lw / 2 + s * (lw / 8), lz + ld / 2);
        g.lineTo(lx - lw / 2 + s * (lw / 8), lz + ld / 2 - 6 * px);
        g.stroke();
      }
    });

    // ทะเลสาบกลางเมือง
    var lg = g.createRadialGradient(S * 0.5, S * 0.5, 10, S * 0.5, S * 0.5, 60 * px);
    lg.addColorStop(0, '#3f7fae');
    lg.addColorStop(1, '#2c5d84');
    g.fillStyle = lg;
    g.beginPath();
    g.ellipse(S * 0.5, S * 0.5, 55 * px, 38 * px, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#d9c98a';
    g.lineWidth = 6;
    g.stroke();

    // สวนสาธารณะกลางเมือง (อยู่ในช่องระหว่างถนน ไม่ทับถนน)
    var parkCX = 104, parkCZ = 45, parkR = 16;
    g.fillStyle = '#4e7a3a';
    g.beginPath();
    g.arc((parkCX + GROUND_SIZE / 2) * px, (parkCZ + GROUND_SIZE / 2) * px, parkR * px, 0, Math.PI * 2);
    g.fill();
    // เนื้อหญ้าจุด ๆ
    for (var pi = 0; pi < 130; pi++) {
      var a3 = rnd() * Math.PI * 2;
      var rr3 = Math.sqrt(rnd()) * parkR;
      var gx = parkCX + Math.cos(a3) * rr3;
      var gz = parkCZ + Math.sin(a3) * rr3;
      g.fillStyle = 'rgba(' + (58 + Math.floor(rnd() * 44)) + ',' + (98 + Math.floor(rnd() * 34)) + ',' + (40 + Math.floor(rnd() * 28)) + ',0.35)';
      g.beginPath();
      g.arc((gx + GROUND_SIZE / 2) * px, (gz + GROUND_SIZE / 2) * px, 2 + rnd() * 5, 0, Math.PI * 2);
      g.fill();
    }
    // ทางเดินวงใน + ขอบสวน
    g.strokeStyle = '#d8c9a0';
    g.lineWidth = 4;
    g.beginPath();
    g.arc((parkCX + GROUND_SIZE / 2) * px, (parkCZ + GROUND_SIZE / 2) * px, 14 * px, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#e8f0d8';
    g.lineWidth = 5;
    g.beginPath();
    g.arc((parkCX + GROUND_SIZE / 2) * px, (parkCZ + GROUND_SIZE / 2) * px, parkR * px, 0, Math.PI * 2);
    g.stroke();

    var tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    return tex;
  }

  // หญ้า texture สำเร็จรูป (ใช้ซ้ำได้ทั้งพื้นและพื้นโซน)
  var grassTex = CityTextures.get('grass');
  var groundMap = makeGroundTexture();

  var groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    new THREE.MeshStandardMaterial({
      map: groundMap,
      bumpMap: grassTex.bumpMap, bumpScale: 0.25,
      roughness: 0.95, metalness: 0,
    })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // ---------- ฐานพื้นดินหนา แสดงชั้นดินตัดขวาง ----------
  function makeSoilTexture() {
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 256;
    var g = cv.getContext('2d');
    var r = 2024;
    function rnd() { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; }
    // ชั้นดินจากบนลงล่าง: หญ้า → ดินบน → อินทรียวัตถุ → ดินร่วน → ดินเหนียว → หิน/กรวด
    var layers = [
      [0, 0.10, '#4e7a3a'],
      [0.10, 0.34, '#6b4f2e'],
      [0.34, 0.42, '#3d2f1c'],
      [0.42, 0.70, '#8a6d3b'],
      [0.70, 0.86, '#b08d57'],
      [0.86, 1.00, '#7a7f85'],
    ];
    layers.forEach(function (L) {
      g.fillStyle = L[2];
      g.fillRect(0, L[0] * cv.height, cv.width, (L[1] - L[0]) * cv.height);
    });
    // จุดกรวด/หิน + ความผันผวนของเนื้อดิน
    for (var i = 0; i < 320; i++) {
      var y = rnd() * cv.height;
      var tone = y > cv.height * 0.72 ? 130 + rnd() * 40 : 85 + rnd() * 60;
      g.fillStyle = 'rgba(' + tone + ',' + (tone - 18) + ',' + (tone - 45) + ',0.45)';
      g.beginPath();
      g.arc(rnd() * cv.width, y, 0.8 + rnd() * 2.4, 0, Math.PI * 2);
      g.fill();
    }
    // เส้นชั้นดินเป็นคลื่น
    g.strokeStyle = 'rgba(0,0,0,0.12)';
    [0.10, 0.34, 0.42, 0.70, 0.86].forEach(function (yy) {
      g.lineWidth = 3;
      g.beginPath();
      for (var x = 0; x <= cv.width; x += 4) {
        var wy = yy * cv.height + Math.sin(x * 0.18 + yy * 7) * 4;
        if (x === 0) g.moveTo(x, wy); else g.lineTo(x, wy);
      }
      g.stroke();
    });
    var tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 1);
    tex.anisotropy = 8;
    return tex;
  }

  var groundBase = new THREE.Mesh(
    new THREE.BoxGeometry(GROUND_SIZE, GROUND_H, GROUND_SIZE),
    new THREE.MeshStandardMaterial({ map: makeSoilTexture(), roughness: 0.95 })
  );
  groundBase.position.y = -(GROUND_H / 2 + 0.06);
  groundBase.receiveShadow = true;
  scene.add(groundBase);

  // ================= ผาดินรอบขอบเมือง (ไม่มีน้ำรอบ — เห็นแค่ชั้นดินเมื่อมองเฉียง) =================
  (function makeSoilCliff() {
    var cliff = new THREE.Mesh(
      new THREE.CylinderGeometry(GROUND_SIZE / 2 + 0.2, GROUND_SIZE / 2 + 4, GROUND_H + 1.2, 64, 1, true),
      new THREE.MeshStandardMaterial({ map: groundBase.material.map.clone(), roughness: 1 })
    );
    cliff.material.map.wrapS = cliff.material.map.wrapT = THREE.RepeatWrapping;
    cliff.material.map.repeat.set(24, 1);
    cliff.position.y = -(GROUND_H + 1.2) / 2 + 0.1;
    scene.add(cliff);
  })();

  // ================= ผิวน้ำทะเลสาบ (นูนคลื่นจริง) =================
  var waterTexBase = CityTextures.get('water');
  var lakeMat = new THREE.MeshStandardMaterial({
    map: waterTexBase.map.clone(),
    bumpMap: waterTexBase.bumpMap.clone(),
    bumpScale: 0.5,
    color: 0xcfe4f0,
    roughness: 0.08, metalness: 0.35,
    envMapIntensity: 1.3,
  });
  lakeMat.map.wrapS = lakeMat.map.wrapT = THREE.RepeatWrapping;
  lakeMat.map.repeat.set(6, 4);
  lakeMat.bumpMap.wrapS = lakeMat.bumpMap.wrapT = THREE.RepeatWrapping;
  lakeMat.bumpMap.repeat.set(6, 4);
  var lake = new THREE.Mesh(new THREE.CircleGeometry(1, 48), lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(55, 38, 1);
  lake.position.y = 0.07;
  scene.add(lake);

  // ================= ทางเท้ายกสูง (คอนกรีต 3 ม. รอบถนนทุกสาย) =================
  var CityMats = window.City ? City.mats : null;
  var sidewalkMat = CityMats ? CityMats.concrete : new THREE.MeshStandardMaterial({ color: 0xa8adb2, roughness: 0.95 });

  function sidewalkSlabs() {
    var grp = new THREE.Group();
    var roads = [-70, 0, 70];   // ถนนหลักกลางเมือง (มีทางเท้ายกสูง)
    var edge = EDGE_ROAD;
    // ช่วงทางเท้า: เว้นช่องตรงแยก (ถนนตัดกันที่ -70/0/70) และห้ามทะเลสาบกลางเมือง
    var SEGS = [-255, -81.2, -58.8, -11.2, 11.2, 58.8, 81.2, 255];
    var LAKE_HALF = 40;   // ครึ่งความยาวช่วงที่ทะเลสาบตัดถนนกลาง (น้ำถึง ~55/38 + กันชน)

    function addSlab(x, z, len, along) {
      if (len < 2) return;   // ชิ้นสั้นเกินไป ข้าม
      var geo = along === 'z' ? new THREE.BoxGeometry(SIDEWALK_W, SIDEWALK_H, len) : new THREE.BoxGeometry(len, SIDEWALK_H, SIDEWALK_W);
      var m = new THREE.Mesh(geo, sidewalkMat);
      m.position.set(x, SIDEWALK_H / 2, z);
      m.receiveShadow = true;
      m.castShadow = true;
      grp.add(m);
    }

    // ตัดช่วง [a,b] ไม่ให้ทับโซนน้ำ [-LAKE_HALF, LAKE_HALF] (เฉพาะถนนที่ข้ามทะเลสาบ)
    function clippedSegs(a, b, crossesLake) {
      if (!crossesLake) return [[a, b]];
      var out = [];
      if (a < -LAKE_HALF) out.push([a, -LAKE_HALF]);
      if (b > LAKE_HALF) out.push([LAKE_HALF, b]);
      return out;
    }

    roads.forEach(function (pos) {
      var crosses = (pos === 0);   // ถนนกลางเมืองสองสายข้ามทะเลสาบ
      for (var s = 0; s < SEGS.length; s += 2) {
        var segs2 = clippedSegs(SEGS[s], SEGS[s + 1], crosses);
        segs2.forEach(function (sg) {
          var a = sg[0], b = sg[1];
          var len = b - a;
          if (len <= 0) return;
          var mid = (a + b) / 2;
          // ริมถนนแนว z (วิ่งตามแกน z) + ริมถนนแนว x (วิ่งตามแกน x)
          addSlab(pos - (ROAD_W / 2 + SIDEWALK_W / 2), mid, len, 'z');
          addSlab(pos + (ROAD_W / 2 + SIDEWALK_W / 2), mid, len, 'z');
          addSlab(mid, pos - (ROAD_W / 2 + SIDEWALK_W / 2), len, 'x');
          addSlab(mid, pos + (ROAD_W / 2 + SIDEWALK_W / 2), len, 'x');
        });
      }
    });
    // ทางเท้าริมเมือง (ด้านใน) — ไม่ข้ามทะเลสาบ
    [-edge + 9.5, edge - 9.5].forEach(function (cx) {
      addSlab(cx, 0, GROUND_SIZE - 60, 'z');
    });
    [-edge + 9.5, edge - 9.5].forEach(function (cz) {
      addSlab(0, cz, GROUND_SIZE - 60, 'x');
    });
    scene.add(grp);
  }
  sidewalkSlabs();

  // ================= อาคาร =================
  var buildingsGroup = new THREE.Group();
  scene.add(buildingsGroup);

  // กลุ่มแลนด์มาร์ก (อาคารจำลองรายแบบ) + กลุ่มคมนาคม (สะพาน/ไฟจราจร)
  var landmarksGroup = new THREE.Group();
  scene.add(landmarksGroup);
  var transportGroup = new THREE.Group();
  scene.add(transportGroup);
  var landmarkMeshes = [];   // กล่องที่ใช้ raycast คลิกดูชื่ออาคาร
  var treesGroup = new THREE.Group();
  scene.add(treesGroup);
  var propsGroup = new THREE.Group();   // ของประดับถนน/สวน
  scene.add(propsGroup);
  var parkedGroup = new THREE.Group();  // รถจอดริมถนน+ลานจอด
  scene.add(parkedGroup);
  var curbGroup = new THREE.Group();
  scene.add(curbGroup);

  var zoneMeshes = [];
  var windowMats = [];   // วัสดุหน้าต่าง (ไฟดวงคืน)
  var windowTexCache = {};

  function seededRandom(seed) {
    var s = seed;
    return function () {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  // สร้าง texture หน้าต่าง (สุ่มไฟติด/ดับ — กลางวันกระจกเข้ม กลางคืนไฟอุ่น)
  function windowTexture(floors, cols) {
    var key = floors + 'x' + cols;
    if (windowTexCache[key]) return windowTexCache[key];

    var cv = document.createElement('canvas');
    var cw = cols * 16, ch = floors * 16;
    cv.width = cw; cv.height = ch;
    var g = cv.getContext('2d');
    g.fillStyle = '#26313d'; // กระจกสีฟ้าเข้ม (สะท้อนแสง)
    g.fillRect(0, 0, cw, ch);

    var rand = seededRandom(floors * 97 + cols * 31 + 7);
    for (var y = 0; y < floors; y++) {
      for (var x = 0; x < cols; x++) {
        var lit = rand() < 0.5; // 50% ติดไฟ
        if (lit) {
          var warm = rand();
          g.fillStyle = warm < 0.75 ? '#ffd98a' : '#cfe4ff'; // ไฟหลอดอุ่น/ฟ้า
        } else {
          g.fillStyle = rand() < 0.5 ? '#31404f' : '#3c4d5e';
        }
        g.fillRect(x * 16 + 3, y * 16 + 3, 10, 10);
      }
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    windowTexCache[key] = tex;
    return tex;
  }

  // ตัวหน้าต่างจริง (กล่องกระจกบาง) — กลางวันสะท้อนฟ้า/เงา ตอนกลางคืนเรืองแสงเหมือนไฟในตึก
  // ใช้ PlaneGeometry ติดผิวอาคารแบบเดิม แต่เปลี่ยนวัสดุเป็น MeshStandardMaterial + envMap
  function makeWindowMaterial(tex) {
    var m = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      opacity: 0.94,
      roughness: 0.22,
      metalness: 0.55,
      envMapIntensity: 1.1,
      emissiveMap: tex,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    windowMats.push(m);
    return m;
  }

  // วัสดุปูนฉาบสีตามโซน (มีเท็กซ์เจอร์จริง ไม่ใช่สีแบน)
  function tintedPlaster(hex) {
    var m = City.mats.plaster.clone();
    m.color = new THREE.Color(hex);
    return m;
  }

  function makeBuilding(x, z, w, d, floors, zone) {
    var bh = floors * FLOOR_H;
    var group = new THREE.Group();

    // ตัวอาคาร — ผนังปูนฉาบ/อิฐสุ่มสีอ่อนจากสีโซน (ไม่ใช่สีแบน)
    var wallColor = new THREE.Color(zone.color).lerp(new THREE.Color(0xe8e6e0), 0.72);
    var bodyMat = tintedPlaster(wallColor.getHex());
    bodyMat.roughness = 0.85;
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, bh, d), bodyMat);
    body.position.y = bh / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // หน้าต่างทั้ง 4 ด้าน (แผ่นบางครอบด้านข้าง)
    var cols = Math.max(2, Math.round(w / 4));
    var rowsZ = Math.max(2, Math.round(d / 4));
    var winTexX = windowTexture(floors, cols);
    var winTexZ = windowTexture(floors, rowsZ);

    var winMatX = makeWindowMaterial(winTexX);
    var winMatZ = makeWindowMaterial(winTexZ);

    var eps = 0.06;
    var px1 = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, bh * 0.92), winMatX);
    px1.position.set(0, bh / 2, d / 2 + eps);
    var px2 = px1.clone(); px2.rotation.y = Math.PI; px2.position.z = -d / 2 - eps;
    var pz1 = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.96, bh * 0.92), winMatZ);
    pz1.rotation.y = Math.PI / 2; pz1.position.set(w / 2 + eps, bh / 2, 0);
    var pz2 = pz1.clone(); pz2.rotation.y = -Math.PI / 2; pz2.position.x = -w / 2 - eps;
    group.add(px1, px2, pz1, pz2);

    // ดาดฟ้า (สีตามโซน — มองจากมุมสูง/ระยะไกลรู้เลยว่าเป็นย่านอะไร)
    var roofColor = new THREE.Color(zone.color).lerp(new THREE.Color(0xf2f0ea), 0.35);
    var roofMat = tintedPlaster(roofColor.getHex());
    roofMat.roughness = 0.9;
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.94, 0.5, d * 0.94),
      roofMat
    );
    roof.position.y = bh + 0.25;
    roof.castShadow = true;
    group.add(roof);

    // ขอบดาดฟ้า (parapet) สี่ด้าน
    var parapetMat = tintedPlaster(new THREE.Color(wallColor).multiplyScalar(0.85).getHex());
    var ph = 0.7, pt = 0.28;
    // สองด้านตามแกน z (ยาวตาม w) + สองด้านตามแกน x (ยาวตาม d)
    [[0, d * 0.47 - pt / 2], [0, -d * 0.47 + pt / 2],
     [w * 0.47 - pt / 2, 0], [-w * 0.47 + pt / 2, 0]].forEach(function (pp, i) {
      var geo = i < 2 ? new THREE.BoxGeometry(w * 0.94, ph, pt) : new THREE.BoxGeometry(pt, ph, d * 0.94);
      var pm = new THREE.Mesh(geo, parapetMat);
      pm.position.set(pp[0], bh + 0.25 + ph / 2, pp[1]);
      pm.castShadow = true;
      group.add(pm);
    });

    // ของบนดาดฟ้า: แอร์/ถังน้ำ/เสาอากาศ/โซลาร์
    var clutterRand = seededRandom(Math.floor(x * 13 + z * 7 + bh));
    group.add(City.rooftopClutter(w, d, bh + 0.5, clutterRand));

    group.position.set(x, 0, z);
    buildingsGroup.add(group);

    // ใช้ body เป็นตัว raycast
    body.userData = { zone: zone, floors: floors };
    zoneMeshes.push(body);
    return group;
  }

  // ตึกแบบหลากหลาย (สุ่ม 4 แบบ) — บล็อกเติมจะได้ไม่เป็นกล่องซ้ำกันหมด
  function makeVariedBuilding(x, z, w, d, floors, zone, rand) {
    var kind = Math.floor(rand() * 4);
    var bh = floors * FLOOR_H;
    var wallColor = new THREE.Color(zone.color).lerp(new THREE.Color(0xe8e6e0), 0.72);
    var bodyMat = tintedPlaster(wallColor.getHex());
    bodyMat.roughness = 0.85;
    if (kind === 0) {
      // ทรงขั้นบันได: ฐานกว้าง 2 ชั้นล่าง + ตัวตึกแคบกว่า
      var base = new THREE.Mesh(new THREE.BoxGeometry(w, bh * 0.35, d), bodyMat);
      base.position.y = bh * 0.175;
      base.castShadow = true; base.receiveShadow = true;
      var upper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, bh * 0.65, d * 0.62), bodyMat);
      upper.position.y = bh * 0.35 + bh * 0.325;
      upper.castShadow = true; upper.receiveShadow = true;
      var grp0 = new THREE.Group();
      grp0.add(base, upper);
      grp0.position.set(x, 0, z);
      buildingsGroup.add(grp0);
      var proxy0 = base;
      proxy0.userData = { zone: zone, floors: floors };
      zoneMeshes.push(proxy0);
      return grp0;
    }
    if (kind === 1) {
      // ทรง L (ปีกตัดมุม)
      var armW = Math.min(w, d) * 0.45;
      var grp1 = City.helpers.lShape(w, d, bh, armW, null, {});
      grp1.traverse(function (mm) { if (mm.isMesh) { mm.material = bodyMat; mm.castShadow = true; mm.receiveShadow = true; } });
      grp1.position.set(x, 0, z);
      grp1.rotation.y = rand() < 0.5 ? 0 : Math.PI / 2;
      buildingsGroup.add(grp1);
      var proxy1 = grp1.children[0];
      proxy1.userData = { zone: zone, floors: floors };
      zoneMeshes.push(proxy1);
      return grp1;
    }
    if (kind === 2) {
      // ทรงแคปซูลโค้งมน (ตึกมุมมนแบบเมืองจริง)
      var cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(w, d) / 2, Math.min(w, d) / 2, bh, 12), bodyMat);
      cyl2.position.set(x, bh / 2, z);
      cyl2.castShadow = true; cyl2.receiveShadow = true;
      cyl2.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
      buildingsGroup.add(cyl2);
      cyl2.userData = { zone: zone, floors: floors };
      zoneMeshes.push(cyl2);
      return cyl2;
    }
    // แบบธรรมดา + กล่องดาดฟ้ายื่น (เส้นขอบฟ้าไม่เรียบ)
    var grp3 = makeBuilding(x, z, w, d, floors, zone);
    var rw = w * 0.3, rd = d * 0.3;
    var rb = new THREE.Mesh(new THREE.BoxGeometry(rw, 1.6, rd), tintedPlaster(wallColor.clone().multiplyScalar(0.88).getHex()));
    rb.position.set(x + (rand() - 0.5) * w * 0.3, bh + 0.8, z + (rand() - 0.5) * d * 0.3);
    rb.castShadow = true;
    buildingsGroup.add(rb);
    return grp3;
  }

  function zoneById(id) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i];
    return null;
  }

  // ลงทะเบียน mesh ทุกชิ้นในแลนด์มาร์กให้คลิกได้ (พร้อมชื่ออาคาร)
  function registerLandmark(grp, label, cat, zoneId) {
    grp.traverse(function (m) {
      if (!m.isMesh) return;
      m.userData = { label: label, cat: cat, zoneId: zoneId, landmark: true };
      // ชิ้นแบน ๆ (สนาม/ลาน/ทางม้าลาย) ไม่ให้ทิ้งเงาเพื่อกันอาการ shadow acne
      var bb = m.geometry.boundingBox;
      if (!bb) {
        m.geometry.computeBoundingBox();
        bb = m.geometry.boundingBox;
      }
      m.castShadow = (bb.max.y - bb.min.y) >= 0.5;   // สะพานยกระดับทิ้งเงาลงน้ำ
      m.receiveShadow = true;   // อาคารรับเงาจากอาคารด้วยกัน — เงาชัดขึ้นทั้งเมือง
      landmarkMeshes.push(m);
    });
  }

  // ตรวจว่าพื้นที่ (x, z, กว้าง w, ลึก d) ชนกับของที่วางไปแล้วหรือไม่
  function overlaps(boxes, x, z, w, d) {
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (Math.abs(x - b.x) < (w + b.w) / 2 && Math.abs(z - b.z) < (d + b.d) / 2) return true;
    }
    return false;
  }

  // ================= ตัวกันบล็อกโซนทับถนน (safety net) =================
  // บดบังตัวเลขใน ZONE_BLOCKS ให้เข้าช่องระหว่างถนนเสมอ: ขอบบล็อกห่างแนวถนนอย่างน้อย 8 ม.
  // ทำงานครั้งเดียวตอนโหลด — ถ้าแก้พิกัดบล็อกผิดในอนาคต เมืองก็ยังไม่ทับถนน
  (function fitBlocksToRoads() {
    var RX = CITY_ROADS.concat([EDGE_ROAD]);   // แนวถนนแกน x (z คงที่)
    var RZ = CITY_ROADS.concat([EDGE_ROAD]);   // แนวถนนแกน z (x คงที่)
    var LIMIT = GROUND_SIZE / 2 - 14;          // ขอบพื้นที่วางบล็อกได้
    var CLEAR = 8;                             // ระยะปลอดภัยจากขอบถนน
    function fit(v, size, roads) {
      var lo = v - size / 2, hi = v + size / 2;
      var opts = [];
      for (var i = 0; i < roads.length; i++) {
        var r = roads[i];
        var a = r - CLEAR - size / 2;   // วางก่อนถนนสายนี้
        var b = r + CLEAR + size / 2;   // วางหลังถนนสายนี้
        if (a >= -LIMIT && a <= LIMIT) opts.push(a);
        if (b >= -LIMIT && b <= LIMIT) opts.push(b);
      }
      // หาตำแหน่งที่ต้องขยับน้อยที่สุด
      var best = v, bestShift = Infinity;
      for (var j = 0; j < opts.length; j++) {
        var sh = Math.abs(opts[j] - v);
        if (sh < bestShift) { bestShift = sh; best = opts[j]; }
      }
      // ไม่มีตัวเลือกไหนดี (ช่องแคบกว่าบล็อก) → ย่อขนาดให้พอดีช่องที่ถูกสุด
      if (bestShift === Infinity) return { v: v, size: Math.min(size, 52) };
      return { v: best, size: size };
    }
    for (var k = 0; k < ZONE_BLOCKS.length; k++) {
      var b = ZONE_BLOCKS[k];
      var fx = fit(b.x, b.w, RX);
      var fz = fit(b.z, b.d, RZ);
      if (fx.v !== b.x || fz.v !== b.z) {
        console.warn('[city] block', b.zone, 'adjusted to avoid road:',
          b.x + ',' + b.z + ' → ' + fx.v + ',' + fz.v);
      }
      b.x = fx.v; b.w = fx.size;
      b.z = fz.v; b.d = fz.size;
    }
  })();

  // จุดวางแบบกระจาย: แบ่งบล็อกเป็นตาราง (สเตรตไฟล์) แล้วสุ่มเจเตอร์เล็กๆ ในช่อง
  // → สิ่งก่อสร้างครอบพื้นที่บล็อกทั้งหมด ไม่กระจุกอยู่ฝั่งเดียว
  function scatterPoints(block, n, rand, margin) {
    var m = margin != null ? margin : 10;
    var w = Math.max(0, block.w - m * 2);
    var d = Math.max(0, block.d - m * 2);
    var cols = Math.max(1, Math.round(Math.sqrt(n * w / Math.max(1, d))));
    var rows = Math.max(1, Math.ceil(n / cols));
    var pts = [];
    var index = 0;
    for (var r = 0; r < rows && pts.length < n; r++) {
      // เว้นช่องแถวคู่/คี่เล็กน้อย ให้ผังคล้ายเมืองจริง (ไม่เรียงตรงเป๊ะ)
      var offset = (r % 2) * 0.35 * (w / cols);
      for (var c = 0; c < cols && pts.length < n; c++) {
        var cx = -w / 2 + (c + 0.5) * (w / cols);
        var cz = -d / 2 + (r + 0.5) * (d / rows);
        var jx = (rand() - 0.5) * Math.min(0.6, 1 / cols) * w;
        var jz = (rand() - 0.5) * Math.min(0.6, 1 / rows) * d;
        pts.push({ x: block.x + cx + offset + jx, z: block.z + cz + jz, i: index++ });
      }
    }
    return pts;
  }

  // เรียงจุดจากใจกลางบล็อกออกไป (ใกล้ → ไกล) เพื่อคุมลำดับการวาง
  function ringOrder(pts, block) {
    var cx = block.x, cz = block.z;
    var arr = pts.slice();
    arr.sort(function (a, b) {
      var da = (a.x - cx) * (a.x - cx) + (a.z - cz) * (a.z - cz);
      var db = (b.x - cx) * (b.x - cx) + (b.z - cz) * (b.z - cz);
      return da - db;
    });
    return arr;
  }

  // วางสิ่งปลูกสร้างจาก City.makers ลงในบล็อกโซน (กระจายทั่วบล็อก + หลีกเลี่ยงการทับซ้อน)
  function placeMakers(block, makers, count, minS, maxS, seed, boxes) {
    var rand = seededRandom(seed);
    var pts = ringOrder(scatterPoints(block, count, rand), block);
    var placed = 0, guard = 0;
    while (placed < count && guard < count * 20 && pts.length) {
      guard++;
      var p = pts.shift();
      var key = makers[Math.floor(rand() * makers.length)];
      var mk = City.makers[key];
      if (!mk) continue;
      var s = minS + rand() * (maxS - minS);
      var grp = mk.build(rand);
      grp.rotation.y = rand() * Math.PI;   // หันสุ่มทุกทิศ — หมู่อาคารไม่เรียงตัวเป็นตาราง
      // อาคารใหญ่ขึ้นกว่าเดิมชัดเจน: ตัวโครงกว้างขึ้น ~1.85x และสูงขึ้น ~3x เห็นเด่นจากระยะไกล
      grp.scale.set(s * 1.85, s * 3, s * 1.85);
      var x = p.x, z = p.z;
      grp.position.set(x, 0, z);
      // คำนวณขอบจริงของอาคาร (รวมสเกล+หมุน) เพื่อกันทับซ้อน
      var bb = new THREE.Box3().setFromObject(grp);
      var bw = bb.max.x - bb.min.x + 2;
      var bd = bb.max.z - bb.min.z + 2;
      if (x - bw / 2 < block.x - block.w / 2 || x + bw / 2 > block.x + block.w / 2 ||
          z - bd / 2 < block.z - block.d / 2 || z + bd / 2 > block.z + block.d / 2) {
        pts.push({ x: x, z: z, i: p.i });          // เก็บจุดไว้ลองกับอาคารลำดับถัดๆ ไปอีกครั้ง
        pts.sort(function (a, b) { return a.i - b.i; });
        continue;
      }
      if (overlaps(boxes, x, z, bw, bd)) {
        pts.push({ x: x, z: z, i: p.i + 0.5 });    // จุดเดิมลองใหม่หลังจุดอื่น กันลูปจุดเดิม
        pts.sort(function (a, b) { return a.i - b.i; });
        continue;
      }
      boxes.push({ x: x, z: z, w: bw, d: bd });
      landmarksGroup.add(grp);
      registerLandmark(grp, mk.label, mk.cat, block.zone);
      addBuildingLabel(grp, mk.label, mk.cat, bb.max.y + 7, null, 2);   // อาคารชื่อเฉพาะ
      placed++;
    }
  }

  // ขอบทางเท้ารอบบล็อกโซนในเมือง (คอนกรีตมีเท็กซ์เจอร์)
  function makeCurb(x, z, w, d) {
    var h = 0.24;
    var w2 = w + 3, d2 = d + 3;
    var m = CityMats ? CityMats.concrete : sidewalkMat;
    var a = new THREE.Mesh(new THREE.BoxGeometry(w2, h, 0.7), m);
    a.position.set(x, h / 2, z - d2 / 2);
    var b = a.clone(); b.position.z = z + d2 / 2;
    var c = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, d2 - 1.4), m);
    c.position.set(x - w2 / 2, h / 2, z);
    var e = c.clone(); e.position.x = x + w2 / 2;
    [a, b, c, e].forEach(function (p) { p.castShadow = true; p.receiveShadow = true; });
    curbGroup.add(a, b, c, e);
  }

  function buildCity() {
    var allBlocks = ZONE_BLOCKS.concat(INFILL_BLOCKS);
    allBlocks.forEach(function (block, bi) {
      var zone = zoneById(block.zone);
      var makers = ZONE_MAKERS[block.zone];
      var count = ZONE_COUNTS[block.zone] || 4;
      var boxes = [];   // พื้นที่ที่วางของไปแล้ว ใช้กันทับซ้อน

      if (makers) {
        // โซนที่อยู่อาศัยใช้สเกลใหญ่หน่อย (บ้าน/คอนโด) ที่เหลือสเกลมาตรฐาน
        var big = block.zone === 'res';
        placeMakers(block, makers, count, big ? 1 : 0.9, big ? 1.25 : 1.15, bi * 7 + 13, boxes);
      }

      // ย่านแน่น: เติมกลุ่มอาคารเรียงแถวประจำย่าน (แบบเมืองจริงจากมุมสูง)
      var CLUSTER_OF = { res: 'estate', edu: 'campus', commerce: 'shophouses', food: 'foodStreet' };
      if (CLUSTER_OF[block.zone] && block.w >= 50 && block.d >= 30) {
        var cgrp = City.cluster(CLUSTER_OF[block.zone]);
        var cbb0 = new THREE.Box3().setFromObject(cgrp);
        var c0w = Math.max(1, cbb0.max.x - cbb0.min.x);
        var c0d = Math.max(1, cbb0.max.z - cbb0.min.z);
        // สเกลให้พอดีบล็อก (กันแถวอาคารยื่นออกนอกบล็อกไปทับถนน) แต่ไม่เกิน 2.4 เท่า
        var fit = Math.min(2.4, (block.w - 8) / c0w, (block.d - 8) / c0d);
        fit = Math.max(0.9, fit);
        cgrp.scale.set(fit, fit * 1.5, fit);
        var cbb = new THREE.Box3().setFromObject(cgrp);
        var cw = cbb.max.x - cbb.min.x, cd = cbb.max.z - cbb.min.z;
        var cTry = 0, cPlaced = false;
        while (cTry++ < 16 && !cPlaced) {
          var cx2 = block.x + (seededRandom(bi * 97 + cTry)() - 0.5) * Math.max(2, block.w - cw - 6);
          var cz2 = block.z + (seededRandom(bi * 131 + cTry)() - 0.5) * Math.max(2, block.d - cd - 6);
          if (overlaps(boxes, cx2, cz2, cw, cd)) continue;
          cgrp.position.set(cx2, 0, cz2);
          landmarksGroup.add(cgrp);
          var clName = { estate: 'หมู่บ้านจัดสรร', campus: 'กลุ่มอาคารเรียน', shophouses: 'ตึกแถวย่านการค้า', foodStreet: 'ย่านร้านอาหาร' }[CLUSTER_OF[block.zone]];
          registerLandmark(cgrp, clName, 'ย่าน', block.zone);
          addBuildingLabel(cgrp, clName, 'ย่าน', null, null, 3);   // หมู่บ้าน/ย่าน = แลนด์มาร์กหลัก
          boxes.push({ x: cx2, z: cz2, w: cw, d: cd });
          cPlaced = true;
        }
      }

      // กล่องเติม (ให้เห็นสีโซนบนผังเมือง) — ย่านใจกลางเมือง/ที่อยู่อาศัย: ตึกตามช่วงชั้นของโซน
      if (DENSE_ZONES[block.zone]) {
        var rand = seededRandom(bi * 31 + 7);
        var filler = 7 + (bi % 4);
        var fpts = scatterPoints(block, filler, rand, 6);   // จุดกระจายทั่วบล็อก ไม่กระจุก
        var fRetry = 0;
        for (var j = 0; j < filler && fpts.length; j++) {
          var bw = 10 + rand() * (block.w / 3.6);
          var bd = 10 + rand() * (block.d / 3.6);
          var floors = Math.round(zone.floors[0] + rand() * (zone.floors[1] - zone.floors[0]));
          var fp = fpts.shift();
          var fx = fp.x, fz = fp.z;
          if (overlaps(boxes, fx, fz, bw + 2, bd + 2)) {
            if (++fRetry > filler * 8) continue;   // กันลูปไม่รู้จบเมื่อบล็อกแน่นเกิน
            fpts.push(fp); j--;
            continue;
          }
          boxes.push({ x: fx, z: fz, w: bw + 2, d: bd + 2 });
          var fgrp = makeVariedBuilding(fx, fz, bw, bd, floors, zone, rand);
          addBuildingLabel(fgrp, zone.label.split(' (')[0], null, null, ZONE_ICONS[zone.id], 1);   // ตึกเติมตามโซน
        }
        // ต้นไม้ในย่านที่อยู่อาศัย
        if (block.zone === 'res') {
          for (var t = 0; t < 6; t++) {
            var tx = block.x + (rand() - 0.5) * (block.w - 8);
            var tz = block.z + (rand() - 0.5) * (block.d - 8);
            if (overlaps(boxes, tx, tz, 4, 4)) continue;
            boxes.push({ x: tx, z: tz, w: 3, d: 3 });
            makeTree(tx, tz, 0.7 + rand() * 0.4, rand);
            if (rand() < 0.6) makeBush(tx + 2.2, tz + 1.4, 0.8 + rand() * 0.5, rand);
          }
        }
      }
      // โซนอื่นก็เติมต้นไม้/พุ่มไม้บ้าง (ยกเว้นเกษตร/อุตสาหกรรม)
      else if (block.zone !== 'agriculture' && block.zone !== 'industry') {
        var rand2 = seededRandom(bi * 53 + 11);
        for (var t2 = 0; t2 < 3; t2++) {
          var tx2 = block.x + (rand2() - 0.5) * (block.w - 6);
          var tz2 = block.z + (rand2() - 0.5) * (block.d - 6);
          if (overlaps(boxes, tx2, tz2, 4, 4)) continue;
          boxes.push({ x: tx2, z: tz2, w: 3, d: 3 });
          makeTree(tx2, tz2, 0.6 + rand2() * 0.4, rand2);
        }
      }

      // ขอบทางเท้ารอบบล็อกในเมือง (ยกเว้นโซนชานเมือง/เกษตร)
      if (!NO_CURB[block.zone]) makeCurb(block.x, block.z, block.w, block.d);
    });

    // ของแต่งในสวนสาธารณะกลางเมือง (โซนสีเขียว) รอบจุดกึ่งกลางสวน (104, 45)
    (function plantGreenZone() {
      var rand = seededRandom(4242);
      var items = ZONE_MAKERS.green;
      var parkX = 104, parkZ = 45;
      items.forEach(function (key, i) {
        var mk = City.makers[key];
        if (!mk) return;
        var grp = mk.build(rand);
        var a = -1.2 + i * 1.15;
        grp.position.set(parkX + Math.cos(a) * 16, 0, parkZ + Math.sin(a) * 16 * 0.7);
        grp.rotation.y = rand() * Math.PI;
        landmarksGroup.add(grp);
        registerLandmark(grp, mk.label, mk.cat, 'green');
        addBuildingLabel(grp, mk.label, mk.cat, null, null, 2);
      });
    })();

    buildTransport();
    buildParkingLots();
    plantStreetProps();
    parkCarsAlongStreets();
  }

  // ================= ลานจอดรถ (มีรถจอดจริง) =================
  function buildParkingLots() {
    var lots = [
      { x: 50, z: 88, w: 20, d: 14 },
      { x: -50, z: -88, w: 20, d: 14 },
    ];
    var rand = seededRandom(31337);
    lots.forEach(function (lot) {
      // พื้นลานยางมะตอย
      var lotMesh = new THREE.Mesh(new THREE.BoxGeometry(lot.w, 0.12, lot.d), City.mats.asphalt);
      lotMesh.position.set(lot.x, 0.06, lot.z);
      lotMesh.receiveShadow = true;
      propsGroup.add(lotMesh);
      // รถจอดสองแถว
      for (var row = -1; row <= 1; row += 2) {
        for (var i = 0; i < 4; i++) {
          if (rand() < 0.3) continue; // บางช่องว่าง
          var v = City.makeVehicle(rand() < 0.2 ? 'pickup' : (rand() < 0.5 ? 'sedan' : 'taxi'), rand);
          v.position.set(lot.x - lot.w / 2 + 2.4 + i * (lot.w / 4.6), 0.1, lot.z + row * (lot.d / 4));
          v.rotation.y = row > 0 ? 0 : Math.PI;
          parkedGroup.add(v);
        }
      }
    });
  }

  // ================= ของประดับริมถนน/สวน =================
  function makeBusStop(x, z, ry) {
    var g = new THREE.Group();
    var m = CityMats.concrete;
    [0, 3.4].forEach(function (ox) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), m);
      p.position.set(ox, 1.3, 0);
      g.add(p);
    });
    var roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 1.6), City.mats.metal);
    roof.position.set(1.7, 2.65, 0);
    roof.castShadow = true;
    g.add(roof);
    var glass = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 0.08), City.mats.glass);
    glass.position.set(1.7, 1.7, -0.7);
    g.add(glass);
    var bench = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.4), City.mats.wood);
    bench.position.set(1.7, 0.75, -0.4);
    g.add(bench);
    g.position.set(x, SIDEWALK_H, z);
    g.rotation.y = ry || 0;
    propsGroup.add(g);
    addBuildingLabel(g, 'ป้ายรถเมล์', 'คมนาคม', SIDEWALK_H + 5.4, null, 0);
  }

  function makeHydrant(x, z) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.75, 8),
      new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.5 }));
    body.position.y = 0.38;
    var cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.5 }));
    cap.position.y = 0.78;
    g.add(body, cap);
    g.position.set(x, SIDEWALK_H, z);
    propsGroup.add(g);
  }

  function makeBin(x, z) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.8, 10),
      new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7, metalness: 0.3 }));
    body.position.y = 0.4;
    g.add(body);
    g.position.set(x, SIDEWALK_H, z);
    propsGroup.add(g);
  }

  function plantStreetProps() {
    var rand = seededRandom(8181);
    // ป้ายรถเมล์ริมถนนหลัก
    makeBusStop(22, 11.2, 0);
    makeBusStop(-22, -11.2, Math.PI);
    makeBusStop(11.2, -60, Math.PI / 2);
    makeBusStop(-11.2, 60, -Math.PI / 2);
    makeBusStop(101.2, 40, 0);
    // ป้ายบิลบอร์ด
    var bbSpots = [
      [-46, 11.8, 0], [46, -11.8, Math.PI], [11.8, -46, Math.PI / 2],
      [-11.8, 46, -Math.PI / 2],
      [100, 11.8, 0], [-100, -11.8, Math.PI], [11.8, 100, Math.PI / 2], [-11.8, -100, -Math.PI / 2],
    ];
    bbSpots.forEach(function (p) {
      var bb = City.billboard(rand);
      bb.position.set(p[0], SIDEWALK_H, p[1]);
      bb.rotation.y = p[2];
      propsGroup.add(bb);
      registerLandmark(bb, 'ป้ายโฆษณา', 'โฆษณา', 'commerce');
      addBuildingLabel(bb, 'ป้ายโฆษณา', 'โฆษณา', null, null, 0);
    });
    // ไฮดรันต์ + ถังขยะ เฉพาะแยกและริมทางเท้า
    var corners = [[-62, -9], [62, 9], [-9, 62], [9, -62], [-81, 9], [81, -9], [-9, -81], [9, 81]];
    corners.forEach(function (c, i) {
      if (i % 2 === 0) makeHydrant(c[0], c[1]); else makeBin(c[0], c[1]);
    });
    // หิน + พุ่มไม้รอบสวนกลางและริมทะเลสาบ (เลี่ยงถนน/บล็อกอาคาร)
    function inAnyBlock(x, z) {
      var all = ZONE_BLOCKS.concat(INFILL_BLOCKS);
      for (var i = 0; i < all.length; i++) {
        var b = all[i];
        if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) return true;
      }
      return false;
    }
    for (var i = 0; i < 30; i++) {
      var a = rand() * Math.PI * 2;
      var rr = 58 + rand() * 9;
      var rx = Math.cos(a) * rr, rz = Math.sin(a) * rr * 1.15;
      if (Math.abs(rx) < 12 || Math.abs(rz) < 12) continue;
      if ((Math.abs(rx) > 60 && Math.abs(rx) < 80) || (Math.abs(rz) > 60 && Math.abs(rz) < 80)) continue;
      if (inAnyBlock(rx, rz)) continue;
      if (rand() < 0.5) propsGroup.add(place(City.rock(0.6 + rand() * 0.7), rx, rz, rand));
      else propsGroup.add(place(City.bush(0.8 + rand() * 0.8, rand), rx, rz, rand));
    }
    // ม้านั่งเกียจในสวน
    var bench = City.makers.bench.build(rand);
    bench.position.set(104, 0, 45);
    propsGroup.add(bench);
    registerLandmark(bench, 'ม้านั่ง', 'พื้นที่สีเขียว', 'green');
    addBuildingLabel(bench, 'ม้านั่ง', 'พื้นที่สีเขียว', 2.2, null, 0);

    function place(obj, x, z, R) {
      obj.position.set(x, 0, z);
      obj.rotation.y = R() * Math.PI * 2;
      return obj;
    }
  }

  // ================= รถจอดริมถนน =================
  function parkCarsAlongStreets() {
    var rand = seededRandom(2468);
    var roads = CITY_ROADS;
    var types = ['sedan', 'taxi', 'pickup', 'van', 'sedan', 'tuk'];
    function ok(t) { return Math.abs(t) > 26; }   // เว้นแยก
    roads.forEach(function (pos) {
      for (var t = -262; t <= 262; t += 30) {
        if (!ok(t)) continue;
        // ริมถนนแนว x=0 ข้ามทะเลสาบ — ไม่จอด (บนสะพาน/ในน้ำ)
        if (pos === 0 && Math.abs(t) < 62) continue;
        [[pos + 6.1, t, 'z'], [pos - 6.1, t, 'z'], [t, pos + 6.1, 'x'], [t, pos - 6.1, 'x']].forEach(function (p, idx) {
          if (rand() < 0.55) return;  // จอดไม่ทุกช่อง ให้เป็นธรรมชาติ
          // เลี่ยงช่วงทะเลสาบ (ถนนกลางเมืองสองสายข้ามน้ำ)
          if (pos === 0 && ((p[2] === 'x' && Math.abs(p[0]) < 62) || (p[2] === 'z' && Math.abs(p[1]) < 62))) return;
          var v = City.makeVehicle(types[Math.floor(rand() * types.length)], rand);
          v.position.set(p[0], 0, p[1]);
          // จอดให้ตัวรถขนานถนน (ตัวรถยาวตามแกน Z)
          v.rotation.y = p[2] === 'z' ? (rand() < 0.5 ? 0 : Math.PI) : (rand() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
          parkedGroup.add(v);
        });
      }
    });
  }
  // สะพานข้ามทะเลสาบ + ไฟจราจร + ทางม้าลายที่แยกใกล้ใจกลางเมือง
  function buildTransport() {
    var rand = seededRandom(555);
    var put = function (key, x, z, ry) {
      var mk = City.makers[key];
      if (!mk) return;
      var grp = mk.build(rand);
      grp.position.set(x, 0, z);
      grp.rotation.y = ry || 0;
      transportGroup.add(grp);
      registerLandmark(grp, mk.label, mk.cat, 'transport');
      if (key === 'bridge') addBuildingLabel(grp, mk.label, mk.cat, null, null, 3);   // ไฟจราจร/ทางม้าลายไม่ใส่ป้าย   // ไฟจราจร/ทางม้าลายไม่ใส่ป้าย
    };
    // สะพานข้ามทะเลสาบกลางเมือง 2 เส้นตัดกันแบบต่างระดับ:
    // แนว x=0 สูง 4.5 ม. | แนว z=0 สูง 12 ม. (ลอดใต้กัน ชัดเจน)
    put('bridge', 0, 0, 0);
    City.bridgeLevel = BRIDGE_HIGH;
    var br2 = City.makers.bridge.build(rand);
    City.bridgeLevel = BRIDGE_LOW;
    br2.rotation.y = Math.PI / 2;
    transportGroup.add(br2);
    registerLandmark(br2, 'สะพานข้ามคลอง (สูง)', 'คมนาคม', 'transport');
    addBuildingLabel(br2, 'สะพานข้ามคลอง (สูง)', 'คมนาคม', null, null, 3);

    // สัญญาณไฟ + ทางม้าลายแยกหลัก
    var xings = [
      [-70, 0], [0, -70], [0, 70], [70, 0],
      [-140, -70], [-140, 70], [140, -70], [140, 70],
      [-240, -140], [-240, 140], [240, -140], [240, 140],
    ];
    xings.forEach(function (ix) {
      var cx = ix[0], cz = ix[1];
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
        put('trafficLight', cx + c[0] * 9, cz + c[1] * 9, Math.atan2(-c[1], -c[0]));
      });
      put('crosswalk', cx, cz - 9.2, 0);
      put('crosswalk', cx, cz + 9.2, 0);
      put('crosswalk', cx - 9.2, cz, Math.PI / 2);
      put('crosswalk', cx + 9.2, cz, Math.PI / 2);
    });
  }

  // ================= รถไฟฟ้า (รางยกระดับ แนว x=-292 วิ่งตามแกน z) =================
  // วิ่งผ่านชานเมืองริมขอบเมืองฝั่งตะวันตก (นอกถนนรอบนอก ±280) ไม่ทับตึกทุกหลัง
  var RAIL_X = -292;
  var RAIL_Y = 9;                 // ความสูงดาดราง
  var trainGroup = new THREE.Group();
  scene.add(trainGroup);

  function buildElevatedRail() {
    var matPier = City.mats.concrete;
    var matDeck = City.mats.concrete;
    var matRail = City.mats.metal;
    var matBallast = City.mats.asphalt;
    var railHalf = new THREE.Group();
    var end = 240;
    var span = 18;
    // เสาตอม่อทุก 18 ม. (เว้นตรงทะเลสาบไม่ได้เพราะรางอยู่นอกน้ำอยู่แล้ว แต่เว้นช่วงสะพานยกระดับแนว z=0)
    for (var z = -end; z <= end; z += span) {
      var pier = new THREE.Mesh(new THREE.BoxGeometry(1.6, RAIL_Y, 1.6), matPier);
      pier.position.set(RAIL_X, RAIL_Y / 2, z);
      pier.castShadow = true;
      pier.receiveShadow = true;
      railHalf.add(pier);
      var cap = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 3), matPier);
      cap.position.set(RAIL_X, RAIL_Y - 0.25, z);
      cap.castShadow = true;
      railHalf.add(cap);
    }
    // ดาดรางยาวตลอดสาย (คาน 3 ชิ้นต่อช่วงเว้นช่วงสะพานสูง z=0)
    var segs = [[-end, -24], [24, end]];   // สะพานยกระดับสูง (แนว z=0) ตัดผ่านช่วง z ±24
    segs.forEach(function (sg) {
      var len = sg[1] - sg[0];
      var deck = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.1, len), matDeck);
      deck.position.set(RAIL_X, RAIL_Y + 0.55, (sg[0] + sg[1]) / 2);
      deck.castShadow = true;
      deck.receiveShadow = true;
      railHalf.add(deck);
      var ball = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, len), matBallast);
      ball.position.set(RAIL_X, RAIL_Y + 1.2, (sg[0] + sg[1]) / 2);
      ball.receiveShadow = true;
      railHalf.add(ball);
      // รางเหล็กคู่
      [-1.2, 1.2].forEach(function (rx) {
        var rl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, len), matRail);
        rl.position.set(RAIL_X + rx, RAIL_Y + 1.4, (sg[0] + sg[1]) / 2);
        railHalf.add(rl);
      });
      // ราวกั้นสองข้าง
      [-3.15, 3.15].forEach(function (gx) {
        var gd = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.05, len), matRail);
        gd.position.set(RAIL_X + gx, RAIL_Y + 1.75, (sg[0] + sg[1]) / 2);
        gd.castShadow = true;
        railHalf.add(gd);
      });
    });
    // ทางลาดขึ้น-ลงปลายสาย (จบลงบนพื้นภายในขอบพื้นเมือง ±250)
    [[-1, -end], [1, end]].forEach(function (e) {
      var rampLen = 30;
      var ramp = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.1, rampLen), matDeck);
      ramp.position.set(RAIL_X, RAIL_Y / 2 + 0.4, e[1] + e[0] * (rampLen / 2 + 2));
      ramp.rotation.x = e[0] * Math.atan(RAIL_Y / rampLen);
      ramp.castShadow = true;
      railHalf.add(ramp);
    });
    transportGroup.add(railHalf);
  }
  buildElevatedRail();

  // ขบวนรถไฟฟ้า 3 โบกี้ (เลื่อนไปมาบนรางตลอดเวลา)
  var trainCars = [];
  (function makeTrain() {
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.35, metalness: 0.5 });
    var stripeMat = new THREE.MeshStandardMaterial({ color: 0x0288d1, roughness: 0.4, metalness: 0.3 });
    var winMat = new THREE.MeshStandardMaterial({ color: 0x22384a, roughness: 0.15, metalness: 0.6 });
    for (var i = 0; i < 3; i++) {
      var b = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 8.2), bodyMat);
      body.position.y = 1.6;
      body.castShadow = true;
      b.add(body);
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.45, 8.25), stripeMat);
      stripe.position.y = 1.1;
      b.add(stripe);
      var win = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.8, 7.4), winMat);
      win.position.y = 2.1;
      b.add(win);
      b.position.set(RAIL_X, RAIL_Y + 1.45, -190 + i * 8.6);
      trainGroup.add(b);
      trainCars.push(b);
    }
  })();

  var trainT = 0;
  function updateTrain(dt) {
    trainT += dt * 9;   // ความเร็ว ~9 ม./วินาที
    var period = 480;   // ความยาวรอบสาย (วิ่งไปกลับ)
    var p = trainT % period;
    var dirFlip = (Math.floor(trainT / period) % 2) === 1;
    var z = dirFlip ? 240 - p : p - 240;
    trainCars.forEach(function (c, i) {
      c.position.z = z + i * 8.6 * (dirFlip ? -1 : 1);
    });
    trainGroup.visible = transportGroup.visible;
  }

  // ================= ทางจักรยาน (แถบสีเขียวริมถนนกลางเมือง) =================
  function buildBikeLane() {
    var bikeMat = new THREE.MeshStandardMaterial({ color: 0x2e7d52, roughness: 0.9 });
    var laneHalf = 8.6;   // จากกึ่งกลางถนน ROAD_W/2=8 ถึงขอบทางเท้า ~11.2
    [[0, 'z'], [0, 'x']].forEach(function (rd) {
      // สองฝั่งถนนกลางเมือง ตัดช่วงทะเลสาบออก
      [-1, 1].forEach(function (s) {
        var segs2 = [[-268, -62], [62, 268]];
        segs2.forEach(function (sg) {
          var len = sg[1] - sg[0];
          var geo = rd[1] === 'z'
            ? new THREE.BoxGeometry(1.6, 0.05, len)
            : new THREE.BoxGeometry(len, 0.05, 1.6);
          var m = new THREE.Mesh(geo, bikeMat);
          m.position.set(rd[1] === 'z' ? s * laneHalf : (sg[0] + sg[1]) / 2, 0.03, rd[1] === 'z' ? (sg[0] + sg[1]) / 2 : s * laneHalf);
          m.receiveShadow = true;
          transportGroup.add(m);
        });
      });
    });
    // สัญลักษณ์จักรยานสีขาวทุก 40 ม.
    var markMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    [[0, 'z'], [0, 'x']].forEach(function (rd) {
      [-1, 1].forEach(function (s) {
        for (var t = -268; t <= 268; t += 40) {
          if (Math.abs(t) < 66) continue;
          var geo = rd[1] === 'z'
            ? new THREE.PlaneGeometry(1.4, 2.2)
            : new THREE.PlaneGeometry(2.2, 1.4);
          var mk = new THREE.Mesh(geo, markMat);
          mk.rotation.x = -Math.PI / 2;
          if (rd[1] === 'z') mk.position.set(s * laneHalf, 0.06, t);
          else mk.position.set(t, 0.06, s * laneHalf);
          transportGroup.add(mk);
        }
      });
    });
  }
  buildBikeLane();

  // ================= ป้ายชื่อบนหัวตึก (GUI: โปรเจกต์ 3D → จอ ทุกเฟรม) =================
  var labelLayer = document.getElementById('labelLayer');
  var bLabels = [];                 // { grp, x, y, z, el, pri }
  var blVec = new THREE.Vector3();
  var ZONE_ICONS = {
    res: '🏠', edu: '🎓', health: '🏥', safety: '🚨', commerce: '🛍️', food: '🍜',
    business: '🏦', transport: '🚦', green: '🌳', sports: '⚽', culture: '🎭',
    religion: '🛕', industry: '🏭', utility: '⚡', agriculture: '🌾', tourism: '🏨', everyday: '🧺',
  };
  var CAT_ICONS = {
    'ที่อยู่อาศัย': '🏠', 'การศึกษา': '🎓', 'สาธารณสุข': '🏥', 'ความปลอดภัย': '🚨',
    'ย่านการค้า': '🛍️', 'ร้านอาหาร': '🍜', 'ธนาคารและธุรกิจ': '🏦', 'คมนาคม': '🚦',
    'พื้นที่สีเขียว': '🌳', 'กีฬา': '⚽', 'วัฒนธรรม': '🎭', 'ศาสนา': '🛕',
    'อุตสาหกรรม': '🏭', 'สาธารณูปโภค': '⚡', 'เกษตร': '🌾', 'การท่องเที่ยว': '🏨',
    'ชีวิตประจำวัน': '🧺', 'ย่าน': '🏘️', 'โฆษณา': '📢',
  };

  // เพิ่มป้ายเหนืออาคาร 1 หลัง (worldY = ยอดอาคารจริง ถ้าไม่ส่งจะคำนวณจากกล่องอาคาร)
  // pri = ลำดับความสำคัญ: 3 = แลนด์มาร์กหายาก (สะพาน/หมู่บ้านจัดสรร - ขอบทอง โชว์ก่อนเสมอ),
  // 2 = อาคารชื่อเฉพาะ (โรงพยาบาล/ห้าง/วัด...), 1 = ตึกเติมตามโซน, 0 = ของประดับ (ป้ายรถเมล์/บิลบอร์ด)
  function addBuildingLabel(grp, label, cat, worldY, iconOverride, pri) {
    if (!labelLayer || !grp) return;
    var p = (pri == null ? 2 : pri);
    var el = document.createElement('div');
    el.className = 'blabel' + (p === 3 ? ' pri2' : '');
    el.innerHTML = '<span class="ic">' + (iconOverride || CAT_ICONS[cat] || '🏢') + '</span>' + label;
    labelLayer.appendChild(el);
    var top = worldY;
    if (top == null) {
      var b = new THREE.Box3().setFromObject(grp);
      top = isFinite(b.max.y) ? b.max.y : 10;
    }
    bLabels.push({ grp: grp, x: grp.position.x, y: top + 7, z: grp.position.z, el: el, pri: p });
  }

  // ================= ระบบป้ายชื่ออัตโนมัติ =================
  // โหมด: auto = คัดป้ายตามระยะซูม/ความสำคัญ + กันป้ายทับกัน | on = โชว์ทุกป้าย | off = ซ่อนหมด
  var labelMode = 'auto';
  var placedRects = [];   // สี่เหลี่ยมป้ายที่วางแล้วในเฟรมนี้ (กันป้ายทับกัน)
  var lblVec = new THREE.Vector3();

  // ระยะซูมสูงสุดที่แต่ละลำดับความสำคัญเริ่มโชว์ (ยิ่งค่าน้อย = ต้องซูมเข้าใกล้มากขึ้น)
  var PRI_SHOW_DIST = { 3: 1700, 2: 780, 1: 450, 0: 300 };

  // อัปเดตตำแหน่งป้ายทุกเฟรม: ซ่อนเมื่ออยู่หลังกล้อง, จางหายเมื่อซูมออกไกล,
  // โหมดอัตโนมัติจะคัดให้เหลือเฉพาะป้ายสำคัญ/ไม่ทับกัน อ่านง่ายไม่รก
  function updateBuildingLabels() {
    if (!labelLayer) return;
    var W = window.innerWidth, H = window.innerHeight;
    var dist = camera.position.distanceTo(controls.target);
    var auto = labelMode === 'auto';
    var fade = (dist / 1500) * (dist / 1500);
    var op = Math.max(0, Math.min(1, 1 - fade));
    if (labelMode === 'off' || (auto && op <= 0.02)) {
      for (var k = 0; k < bLabels.length; k++) bLabels[k].el.style.display = 'none';
      return;
    }
    placedRects.length = 0;
    // จัดเรียง: ป้ายสำคัญก่อน (pri มากก่อน) → แลนด์มาร์กได้ที่วางก่อนเสมอ
    var order = bLabels.slice().sort(function (a, b) { return b.pri - a.pri; });
    // จำนวนป้ายสูงสุดต่อเฟรม ตามขนาดจอ (จอใหญ่รับได้เยอะ / มือถือน้อยลง)
    var budget = Math.round(Math.min(36, Math.max(16, (W * H) / 42000)));
    var shown = 0;
    var margin = 4;   // ช่องไฟระหว่างป้าย (px)
    for (var i = 0; i < order.length; i++) {
      var L = order[i];
      var parentVis = L.grp.parent ? L.grp.parent.visible : true;
      if (!parentVis || !L.grp.visible) { L.el.style.display = 'none'; continue; }
      if (auto) {
        var maxDist = PRI_SHOW_DIST[L.pri] || 780;
        if (dist > maxDist) { L.el.style.display = 'none'; continue; }
        if (shown >= budget && L.pri < 3) { L.el.style.display = 'none'; continue; }
      }
      lblVec.set(L.x, L.y, L.z);
      lblVec.project(camera);
      var x = (lblVec.x * 0.5 + 0.5) * W;
      var y = (-lblVec.y * 0.5 + 0.5) * H;
      var vis = lblVec.z <= 1 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (vis) {
        // กันป้ายทับกัน: ประเมินขนาดกล่องคร่าว ๆ จากความยาวชื่อ (ถูกกว่าการอ่าน layout ทุกเฟรม)
        var estW = (L.el.textContent || '').length * 7.4 + 34;
        var r = { x0: x - estW / 2 - margin, y0: y - 30 - margin, x1: x + estW / 2 + margin, y1: y + margin };
        var collide = false;
        for (var j = 0; j < placedRects.length; j++) {
          var q = placedRects[j];
          if (r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0) { collide = true; break; }
        }
        // โหมดอัตโนมัติ: ป้ายทับได้ = ซ่อน (ยกเว้นแลนด์มาร์กหายาก pri 3 โชว์เสมอ)
        if (collide && auto && L.pri < 3) { L.el.style.display = 'none'; continue; }
        placedRects.push(r);
        L.el.style.display = 'block';
        L.el.style.opacity = String(op);
        L.el.style.transform = 'translate(-50%,-100%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        shown++;
      } else {
        L.el.style.display = 'none';
      }
    }
  }

  buildCity();

  // ================= ต้นไม้ =================

  function makeTree(x, z, scale, R) {
    var g = City.tree(scale || 1, R);
    g.position.set(x, 0, z);
    treesGroup.add(g);
  }

  function makeBush(x, z, scale, R) {
    var g = City.bush(scale || 1, R);
    g.position.set(x, 0, z);
    treesGroup.add(g);
  }

  function plantTrees() {
    var rand = seededRandom(999);
    function inLake(x, z) {
      var nx = x / 55, nz = z / 38;
      return nx * nx + nz * nz < 1;
    }
    // ต้นไม้ต้องไม่อยู่บนถนน (x=0 / z=0) หรือในบล็อกโซน
    function badSpot(x, z) {
      if (inLake(x, z)) return true;
      if (Math.abs(x) < 12 || Math.abs(z) < 12) return true;   // ถนนกลางเมือง+ทางเท้า
      var ax = Math.abs(x), az = Math.abs(z);
      if ((ax > 60 && ax < 80) || (az > 60 && az < 80)) return true;     // ถนนสาย ±70
      if ((ax > 132 && ax < 148) || (az > 132 && az < 148)) return true; // ถนนสาย ±140
      if ((ax > 232 && ax < 248) || (az > 232 && az < 248)) return true; // ถนนสาย ±240
      if ((ax > 268 && ax < 292) || (az > 268 && az < 292)) return true; // ถนนริมเมือง ±280 + ทางเท้า
      for (var i = 0; i < ZONE_BLOCKS.length; i++) {
        var b = ZONE_BLOCKS[i];
        if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) return true;
      }
      for (var j = 0; j < INFILL_BLOCKS.length; j++) {
        var b2 = INFILL_BLOCKS[j];
        if (Math.abs(x - b2.x) < b2.w / 2 && Math.abs(z - b2.z) < b2.d / 2) return true;
      }
      return false;
    }
    // ต้นไม้ในสวนสาธารณะ (104, 45)
    for (var i = 0; i < 34; i++) {
      var a = rand() * Math.PI * 2;
      var rr = rand() * 13;
      var px = 104 + Math.cos(a) * rr;
      var pz = 45 + Math.sin(a) * rr * 0.75;
      if (badSpot(px, pz)) continue;
      makeTree(px, pz, 0.8 + rand() * 0.6, rand);
      if (rand() < 0.5) makeBush(px + 2, pz + 1.5, 0.7 + rand() * 0.6, rand);
    }
    // ต้นไม้เป็นวงรอบทะเลสาบกลางเมือง (เฉพาะช่องว่างระหว่างบล็อก)
    for (var k = 0; k < 52; k++) {
      var a2 = rand() * Math.PI * 2;
      var rr2 = 60 + rand() * 6;
      var lx = Math.cos(a2) * rr2;
      var lz = Math.sin(a2) * rr2 * 1.15;
      if (badSpot(lx, lz)) continue;
      makeTree(lx, lz, 0.7 + rand() * 0.5, rand);
    }
    // ริมถนน
    var roads = CITY_ROADS;
    roads.forEach(function (pos) {
      for (var t = -262; t <= 262; t += 22) {
        if (Math.abs(t) < 30 && pos === 0) continue; // เว้นแยกกลาง
        [[pos + 12.4, t], [t, pos + 12.4], [pos - 12.4, t], [t, pos - 12.4]].forEach(function (p) {
          if (badSpot(p[0], p[1])) return;
          makeTree(p[0], p[1], 0.7 + rand() * 0.4, rand);
        });
      }
    });    // แถวป่ารอบนอกเมือง (รอบขอบเมือง) ให้ขอบเมืองไม่โล่ง
    for (var f = 0; f < 400; f++) {
      var fa = rand() * Math.PI * 2;
      var fr = 262 + rand() * 24;
      var fx2 = Math.cos(fa) * fr;
      var fz2 = Math.sin(fa) * fr;
      if (badSpot(fx2, fz2)) continue;
      if (Math.abs(fx2) > 294 || Math.abs(fz2) > 294) continue; // อย่าล้ำขอบเมือง
      makeTree(fx2, fz2, 0.8 + rand() * 0.8, rand);
    }
    // ต้นไม้กระจายในแนวชานเมือง (100-295) — โซนชั้นนอกไม่ให้โล่ง
    for (var m = 0; m < 300; m++) {
      var mx = (rand() - 0.5) * 590;
      var mz = (rand() - 0.5) * 590;
      if (Math.abs(mx) < 100 || Math.abs(mz) < 100) continue;
      if (badSpot(mx, mz)) continue;
      makeTree(mx, mz, 0.65 + rand() * 0.5, rand);
      if (rand() < 0.4) makeBush(mx + 1.8, mz + 1.2, 0.6 + rand() * 0.5, rand);
    }
  }
  plantTrees();

  // ================= เสาไฟถนน =================
  var lampGroup = new THREE.Group();
  scene.add(lampGroup);

  var poleGeo = new THREE.CylinderGeometry(0.18, 0.25, 7, 6);
  var poleMat = new THREE.MeshStandardMaterial({ color: 0x37414c, roughness: 0.6, metalness: 0.4 });
  var bulbGeo = new THREE.SphereGeometry(0.55, 10, 8);
  var bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });

  function makeLamp(x, z) {
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 3.5 + SIDEWALK_H, z);
    pole.castShadow = true;
    var bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x, 7.2 + SIDEWALK_H, z);
    bulb.visible = false; // เปิดตอนกลางคืน
    lampGroup.add(pole, bulb);
    return bulb;
  }

  var lampBulbs = [];
  var roadsL = [-70, 0, 70];
  roadsL.forEach(function (pos) {
    for (var t = -262; t <= 262; t += 46) {
      // เสาไฟไม่ปักในน้ำ (ถนนกลางเมืองข้ามทะเลสาบ ให้เว้นช่วงนั้น)
      if (pos === 0 && Math.abs(t) < 58) continue;
      lampBulbs.push(makeLamp(pos + 9.6, t));
      lampBulbs.push(makeLamp(t, pos + 9.6));
    }
  });

  // ไฟจุดจริง (PointLight) เฉพาะแยกกลาง เพื่อประหยัด
  var cornerLight = new THREE.PointLight(0xffd98a, 0, 90, 2);
  cornerLight.position.set(0, 9, 0);
  scene.add(cornerLight);

  // ================= รถวิ่งบนถนน (หลายแบบ: เก๋ง/แท็กซี่/บัส/ตุ๊กตุ๊ก...) =================
  var carsGroup = new THREE.Group();
  scene.add(carsGroup);

  function makeCar(axis, laneOffset, dir, speed, start, R) {
    var roll = R();
    var type = 'sedan';
    if (roll < 0.34) type = 'sedan';
    else if (roll < 0.48) type = 'taxi';
    else if (roll < 0.62) type = 'pickup';
    else if (roll < 0.74) type = 'van';
    else if (roll < 0.86) type = 'tuk';
    else if (roll < 0.94) type = 'bus';
    else type = 'truck';
    var grp = City.makeVehicle(type, R);
    carsGroup.add(grp);
    return { grp: grp, axis: axis, lane: laneOffset, dir: dir, speed: speed, pos: start, lake: Math.abs(laneOffset) < 8 };
  }

  var cars = [];
  var carRand = seededRandom(777);
  roadsL.forEach(function (pos) {
    // 2 เลนต่อทิศ ต่อถนน (เมืองใหญ่ขึ้น → เพิ่มรถเป็น 5 คัน/เลน)
    for (var i = 0; i < 5; i++) {
      cars.push(makeCar('x', pos + 4, 1, 13 + carRand() * 10, -373 + carRand() * 746, carRand));
      cars.push(makeCar('x', pos - 4, -1, 13 + carRand() * 10, -373 + carRand() * 746, carRand));
      cars.push(makeCar('z', pos + 4, 1, 13 + carRand() * 10, -373 + carRand() * 746, carRand));
      cars.push(makeCar('z', pos - 4, -1, 13 + carRand() * 10, -373 + carRand() * 746, carRand));
    }
  });

  function updateCars(dt) {
    cars.forEach(function (c) {
      c.pos += c.speed * c.dir * dt;
      if (c.pos > 373) c.pos = -373;
      if (c.pos < -373) c.pos = 373;
      if (c.axis === 'x') c.grp.position.set(c.pos, 0, c.lane);
      else c.grp.position.set(c.lane, 0, c.pos);
      // รถบนถนนกลางเมืองขึ้น-ลงสะพานยกระดับข้ามทะเลสาบ:
      // รถบนถนน z=0 วิ่งตามแกน x → ข้ามสะพานสูง (BRIDGE_HIGH)
      // รถบนถนน x=0 วิ่งตามแกน z → ข้ามสะพานเตี้ย (BRIDGE_LOW)
      if (c.lake) {
        var a = Math.abs(c.pos);
        var D = c.axis === 'z' ? BRIDGE_LOW : BRIDGE_HIGH;
        var rampLen = D >= 8 ? 40 : 30;
        var e = 41 + rampLen;
        var surface = a <= 41 ? D : (a >= e ? 0 : D * (e - a) / rampLen);
        c.grp.position.y = surface - 0.15;
      }
      // หมุนให้หัวรถไปทางทิศทางวิ่ง (ตัวรถสร้างยาวตามแกน Z)
      var yaw = (c.axis === 'x' ? Math.PI / 2 : 0) + (c.dir > 0 ? 0 : Math.PI);
      c.grp.rotation.y = yaw;
    });
  }

  // ================= เครื่องบินเหนือเมือง =================
  var planeGroup = new THREE.Group();
  scene.add(planeGroup);
  var plane = new THREE.Group();
  var pBody = new THREE.Mesh(
    THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(1.2, 8, 4, 8) : new THREE.CylinderGeometry(1.2, 1.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8ecf0, roughness: 0.35, metalness: 0.3 })
  );
  pBody.rotation.z = Math.PI / 2;
  plane.add(pBody);
  var wing = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.3, 11),
    new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.4, metalness: 0.3 })
  );
  plane.add(wing);
  var tail = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.6, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xd94f4f, roughness: 0.4 })
  );
  tail.position.set(-4.2, 1.4, 0);
  plane.add(tail);
  planeGroup.add(plane);

  var planeAngle = 0;
  function updatePlane(dt) {
    planeAngle += dt * 0.06;
    var R = 460;
    planeGroup.position.set(Math.cos(planeAngle) * R, 140 + Math.sin(planeAngle * 2) * 8, Math.sin(planeAngle) * R);
    planeGroup.rotation.y = -planeAngle + Math.PI / 2;
  }

  // ================= เฮลิคอปเตอร์ตรวจการณ์ (บินวนใจกลางเมือง) =================
  var heliGroup = new THREE.Group();
  scene.add(heliGroup);
  var heli = new THREE.Group();
  (function makeHeli() {
    var bodyM = new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.4, metalness: 0.3 });
    var body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 9), bodyM);
    body.scale.set(1, 0.85, 1.7);
    body.castShadow = true;
    heli.add(body);
    var tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 4.2), bodyM);
    tail.position.set(0, 0.35, -3.6);
    heli.add(tail);
    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 0.9), bodyM);
    fin.position.set(0, 0.9, -5.3);
    heli.add(fin);
    var skid = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x28323a, roughness: 0.5, metalness: 0.4 }));
    skid.position.set(0, -1.5, 0);
    heli.add(skid);
    var skid2 = skid.clone(); skid2.position.z = 1.2; heli.add(skid2);
  })();
  var rotor = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.06, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x28323a, roughness: 0.5, transparent: true, opacity: 0.85 })
  );
  rotor.position.y = 1.8;
  heli.add(rotor);
  heliGroup.add(heli);

  var heliAngle = 0;
  function updateHeli(dt) {
    heliAngle += dt * 0.22;
    var R = 165;
    heliGroup.position.set(Math.cos(heliAngle) * R, 95 + Math.sin(heliAngle * 3) * 6, Math.sin(heliAngle) * R);
    heli.rotation.y = -heliAngle + Math.PI / 2;
    heli.rotation.z = -0.12;
    rotor.rotation.y += dt * 28;
  }

  // ================= ดวงดาว (กลางคืน) =================
  var starGeo = new THREE.BufferGeometry();
  var starVerts = [];
  for (var si = 0; si < 1200; si++) {
    var th = Math.random() * Math.PI * 2;
    var ph = Math.random() * Math.PI * 0.42;   // ครึ่งฟากฟ้าบน
    var R2 = 3200;
    starVerts.push(
      Math.cos(th) * Math.sin(ph + 0.15) * R2,
      Math.cos(ph) * R2 * 0.9 + 120,
      Math.sin(th) * Math.sin(ph + 0.15) * R2
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfd8ea, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0 }));
  scene.add(stars);

  // ================= โหมดแสง =================
  var LIGHT_MODES = {
    day:    { sky: 0x8fc7ee, dome: 0xffffff, fog: [0xbfd9ea, 600, 2200], sunColor: 0xfff4e0, sunI: 1.15, ambI: 0.55, hemiI: 0.6,  sunPos: [200, 300, 140],   lamps: false, windowEmissive: false, starO: 0,    cloudO: 0.9 },
    sunset: { sky: 0xe8956a, dome: 0xffd9b0, fog: [0xd98a5f, 520, 2000], sunColor: 0xffb066, sunI: 0.75, ambI: 0.4,  hemiI: 0.35, sunPos: [340, 80, -160],   lamps: true,  windowEmissive: true,  starO: 0.35, cloudO: 0.7 },
    night:  { sky: 0x0b1020, dome: 0x24304e, fog: [0x0b1020, 480, 1800], sunColor: 0x8fb0ff, sunI: 0.14, ambI: 0.16, hemiI: 0.1,  sunPos: [-160, 220, -120], lamps: true,  windowEmissive: true,  starO: 0.9,  cloudO: 0.12, night: 1 },
  };

  function setLightMode(mode) {
    var m = LIGHT_MODES[mode];
    if (!m) return;
    scene.background = new THREE.Color(m.sky);
    scene.fog = new THREE.Fog(m.fog[0], m.fog[1], m.fog[2]);
    skyDome.material.color.set(m.dome);
    cloudGroup.children.forEach(function (c) { c.material.opacity = m.cloudO; });
    sun.color.set(m.sunColor);
    sun.intensity = m.sunI;
    sun.position.set(m.sunPos[0], m.sunPos[1], m.sunPos[2]);
    ambient.intensity = m.ambI;
    hemi.intensity = m.hemiI;
    lampGroup.children.forEach(function (c) { if (c.geometry === bulbGeo) c.visible = m.lamps; });
    cornerLight.intensity = m.lamps ? 1.4 : 0;
    stars.material.opacity = m.starO;
    windowMats.forEach(function (mat) {
      if (m.windowEmissive) {
        mat.opacity = 1;
        mat.metalness = 0.1;
        mat.roughness = 0.5;
        mat.emissive.setHex(0xffffff);
        mat.emissiveIntensity = 0.55;
      } else {
        mat.opacity = 0.94;
        mat.metalness = 0.55;
        mat.roughness = 0.22;
        mat.emissiveIntensity = 0;
      }
    });
    stars.position.copy(camera.position);     // ดาวก็ตามกล้อง (เดิมอยู่กับที่ ซูมออกแล้วหลุดฟ้า)
    // แสงเงา/สีของวัสดุลอยละมุนขึ้น — ล้างสีเขียวจาก hemi ตอนกลางคืน
    if (m.night) hemi.color.setHex(0x8fb0ff); else hemi.color.setHex(0x9fc5e8);
    // ดวงอาทิตย์/ดวงจันทร์บนฟ้า แสดงเฉพาะโหมดที่เหมาะสม
    if (sunSprite) sunSprite.visible = (mode !== 'night');
    if (moonSprite) moonSprite.visible = (mode === 'night');
    updateSkyBillboards();
  }
  setLightMode('day');

  // ================= UI: legend =================
  var legendList = document.getElementById('legendList');
  ZONES.forEach(function (z) {
    var li = document.createElement('li');
    var hex = '#' + ('00000' + z.color.toString(16)).slice(-6);
    li.innerHTML = '<span class="swatch" style="background:' + hex + '"></span> ' + z.label;
    legendList.appendChild(li);

    li.addEventListener('click', function () {
      var dim = li.classList.toggle('dim');
      zoneMeshes.forEach(function (mesh) {
        if (mesh.userData.zone.id === z.id) mesh.visible = !dim;
      });
      landmarkMeshes.forEach(function (m) {
        if (m.userData.zoneId === z.id) m.visible = !dim;
      });
    });
  });

  // ================= UI: ปุ่มเปิด/ปิดแผงบนมือถือ + หัวแผงกดยุบได้ =================
  var isMobile = function () { return window.matchMedia('(max-width: 720px)').matches; };
  var controlPanel = document.getElementById('controlPanel');
  var legendPanel = document.getElementById('legendPanel');
  var menuToggle = document.getElementById('menuToggle');
  var legendToggle = document.getElementById('legendToggle');

  function setPanelOpen(panel, btn, open) {
    panel.classList.toggle('open', open);
    if (btn) btn.classList.toggle('active', open);
  }
  function anyPanelOpen() {
    return controlPanel.classList.contains('open') || legendPanel.classList.contains('open');
  }
  function closeAllPanels() {
    setPanelOpen(controlPanel, menuToggle, false);
    setPanelOpen(legendPanel, legendToggle, false);
  }

  if (menuToggle) menuToggle.addEventListener('click', function () {
    var willOpen = !controlPanel.classList.contains('open');
    closeAllPanels();
    setPanelOpen(controlPanel, menuToggle, willOpen);
  });
  if (legendToggle) legendToggle.addEventListener('click', function () {
    var willOpen = !legendPanel.classList.contains('open');
    closeAllPanels();
    setPanelOpen(legendPanel, legendToggle, willOpen);
  });

  // หัวแผง (เดสก์ท็อป): กดยุบ/ขยายได้
  [controlPanel, legendPanel].forEach(function (panel) {
    var head = panel.querySelector('.panel-head');
    if (!head) return;
    head.addEventListener('click', function () {
      panel.classList.toggle('collapsed');
    });
  });

  // ================= UI: toggles =================
  document.getElementById('showBuildings').addEventListener('change', function (e) {
    buildingsGroup.visible = e.target.checked;
    landmarksGroup.visible = e.target.checked;
    transportGroup.visible = e.target.checked;
  });

  var zoneColors = new Map();
  zoneMeshes.forEach(function (m) { zoneColors.set(m, m.material.color.clone()); });
  var neutralColor = new THREE.Color(0xb8bec4);

  document.getElementById('showZones').addEventListener('change', function (e) {
    zoneMeshes.forEach(function (m) {
      m.material.color.copy(e.target.checked ? zoneColors.get(m) : neutralColor);
    });
  });

  // ================= UI: ปุ่มโหมดแสง =================
  var lightButtons = document.querySelectorAll('#lightMode button');
  lightButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      lightButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setLightMode(btn.dataset.mode);
    });
  });

  // ================= UI: มุมกล้อง =================
  var VIEWS = {
    top:    { pos: [0, 640, 0.01], target: [0, 0, 0] },
    iso:    { pos: [340, 300, 340], target: [0, 0, 0] },
    street: { pos: [0, 16, 190], target: [0, 4, 0] },   // มุมต่ำ เห็นชั้นดินตัดขวาง
  };

  document.querySelectorAll('#viewPresets button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = VIEWS[btn.dataset.view];
      if (!v) return;
      camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
      controls.target.set(v.target[0], v.target[1], v.target[2]);
    });
  });

  // ================= แตะ/คลิกอาคารเพื่อดูข้อมูล =================
  // แตะ = โชว์ข้อมูล, ลาก = หมุนกล้อง (ต้องแยกให้ชัด ไม่งั้นหมุนแล้วขึ้นป๊อปทุกครั้ง)
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var tooltip = document.getElementById('tooltip');
  var hoverTag = document.getElementById('hoverTag');   // ป้ายชื่ออาคารแบบ GUI (ตามเมาส์)
  var downX = 0, downY = 0, downTime = 0, pointersDown = 0;
  var TAP_SLOP = 8;      // px — ระยะขยับที่ยังนับเป็น "แตะ"
  var TAP_TIME = 350;    // ms — เวลากดค้างสูงสุดที่นับเป็น "แตะ"

  var pickables = zoneMeshes.concat(landmarkMeshes);

  function pickAt(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(pickables, false);
    for (var i = 0; i < hits.length; i++) {
      if (hits[i].object.visible !== false) return hits[i];
    }
    return null;
  }

  // ไอคอน + คำอธิบายสั้นๆ ต่อหมวด (ใช้ในกล่องข้อมูล GUI)
  var CAT_INFO = {
    'ที่อยู่อาศัย': ['🏠', 'ที่พักอาศัยของผู้คนในเมือง'],
    'การศึกษา': ['🎓', 'สถานศึกษาสำหรับเด็กถึงผู้ใหญ่'],
    'สาธารณสุข': ['🏥', 'ดูแลสุขภาพและรักษาผู้ป่วย'],
    'ความปลอดภัย': ['🚨', 'หน่วยงานรักษาความสงบเรียบร้อย'],
    'ย่านการค้า': ['🛍️', 'แหล่งช้อปปิ้งและค้าขาย'],
    'ร้านอาหาร': ['🍜', 'ร้านอาหารและเครื่องดื่ม'],
    'ธนาคารและธุรกิจ': ['🏦', 'สถาบันการเงินและออฟฟิศ'],
    'คมนาคม': ['🚦', 'โครงข่ายถนนและการเดินทาง'],
    'พื้นที่สีเขียว': ['🌳', 'สวนและพื้นที่พักผ่อนหย่อนใจ'],
    'กีฬา': ['⚽', 'สนามกีฬาและการออกกำลังกาย'],
    'วัฒนธรรม': ['🎭', 'ศิลปะ บันเทิง และวัฒนธรรม'],
    'ศาสนา': ['🛕', 'สถานที่ประกอบศาสนกิจ'],
    'อุตสาหกรรม': ['🏭', 'โรงงานและคลังสินค้าชานเมือง'],
    'สาธารณูปโภค': ['⚡', 'สาธารณูปโภคและบริการพื้นฐาน'],
    'เกษตร': ['🌾', 'พื้นที่เพาะปลูกนอกเมือง'],
    'การท่องเที่ยว': ['🏨', 'ที่พักและแลนด์มาร์กนักท่องเที่ยว'],
    'ชีวิตประจำวัน': ['🧺', 'บริการใกล้ตัวสำหรับใช้ประจำวัน'],
    'ย่าน': ['🏘️', 'กลุ่มอาคารเรียงแถวตามย่าน'],
    'โฆษณา': ['📢', 'ป้ายโฆษณาริมถนน'],
  };

  function showTooltip(hit) {
    var ud = hit.object.userData;
    var info = CAT_INFO[ud.cat] || ['🏢', 'สิ่งปลูกสร้างในเมือง'];
    if (ud.landmark) {
      tooltip.innerHTML =
        '<div class="tip-head"><span class="tip-icon">' + info[0] + '</span><b>' + ud.label + '</b></div>' +
        '<div class="tip-cat">' + ud.cat + ' — ' + info[1] + '</div>' +
        '<small>คลิกอาคารอื่นเพื่อดูข้อมูล</small>';
    } else {
      var zc = '#' + ('00000' + ud.zone.color.toString(16)).slice(-6);
      tooltip.innerHTML =
        '<div class="tip-head"><span class="tip-dot" style="background:' + zc + '"></span><b>' + ud.zone.label + '</b></div>' +
        '<div class="tip-cat">ความสูง ' + ud.floors + ' ชั้น (~' + Math.round(ud.floors * FLOOR_H) + ' ม.)</div>' +
        '<small>คลิกอาคารอื่นเพื่อดูข้อมูล</small>';
    }
    tooltip.classList.remove('hidden');
    clearTimeout(tooltip._t);
    tooltip._t = setTimeout(function () { tooltip.classList.add('hidden'); }, 4000);
  }

  canvas.addEventListener('pointerdown', function (e) {
    pointersDown++;
    downX = e.clientX; downY = e.clientY; downTime = Date.now();
  });

  canvas.addEventListener('pointerup', function (e) {
    var wasMultiTouch = pointersDown > 1;   // มีนิ้วอื่นยังแตะอยู่ = pinch/pan ไม่ใช่แตะ
    pointersDown = Math.max(0, pointersDown - 1);
    // ข้ามกรณีหลายนิ้ว (pinch zoom) และกรณีเลื่อนเยอะ/กดนาน = การหมุนกล้อง ไม่ใช่แตะ
    if (wasMultiTouch) return;
    var moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (moved > TAP_SLOP || Date.now() - downTime > TAP_TIME) return;
    var hit = pickAt(e.clientX, e.clientY);
    if (hit) showTooltip(hit);
  });

  canvas.addEventListener('pointercancel', function () {
    pointersDown = 0;
  });

  // ---------- ป้ายชื่ออาคารแบบ GUI: ชี้ที่ไหน ชื่อขึ้นที่นั่น (เดสก์ท็อป — จอสัมผัสใช้การแตะ) ----------
  var isTouchOnly = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
  if (!isTouchOnly) {
    var hoverPending = false;
    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      if (e.buttons > 0) { hoverTag.classList.add('hidden'); return; }   // ลากหมุนกล้อง = ซ่อนป้าย
      if (hoverPending) return;   // จำกัด raycast ทีละเฟรม กันหนักเครื่อง
      hoverPending = true;
      requestAnimationFrame(function () {
        hoverPending = false;
        var hit = pickAt(e.clientX, e.clientY);
        if (!hit) { hoverTag.classList.add('hidden'); return; }
        var ud = hit.object.userData;
        var ic = ud.landmark ? (CAT_ICONS[ud.cat] || '🏢') : (ZONE_ICONS[ud.zone.id] || '🏙️');
        hoverTag.innerHTML = ic + ' ' + (ud.landmark
          ? ud.label + '<span class="tag-cat">' + ud.cat + '</span>'
          : ud.zone.label.split(' (')[0] + '<span class="tag-cat">' + ud.floors + ' ชั้น</span>');
        hoverTag.style.left = e.clientX + 'px';
        hoverTag.style.top = e.clientY + 'px';
        hoverTag.classList.remove('hidden');
      });
    });
    canvas.addEventListener('pointerleave', function () {
      hoverTag.classList.add('hidden');
    });
  }

  // ซ่อน tooltip ทันทีที่เริ่มลากหมุนกล้อง (ทั้งเมาส์และนิ้ว)
  canvas.addEventListener('pointermove', function (e) {
    if (e.buttons > 0 && Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_SLOP) {
      tooltip.classList.add('hidden');
    }
  });

  // ================= คำใบ้การใช้งานตามประเภทอุปกรณ์ =================
  var hintText = document.getElementById('hintText');
  if (hintText) {
    var touchHint = 'ลากนิ้ว = หมุน • สองนิ้วบีบ = ซูม • สองนิ้วเลื่อน = แพน • แตะอาคารเพื่อดูข้อมูล';
    var mouseHint = 'ลาก = หมุน • สกรอลล์ = ซูม • คลิกขวาลาก = เลื่อน • คลิกอาคารเพื่อดูข้อมูล';
    hintText.textContent = (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) ? touchHint : mouseHint;
  }

  // ================= UI: โหมดป้ายชื่อ (อัตโนมัติ / ทั้งหมด / ซ่อน) =================
  var labelModeButtons = document.querySelectorAll('#labelMode button');
  labelModeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      labelModeButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      labelMode = btn.dataset.mode;
      syncLabelChip();
    });
  });

  // ปุ่มป้ายด่วนบนแถบหัวเรื่อง: กดสลับ อัตโนมัติ ↔ ซ่อน
  var labelToggleBtn = document.getElementById('labelToggle');
  function syncLabelChip() {
    if (labelToggleBtn) labelToggleBtn.classList.toggle('active', labelMode !== 'off');
  }
  if (labelToggleBtn) labelToggleBtn.addEventListener('click', function () {
    var next = labelMode === 'off' ? 'auto' : 'off';
    labelMode = next;
    labelModeButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.mode === next); });
    syncLabelChip();
  });
  syncLabelChip();

  // ================= Auto-rotate =================
  var autoRotateCb = document.getElementById('autoRotate');
  autoRotateCb.addEventListener('change', function () {
    controls.autoRotate = autoRotateCb.checked;
    controls.autoRotateSpeed = 0.8;
  });

  // ================= Resize =================
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener('resize', onResize);
  // มือถือ: address bar หด/ขยายไม่ fire resize เสมอไป — ใช้ visualViewport ช่วย
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

  // ================= ซ่อนหน้าโหลด =================
  var loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.classList.add('done');

  // ================= Loop =================
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    updateCars(dt);
    updateTrain(dt);
    updatePlane(dt);
    updateHeli(dt);
    // เมฆลอยช้า ๆ + ผิวน้ำไหล (ทั้งทะเลสาบและมหาสมุทร)
    cloudGroup.rotation.y += dt * 0.004;
    cloudGroup.children.forEach(function (s) {
      if (s.material) s.material.rotation += dt * 0.004;   // เมฆหมุนเบาๆ ดูมีชีวิต
    });
    lakeMat.map.offset.y -= dt * 0.01;
    lakeMat.bumpMap.offset.y -= dt * 0.015;
    updateSkyBillboards();
    controls.update();
    updateBuildingLabels();   // ป้ายชื่อบนหัวตึก — คำนวณหลังกล้องอัปเดตแล้ว ก่อนเรนเดอร์
    renderer.render(scene, camera);
  }
  animate();

})();
