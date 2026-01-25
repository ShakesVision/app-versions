// Book App JavaScript
// Reads content.json and config.json to render the book

(function() {
    'use strict';

    // State
    let bookData = null;
    let configData = null;
    let currentPage = 0; // 0 = cover, 1+ = chapters
    let fontSize = 16;

    // DOM Elements
    const elements = {};

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        cacheElements();
        await loadData();
        applyConfig();
        renderBook();
        setupEventListeners();
        hideLoading();
    }

    function cacheElements() {
        elements.loading = document.getElementById('loading');
        elements.app = document.getElementById('app');
        elements.headerTitle = document.getElementById('headerTitle');
        elements.menuBtn = document.getElementById('menuBtn');
        elements.settingsBtn = document.getElementById('settingsBtn');
        elements.sidebar = document.getElementById('sidebar');
        elements.closeSidebar = document.getElementById('closeSidebar');
        elements.overlay = document.getElementById('overlay');
        elements.tocList = document.getElementById('tocList');
        elements.coverPage = document.getElementById('coverPage');
        elements.coverImage = document.getElementById('coverImage');
        elements.bookTitle = document.getElementById('bookTitle');
        elements.bookAuthor = document.getElementById('bookAuthor');
        elements.dedication = document.getElementById('dedication');
        elements.startReading = document.getElementById('startReading');
        elements.chapters = document.getElementById('chapters');
        elements.prevBtn = document.getElementById('prevBtn');
        elements.nextBtn = document.getElementById('nextBtn');
        elements.pageIndicator = document.getElementById('pageIndicator');
        elements.settingsPanel = document.getElementById('settingsPanel');
        elements.closeSettings = document.getElementById('closeSettings');
        elements.fontSmaller = document.getElementById('fontSmaller');
        elements.fontLarger = document.getElementById('fontLarger');
        elements.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    }

    async function loadData() {
        try {
            // Load content
            const contentResponse = await fetch('content.json');
            if (contentResponse.ok) {
                bookData = await contentResponse.json();
            } else {
                // Demo content for testing
                bookData = {
                    title: 'Sample Book',
                    author: 'Author Name',
                    direction: 'ltr',
                    chapters: [
                        { id: 1, title: 'Introduction', content: '<p>Welcome to this book!</p>', direction: 'inherit' }
                    ]
                };
            }

            // Load config
            const configResponse = await fetch('config.json');
            if (configResponse.ok) {
                configData = await configResponse.json();
            } else {
                // Default config
                configData = {
                    theme: {
                        primaryColor: '#2196F3',
                        backgroundColor: '#FAFAFA',
                        textColor: '#212121',
                        accentColor: '#FF5722'
                    },
                    fonts: {
                        heading: 'Roboto',
                        body: 'Merriweather'
                    },
                    direction: 'ltr'
                };
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function applyConfig() {
        if (!configData) return;

        const root = document.documentElement;
        const theme = configData.theme;
        const fonts = configData.fonts;

        // Apply colors
        if (theme) {
            root.style.setProperty('--primary-color', theme.primaryColor);
            root.style.setProperty('--background-color', theme.backgroundColor);
            root.style.setProperty('--text-color', theme.textColor);
            root.style.setProperty('--accent-color', theme.accentColor);
        }

        // Apply fonts
        if (fonts) {
            root.style.setProperty('--heading-font', `'${fonts.heading}', sans-serif`);
            root.style.setProperty('--body-font', `'${fonts.body}', serif`);
        }

        // Apply direction
        const direction = configData.direction || bookData?.direction || 'ltr';
        document.body.setAttribute('dir', direction === 'auto' ? 'ltr' : direction);
    }

    function renderBook() {
        if (!bookData) return;

        // Cover
        elements.bookTitle.textContent = bookData.title || 'Untitled';
        elements.headerTitle.textContent = bookData.title || 'Book';
        elements.bookAuthor.textContent = bookData.author ? `by ${bookData.author}` : '';

        if (bookData.cover) {
            elements.coverImage.src = bookData.cover;
            elements.coverImage.classList.remove('hidden');
        }

        if (bookData.fields?.dedication) {
            elements.dedication.textContent = bookData.fields.dedication;
            elements.dedication.classList.remove('hidden');
        }

        // Table of Contents
        elements.tocList.innerHTML = '';
        const coverLi = document.createElement('li');
        coverLi.textContent = 'Cover';
        coverLi.onclick = () => goToPage(0);
        elements.tocList.appendChild(coverLi);

        // Chapters
        elements.chapters.innerHTML = '';
        if (bookData.chapters) {
            bookData.chapters.forEach((chapter, index) => {
                // TOC entry
                const li = document.createElement('li');
                li.textContent = chapter.title || `Chapter ${index + 1}`;
                li.onclick = () => goToPage(index + 1);
                elements.tocList.appendChild(li);

                // Chapter content
                const section = document.createElement('section');
                section.className = 'chapter page hidden';
                section.id = `chapter-${chapter.id}`;

                // Apply chapter direction if specified
                const chapterDir = chapter.direction === 'inherit' ? 
                    (configData?.direction || 'ltr') : 
                    (chapter.direction || 'ltr');
                section.setAttribute('dir', chapterDir === 'auto' ? 'ltr' : chapterDir);

                section.innerHTML = `
                    <h2>${chapter.title || 'Chapter ' + (index + 1)}</h2>
                    <div class="chapter-content">${chapter.content}</div>
                `;

                elements.chapters.appendChild(section);
            });
        }

        // Update navigation
        updateNavigation();
    }

    function setupEventListeners() {
        // Menu
        elements.menuBtn.onclick = openSidebar;
        elements.closeSidebar.onclick = closeSidebar;
        elements.overlay.onclick = () => {
            closeSidebar();
            closeSettings();
        };

        // Navigation
        elements.startReading.onclick = () => goToPage(1);
        elements.prevBtn.onclick = () => goToPage(currentPage - 1);
        elements.nextBtn.onclick = () => goToPage(currentPage + 1);

        // Settings
        elements.settingsBtn.onclick = openSettings;
        elements.closeSettings.onclick = closeSettings;

        // Font size
        elements.fontSmaller.onclick = () => changeFontSize(-2);
        elements.fontLarger.onclick = () => changeFontSize(2);

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => setTheme(btn.dataset.theme);
        });
    }

    function openSidebar() {
        elements.sidebar.classList.add('open');
        elements.sidebar.classList.remove('hidden');
        elements.overlay.classList.add('open');
        elements.overlay.classList.remove('hidden');
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('open');
        elements.overlay.classList.remove('open');
        setTimeout(() => {
            elements.sidebar.classList.add('hidden');
            elements.overlay.classList.add('hidden');
        }, 300);
    }

    function openSettings() {
        elements.settingsPanel.classList.add('open');
        elements.settingsPanel.classList.remove('hidden');
    }

    function closeSettings() {
        elements.settingsPanel.classList.remove('open');
        setTimeout(() => {
            elements.settingsPanel.classList.add('hidden');
        }, 300);
    }

    function goToPage(page) {
        const totalPages = 1 + (bookData?.chapters?.length || 0);
        if (page < 0 || page >= totalPages) return;

        currentPage = page;

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

        // Show current page
        if (page === 0) {
            elements.coverPage.classList.remove('hidden');
        } else {
            const chapterId = bookData.chapters[page - 1].id;
            const chapterEl = document.getElementById(`chapter-${chapterId}`);
            if (chapterEl) chapterEl.classList.remove('hidden');
        }

        // Update TOC
        const tocItems = elements.tocList.querySelectorAll('li');
        tocItems.forEach((li, i) => {
            li.classList.toggle('active', i === page);
        });

        // Update navigation
        updateNavigation();
        closeSidebar();

        // Scroll to top
        window.scrollTo(0, 0);
    }

    function updateNavigation() {
        const totalPages = 1 + (bookData?.chapters?.length || 0);
        
        elements.prevBtn.disabled = currentPage === 0;
        elements.nextBtn.disabled = currentPage >= totalPages - 1;
        elements.pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
    }

    function changeFontSize(delta) {
        fontSize = Math.max(12, Math.min(24, fontSize + delta));
        document.documentElement.style.setProperty('--font-size', fontSize + 'px');
        elements.fontSizeDisplay.textContent = fontSize + 'px';
    }

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    function hideLoading() {
        elements.loading.classList.add('hidden');
        elements.app.classList.remove('hidden');
    }
})();

