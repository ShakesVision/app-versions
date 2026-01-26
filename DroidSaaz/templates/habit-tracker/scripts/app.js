/**
 * Habit Tracker App
 * Local-first habit tracking with optional Google Drive backup
 */

// Constants
const STORAGE_KEY = 'habit_tracker_data';
const SETTINGS_KEY = 'habit_tracker_settings';

// State
let appConfig = {};
let habits = [];
let habitData = {}; // { 'YYYY-MM-DD': { habitId: count } }
let currentDate = new Date();
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    loadData();
    render();
    setupEventListeners();
});

/**
 * Load config from content.json
 */
async function loadConfig() {
    try {
        const response = await fetch('content.json');
        const data = await response.json();
        
        appConfig = {
            title: data.fields?.title || 'Habit Tracker',
            subtitle: data.fields?.subtitle || '',
            resetTime: data.fields?.resetTime || '00:00',
            weekStart: parseInt(data.fields?.weekStart || '0'),
            enableDriveBackup: data.fields?.enableDriveBackup || false
        };
        
        // Load habits from config
        habits = (data.chapters || []).map((h, i) => ({
            id: `habit_${i}`,
            name: h.fields?.name || h.name || 'Untitled',
            icon: h.fields?.icon || h.icon || '✓',
            category: h.fields?.category || h.category || 'other',
            frequency: h.fields?.frequency || h.frequency || 'daily',
            targetCount: parseInt(h.fields?.targetCount || h.targetCount || 1),
            color: h.fields?.color || h.color || '#4CAF50',
            notes: h.fields?.notes || h.notes || ''
        }));
        
        // Apply customization
        if (data.customization) {
            applyTheme(data.customization);
        }
        
        document.getElementById('pageTitle').textContent = appConfig.title;
        document.getElementById('appTitle').textContent = appConfig.title;
        document.getElementById('appSubtitle').textContent = appConfig.subtitle;
        
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

/**
 * Apply theme customization
 */
function applyTheme(customization) {
    const root = document.documentElement;
    
    if (customization.colors) {
        Object.entries(customization.colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }
    
    if (customization.fonts) {
        if (customization.fonts.heading) {
            root.style.setProperty('--font-heading', `'${customization.fonts.heading}', sans-serif`);
        }
        if (customization.fonts.body) {
            root.style.setProperty('--font-body', `'${customization.fonts.body}', sans-serif`);
        }
    }
    
    if (customization.direction && customization.direction !== 'auto') {
        document.body.setAttribute('dir', customization.direction);
    }
}

/**
 * Load data from localStorage
 */
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            habitData = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load data:', e);
        habitData = {};
    }
}

/**
 * Save data to localStorage
 */
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habitData));
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

/**
 * Get today's date key (accounting for custom reset time)
 */
function getDateKey(date = currentDate) {
    const d = new Date(date);
    // Adjust for reset time
    const [resetHour] = appConfig.resetTime?.split(':').map(Number) || [0];
    if (d.getHours() < resetHour) {
        d.setDate(d.getDate() - 1);
    }
    return d.toISOString().split('T')[0];
}

/**
 * Main render function
 */
function render() {
    renderDate();
    renderCategoryFilter();
    renderHabits();
    updateProgress();
}

/**
 * Render current date display
 */
function renderDate() {
    const dateEl = document.getElementById('currentDate');
    const today = new Date();
    const isToday = getDateKey() === getDateKey(today);
    
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateEl.textContent = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', options);
    dateEl.classList.toggle('today', isToday);
}

/**
 * Render category filter chips
 */
