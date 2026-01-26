/**
 * Restaurant & Shop Template
 * Digital menu and catalog app
 */

// App state
let appData = {
    name: '',
    tagline: '',
    logo: '',
    cover: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    mapUrl: '',
    hours: '',
    menu: [],
    gallery: [],
    social: {}
};

let currentCategory = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
    setupTabs();
});

/**
 * Load content from content.json
 */
async function loadContent() {
    try {
        const response = await fetch('content.json');
        const data = await response.json();
        
        // Map data
        appData = {
            name: data.fields?.name || data.name || 'Business Name',
            tagline: data.fields?.tagline || data.tagline || '',
            logo: data.fields?.logo || data.logo || '',
            cover: data.fields?.cover || data.cover || '',
            description: data.fields?.description || data.description || '',
            phone: data.fields?.phone || data.phone || '',
            whatsapp: data.fields?.whatsapp || data.whatsapp || '',
            email: data.fields?.email || data.email || '',
            address: data.fields?.address || data.address || '',
            mapUrl: data.fields?.mapUrl || data.mapUrl || '',
            hours: data.fields?.hours || data.hours || '',
            menu: data.chapters || data.menu || [],
            gallery: parseGallery(data.fields?.gallery || data.gallery),
            social: {
                instagram: data.fields?.instagram || data.instagram || '',
                facebook: data.fields?.facebook || data.facebook || '',
                twitter: data.fields?.twitter || data.twitter || '',
                tiktok: data.fields?.tiktok || data.tiktok || '',
                youtube: data.fields?.youtube || data.youtube || '',
                website: data.fields?.website || data.website || ''
            }
        };

        // Apply customization
        if (data.customization) {
            applyCustomization(data.customization);
        }

        // Render content
        renderHero();
        renderQuickActions();
        renderMenu();
        renderAbout();
        renderGallery();
        renderContact();
        
    } catch (error) {
        console.error('Failed to load content:', error);
        showError();
    }
}

/**
 * Parse gallery data (can be array of strings or array of objects)
 */
function parseGallery(gallery) {
    if (!gallery) return [];
    if (typeof gallery === 'string') {
        try {
            return JSON.parse(gallery);
        } catch {
            return [gallery];
        }
    }
    return Array.isArray(gallery) ? gallery : [];
}

/**
 * Apply customization (colors, fonts, direction)
 */
