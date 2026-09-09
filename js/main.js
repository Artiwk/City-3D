/* =========================================================
 * ผังเมือง 3D — Three.js City Plan Viewer (plain JS, offline)
 * พื้น/ถนน/แปลงที่ดิน สร้างอัตโนมัติ | อาคารมีหน้าต่าง+ไฟห้อง
 * ========================================================= */

(function () {
  'use strict';

  // ================= โซนผังเมือง (17 หมวด) =================
  var ZONES = [
    { id: 'res',        color: 0xffe14f, label: 'ที่อยู่อาศัย (สีเหลือง)',           floors: [3, 6] },
    { id: 'edu',        color: 0x42a5f5, label: 'สถานศึกษา (สีฟ้า)',                 floors: [2, 5] },
    { id: 'health',     color: 0xef5350, label: 'สาธารณสุข (สีแดง/ชมพู)',            floors: [4, 8] },
    { id: 'safety',     color: 0x283593, label: 'ความปลอดภัย (สีน้ำเงินเข้ม)',        floors: [2, 4] },
    { id: 'commerce',   color: 0xb45ce8, label: 'ย่านการค้า (สีม่วง/ชมพู)',          floors: [3, 6] },
    { id: 'food',       color: 0xff9a3c, label: 'ร้านอาหาร (สีส้ม)',                 floors: [2, 3] },
    { id: 'business',   color: 0x90a4ae, label: 'ธนาคารและธุรกิจ (สีเทา)',           floors: [4, 10] },
    { id: 'transport',  color: 0x37474f, label: 'คมนาคม (ถนน/สะพาน/ไฟจราจร)',      floors: [1, 1] },
    { id: 'green',      color: 0x66bb6a, label: 'พื้นที่สีเขียว (สวน/สนามเด็กเล่น)',  floors: [1, 1] },
    { id: 'sports',     color: 0x8bc34a, label: 'กีฬา (สีเขียวอ่อน)',                floors: [1, 2] },
    { id: 'culture',    color: 0xd4af37, label: 'วัฒนธรรม (สีทอง)',                  floors: [3, 6] },
    { id: 'religion',   color: 0xe8d5a0, label: 'ศาสนา (สีขาว/ทอง)',                floors: [2, 6] },
    { id: 'industry',   color: 0x546e7a, label: 'อุตสาหกรรม (สีเทาเข้ม) — ชานเมือง', floors: [2, 4] },
    { id: 'utility',    color: 0xe65100, label: 'สาธารณูปโภค (สีส้มเข้ม) — ชานเมือง', floors: [1, 3] },
    { id: 'agriculture', color: 0x9db84a, label: 'เกษตร (สีเขียวเหลือง) — รอบนอก',  floors: [1, 1] },
    { id: 'tourism',    color: 0xf48fb1, label: 'การท่องเที่ยว (สีชมพู)',            floors: [3, 8] },
    { id: 'everyday',   color: 0x26c6da, label: 'ชีวิตประจำวัน (บริการ)',            floors: [2, 4] },
  ];

  // ก้อนโซน (x, z, กว้าง w, ลึก d) หน่วย = เมตร บนพื้น 500x500
  var ZONE_BLOCKS = [
    { zone: 'res',         x:  170, z:  170, w: 100, d: 100 },   // ชานเมืองตะวันออกเฉียงใต้ (บ้าน)
    { zone: 'res',         x:  -45, z: -165, w:  70, d:  90 },   // คอนโด/อพาร์ตเมนต์เหนือเมือง
    { zone: 'edu',         x:   45, z: -165, w:  70, d:  90 },
    { zone: 'industry',    x: -165, z: -165, w: 105, d: 105 },   // ชานเมือง NW
    { zone: 'agriculture', x:  165, z: -165, w: 105, d: 105 },   // รอบนอก NE (นาข้าว)
    { zone: 'utility',     x: -165, z:  165, w: 105, d: 105 },   // ชานเมือง SW
    { zone: 'safety',      x: -160, z:  -45, w: 110, d:  66 },
    { zone: 'commerce',    x:  160, z:  -45, w: 110, d:  66 },
    { zone: 'religion',    x:  190, z:   62, w:  60, d:  34 },
    { zone: 'sports',      x:   45, z:  -60, w:  66, d:  42 },
    { zone: 'tourism',     x:  -45, z:  -60, w:  66, d:  42 },
    { zone: 'food',        x:  -45, z:   60, w:  66, d:  42 },
    { zone: 'business',    x:   35, z:   60, w:  50, d:  42 },
    { zone: 'health',      x:   35, z:  115, w:  55, d:  30 },
    { zone: 'everyday',    x:  -45, z:  115, w:  60, d:  30 },
  ];

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

  // จำนวนสิ่งปลูกสร้างต่อบล็อกโซน
  var ZONE_COUNTS = {
    res: 7, edu: 6, health: 5, safety: 4, commerce: 10, food: 6, business: 4,
    sports: 5, culture: 5, religion: 3, industry: 4, utility: 4, agriculture: 4,
    tourism: 4, everyday: 5,
  };

  // โซนชานเมือง/เกษตรไม่ต้องมีขอบทางเท้ารอบบล็อก
  var NO_CURB = { industry: 1, agriculture: 1, utility: 1 };

  var GROUND_SIZE = 500;   // พื้น 500x500 หน่วย
  var FLOOR_H = 3.2;       // ความสูงชั้นละ 3.2 ม.
  var ROAD_W = 16;         // ความกว้างถนนหลัก
  var GROUND_H = 26;       // ความหนาของชั้นดินใต้พื้นผิว (เห็นตอนกดมุมต่ำ)
  var BRIDGE_LOW = 4.5;    // ระดับสะพานข้ามทะเลสาบ (แนว x=0)
  var BRIDGE_HIGH = 12;    // ระดับสะพานยกระดับสูง (แนว z=0) ตัดต่างระดับชัดเจน

  // ================= ฉากพื้นฐาน =================
  var canvas = document.getElementById('scene');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 3000);
  camera.position.set(280, 240, 280);

  var controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 20;
  controls.maxDistance = 900;
  controls.target.set(0, 0, 0);

  // ================= แสง =================
  var sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.position.set(200, 300, 140);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -320;
  sun.shadow.camera.right = 320;
  sun.shadow.camera.top = 320;
  sun.shadow.camera.bottom = -320;
  sun.shadow.camera.far = 1200;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  var ambient = new THREE.AmbientLight(0xbfd4e0, 0.55);
  scene.add(ambient);

  var hemi = new THREE.HemisphereLight(0x9fc5e8, 0x3a4a3f, 0.6);
  scene.add(hemi);

  // ================= พื้น: วาดผังบน canvas แล้วใช้เป็น texture =================
  function makeGroundTexture() {
    var S = 2048;                 // ความละเอียด canvas
    var px = S / GROUND_SIZE;     // pixel ต่อเมตร
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');

    // พื้นฐาน: ดิน/หญ้า
    g.fillStyle = '#6d8f56';
    g.fillRect(0, 0, S, S);

    // ความผันผวนของสีหญ้า
    var r = 12345;
    function rnd() { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; }
    for (var i = 0; i < 900; i++) {
      g.fillStyle = 'rgba(' + (90 + Math.floor(rnd() * 40)) + ',' + (120 + Math.floor(rnd() * 40)) + ',' + (60 + Math.floor(rnd() * 30)) + ',0.25)';
      var rr = 20 + rnd() * 90;
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
      g.fillStyle = hex + '66'; // โปร่งบนพื้น
      g.fillRect(cx - w / 2, cy - d / 2, w, d);
      g.strokeStyle = hex;
      g.lineWidth = 4;
      g.strokeRect(cx - w / 2, cy - d / 2, w, d);

      // เส้นแบ่งแปลงย่อย
      g.strokeStyle = 'rgba(255,255,255,0.35)';
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

    // ===== ถนน: ทางเท้า + ผิวถนน + เส้นเลน =====
    var roadW = ROAD_W * px;
    var roads = [-90, 0, 90]; // ตำแหน่งกึ่งกลางถนน (เมตร)
    var edge = GROUND_SIZE / 2 - 20;

    // ทางเท้าสีเทาอ่อน (กว้าง 3 ม.) ข้างถนนสายหลัก
    g.fillStyle = '#98a1a8';
    roads.forEach(function (pos) {
      var off = (pos + GROUND_SIZE / 2) * px;
      g.fillRect(off - (roadW / 2 + 3 * px), 0, 3 * px, S);
      g.fillRect(off + roadW / 2, 0, 3 * px, S);
      g.fillRect(0, off - (roadW / 2 + 3 * px), S, 3 * px);
      g.fillRect(0, off + roadW / 2, S, 3 * px);
    });
    // ทางเท้าถนนริมเมือง (ด้านใน)
    [-edge + 9.5, edge - 9.5].forEach(function (cx) {
      g.fillRect((cx + GROUND_SIZE / 2) * px - 1.5 * px, 0, 3 * px, S);
    });
    [-edge + 9.5, edge - 9.5].forEach(function (cz) {
      g.fillRect(0, (cz + GROUND_SIZE / 2) * px - 1.5 * px, S, 3 * px);
    });

    // ผิวถนนยางมะตอย (มีจุดเนื้อละเอียด)
    roads.forEach(function (pos) {
      var c = (pos + GROUND_SIZE / 2) * px;
      g.fillStyle = '#3a3d42';
      g.fillRect(c - roadW / 2, 0, roadW, S);
      g.fillRect(0, c - roadW / 2, S, roadW);
      g.fillStyle = 'rgba(255,255,255,0.045)';
      for (var i = 0; i < 420; i++) {
        var y = rnd() * S;
        var x = c - roadW / 2 + rnd() * roadW;
        g.fillRect(x, y, 2, 2);
        g.fillRect(y, x, 2, 2);
      }
    });
    // ถนนริมเมือง
    [[-edge, 0], [edge, 0], [0, -edge], [0, edge]].forEach(function (p) {
      g.fillStyle = '#3a3d42';
      g.fillRect((p[0] + GROUND_SIZE / 2) * px - roadW / 2, 0, roadW, S);
      g.fillRect(0, (p[1] + GROUND_SIZE / 2) * px - roadW / 2, S, roadW);
    });

    // เส้นแบ่งเลน + เส้นขอบถนน
    roads.forEach(function (pos) {
      var c = (pos + GROUND_SIZE / 2) * px;
      g.fillStyle = 'rgba(255,255,255,0.65)';
      for (var y = 0; y < S; y += 64) {
        g.fillRect(c - 2.5, y, 5, 28);               // แนวตั้ง
        g.fillRect(y, c - 2.5, 28, 5);               // แนวนอน
      }
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(c - roadW / 2, 0, 2, S);
      g.fillRect(c + roadW / 2 - 2, 0, 2, S);
      g.fillRect(0, c - roadW / 2, S, 2);
      g.fillRect(0, c + roadW / 2 - 2, S, 2);
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
    // ลูกคลื่นในน้ำ
    g.strokeStyle = 'rgba(255,255,255,0.13)';
    g.lineWidth = 2;
    for (var rp = 0; rp < 4; rp++) {
      var ry = 10 + rp * 8;
      g.beginPath();
      g.ellipse(S * 0.5, S * 0.5, ry * px * 1.45, ry * px, 0, 0.25, 1.4);
      g.stroke();
    }

    // สวนสาธารณะกลางเมือง (อยู่ในช่องระหว่างถนน ไม่ทับถนน)
    var parkCX = 130, parkCZ = 45, parkR = 28;
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
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  var groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    new THREE.MeshStandardMaterial({ map: makeGroundTexture(), roughness: 0.95, metalness: 0 })
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
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  var groundBase = new THREE.Mesh(
    new THREE.BoxGeometry(GROUND_SIZE, GROUND_H, GROUND_SIZE),
    new THREE.MeshStandardMaterial({ map: makeSoilTexture(), roughness: 0.95 })
  );
  groundBase.position.y = -(GROUND_H / 2 + 0.06);
  groundBase.receiveShadow = true;
  scene.add(groundBase);

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

  // สร้าง texture หน้าต่าง (สุ่มไฟติด/ดับ)
  function windowTexture(floors, cols) {
    var key = floors + 'x' + cols;
    if (windowTexCache[key]) return windowTexCache[key];

    var cv = document.createElement('canvas');
    var cw = cols * 16, ch = floors * 16;
    cv.width = cw; cv.height = ch;
    var g = cv.getContext('2d');
    g.fillStyle = '#1c2733'; // กระจกกลางวัน
    g.fillRect(0, 0, cw, ch);

    var rand = seededRandom(floors * 97 + cols * 31 + 7);
    for (var y = 0; y < floors; y++) {
      for (var x = 0; x < cols; x++) {
        var lit = rand() < 0.42; // 42% ติดไฟ
        g.fillStyle = lit ? '#ffd98a' : '#31404f';
        g.fillRect(x * 16 + 3, y * 16 + 3, 10, 10);
      }
    }
    var tex = new THREE.CanvasTexture(cv);
    windowTexCache[key] = tex;
    return tex;
  }

  function makeBuilding(x, z, w, d, floors, zone) {
    var bh = floors * FLOOR_H;
    var group = new THREE.Group();

    // ตัวอาคาร
    var wallColor = new THREE.Color(zone.color).lerp(new THREE.Color(0xdddddd), 0.55);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      map: City.wallTex || null,
      roughness: 0.75,
      metalness: 0.05,
    });
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

    var winMatX = new THREE.MeshBasicMaterial({ map: winTexX, transparent: true, opacity: 0.9 });
    var winMatZ = new THREE.MeshBasicMaterial({ map: winTexZ, transparent: true, opacity: 0.9 });
    windowMats.push(winMatX, winMatZ);

    var eps = 0.06;
    var px1 = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, bh * 0.92), winMatX);
    px1.position.set(0, bh / 2, d / 2 + eps);
    var px2 = px1.clone(); px2.rotation.y = Math.PI; px2.position.z = -d / 2 - eps;
    var pz1 = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.96, bh * 0.92), winMatZ);
    pz1.rotation.y = Math.PI / 2; pz1.position.set(w / 2 + eps, bh / 2, 0);
    var pz2 = pz1.clone(); pz2.rotation.y = -Math.PI / 2; pz2.position.x = -w / 2 - eps;
    group.add(px1, px2, pz1, pz2);

    // ดาดฟ้า
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.92, 0.6, d * 0.92),
      new THREE.MeshStandardMaterial({ color: 0x555a60, map: City.wallTex || null, roughness: 0.9 })
    );
    roof.position.y = bh + 0.3;
    roof.castShadow = true;
    group.add(roof);

    // ถังน้ำบนดาดฟ้า (ถ้าสูงเกิน 4 ชั้น)
    if (floors >= 4) {
      var tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 2, 10),
        new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.6 })
      );
      tank.position.set(w * 0.25, bh + 1.6, -d * 0.25);
      tank.castShadow = true;
      group.add(tank);
    }

    group.position.set(x, 0, z);
    buildingsGroup.add(group);

    // ใช้ body เป็นตัว raycast
    body.userData = { zone: zone, floors: floors };
    zoneMeshes.push(body);
    return group;
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

  // วางสิ่งปลูกสร้างจาก City.makers ลงในบล็อกโซน (หลีกเลี่ยงการทับซ้อน)
  function placeMakers(block, makers, count, minS, maxS, seed, boxes) {
    var rand = seededRandom(seed);
    var placed = 0, guard = 0;
    while (placed < count && guard < count * 10) {
      guard++;
      var key = makers[Math.floor(rand() * makers.length)];
      var mk = City.makers[key];
      if (!mk) continue;
      var s = minS + rand() * (maxS - minS);
      var grp = mk.build(rand);
      grp.rotation.y = rand() < 0.5 ? 0 : Math.PI / 2;
      grp.scale.setScalar(s);
      var x = block.x + (rand() - 0.5) * (block.w - 10);
      var z = block.z + (rand() - 0.5) * (block.d - 10);
      grp.position.set(x, 0, z);
      // คำนวณขอบจริงของอาคาร (รวมสเกล+หมุน) เพื่อกันทับซ้อน
      var bb = new THREE.Box3().setFromObject(grp);
      var bw = bb.max.x - bb.min.x + 2;
      var bd = bb.max.z - bb.min.z + 2;
      if (x - bw / 2 < block.x - block.w / 2 || x + bw / 2 > block.x + block.w / 2 ||
          z - bd / 2 < block.z - block.d / 2 || z + bd / 2 > block.z + block.d / 2) continue;
      if (overlaps(boxes, x, z, bw, bd)) continue;
      boxes.push({ x: x, z: z, w: bw, d: bd });
      landmarksGroup.add(grp);
      registerLandmark(grp, mk.label, mk.cat, block.zone);
      placed++;
    }
  }

  // ขอบทางเท้ารอบบล็อกโซนในเมือง (ให้บล็อกดูชัดเจนขึ้น)
  function makeCurb(x, z, w, d) {
    var h = 0.22;
    var w2 = w + 3, d2 = d + 3;
    var m = new THREE.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.9 });
    var a = new THREE.Mesh(new THREE.BoxGeometry(w2, h, 0.7), m);
    a.position.set(x, h / 2, z - d2 / 2);
    var b = a.clone(); b.position.z = z + d2 / 2;
    var c = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, d2 - 1.4), m);
    c.position.set(x - w2 / 2, h / 2, z);
    var e = c.clone(); e.position.x = x + w2 / 2;
    curbGroup.add(a, b, c, e);
  }

  function buildCity() {
    ZONE_BLOCKS.forEach(function (block, bi) {
      var zone = zoneById(block.zone);
      var makers = ZONE_MAKERS[block.zone];
      var count = ZONE_COUNTS[block.zone] || 4;
      var boxes = [];   // พื้นที่ที่วางของไปแล้ว ใช้กันทับซ้อน

      if (makers) {
        // โซนที่อยู่อาศัยใช้สเกลใหญ่หน่อย (บ้าน/คอนโด) ที่เหลือสเกลมาตรฐาน
        var big = block.zone === 'res';
        placeMakers(block, makers, count, big ? 1 : 0.9, big ? 1.25 : 1.15, bi * 7 + 13, boxes);
      }

      // กล่องเติม (ให้เห็นสีโซนบนผังเมือง) เฉพาะโซนที่อยู่อาศัย
      if (block.zone === 'res') {
        var rand = seededRandom(bi * 31 + 7);
        var filler = 4 + (bi % 3);
        for (var j = 0; j < filler; j++) {
          var bw = 10 + rand() * (block.w / 4.5);
          var bd = 10 + rand() * (block.d / 4.5);
          var floors = Math.round(zone.floors[0] + rand() * (zone.floors[1] - zone.floors[0]));
          var ox = (rand() - 0.5) * (block.w - bw);
          var oz = (rand() - 0.5) * (block.d - bd);
          var fx = block.x + ox, fz = block.z + oz;
          if (overlaps(boxes, fx, fz, bw + 2, bd + 2)) continue;
          boxes.push({ x: fx, z: fz, w: bw + 2, d: bd + 2 });
          makeBuilding(fx, fz, bw, bd, floors, zone);
        }
        // ต้นไม้ในย่านที่อยู่อาศัย
        for (var t = 0; t < 4; t++) {
          var tx = block.x + (rand() - 0.5) * (block.w - 8);
          var tz = block.z + (rand() - 0.5) * (block.d - 8);
          if (overlaps(boxes, tx, tz, 4, 4)) continue;
          makeTree(tx, tz, 0.7 + rand() * 0.4);
        }
      }

      // ขอบทางเท้ารอบบล็อกในเมือง (ยกเว้นโซนชานเมือง/เกษตร)
      if (!NO_CURB[block.zone]) makeCurb(block.x, block.z, block.w, block.d);
    });

    plantGreenZone();
    buildTransport();
  }

  // ของแต่งในสวนสาธารณะกลางเมือง (โซนสีเขียว)
  function plantGreenZone() {
    var rand = seededRandom(4242);
    var items = ZONE_MAKERS.green;
    var parkX = 130, parkZ = 45;
    items.forEach(function (key, i) {
      var mk = City.makers[key];
      if (!mk) return;
      var grp = mk.build(rand);
      var a = -1.2 + i * 1.15;
      grp.position.set(parkX + Math.cos(a) * 20, 0, parkZ + Math.sin(a) * 20 * 0.7);
      grp.rotation.y = rand() * Math.PI;
      landmarksGroup.add(grp);
      registerLandmark(grp, mk.label, mk.cat, 'green');
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

    // สัญญาณไฟ + ทางม้าลาย 4 แยกใกล้ใจกลาง
    var xings = [[-90, 0], [0, -90], [0, 90], [90, 0]];
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
  buildCity();

  // ================= ต้นไม้ =================

  function makeTree(x, z, scale) {
    var g = new THREE.Group();
    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.5, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.95 })
    );
    trunk.position.y = 1.5;
    trunk.castShadow = true;

    var leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7d33, roughness: 0.9 });
    var c1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), leafMat);
    c1.position.y = 4.4;
    c1.castShadow = true;
    var c2 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), leafMat);
    c2.position.set(0.8, 5.6, 0.5);
    c2.castShadow = true;
    var c3 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), leafMat);
    c3.position.set(-0.7, 5.2, -0.6);
    c3.castShadow = true;

    g.add(trunk, c1, c2, c3);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale || 1);
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
      if (Math.abs(x) < 10 || Math.abs(z) < 10) return true;   // ถนนกลางเมือง
      var ax = Math.abs(x), az = Math.abs(z);
      if ((ax > 82 && ax < 98) || (az > 82 && az < 98)) return true;     // ถนนสาย ±90
      if ((ax > 222 && ax < 238) || (az > 222 && az < 238)) return true; // ถนนริม
      for (var i = 0; i < ZONE_BLOCKS.length; i++) {
        var b = ZONE_BLOCKS[i];
        if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) return true;
      }
      return false;
    }
    // ต้นไม้ในสวนสาธารณะ (130, 45)
    for (var i = 0; i < 26; i++) {
      var a = rand() * Math.PI * 2;
      var rr = rand() * 26;
      var px = 130 + Math.cos(a) * rr;
      var pz = 45 + Math.sin(a) * rr * 0.75;
      if (badSpot(px, pz)) continue;
      makeTree(px, pz, 0.8 + rand() * 0.6);
    }
    // ต้นไม้เป็นวงรอบทะเลสาบกลางเมือง (เฉพาะช่องว่างระหว่างบล็อก)
    for (var k = 0; k < 42; k++) {
      var a2 = rand() * Math.PI * 2;
      var rr2 = 60 + rand() * 9;
      var lx = Math.cos(a2) * rr2;
      var lz = Math.sin(a2) * rr2 * 1.15;
      if (badSpot(lx, lz)) continue;
      makeTree(lx, lz, 0.7 + rand() * 0.5);
    }
    // ริมถนน
    var roads = [-90, 0, 90];
    roads.forEach(function (pos) {
      for (var t = -230; t <= 230; t += 24) {
        if (Math.abs(t) < 30 && pos === 0) continue; // เว้นแยกกลาง
        [[pos + 12, t], [t, pos + 12], [pos - 12, t], [t, pos - 12]].forEach(function (p) {
          if (badSpot(p[0], p[1])) return;
          makeTree(p[0], p[1], 0.7 + rand() * 0.4);
        });
      }
    });
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
    pole.position.set(x, 3.5, z);
    pole.castShadow = true;
    var bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x, 7.2, z);
    bulb.visible = false; // เปิดตอนกลางคืน
    lampGroup.add(pole, bulb);
    return bulb;
  }

  var lampBulbs = [];
  var roadsL = [-90, 0, 90];
  roadsL.forEach(function (pos) {
    for (var t = -230; t <= 230; t += 46) {
      lampBulbs.push(makeLamp(pos + 9.5, t));
      lampBulbs.push(makeLamp(t, pos + 9.5));
    }
  });

  // ไฟจุดจริง (PointLight) เฉพาะแยกกลาง เพื่อประหยัด
  var cornerLight = new THREE.PointLight(0xffd98a, 0, 90, 2);
  cornerLight.position.set(0, 9, 0);
  scene.add(cornerLight);

  // ================= รถวิ่งบนถนน =================
  var carsGroup = new THREE.Group();
  scene.add(carsGroup);

  var carBodyGeo = new THREE.BoxGeometry(4.2, 1.5, 2);
  var carTopGeo = new THREE.BoxGeometry(2.4, 1.1, 1.8);
  var carColors = [0xd94f4f, 0x4f7fd9, 0xe8e8e8, 0x3a3a3a, 0xe8b84f, 0x4fae6e];

  function makeCar(axis, laneOffset, dir, speed, start) {
    var color = carColors[Math.floor(Math.random() * carColors.length)];
    var grp = new THREE.Group();
    var body = new THREE.Mesh(carBodyGeo, new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.3 }));
    body.position.y = 0.9;
    body.castShadow = true;
    var top = new THREE.Mesh(carTopGeo, new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.2, metalness: 0.4 }));
    top.position.y = 2;
    grp.add(body, top);

    var headL = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    headL.position.set(2.1, 0.9, 0.6);
    var headR = headL.clone(); headR.position.z = -0.6;
    grp.add(headL, headR);

    carsGroup.add(grp);
    return { grp: grp, axis: axis, lane: laneOffset, dir: dir, speed: speed, pos: start, lake: Math.abs(laneOffset) < 8 };
  }

  var cars = [];
  var carRand = seededRandom(777);
  roadsL.forEach(function (pos) {
    // 2 เลนต่อทิศ ต่อถนน
    for (var i = 0; i < 3; i++) {
      cars.push(makeCar('x', pos + 4, 1, 14 + carRand() * 10, -230 + carRand() * 460));
      cars.push(makeCar('x', pos - 4, -1, 14 + carRand() * 10, -230 + carRand() * 460));
      cars.push(makeCar('z', pos + 4, 1, 14 + carRand() * 10, -230 + carRand() * 460));
      cars.push(makeCar('z', pos - 4, -1, 14 + carRand() * 10, -230 + carRand() * 4));
    }
  });

  function updateCars(dt) {
    cars.forEach(function (c) {
      c.pos += c.speed * c.dir * dt;
      if (c.pos > 240) c.pos = -240;
      if (c.pos < -240) c.pos = 240;
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
      // หมุนให้หัวรถไปทางทิศทางวิ่ง
      var yaw = (c.axis === 'x' ? 0 : Math.PI / 2) + (c.dir > 0 ? 0 : Math.PI);
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
    var R = 330;
    planeGroup.position.set(Math.cos(planeAngle) * R, 120 + Math.sin(planeAngle * 2) * 8, Math.sin(planeAngle) * R);
    planeGroup.rotation.y = -planeAngle + Math.PI / 2;
  }

  // ================= ดวงดาว (กลางคืน) =================
  var starGeo = new THREE.BufferGeometry();
  var starVerts = [];
  for (var si = 0; si < 900; si++) {
    var th = Math.random() * Math.PI * 2;
    var ph = Math.random() * Math.PI * 0.42;   // ครึ่งฟากฟ้าบน
    var R2 = 1400;
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
    day:    { sky: 0x8fc7ee, fog: [0xbfd9ea, 500, 1400], sunColor: 0xfff4e0, sunI: 1.15, ambI: 0.55, hemiI: 0.6,  sunPos: [200, 300, 140],   lamps: false, windowEmissive: false, starO: 0 },
    sunset: { sky: 0xe8956a, fog: [0xd98a5f, 420, 1300], sunColor: 0xffb066, sunI: 0.75, ambI: 0.4,  hemiI: 0.35, sunPos: [340, 80, -160],   lamps: true,  windowEmissive: true,  starO: 0.35 },
    night:  { sky: 0x0b1020, fog: [0x0b1020, 380, 1200], sunColor: 0x8fb0ff, sunI: 0.14, ambI: 0.16, hemiI: 0.1,  sunPos: [-160, 220, -120], lamps: true,  windowEmissive: true,  starO: 0.9 },
  };

  function setLightMode(mode) {
    var m = LIGHT_MODES[mode];
    if (!m) return;
    scene.background = new THREE.Color(m.sky);
    scene.fog = new THREE.Fog(m.fog[0], m.fog[1], m.fog[2]);
    sun.color.set(m.sunColor);
    sun.intensity = m.sunI;
    sun.position.set(m.sunPos[0], m.sunPos[1], m.sunPos[2]);
    ambient.intensity = m.ambI;
    hemi.intensity = m.hemiI;
    lampGroup.children.forEach(function (c) { if (c.geometry === bulbGeo) c.visible = m.lamps; });
    cornerLight.intensity = m.lamps ? 1.4 : 0;
    stars.material.opacity = m.starO;
    windowMats.forEach(function (mat) { mat.opacity = m.windowEmissive ? 1 : 0.9; });
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
    top:    { pos: [0, 420, 0.01], target: [0, 0, 0] },
    iso:    { pos: [280, 240, 280], target: [0, 0, 0] },
    street: { pos: [0, 16, 215], target: [0, 4, 0] },   // มุมต่ำ เห็นชั้นดินตัดขวาง
  };

  document.querySelectorAll('#viewPresets button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = VIEWS[btn.dataset.view];
      if (!v) return;
      camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
      controls.target.set(v.target[0], v.target[1], v.target[2]);
    });
  });

  // ================= คลิกอาคารเพื่อดูข้อมูล =================
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var tooltip = document.getElementById('tooltip');

  var pickables = zoneMeshes.concat(landmarkMeshes);

  canvas.addEventListener('pointerdown', function (e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(pickables, false);
    var hit = null;
    for (var i = 0; i < hits.length; i++) {
      if (hits[i].object.visible !== false) { hit = hits[i]; break; }
    }
    if (hit) {
      var ud = hit.object.userData;
      if (ud.landmark) {
        tooltip.innerHTML =
          '<b>' + ud.label + '</b><br/>' +
          'หมวด: ' + ud.cat + '<br/>' +
          '<small>คลิกอาคารอื่นเพื่อดูข้อมูล</small>';
      } else {
        tooltip.innerHTML =
          '<b>' + ud.zone.label + '</b><br/>' +
          'ความสูง: ' + ud.floors + ' ชั้น (~' + Math.round(ud.floors * FLOOR_H) + ' ม.)<br/>' +
          '<small>คลิกอาคารอื่นเพื่อดูข้อมูล</small>';
      }
      tooltip.classList.remove('hidden');
      clearTimeout(tooltip._t);
      tooltip._t = setTimeout(function () { tooltip.classList.add('hidden'); }, 4000);
    }
  });

  // ================= Auto-rotate =================
  var autoRotateCb = document.getElementById('autoRotate');
  autoRotateCb.addEventListener('change', function () {
    controls.autoRotate = autoRotateCb.checked;
    controls.autoRotateSpeed = 0.8;
  });

  // ================= Resize =================
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ================= ซ่อนหน้าโหลด =================
  var loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.classList.add('done');

  // ================= Loop =================
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    updateCars(dt);
    updatePlane(dt);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

})();
