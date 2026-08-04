/* ═══════════════════════════════════════════════════════════════════════════
   B-31 — การ์ดข่าวคลิกได้ (design: plan/news_click_design_fable.md)
   ใช้ร่วมกันทั้ง index.html และ news.html · ไฟล์นี้ "คนเขียนครั้งเดียว" ท่อ publish-web ไม่แตะ

   🔴 ทำไมโหลด news_manifest.json ตอน "คลิกครั้งแรก" ไม่ใช่ฝังลงหน้า:
      งบที่ตกลงไว้คือ index โหลดแรก **+0 KB** — เนื้อข่าวเต็มกับรูปชุด 8 ใบต่อข่าว
      ถ้าฝังลง HTML จะกินน้ำหนักหน้าแรกของทุกคน ทั้งที่คนส่วนใหญ่ไม่ได้กดดูสักใบ
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var manifestPromise = null;
  function loadNews() {
    if (!manifestPromise) {
      manifestPromise = fetch('news_manifest.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : { items: [] }; })
        .catch(function () { return { items: [] }; });
    }
    return manifestPromise;
  }

  var lb = document.getElementById('nlb');
  if (!lb) return;
  var img = document.getElementById('nlbImg');
  var cap = document.getElementById('nlbCap');
  var meta = document.getElementById('nlbMeta');
  var body = document.getElementById('nlbBody');
  var dots = document.getElementById('nlbDots');
  var link = document.getElementById('nlbLink');
  var cur = null, idx = 0;

  function show() {
    var photos = (cur && cur.photos) || [];
    var multi = photos.length > 1;
    if (photos.length) {
      img.src = photos[idx].src;
      img.alt = photos[idx].alt || cur.title || '';
      img.style.display = '';
    } else {
      // ข่าว seed เก่าไม่มีชุดรูป — ใช้รูปปกใบเดียว ไม่ปล่อยกล่องว่าง
      img.src = cur.img || '';
      img.alt = cur.alt || cur.title || '';
      img.style.display = cur.img ? '' : 'none';
    }
    cap.textContent = photos.length ? (idx + 1) + ' / ' + photos.length : '';
    Array.prototype.forEach.call(dots.children, function (d, k) {
      d.className = k === idx ? 'on' : '';
    });
    Array.prototype.forEach.call(lb.querySelectorAll('.arw'), function (a) {
      a.style.display = multi ? '' : 'none';
    });
  }

  function open(item) {
    if (!item) return;
    cur = item; idx = 0;
    meta.textContent = (item.date_thai || '') + (item.title ? ' · ' + item.title : '');
    // body_html มาจากท่อซึ่ง escape มาแล้ว (เหลือแค่ <br>) — ไม่มี HTML ดิบจากแคปชั่นหลุดเข้ามา
    body.innerHTML = item.body_html || item.summary_html || '';
    var photos = item.photos || [];
    dots.innerHTML = photos.map(function (_, k) {
      return '<i data-k="' + k + '"' + (k === 0 ? ' class="on"' : '') + '></i>';
    }).join('');
    if (item.gallery_project) {
      link.href = 'gallery.html#' + encodeURIComponent(item.gallery_project);
      link.style.display = '';
    } else {
      link.style.display = 'none';
    }
    show();
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.x').focus();
  }

  function openById(id) {
    return loadNews().then(function (m) {
      var it = (m.items || []).filter(function (x) { return x.id === id; })[0];
      open(it);
      return !!it;
    });
  }

  function close() {
    lb.classList.remove('on');
    document.body.style.overflow = '';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }
  function nav(d) {
    var n = ((cur && cur.photos) || []).length;
    if (!n) return;
    idx = (idx + d + n) % n; show();
  }

  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  lb.querySelector('.x').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', function () { nav(-1); });
  lb.querySelector('.next').addEventListener('click', function () { nav(1); });
  dots.addEventListener('click', function (e) {
    var k = e.target && e.target.getAttribute('data-k');
    if (k !== null && k !== undefined) { idx = +k; show(); }
  });
  addEventListener('keydown', function (e) {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') nav(1);
    if (e.key === 'ArrowLeft') nav(-1);
  });

  // การ์ดข่าวถูก gen จากท่อ (มี data-news-id) — ผูก event ที่ container เดียว
  // ⇒ ท่อ regen การ์ดใหม่เมื่อไรก็ยังคลิกได้ ไม่ต้องผูกใหม่
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('[data-news-id]');
    if (card) { e.preventDefault(); openById(card.getAttribute('data-news-id')); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var card = e.target.closest && e.target.closest('[data-news-id]');
    if (card) { e.preventDefault(); openById(card.getAttribute('data-news-id')); }
  });

  // deep-link: news.html#<id> → เปิด lightbox ข่าวนั้นเอง (ที่อยู่ถาวรสำหรับแชร์ โดยไม่มีไฟล์รายข่าว)
  function fromHash() {
    var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (id) openById(id);
  }
  fromHash();
  addEventListener('hashchange', fromHash);
})();
