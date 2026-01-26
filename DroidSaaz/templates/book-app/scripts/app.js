// Book App - Minimal JS
(function() {
  'use strict';

  let data = null, config = null, page = 0, fontSize = 16;
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const [contentRes, configRes] = await Promise.all([
        fetch('content.json').catch(() => null),
        fetch('config.json').catch(() => null)
      ]);
      
      data = contentRes?.ok ? await contentRes.json() : {
        title: 'Sample Book', author: 'Author', chapters: [
          { id: 1, title: 'Chapter 1', content: '<p>Welcome to this book!</p>' }
        ]
      };
      
      config = configRes?.ok ? await configRes.json() : {
        theme: { primaryColor: '#2196F3', backgroundColor: '#FAFAFA', textColor: '#212121' },
        fonts: { heading: 'Roboto', body: 'Merriweather' }, direction: 'ltr'
      };
      
      applyConfig();
      render();
      bindEvents();
      $('loading').classList.add('hidden');
      $('app').classList.remove('hidden');
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  function applyConfig() {
    const r = document.documentElement.style;
    const t = config.theme || {};
    if (t.primaryColor) r.setProperty('--c-primary', t.primaryColor);
    if (t.backgroundColor) r.setProperty('--c-bg', t.backgroundColor);
    if (t.textColor) r.setProperty('--c-text', t.textColor);
    if (t.accentColor) r.setProperty('--c-accent', t.accentColor);
    
    const f = config.fonts || {};
    if (f.heading) r.setProperty('--font-heading', `'${f.heading}', sans-serif`);
    if (f.body) r.setProperty('--font-body', `'${f.body}', serif`);
    
    const dir = config.direction || data?.direction || 'ltr';
    document.body.setAttribute('dir', dir === 'auto' ? 'ltr' : dir);
  }

  function render() {
    // Cover
    $('bookTitle').textContent = data.title || 'Untitled';
    $('headerTitle').textContent = data.title || 'Book';
    $('bookAuthor').textContent = data.author ? `by ${data.author}` : '';
    
    if (data.cover) {
      $('coverImage').src = data.cover;
      $('coverImage').classList.remove('hidden');
    }
    if (data.fields?.dedication || data.dedication) {
      $('dedication').textContent = data.fields?.dedication || data.dedication;
      $('dedication').classList.remove('hidden');
    }

    // TOC
    const toc = $('tocList');
    toc.innerHTML = '<li class="px-5 py-3 border-b cursor-pointer transition hover:bg-black/50 active" data-page="0">Cover</li>';
    
    // Chapters
    const chapters = $('chapters');
    chapters.innerHTML = '';
    
    (data.chapters || []).forEach((ch, i) => {
      // TOC item
      const li = document.createElement('li');
      li.className = 'px-5 py-3 border-b cursor-pointer transition hover:bg-black/50';
      li.textContent = ch.title || `Chapter ${i + 1}`;
      li.dataset.page = i + 1;
      li.onclick = () => goTo(i + 1);
      toc.appendChild(li);
      
      // Chapter section
      const sec = document.createElement('section');
      sec.className = 'chapter hidden animate-fadeIn py-6';
      sec.id = `ch-${ch.id || i}`;
      
      const dir = ch.direction === 'inherit' ? (config?.direction || 'ltr') : (ch.direction || 'ltr');
      sec.setAttribute('dir', dir === 'auto' ? 'ltr' : dir);
      
      sec.innerHTML = `
        <h2 class="text-2xl font-bold text-primary mb-6 pb-3 border-b-2 border-primary">${ch.title || 'Chapter ' + (i + 1)}</h2>
        <div class="chapter-content">${ch.content || ''}</div>
      `;
      chapters.appendChild(sec);
    });

    toc.querySelector('[data-page="0"]').onclick = () => goTo(0);
    updateNav();
  }

  function bindEvents() {
    // Menu
    $('menuBtn').onclick = () => toggleSidebar(true);
    $('closeSidebar').onclick = () => toggleSidebar(false);
    $('overlay').onclick = () => { toggleSidebar(false); toggleSettings(false); };
    
    // Navigation
    $('startBtn').onclick = () => goTo(1);
    $('prevBtn').onclick = () => goTo(page - 1);
    $('nextBtn').onclick = () => goTo(page + 1);
    
    // Settings
    $('settingsBtn').onclick = () => toggleSettings(true);
    $('closeSettings').onclick = () => toggleSettings(false);
    
    // Font size
    $('fontDown').onclick = () => setFontSize(-2);
    $('fontUp').onclick = () => setFontSize(2);
    
    // Theme
    $$('.theme-btn').forEach(btn => {
      btn.onclick = () => setTheme(btn.dataset.theme);
    });
  }

  function toggleSidebar(open) {
    const sb = $('sidebar'), ov = $('overlay');
    if (open) {
      sb.classList.remove('-translate-x-full');
      sb.classList.add('translate-x-0');
      ov.classList.remove('hidden', 'opacity-0');
    } else {
      sb.classList.add('-translate-x-full');
      sb.classList.remove('translate-x-0');
      ov.classList.add('opacity-0');
      setTimeout(() => ov.classList.add('hidden'), 300);
    }
  }

  function toggleSettings(open) {
    const sp = $('settingsPanel'), ov = $('overlay');
    if (open) {
      sp.classList.remove('hidden', 'translate-y-full');
      sp.classList.add('translate-y-0');
      ov.classList.remove('hidden', 'opacity-0');
    } else {
      sp.classList.add('translate-y-full');
      sp.classList.remove('translate-y-0');
      setTimeout(() => sp.classList.add('hidden'), 300);
      ov.classList.add('opacity-0');
      setTimeout(() => ov.classList.add('hidden'), 300);
    }
  }

  function goTo(p) {
    const total = 1 + (data?.chapters?.length || 0);
    if (p < 0 || p >= total) return;
    page = p;
    
    // Hide all, show current
    $$('.chapter').forEach(el => el.classList.add('hidden'));
    if (p === 0) {
      $('coverPage').classList.remove('hidden');
    } else {
      $('coverPage').classList.add('hidden');
      const ch = data.chapters[p - 1];
      const el = $(`ch-${ch.id || p - 1}`);
      if (el) el.classList.remove('hidden');
    }
    
    // Update TOC active
    $$('#tocList li').forEach((li, i) => {
      li.classList.toggle('active', i === p);
    });
    
    updateNav();
    toggleSidebar(false);
    window.scrollTo(0, 0);
  }

  function updateNav() {
    const total = 1 + (data?.chapters?.length || 0);
    $('prevBtn').disabled = page === 0;
    $('nextBtn').disabled = page >= total - 1;
    $('pageNum').textContent = `${page + 1} / ${total}`;
  }

  function setFontSize(delta) {
    fontSize = Math.max(12, Math.min(24, fontSize + delta));
    document.documentElement.style.setProperty('--text-size', fontSize + 'px');
    $('fontSize').textContent = fontSize + 'px';
  }

  function setTheme(theme) {
    document.body.dataset.theme = theme;
    $$('.theme-btn').forEach(btn => {
      btn.classList.toggle('border-primary', btn.dataset.theme === theme);
    });
  }
})();

