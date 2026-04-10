/* ============================================================
 * TAAG Entrance Page Script
 * 真のソース。CMSへ貼り付ける際は本ファイルの内容を
 * フロンティア管理画面 [ページ単位 上級者設定 > 独自JS] に転記する。
 *
 * 状態管理: sessionStorage('taag-entered')
 *   - 未設定 → エントランス演出を再生
 *   - '1'    → 演出をスキップしてトップページオーバーレイを直接表示
 *   - タブを閉じると消滅 → 翌日訪問時は再度演出を見られる
 *
 * 失敗安全（fail-safe）: sessionStorage が使えない環境
 * （プライベートブラウズ等）でも try/catch で吸収し、
 * 「毎回エントランス演出が再生される」という挙動に縮退する。
 * ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // sessionStorage ヘルパー（fail-safe）
  // ============================================================
  var STORAGE_KEY = 'taag-entered';

  function hasEntered() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false; // ストレージ不可 → 毎回演出を見せる
    }
  }
  function markEntered() {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }
  function clearEntered() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ============================================================
  // 日付表示
  // ============================================================
  function setupDate() {
    var now = new Date();
    var dateStr = now.getFullYear() + '.'
      + String(now.getMonth() + 1).padStart(2, '0') + '.'
      + String(now.getDate()).padStart(2, '0');
    var el = document.getElementById('dateDisp');
    if (el) el.textContent = dateStr;
  }

  // ============================================================
  // 桜の花びら散布
  // ============================================================
  function setupPetals() {
    var pc = document.getElementById('petals');
    if (!pc) return;
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('div');
      p.className = 'petal';
      p.style.cssText =
        'left:' + (Math.random() * 80) + '%;' +
        'width:' + (7 + Math.random() * 5) + 'px;' +
        'height:' + (5 + Math.random() * 4) + 'px;' +
        'animation-duration:' + (4 + Math.random() * 4) + 's;' +
        'animation-delay:' + (Math.random() * 7) + 's;' +
        'transform:rotate(' + (Math.random() * 360) + 'deg);' +
        'background:rgba(255,' +
          (158 + Math.floor(Math.random() * 28)) + ',' +
          (172 + Math.floor(Math.random() * 24)) + ',.8);';
      pc.appendChild(p);
    }
  }

  // ============================================================
  // 棒人間アニメーション（歩行）
  // ============================================================
  var elPerson, elLegF, elLegB, elArmF, elArmB, elShoeF, elShoeB, elHead;

  // 定数
  var GY = 460;     // 地面Y
  var BX = 90;      // 人物中心X
  var HIP_Y = 415;  // 腰Y
  var SHO_Y = 362;  // 肩Y
  var START_OFFSET = 100;

  var offsetX = 0;
  var animating = false;
  var walking = false;
  var lastTs = null;
  var rafId = null;
  var targetX = 0;
  var phase = 0;

  function bindPersonElements() {
    elPerson = document.getElementById('person');
    elLegF   = document.getElementById('legF');
    elLegB   = document.getElementById('legB');
    elArmF   = document.getElementById('armF');
    elArmB   = document.getElementById('armB');
    elShoeF  = document.getElementById('shoeF');
    elShoeB  = document.getElementById('shoeB');
    elHead   = document.getElementById('head');
  }

  function drawWalkPose(ph) {
    var ls = Math.sin(ph) * 12;             // 脚の振れ幅
    var as = Math.sin(ph + Math.PI) * 9;    // 腕の振れ幅（逆位相）

    // 前脚
    var lfThighX = BX + ls;
    var lfKneeY  = HIP_Y + 24;
    var lfFootX  = lfThighX + ls * 0.12;
    elLegF.setAttribute('d',
      'M' + BX + ',' + HIP_Y +
      ' Q' + lfThighX + ',' + lfKneeY + ' ' + lfFootX + ',' + (GY - 2) +
      ' L' + (lfFootX + 6) + ',' + (GY - 2) +
      ' Q' + (lfThighX + 5) + ',' + lfKneeY + ' ' + (BX + 4) + ',' + HIP_Y + ' Z'
    );
    elShoeF.setAttribute('d',
      'M' + (lfFootX - 1) + ',' + (GY - 1) +
      ' Q' + (lfFootX + 5) + ',' + (GY - 3) + ' ' + (lfFootX + 9) + ',' + (GY - 1) +
      ' Q' + (lfFootX + 10) + ',' + (GY + 2) + ' ' + (lfFootX + 7) + ',' + (GY + 3) +
      ' Q' + (lfFootX + 2) + ',' + (GY + 3) + ' ' + (lfFootX - 1) + ',' + (GY + 1) + ' Z'
    );

    // 後脚
    var lbThighX = BX - ls;
    var lbKneeY  = HIP_Y + 24;
    var lbFootX  = lbThighX - ls * 0.12;
    elLegB.setAttribute('d',
      'M' + (BX - 2) + ',' + HIP_Y +
      ' Q' + (lbThighX - 2) + ',' + lbKneeY + ' ' + (lbFootX - 4) + ',' + (GY - 2) +
      ' L' + (lbFootX + 2) + ',' + (GY - 2) +
      ' Q' + (lbThighX + 2) + ',' + lbKneeY + ' ' + (BX + 2) + ',' + HIP_Y + ' Z'
    );
    elShoeB.setAttribute('d',
      'M' + (lbFootX - 5) + ',' + (GY - 1) +
      ' Q' + (lbFootX + 1) + ',' + (GY - 3) + ' ' + (lbFootX + 4) + ',' + (GY - 1) +
      ' Q' + (lbFootX + 5) + ',' + (GY + 2) + ' ' + (lbFootX + 2) + ',' + (GY + 3) +
      ' Q' + (lbFootX - 4) + ',' + (GY + 3) + ' ' + (lbFootX - 6) + ',' + (GY + 1) + ' Z'
    );

    // 前腕
    var afElbX  = BX + as;
    var afElbY  = SHO_Y + 20;
    var afHandX = afElbX + as * 0.2;
    var afHandY = afElbY + 16;
    elArmF.setAttribute('d',
      'M' + (BX + 3) + ',' + SHO_Y +
      ' Q' + (afElbX + 2) + ',' + afElbY + ' ' + (afHandX + 1) + ',' + afHandY
    );

    // 後腕
    var abElbX  = BX - as;
    var abElbY  = SHO_Y + 20;
    var abHandX = abElbX - as * 0.2;
    var abHandY = abElbY + 16;
    elArmB.setAttribute('d',
      'M' + (BX - 3) + ',' + SHO_Y +
      ' Q' + (abElbX - 2) + ',' + abElbY + ' ' + (abHandX - 1) + ',' + abHandY
    );

    // 上下の揺れ
    var bobY = Math.abs(Math.sin(ph * 2)) * 1.5;
    elPerson.setAttribute('transform', 'translate(' + offsetX + ',' + bobY + ')');
  }

  function walkLoop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    if (walking) {
      phase += dt * 5;
      offsetX += dt * 55;
      drawWalkPose(phase);
      if (offsetX >= targetX) {
        offsetX = targetX;
        walking = false;
        phase = 0;
        drawWalkPose(0);
        onReachDoor();
        return;
      }
    }
    rafId = requestAnimationFrame(walkLoop);
  }

  function walkLoopIn(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    if (walking) {
      phase += dt * 5;
      offsetX += dt * 48;
      drawWalkPose(phase);
      var progress = (offsetX - (targetX - 65)) / 65;
      elPerson.style.opacity = Math.max(1 - progress * 1.5, 0);
      if (offsetX >= targetX) { walking = false; return; }
    }
    rafId = requestAnimationFrame(walkLoopIn);
  }

  function onReachDoor() {
    // 扉を開く
    var d = document.getElementById('doorAnim');
    d.style.transition = 'transform 0.9s cubic-bezier(0.4,0,0.2,1)';
    d.style.transform  = 'perspective(700px) rotateY(-78deg)';
    document.getElementById('doorLight').style.opacity = '1';
    // 扉が開いてから中に入る
    setTimeout(function () {
      walking = true;
      targetX = offsetX + 65;
      lastTs = null;
      rafId = requestAnimationFrame(walkLoopIn);
    }, 1000);
    // フラッシュ
    setTimeout(function () {
      document.getElementById('flash').classList.add('on');
    }, 1900);
    setTimeout(function () {
      var fl = document.getElementById('flash');
      document.getElementById('topPage').classList.add('show');
      fl.classList.add('slow-out');
      fl.classList.remove('on');
      setTimeout(function () { fl.classList.remove('slow-out'); }, 2400);
      markEntered(); // ★ ここでセッションに「通過済み」を記録
    }, 3400);
  }

  function startAnim() {
    if (animating) return;
    animating = true;
    var arrow = document.getElementById('walkArrow');
    if (arrow) arrow.style.opacity = '0';
    targetX = 248;
    walking = true;
    lastTs = null;
    rafId = requestAnimationFrame(walkLoop);
  }

  // SVGクリックでスキップ
  function skipToTop() {
    if (!animating) return;
    cancelAnimationFrame(rafId);
    walking = false;
    elPerson.style.opacity = '0';
    document.getElementById('flash').classList.add('on');
    setTimeout(function () {
      var fl = document.getElementById('flash');
      document.getElementById('topPage').classList.add('show');
      fl.classList.add('slow-out');
      fl.classList.remove('on');
      setTimeout(function () { fl.classList.remove('slow-out'); }, 2400);
      markEntered(); // ★ スキップでも「通過済み」を記録
    }, 1500);
  }

  // ENTRANCE戻りボタン
  function goBack() {
    clearEntered(); // ★ 演出を再度見たい意思表示としてフラグを消す

    document.getElementById('mainsvg').style.display = '';
    document.getElementById('flash').style.display = '';
    document.getElementById('flash').classList.add('on');
    cancelAnimationFrame(rafId);

    setTimeout(function () {
      document.getElementById('topPage').classList.remove('show');
      walking = false;
      offsetX = START_OFFSET;
      phase = 0;
      lastTs = null;
      elPerson.style.opacity = 1;
      drawWalkPose(0);
      var d = document.getElementById('doorAnim');
      d.style.transition = 'transform .6s';
      d.style.transform  = 'perspective(700px) rotateY(0deg)';
      document.getElementById('doorLight').style.opacity = '0';
      var arrow = document.getElementById('walkArrow');
      if (arrow) arrow.style.opacity = '1';
      setTimeout(function () {
        document.getElementById('flash').classList.remove('on');
      }, 200);
      animating = false;
      setTimeout(startAnim, 1000);
    }, 400);
  }

  // 関数を SVG の onclick / button onclick から呼べるようにグローバル公開
  window.skipToTop = skipToTop;
  window.goBack = goBack;

  // ============================================================
  // 起動
  // ============================================================
  // ============================================================
  // 写真表示モード切替（開発用）
  // デフォルト: cover（画面いっぱいにトリミング）
  // ?photo=contain → 写真全体を表示（比較用）
  // ============================================================
  function applyPhotoMode() {
    var params = new URLSearchParams(location.search);
    var mode = params.get('photo');
    if (mode === 'contain') {
      document.getElementById('topPage').classList.add('photo-contain');
    }
  }

  // ============================================================
  // コンセプトセクション: スライドドット同期
  // ============================================================
  function setupSlideDots() {
    var dots = document.querySelectorAll('.slide-dots span');
    if (!dots.length) return;
    var current = 0;
    setInterval(function () {
      dots[current].classList.remove('active');
      current = (current + 1) % dots.length;
      dots[current].classList.add('active');
    }, 4000); // 20s / 5枚 = 4s
  }

  function init() {
    setupDate();
    setupPetals();
    bindPersonElements();
    applyPhotoMode();
    setupSlideDots();

    // 初期姿勢（ドア手前）
    offsetX = START_OFFSET;
    try {
      drawWalkPose(0);
    } catch (e) {
      // SVG要素が見つからない場合も安全に続行
    }

    if (hasEntered()) {
      // 既にエントランス通過済み → 演出スキップしてトップを直接表示
      document.getElementById('topPage').classList.add('show');
      var svg = document.getElementById('mainsvg');
      if (svg) svg.style.display = 'none';
    } else {
      // 初回 → 通常の演出開始
      setTimeout(startAnim, 3700);
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
