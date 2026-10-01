(function () {
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // Font size controls
  var size = document.getElementById('size'), box = document.getElementById('sizeBox');
  function setSize(n) {
    n = Math.max(14, Math.min(26, +n || 18));
    root.style.setProperty('--fs', n);
    if (size) size.value = n;
    if (box) box.value = n;
    store.set('ml-fs', n);
  }
  setSize(store.get('ml-fs') || 18);
  if (size && box) {
    size.oninput = function () { setSize(size.value); };
    box.onchange = function () { setSize(box.value); };
  }

  var decBtn = document.getElementById('dec');
  var incBtn = document.getElementById('inc');
  if (decBtn) decBtn.onclick = function () { setSize(+size.value - 1); };
  if (incBtn) incBtn.onclick = function () { setSize(+size.value + 1); };

  // Reading progress
  var bar = document.getElementById('progress');
  if (bar) {
    addEventListener('scroll', function () {
      var max = root.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    }, { passive: true });
  }

  // Index tree: expand / collapse
  document.querySelectorAll('.index .tg').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); // prevent sidebar toggle
      var kids = btn.closest('li').querySelector(':scope > .kids');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      kids.hidden = open;
    });
  });

  // Sidebar collapse/expand functionality
  var wrap = document.querySelector('.wrap');
  var indexAside = document.getElementById('sidebarIndex');
  var closeBtn = document.getElementById('sidebarCloseBtn');
  var toggleBtn = document.getElementById('sidebarToggle');
  var hoverExpanded = false;

  if (wrap && indexAside) {
    // Minimize button inside the header
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        wrap.classList.add('collapsed');
        hoverExpanded = false;
      });
    }

    // Toggle strip click (when collapsed)
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        wrap.classList.toggle('collapsed');
        hoverExpanded = false;
      });
    }

    // Clicking anywhere on the collapsed bar expands it
    indexAside.addEventListener('click', function (e) {
      if (wrap.classList.contains('collapsed')) {
        wrap.classList.remove('collapsed');
      }
      if (hoverExpanded) {
        hoverExpanded = false; // Make the expansion permanent
      }
    });

    // Hover to expand when collapsed
    indexAside.addEventListener('mouseenter', function () {
      if (wrap.classList.contains('collapsed')) {
        hoverExpanded = true;
        wrap.classList.remove('collapsed');
      }
    });

    // Collapse it back when mouse leaves if it was expanded via hover
    indexAside.addEventListener('mouseleave', function () {
      if (hoverExpanded) {
        wrap.classList.add('collapsed');
        hoverExpanded = false;
      }
    });
  }
})();