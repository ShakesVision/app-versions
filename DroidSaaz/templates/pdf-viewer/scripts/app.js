/**
 * PDF/Image Viewer App
 * A lightweight, feature-rich document viewer for image-based documents
 */

(function() {
  'use strict';

  // ============= Configuration =============
  let config = {
    title: 'Document',
    author: '',
    description: '',
    cover: '',
    pages: [],
    settings: {
      showPageNumbers: true,
      showThumbnails: true,
      enableZoom: true,
      rememberPage: true
    },
    direction: 'ltr'
  };

  // ============= State =============
  let state = {
    currentPage: 0,
    totalPages: 0,
    zoom: 1,
    minZoom: 0.5,
    maxZoom: 3,
    bookmarks: [],
    theme: 'light',
    isReading: false
  };

  // ============= DOM Elements =============
  const $ = id => document.getElementById(id);
  const elements = {};

  // ============= Initialization =============
  async function init() {
    try {
      await loadConfig();
      cacheElements();
      setupEventListeners();
      loadSavedState();
      renderApp();
      hideLoading();
    } catch (error) {
      console.error('Initialization error:', error);
      hideLoading();
      showError('Failed to load document');
    }
  }

  async function loadConfig() {
    try {
      const response = await fetch('content.json');
      if (response.ok) {
        const data = await response.json();
        config = { ...config, ...data };
      }
    } catch (e) {
      console.log('Using default config');
    }

    // Process pages
    if (config.pages && config.pages.length > 0) {
      state.totalPages = config.pages.length;
    }

    // Set direction
    if (config.direction === 'rtl') {
      document.documentElement.setAttribute('dir', 'rtl');
    }
  }

  function cacheElements() {
    const ids = [
      'app', 'loading', 'header', 'headerTitle', 'menuBtn', 'thumbnailBtn',
      'settingsBtn', 'sidebar', 'closeSidebar', 'thumbnailList', 'overlay',
      'viewer', 'coverPage', 'coverImage', 'bookTitle', 'bookAuthor',
      'bookDescription', 'startBtn', 'pageContainer', 'pageWrapper',
      'currentPage', 'navbar', 'prevBtn', 'nextBtn', 'pageInput', 'pageTotal',
      'settingsPanel', 'closeSettings', 'zoomOut', 'zoomIn', 'zoomFit',
      'zoomLevel', 'fullscreenBtn', 'bookmarkBtn', 'bookmarkList',
      'bookmarkSection', 'zoomIndicator'
    ];
    
    ids.forEach(id => {
      elements[id] = $(id);
    });
  }

  function setupEventListeners() {
    // Menu / Sidebar
    elements.menuBtn.addEventListener('click', openSidebar);
    elements.closeSidebar.addEventListener('click', closeSidebar);
    elements.overlay.addEventListener('click', closeAllPanels);
    
    // Thumbnails
    elements.thumbnailBtn.addEventListener('click', openSidebar);
    
    // Settings
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettings);
    
    // Navigation
    elements.startBtn.addEventListener('click', startReading);
    elements.prevBtn.addEventListener('click', prevPage);
    elements.nextBtn.addEventListener('click', nextPage);
    elements.pageInput.addEventListener('change', handlePageInput);
    elements.pageInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handlePageInput();
    });
    
    // Zoom
    elements.zoomOut.addEventListener('click', () => changeZoom(-0.25));
    elements.zoomIn.addEventListener('click', () => changeZoom(0.25));
    elements.zoomFit.addEventListener('click', resetZoom);
    
    // Fullscreen
    elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Bookmarks
    elements.bookmarkBtn.addEventListener('click', addBookmark);
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
    
    // Swipe gestures
    setupSwipeGestures();
    
    // Pinch zoom
    if (config.settings.enableZoom) {
      setupPinchZoom();
    }
  }

  function loadSavedState() {
    try {
      // Load theme
      const savedTheme = localStorage.getItem('pdf-theme');
      if (savedTheme) {
        state.theme = savedTheme;
        setTheme(savedTheme, false);
      }
      
      // Load bookmarks
      const savedBookmarks = localStorage.getItem('pdf-bookmarks');
      if (savedBookmarks) {
        state.bookmarks = JSON.parse(savedBookmarks);
      }
      
      // Load last page
      if (config.settings.rememberPage) {
        const savedPage = localStorage.getItem('pdf-current-page');
        if (savedPage) {
          state.currentPage = parseInt(savedPage, 10);
          if (state.currentPage >= state.totalPages) {
            state.currentPage = 0;
          }
        }
      }
    } catch (e) {
      console.log('Error loading saved state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem('pdf-theme', state.theme);
      localStorage.setItem('pdf-bookmarks', JSON.stringify(state.bookmarks));
      if (config.settings.rememberPage) {
        localStorage.setItem('pdf-current-page', state.currentPage.toString());
      }
    } catch (e) {
      console.log('Error saving state:', e);
    }
  }

  // ============= Rendering =============
  function renderApp() {
    // Set title
    elements.headerTitle.textContent = config.title;
    elements.bookTitle.textContent = config.title;
    document.title = config.title;
    
    // Set author
    if (config.author) {
      elements.bookAuthor.textContent = 'by ' + config.author;
    }
    
    // Set description
    if (config.description) {
      elements.bookDescription.textContent = config.description;
    }
    
    // Set cover
    if (config.cover) {
      elements.coverImage.src = config.cover;
      elements.coverImage.classList.remove('hidden');
    }
    
    // Set page total
    elements.pageTotal.textContent = '/ ' + state.totalPages;
    elements.pageInput.max = state.totalPages;
    
    // Render thumbnails
    renderThumbnails();
    
    // Render bookmarks
    renderBookmarks();
    
    // If no pages, hide start button
    if (state.totalPages === 0) {
      elements.startBtn.style.display = 'none';
    }
    
    // Check if we should auto-start (returning reader)
    if (state.currentPage > 0 && config.settings.rememberPage) {
      startReading();
    }
  }

  function renderThumbnails() {
    if (!config.settings.showThumbnails || !config.pages) return;
    
    elements.thumbnailList.innerHTML = '';
    
    config.pages.forEach((page, index) => {
      const item = document.createElement('div');
      item.className = 'thumbnail-item' + (index === state.currentPage ? ' active' : '');
      item.innerHTML = `
        <img src="${page.image}" alt="Page ${index + 1}" loading="lazy">
        <span class="page-num">${index + 1}</span>
      `;
      item.addEventListener('click', () => goToPage(index));
      elements.thumbnailList.appendChild(item);
    });
  }

  function updateThumbnailActive() {
    const items = elements.thumbnailList.querySelectorAll('.thumbnail-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === state.currentPage);
    });
    
    // Scroll active thumbnail into view
    const activeItem = items[state.currentPage];
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderBookmarks() {
    if (state.bookmarks.length === 0) {
      elements.bookmarkSection.classList.add('hidden');
      return;
    }
    
    elements.bookmarkSection.classList.remove('hidden');
    elements.bookmarkList.innerHTML = '';
    
    state.bookmarks.forEach((pageNum, index) => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.innerHTML = `
        <span>Page ${pageNum + 1}${config.pages[pageNum]?.label ? ' - ' + config.pages[pageNum].label : ''}</span>
        <button class="bookmark-delete" data-index="${index}">
          <svg width="16" height="16" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      `;
      item.querySelector('span').addEventListener('click', () => {
        goToPage(pageNum);
        closeSettings();
      });
      item.querySelector('.bookmark-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        removeBookmark(index);
      });
      elements.bookmarkList.appendChild(item);
    });
  }

  // ============= Navigation =============
  function startReading() {
    state.isReading = true;
    elements.coverPage.classList.add('hidden');
    elements.pageContainer.classList.remove('hidden');
    elements.navbar.classList.remove('hidden');
    loadPage(state.currentPage);
  }

  function loadPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= state.totalPages) return;
    
    state.currentPage = pageIndex;
    const page = config.pages[pageIndex];
    
    // Load image
    elements.currentPage.src = page.image;
    
    // Update UI
    elements.pageInput.value = pageIndex + 1;
    elements.prevBtn.disabled = pageIndex === 0;
    elements.nextBtn.disabled = pageIndex === state.totalPages - 1;
    
    // Update thumbnails
    updateThumbnailActive();
    
    // Reset zoom
    resetZoom();
    
    // Save state
    saveState();
  }

  function goToPage(pageIndex) {
    if (!state.isReading) {
      state.currentPage = pageIndex;
      startReading();
    } else {
      loadPage(pageIndex);
    }
    closeSidebar();
  }

  function prevPage() {
    if (state.currentPage > 0) {
      loadPage(state.currentPage - 1);
    }
  }

  function nextPage() {
    if (state.currentPage < state.totalPages - 1) {
      loadPage(state.currentPage + 1);
    }
  }

  function handlePageInput() {
    const value = parseInt(elements.pageInput.value, 10);
    if (value >= 1 && value <= state.totalPages) {
      loadPage(value - 1);
    } else {
      elements.pageInput.value = state.currentPage + 1;
    }
  }

  // ============= Zoom =============
  function changeZoom(delta) {
    const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.zoom + delta));
    setZoom(newZoom);
  }

  function setZoom(zoom) {
    state.zoom = zoom;
    elements.pageWrapper.style.transform = `scale(${zoom})`;
    elements.zoomLevel.textContent = Math.round(zoom * 100) + '%';
    showZoomIndicator();
  }

  function resetZoom() {
    setZoom(1);
  }

  function showZoomIndicator() {
    elements.zoomIndicator.textContent = Math.round(state.zoom * 100) + '%';
    elements.zoomIndicator.classList.add('visible');
    elements.zoomIndicator.classList.remove('hidden');
    
    clearTimeout(state.zoomIndicatorTimeout);
    state.zoomIndicatorTimeout = setTimeout(() => {
      elements.zoomIndicator.classList.remove('visible');
    }, 1000);
  }

  // ============= Panels =============
  function openSidebar() {
    elements.sidebar.classList.add('open');
    elements.overlay.classList.remove('hidden');
    setTimeout(() => elements.overlay.classList.add('visible'), 10);
  }

  function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.overlay.classList.remove('visible');
    setTimeout(() => elements.overlay.classList.add('hidden'), 300);
  }

  function openSettings() {
    elements.settingsPanel.classList.remove('hidden');
    setTimeout(() => elements.settingsPanel.classList.add('open'), 10);
    elements.overlay.classList.remove('hidden');
    setTimeout(() => elements.overlay.classList.add('visible'), 10);
  }

  function closeSettings() {
    elements.settingsPanel.classList.remove('open');
    elements.overlay.classList.remove('visible');
    setTimeout(() => {
      elements.settingsPanel.classList.add('hidden');
      elements.overlay.classList.add('hidden');
    }, 300);
  }

  function closeAllPanels() {
    closeSidebar();
    closeSettings();
  }

  // ============= Theme =============
  function setTheme(theme, save = true) {
    state.theme = theme;
    document.body.setAttribute('data-theme', theme);
    
    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    if (save) saveState();
  }

  // ============= Fullscreen =============
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.() ||
      document.documentElement.webkitRequestFullscreen?.() ||
      document.documentElement.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
    }
  }

  // ============= Bookmarks =============
  function addBookmark() {
    if (!state.isReading) return;
    
    if (!state.bookmarks.includes(state.currentPage)) {
      state.bookmarks.push(state.currentPage);
      state.bookmarks.sort((a, b) => a - b);
      saveState();
      renderBookmarks();
      
      // Visual feedback
      elements.bookmarkBtn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        elements.bookmarkBtn.style.transform = '';
      }, 200);
    }
  }

  function removeBookmark(index) {
    state.bookmarks.splice(index, 1);
    saveState();
    renderBookmarks();
  }

  // ============= Gestures =============
  function setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let distX = 0;
    let distY = 0;
    const threshold = 50;
    const restraint = 100;
    
    elements.pageContainer.addEventListener('touchstart', e => {
      const touch = e.changedTouches[0];
      startX = touch.pageX;
      startY = touch.pageY;
    }, { passive: true });
    
    elements.pageContainer.addEventListener('touchend', e => {
      const touch = e.changedTouches[0];
      distX = touch.pageX - startX;
      distY = touch.pageY - startY;
      
      // Only process single touch
      if (e.changedTouches.length !== 1) return;
      
      // Check if horizontal swipe
      if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
        if (distX > 0) {
          // Swipe right
          config.direction === 'rtl' ? nextPage() : prevPage();
        } else {
          // Swipe left
          config.direction === 'rtl' ? prevPage() : nextPage();
        }
      }
    }, { passive: true });
  }

  function setupPinchZoom() {
    let initialDistance = 0;
    let initialZoom = 1;
    
    elements.pageContainer.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialZoom = state.zoom;
      }
    }, { passive: true });
    
    elements.pageContainer.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, initialZoom * scale));
        setZoom(newZoom);
      }
    }, { passive: true });
  }

  function getDistance(touch1, touch2) {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ============= Keyboard =============
  function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.key) {
      case 'ArrowLeft':
        config.direction === 'rtl' ? nextPage() : prevPage();
        break;
      case 'ArrowRight':
        config.direction === 'rtl' ? prevPage() : nextPage();
        break;
      case 'ArrowUp':
        prevPage();
        break;
      case 'ArrowDown':
        nextPage();
        break;
      case 'Home':
        goToPage(0);
        break;
      case 'End':
        goToPage(state.totalPages - 1);
        break;
      case 'Escape':
        closeAllPanels();
        break;
      case '+':
      case '=':
        changeZoom(0.25);
        break;
      case '-':
        changeZoom(-0.25);
        break;
      case '0':
        resetZoom();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'b':
        addBookmark();
        break;
    }
  }

  // ============= Utilities =============
  function hideLoading() {
    elements.loading.classList.add('hidden');
    elements.app.classList.remove('hidden');
  }

  function showError(message) {
    elements.bookTitle.textContent = 'Error';
    elements.bookDescription.textContent = message;
    elements.startBtn.style.display = 'none';
  }

  // ============= Start =============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

