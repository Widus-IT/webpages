/* =====================================================================
   Widus IT — 대외 신인도 커버플로우 슬라이더
   가운데 크게 / 양옆 작게 · 우측으로 자동 슬라이드(무한 반복) · 원본 확대
   ===================================================================== */
(function () {
  function initCoverflow(root) {
    var viewport = root.querySelector('.widus-cflow-viewport');
    var stage = root.querySelector('.widus-cflow-stage');
    var capEl = root.querySelector('.widus-cflow-caption');
    var dotsEl = root.querySelector('.widus-cflow-dots');

    var originals = Array.prototype.slice.call(stage.querySelectorAll('.widus-cflow-slide'));
    var data = originals.map(function (s) {
      return { src: s.getAttribute('data-src'), title: s.getAttribute('data-title') || '', meta: s.getAttribute('data-meta') || '' };
    });
    var n = data.length;
    if (!n) return;

    var interval = parseInt(root.getAttribute('data-interval'), 10) || 5000;
    var COPIES = 7;
    var JUMP = (COPIES - 2) * n;

    // 슬라이드 다수 복제(무한 루프용)
    stage.innerHTML = '';
    var slides = [];
    for (var c = 0; c < COPIES; c++) {
      for (var i = 0; i < n; i++) {
        (function (di) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'widus-cflow-slide';
          b.setAttribute('data-i', di);
          b.setAttribute('aria-label', data[di].title + ' 원본 보기');
          var img = document.createElement('img');
          img.src = data[di].src;
          img.alt = data[di].title;
          img.draggable = false;
          b.appendChild(img);
          b.addEventListener('click', function () { onClick(slides.indexOf(b)); });
          stage.appendChild(b);
          slides.push(b);
        })(i);
      }
    }
    var total = slides.length;
    var pointer = n;
    var W = 240, spacing = 150;

    function measure() {
      var vw = viewport.clientWidth || 320;
      W = Math.max(140, Math.min(174, vw * 0.46));
      spacing = W * 0.62;
      root.style.setProperty('--cflow-w', W + 'px');
      stage.style.height = Math.round(W * 1.349 + 16) + 'px';
    }

    function mod(a, m) { return ((a % m) + m) % m; }

    function render(animate) {
      for (var idx = 0; idx < slides.length; idx++) {
        var el = slides[idx];
        var off = idx - pointer;
        var a = Math.abs(off);
        var x = off * spacing;
        var scale = off === 0 ? 1 : (a === 1 ? 0.8 : 0.66);
        var op = a === 0 ? 1 : (a === 1 ? 0.6 : 0);
        el.style.transition = animate ? '' : 'none';
        el.style.transform = 'translate(calc(-50% + ' + x + 'px), -50%) scale(' + scale + ')';
        el.style.opacity = op;
        el.style.zIndex = String(100 - a);
        el.style.pointerEvents = a <= 1 ? 'auto' : 'none';
        if (off === 0) el.classList.add('is-center'); else el.classList.remove('is-center');
      }
      var d = data[mod(pointer, n)];
      if (capEl) {
        capEl.querySelector('strong').textContent = d.title;
        capEl.querySelector('span').textContent = d.meta;
      }
      if (dotsEl) {
        var act = mod(pointer, n);
        var ch = dotsEl.children;
        for (var k = 0; k < ch.length; k++) {
          if (k === act) ch[k].classList.add('is-active'); else ch[k].classList.remove('is-active');
        }
      }
    }

    function step() {
      if (pointer + 1 > total - 1 - n) { pointer -= JUMP; render(false); void stage.offsetWidth; }
      pointer += 1;
      render(true);
    }

    var timer = null;
    function play() { stop(); timer = setInterval(step, interval); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function onClick(idx) {
      var off = idx - pointer;
      if (off === 0) { openLightbox(data[mod(pointer, n)]); }
      else { pointer = idx; render(true); play(); }
    }

    // dots
    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (var di = 0; di < n; di++) {
        (function (target) {
          var dt = document.createElement('button');
          dt.type = 'button';
          dt.setAttribute('aria-label', data[target].title);
          dt.addEventListener('click', function () {
            var best = pointer, bestDist = Infinity;
            for (var s = 0; s < slides.length; s++) {
              if (+slides[s].getAttribute('data-i') === target) {
                var dist = Math.abs(s - pointer);
                if (dist < bestDist) { bestDist = dist; best = s; }
              }
            }
            pointer = best; render(true); play();
          });
          dotsEl.appendChild(dt);
        })(di);
      }
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); render(false); void stage.offsetWidth; render(true); }, 120);
    });

    measure();
    render(false);
    void stage.offsetWidth;
    render(true);
    play();
  }

  // ---- 공용 라이트박스(원본 확대) ----
  var lb;
  function openLightbox(d) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'widus-cflow-lightbox';
      lb.innerHTML =
        '<button type="button" class="widus-cflow-lightbox-close" aria-label="닫기">&times;</button>' +
        '<figure><img alt="인증서 원본"><figcaption></figcaption></figure>';
      lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('widus-cflow-lightbox-close')) closeLightbox();
      });
      document.body.appendChild(lb);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
    }
    lb.querySelector('img').src = d.src;
    lb.querySelector('img').alt = d.title;
    lb.querySelector('figcaption').textContent = d.title;
    lb.classList.add('is-open');
  }
  function closeLightbox() { if (lb) lb.classList.remove('is-open'); }

  function boot() {
    var nodes = document.querySelectorAll('.widus-cflow');
    for (var i = 0; i < nodes.length; i++) initCoverflow(nodes[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
