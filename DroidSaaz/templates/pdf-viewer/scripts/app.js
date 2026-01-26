// PDF Viewer App
(function() {
    'use strict';

    // State
    let currentPage = 0;
    let totalPages = 0;
    let isThumbnailsOpen = false;
    let isFullscreen = false;

    // DOM Elements
    const pagesContainer = document.getElementById('pagesContainer');
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnThumbnails = document.getElementById('btnThumbnails');
    const btnFullscreen = document.getElementById('btnFullscreen');
    const thumbnailsPanel = document.getElementById('thumbnailsPanel');
    const btnCloseThumbnails = document.getElementById('btnCloseThumbnails');
    const thumbnailsGrid = document.getElementById('thumbnailsGrid');

    // Initialize
    function init() {
        const pages = document.querySelectorAll('.page');
        totalPages = pages.length;
        totalPagesEl.textContent = totalPages;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'overlay';
        document.body.appendChild(overlay);

        setupEventListeners();
        updateNavigation();
        observePages();
    }

    // Setup event listeners
    function setupEventListeners() {
        btnPrev.addEventListener('click', prevPage);
        btnNext.addEventListener('click', nextPage);
        btnThumbnails.addEventListener('click', toggleThumbnails);
        btnCloseThumbnails.addEventListener('click', closeThumbnails);
        btnFullscreen.addEventListener('click', toggleFullscreen);

        // Overlay click
        document.getElementById('overlay').addEventListener('click', closeThumbnails);

        // Thumbnail clicks
        thumbnailsGrid.addEventListener('click', (e) => {
            const thumbnail = e.target.closest('.thumbnail');
            if (thumbnail) {
                const pageIndex = parseInt(thumbnail.dataset.page);
                goToPage(pageIndex);
                closeThumbnails();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    prevPage();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                    nextPage();
                    break;
                case 'Escape':
                    if (isThumbnailsOpen) closeThumbnails();
                    if (isFullscreen) toggleFullscreen();
                    break;
            }
        });

        // Touch gestures
        let touchStartX = 0;
        let touchStartY = 0;

        pagesContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        pagesContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    nextPage();
                } else {
                    prevPage();
                }
            }
        });
    }

    // Observe page visibility for current page tracking
    function observePages() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    currentPage = parseInt(entry.target.dataset.page);
                    updateNavigation();
                    updateThumbnailActive();
                }
            });
        }, {
            root: pagesContainer,
            threshold: 0.5
        });

        document.querySelectorAll('.page').forEach(page => {
            observer.observe(page);
        });
    }

    // Navigation
    function prevPage() {
        if (currentPage > 0) {
            goToPage(currentPage - 1);
        }
    }

    function nextPage() {
        if (currentPage < totalPages - 1) {
            goToPage(currentPage + 1);
        }
    }

    function goToPage(pageIndex) {
        const pages = document.querySelectorAll('.page');
        if (pages[pageIndex]) {
            pages[pageIndex].scrollIntoView({ behavior: 'smooth' });
            currentPage = pageIndex;
            updateNavigation();
            updateThumbnailActive();
        }
    }

    function updateNavigation() {
        currentPageEl.textContent = currentPage + 1;
        btnPrev.disabled = currentPage === 0;
        btnNext.disabled = currentPage === totalPages - 1;
    }

    function updateThumbnailActive() {
        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentPage);
        });
    }

    // Thumbnails
    function toggleThumbnails() {
        isThumbnailsOpen ? closeThumbnails() : openThumbnails();
    }

    function openThumbnails() {
        isThumbnailsOpen = true;
        thumbnailsPanel.classList.add('open');
        document.getElementById('overlay').classList.add('visible');
        updateThumbnailActive();
        
        // Scroll to current thumbnail
        const activeThumbnail = thumbnailsGrid.querySelector('.thumbnail.active');
        if (activeThumbnail) {
            activeThumbnail.scrollIntoView({ block: 'center' });
        }
    }

    function closeThumbnails() {
        isThumbnailsOpen = false;
        thumbnailsPanel.classList.remove('open');
        document.getElementById('overlay').classList.remove('visible');
    }

    // Fullscreen
    function toggleFullscreen() {
        if (!isFullscreen) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    }

    function enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
        document.body.classList.add('fullscreen');
        isFullscreen = true;
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        document.body.classList.remove('fullscreen');
        isFullscreen = false;
    }

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
        isFullscreen = !!document.fullscreenElement;
        document.body.classList.toggle('fullscreen', isFullscreen);
    });

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();