function renderCategoryFilter() {
    const container = document.getElementById('categoryFilter');
    const categories = [...new Set(habits.map(h => h.category))];
    
    const categoryLabels = {
        health: 'Health',
        spiritual: 'Spiritual',
        learning: 'Learning',
        productivity: 'Productivity',
        mindfulness: 'Mindfulness',
        social: 'Social',
        other: 'Other'
    };
    
    container.innerHTML = `
        <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" 
                data-category="all" onclick="setFilter('all')">All</button>
        ${categories.map(cat => `
            <button class="filter-chip ${currentFilter === cat ? 'active' : ''}" 
                    data-category="${cat}" onclick="setFilter('${cat}')">
                ${categoryLabels[cat] || cat}
            </button>
        `).join('')}
    `;
}

/**
 * Set category filter
 */
function setFilter(category) {
    currentFilter = category;
    render();
}

/**
 * Render habits list
 */
function renderHabits() {
    const container = document.getElementById('habitsList');
    const dateKey = getDateKey();
    const dayData = habitData[dateKey] || {};
    
    // Filter by category
    const filteredHabits = currentFilter === 'all' 
        ? habits 
        : habits.filter(h => h.category === currentFilter);
    
    // Filter by frequency
    const activeHabits = filteredHabits.filter(h => isHabitActiveToday(h));
    
    if (activeHabits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">check_circle_outline</span>
                <p>No habits for today</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activeHabits.map(habit => {
        const count = dayData[habit.id] || 0;
        const isCompleted = count >= habit.targetCount;
        const streak = calculateStreak(habit.id);
        
        return `
            <div class="habit-card ${isCompleted ? 'completed' : ''}" 
                 data-habit-id="${habit.id}">
                <div class="habit-icon" style="background: ${habit.color}20; color: ${habit.color}">
                    ${habit.icon}
                </div>
                <div class="habit-info" onclick="showHabitDetail('${habit.id}')">
                    <div class="habit-name">${escapeHtml(habit.name)}</div>
                    <div class="habit-meta">
                        ${streak > 0 ? `
                            <span class="habit-streak">
                                <span class="material-icons-round">local_fire_department</span>
                                ${streak}
                            </span>
                        ` : ''}
                        ${habit.targetCount > 1 ? `<span>${count}/${habit.targetCount}</span>` : ''}
                    </div>
                </div>
                ${habit.targetCount > 1 ? `
                    <div class="habit-counter">
                        <button class="counter-btn" onclick="decrementHabit('${habit.id}')">−</button>
                        <span class="counter-value">${count}</span>
                        <button class="counter-btn" onclick="incrementHabit('${habit.id}')">+</button>
                    </div>
                ` : `
                    <div class="habit-check" onclick="toggleHabit('${habit.id}')">
                        <span class="material-icons-round">check</span>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

/**
 * Check if habit is active for current day based on frequency
 */
function isHabitActiveToday(habit) {
    const day = currentDate.getDay();
    
    switch (habit.frequency) {
        case 'daily':
            return true;
        case 'weekdays':
            return day >= 1 && day <= 5;
        case 'weekends':
            return day === 0 || day === 6;
        default:
            return true;
    }
}

/**
 * Toggle habit completion (for simple habits)
 */
function toggleHabit(habitId) {
    const dateKey = getDateKey();
    if (!habitData[dateKey]) habitData[dateKey] = {};
    
    const habit = habits.find(h => h.id === habitId);
    const current = habitData[dateKey][habitId] || 0;
    
    habitData[dateKey][habitId] = current >= habit.targetCount ? 0 : habit.targetCount;
    
    saveData();
    render();
    
    if (habitData[dateKey][habitId] > 0) {
        showToast('✓ Habit completed!');
    }
}

/**
 * Increment habit counter
 */
function incrementHabit(habitId) {
    const dateKey = getDateKey();
    if (!habitData[dateKey]) habitData[dateKey] = {};
    
    const habit = habits.find(h => h.id === habitId);
    const current = habitData[dateKey][habitId] || 0;
    
    if (current < habit.targetCount) {
        habitData[dateKey][habitId] = current + 1;
        saveData();
        render();
        
        if (habitData[dateKey][habitId] === habit.targetCount) {
            showToast('🎉 Target reached!');
        }
    }
}

/**
 * Decrement habit counter
 */
function decrementHabit(habitId) {
    const dateKey = getDateKey();
    if (!habitData[dateKey]) habitData[dateKey] = {};
    
    const current = habitData[dateKey][habitId] || 0;
    
    if (current > 0) {
        habitData[dateKey][habitId] = current - 1;
        saveData();
        render();
    }
}

/**
 * Calculate streak for a habit
 */
function calculateStreak(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    
    let streak = 0;
    let checkDate = new Date();
    
    // Start from yesterday if today is not completed
    const todayKey = getDateKey();
    const todayData = habitData[todayKey] || {};
    if ((todayData[habitId] || 0) < habit.targetCount) {
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
        const dateKey = getDateKey(checkDate);
        const dayData = habitData[dateKey] || {};
        
        if ((dayData[habitId] || 0) >= habit.targetCount) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
        
        // Safety limit
        if (streak > 365) break;
    }
    
    return streak;
}

/**
 * Update progress display
 */
function updateProgress() {
    const dateKey = getDateKey();
    const dayData = habitData[dateKey] || {};
    const activeHabits = habits.filter(h => isHabitActiveToday(h));
    
    if (activeHabits.length === 0) {
        document.getElementById('progressPercent').textContent = '—';
        document.getElementById('progressRing').style.strokeDashoffset = 339.292;
        return;
    }
    
    const completed = activeHabits.filter(h => 
        (dayData[h.id] || 0) >= h.targetCount
    ).length;
    
    const percent = Math.round((completed / activeHabits.length) * 100);
    const offset = 339.292 * (1 - percent / 100);
    
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressRing').style.strokeDashoffset = offset;
    
    // Update streak (overall)
    const overallStreak = calculateOverallStreak();
    document.getElementById('streakCount').textContent = overallStreak;
}

/**
 * Calculate overall streak (all habits completed)
 */
function calculateOverallStreak() {
    let streak = 0;
    let checkDate = new Date();
    
    // Start from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    
    while (true) {
        const dateKey = getDateKey(checkDate);
        const dayData = habitData[dateKey] || {};
        
        // Check if all habits were completed
        const allCompleted = habits.every(h => {
            if (!isHabitActiveForDate(h, checkDate)) return true;
            return (dayData[h.id] || 0) >= h.targetCount;
        });
        
        if (allCompleted && Object.keys(dayData).length > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
        
        if (streak > 365) break;
    }
    
    return streak;
}

/**
 * Check if habit was active on a specific date
 */
function isHabitActiveForDate(habit, date) {
    const day = date.getDay();
    switch (habit.frequency) {
        case 'weekdays': return day >= 1 && day <= 5;
        case 'weekends': return day === 0 || day === 6;
        default: return true;
    }
}

/**
 * Change date
 */
function changeDate(delta) {
    currentDate.setDate(currentDate.getDate() + delta);
    render();
}

/**
 * Go to today
 */
function goToToday() {
    currentDate = new Date();
    render();
}

/**
 * Show habit detail modal
 */
function showHabitDetail(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const streak = calculateStreak(habitId);
    const modal = document.getElementById('habitModal');
    
    document.getElementById('habitModalTitle').textContent = habit.name;
    document.getElementById('habitModalBody').innerHTML = `
        <div class="habit-detail">
            <div class="habit-icon-large" style="background: ${habit.color}20; color: ${habit.color}">
                ${habit.icon}
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${streak}</span>
                    <span class="stat-label">Current Streak</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${habit.targetCount}</span>
                    <span class="stat-label">Daily Target</span>
                </div>
            </div>
            ${habit.notes ? `<p class="habit-notes">${escapeHtml(habit.notes)}</p>` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

/**
 * Show stats modal
 */
function showStats() {
    const modal = document.getElementById('statsModal');
    
    // Calculate stats
    const totalDays = Object.keys(habitData).length;
    const totalChecks = Object.values(habitData).reduce((sum, day) => 
        sum + Object.values(day).reduce((s, v) => s + v, 0), 0);
    const avgCompletion = totalDays > 0 ? Math.round(totalChecks / totalDays / habits.length * 100) : 0;
    const bestStreak = calculateOverallStreak();
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <span class="stat-value">${totalDays}</span>
            <span class="stat-label">Days Tracked</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${totalChecks}</span>
            <span class="stat-label">Total Check-ins</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${avgCompletion}%</span>
            <span class="stat-label">Avg Completion</span>
        </div>
        <div class="stat-card">
            <span class="stat-value">${bestStreak}</span>
            <span class="stat-label">Best Streak</span>
        </div>
    `;
    
    // Render weekly chart
    renderWeeklyChart();
    
    // Render month calendar
    renderMonthCalendar();
    
    modal.classList.add('active');
}

/**
 * Render weekly progress chart
 */
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    const ctx = canvas.getContext('2d');
    
    // Get last 7 days data
    const days = [];
    const values = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = getDateKey(d);
        const dayData = habitData[dateKey] || {};
        
        days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const completed = habits.filter(h => 
            (dayData[h.id] || 0) >= h.targetCount
        ).length;
        values.push(habits.length > 0 ? Math.round(completed / habits.length * 100) : 0);
    }
    
    // Simple bar chart
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / days.length - 10;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#6200EE';
    
    values.forEach((val, i) => {
        const barHeight = (val / 100) * (height - 30);
        const x = i * (barWidth + 10) + 5;
        const y = height - barHeight - 20;
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Day label
        ctx.fillStyle = '#B0B0B0';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(days[i], x + barWidth / 2, height - 5);
        
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#6200EE';
    });
}

/**
 * Render month calendar heatmap
 */
function renderMonthCalendar() {
    const container = document.getElementById('monthCalendar');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let html = '';
    
    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    html += dayHeaders.map(d => `<div class="calendar-day" style="color: #666">${d}</div>`).join('');
    
    // Empty cells before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<div class="calendar-day"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const d = new Date(year, month, day);
        const dateKey = getDateKey(d);
        const dayData = habitData[dateKey] || {};
        
        const hasData = Object.keys(dayData).length > 0;
        const allCompleted = hasData && habits.every(h => 
            (dayData[h.id] || 0) >= h.targetCount
        );
        const isToday = day === today.getDate();
        
        let classes = 'calendar-day';
        if (hasData) classes += ' has-data';
        if (allCompleted) classes += ' completed';
        if (isToday) classes += ' today';
        
        html += `<div class="${classes}">${day}</div>`;
    }
    
    container.innerHTML = html;
}

/**
 * Show settings modal
 */
function showSettings() {
    document.getElementById('settingsModal').classList.add('active');
}

/**
 * Close modal
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

/**
 * Export data as JSON file
 */
function exportData() {
    const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        habits: habits,
        data: habitData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
}

/**
 * Import data from JSON file
 */
function importData() {
    document.getElementById('importInput').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.data) {
                habitData = data.data;
                saveData();
                render();
                showToast('Data imported successfully');
                closeModal('settingsModal');
            }
        } catch (error) {
            showToast('Failed to import data');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

/**
 * Backup to Google Drive (placeholder - requires OAuth setup)
 */
async function backupToDrive() {
    showToast('Google Drive backup requires OAuth setup. Use manual export for now.');
}

/**
 * Restore from Google Drive (placeholder)
 */
async function restoreFromDrive() {
    showToast('Google Drive restore requires OAuth setup. Use manual import for now.');
}

/**
 * Confirm and reset all data
 */
function confirmReset() {
    if (confirm('Are you sure you want to delete ALL habit data? This cannot be undone.')) {
        habitData = {};
        saveData();
        render();
        closeModal('settingsModal');
        showToast('All data has been reset');
    }
}

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        }
    });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