function applyCustomization(customization) {
    const root = document.documentElement;
    
    // Colors
    if (customization.colors) {
        Object.entries(customization.colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }
    
    // Fonts
    if (customization.fonts) {
        if (customization.fonts.heading) {
            root.style.setProperty('--font-heading', `'${customization.fonts.heading}', serif`);
        }
        if (customization.fonts.body) {
            root.style.setProperty('--font-body', `'${customization.fonts.body}', sans-serif`);
        }
    }
    
    // Direction
    if (customization.direction && customization.direction !== 'auto') {
        document.body.setAttribute('dir', customization.direction);
    }
}

/**
 * Render hero section
 */
function renderHero() {
    document.getElementById('pageTitle').textContent = appData.name;
    document.getElementById('businessName').textContent = appData.name;
    document.getElementById('tagline').textContent = appData.tagline;
    
    const logoImg = document.getElementById('logoImage');
    if (appData.logo) {
        logoImg.src = appData.logo;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }
    
    const coverImg = document.getElementById('coverImage');
    if (appData.cover) {
        coverImg.src = appData.cover;
    }
}

/**
 * Render quick action buttons
 */
function renderQuickActions() {
    const btnCall = document.getElementById('btnCall');
    const btnWhatsApp = document.getElementById('btnWhatsApp');
    const btnMap = document.getElementById('btnMap');
    
    btnCall.style.display = appData.phone ? '' : 'none';
    btnWhatsApp.style.display = appData.whatsapp ? '' : 'none';
    btnMap.style.display = appData.mapUrl ? '' : 'none';
}

/**
 * Render menu items with category filter
 */
function renderMenu() {
    const container = document.getElementById('menuItems');
    const filterContainer = document.getElementById('categoryFilter');
    
    if (!appData.menu || appData.menu.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">restaurant_menu</span>
                <p>No menu items yet</p>
            </div>
        `;
        return;
    }
    
    // Get unique categories
    const categories = [...new Set(appData.menu.map(item => 
        item.fields?.category || item.category || 'Other'
    ).filter(c => c))];
    
    // Render category filter
    if (categories.length > 1) {
        filterContainer.innerHTML = `
            <button class="category-chip active" data-category="all">All</button>
            ${categories.map(cat => `
                <button class="category-chip" data-category="${cat}">${cat}</button>
            `).join('')}
        `;
        
        // Add filter click handlers
        filterContainer.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                filterContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentCategory = chip.dataset.category;
                renderMenuItems();
            });
        });
    }
    
    renderMenuItems();
}

/**
 * Render filtered menu items
 */
function renderMenuItems() {
    const container = document.getElementById('menuItems');
    
    const filteredItems = currentCategory === 'all' 
        ? appData.menu 
        : appData.menu.filter(item => 
            (item.fields?.category || item.category || 'Other') === currentCategory
        );
    
    container.innerHTML = filteredItems.map(item => {
        const name = item.fields?.name || item.name || item.title || 'Item';
        const description = item.fields?.description || item.description || '';
        const price = item.fields?.price || item.price || '';
        const image = item.fields?.image || item.image || '';
        const tags = (item.fields?.tags || item.tags || '').split(',').filter(t => t.trim());
        
        return `
            <div class="menu-item" ${image ? `onclick="openImage('${image}')"` : ''}>
                ${image ? `<img src="${image}" alt="${name}" class="menu-item-image">` : ''}
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <span class="menu-item-name">${escapeHtml(name)}</span>
                        ${price ? `<span class="menu-item-price">${escapeHtml(price)}</span>` : ''}
                    </div>
                    ${description ? `<p class="menu-item-description">${escapeHtml(description)}</p>` : ''}
                    ${tags.length > 0 ? `
                        <div class="menu-item-tags">
                            ${tags.map(tag => `<span class="item-tag">${escapeHtml(tag.trim())}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render about section
 */
function renderAbout() {
    const aboutContent = document.getElementById('aboutContent');
    const businessHours = document.getElementById('businessHours');
    
    if (appData.description) {
        aboutContent.innerHTML = marked ? marked.parse(appData.description) : appData.description.replace(/\n/g, '<br>');
    } else {
        aboutContent.innerHTML = '<p>Welcome to our establishment!</p>';
    }
    
    businessHours.textContent = appData.hours || 'Contact us for hours';
}

/**
 * Render gallery
 */
function renderGallery() {
    const container = document.getElementById('galleryGrid');
    
    if (!appData.gallery || appData.gallery.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <span class="material-icons">photo_library</span>
                <p>No photos yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appData.gallery.map(src => `
        <div class="gallery-item" onclick="openImage('${src}')">
            <img src="${src}" alt="Gallery photo" loading="lazy">
        </div>
    `).join('');
}

/**
 * Render contact section
 */
function renderContact() {
    // Phone
    const cardPhone = document.getElementById('cardPhone');
    if (appData.phone) {
        document.getElementById('phoneNumber').textContent = appData.phone;
        cardPhone.style.display = '';
    } else {
        cardPhone.style.display = 'none';
    }
    
    // WhatsApp
    const cardWhatsApp = document.getElementById('cardWhatsApp');
    cardWhatsApp.style.display = appData.whatsapp ? '' : 'none';
    
    // Email
    const cardEmail = document.getElementById('cardEmail');
    if (appData.email) {
        document.getElementById('emailAddress').textContent = appData.email;
        cardEmail.style.display = '';
    } else {
        cardEmail.style.display = 'none';
    }
    
    // Address
    const cardAddress = document.getElementById('cardAddress');
    if (appData.address) {
        document.getElementById('businessAddress').textContent = appData.address;
        cardAddress.style.display = '';
    } else {
        cardAddress.style.display = 'none';
    }
    
    // Social links
    renderSocialLinks();
}

/**
 * Render social media links
 */
function renderSocialLinks() {
    const container = document.querySelector('.social-icons');
    const socialLinks = document.getElementById('socialLinks');
    
    const socialConfig = [
        { key: 'instagram', icon: 'instagram', urlPrefix: 'https://instagram.com/' },
        { key: 'facebook', icon: 'facebook', urlPrefix: '' },
        { key: 'twitter', icon: 'twitter', urlPrefix: 'https://twitter.com/' },
        { key: 'tiktok', icon: 'tiktok', urlPrefix: 'https://tiktok.com/@' },
        { key: 'youtube', icon: 'youtube', urlPrefix: '' },
        { key: 'website', icon: 'language', urlPrefix: '' }
    ];
    
    const links = [];
    
    socialConfig.forEach(({ key, icon, urlPrefix }) => {
        let value = appData.social[key];
        if (!value) return;
        
        // Build URL if not already a full URL
        let url = value;
        if (!value.startsWith('http') && urlPrefix) {
            url = urlPrefix + value.replace('@', '');
        }
        
        links.push(`
            <a href="${url}" class="social-icon" target="_blank" rel="noopener">
                <span class="material-icons">${icon === 'instagram' ? 'camera_alt' : 
                    icon === 'facebook' ? 'facebook' : 
                    icon === 'twitter' ? 'alternate_email' :
                    icon === 'tiktok' ? 'music_note' :
                    icon === 'youtube' ? 'play_arrow' : 'language'}</span>
            </a>
        `);
    });
    
    if (links.length > 0) {
        container.innerHTML = links.join('');
        socialLinks.style.display = '';
    } else {
        socialLinks.style.display = 'none';
    }
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Action handlers
 */
function makeCall() {
    if (appData.phone) {
        window.location.href = `tel:${appData.phone.replace(/\s/g, '')}`;
    }
}

function openWhatsApp() {
    if (appData.whatsapp) {
        const number = appData.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${number}`, '_blank');
    }
}

function sendEmail() {
    if (appData.email) {
        window.location.href = `mailto:${appData.email}`;
    }
}

function openMap() {
    if (appData.mapUrl) {
        window.open(appData.mapUrl, '_blank');
    } else if (appData.address) {
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(appData.address)}`, '_blank');
    }
}

/**
 * Image modal
 */
function openImage(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    img.src = src;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
}

// Close modal on background click
document.getElementById('imageModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'imageModal') {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error state
 */
function showError() {
    document.body.innerHTML = `
        <div class="empty-state" style="height: 100vh; display: flex; flex-direction: column; justify-content: center;">
            <span class="material-icons">error_outline</span>
            <p>Failed to load content</p>
        </div>
    `;
}

// Include marked.js for markdown parsing (optional)
if (!window.marked) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(script);
}

