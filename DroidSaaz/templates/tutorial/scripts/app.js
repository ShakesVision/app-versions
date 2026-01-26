/**
 * Tutorial & Course App
 * Educational content with lessons, quizzes, and certificates
 */

// Constants
const STORAGE_KEY = 'tutorial_progress';

// State
let courseData = {};
let lessons = [];
let progress = { completedLessons: [], quizScores: {} };
let currentLessonIndex = 0;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    loadProgress();
    await loadContent();
    render();
    setupTabs();
});

/**
 * Load content from content.json
 */
async function loadContent() {
    try {
        const response = await fetch('content.json');
        const data = await response.json();
        
        courseData = {
            title: data.fields?.title || 'Course',
            subtitle: data.fields?.subtitle || '',
            cover: data.fields?.cover || '',
            instructor: data.fields?.instructor || '',
            instructorPhoto: data.fields?.instructorPhoto || '',
            description: data.fields?.description || '',
            duration: data.fields?.duration || '',
            level: data.fields?.level || 'beginner',
            passingScore: parseInt(data.fields?.passingScore || 70),
            enableCertificate: data.fields?.enableCertificate !== false,
            certificateTitle: data.fields?.certificateTitle || 'Certificate of Completion',
            organizationName: data.fields?.organizationName || '',
            organizationLogo: data.fields?.organizationLogo || ''
        };
        
        // Parse lessons
        lessons = (data.chapters || []).map((l, i) => ({
            id: `lesson_${i}`,
            title: l.fields?.title || l.title || `Lesson ${i + 1}`,
            content: l.fields?.content || l.content || '',
            videoUrl: l.fields?.videoUrl || l.videoUrl || '',
            hasQuiz: l.fields?.hasQuiz || l.hasQuiz || false,
            quizQuestions: parseQuizQuestions(l.fields?.quizQuestions || l.quizQuestions)
        }));
        
        // Apply customization
        if (data.customization) {
            applyTheme(data.customization);
        }
        
    } catch (error) {
        console.error('Failed to load content:', error);
    }
}

/**
 * Parse quiz questions from JSON string or array
 */
function parseQuizQuestions(questions) {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    try {
        return JSON.parse(questions);
    } catch {
        return [];
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
 * Load progress from localStorage
 */
function loadProgress() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            progress = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load progress:', e);
    }
}

/**
 * Save progress to localStorage
 */
function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
}

/**
 * Main render function
 */
function render() {
    renderHeader();
    renderProgress();
    renderLessons();
    renderAbout();
    renderCertificateSection();
}

/**
 * Render course header
 */
function renderHeader() {
    document.getElementById('pageTitle').textContent = courseData.title;
    document.getElementById('courseTitle').textContent = courseData.title;
    document.getElementById('courseSubtitle').textContent = courseData.subtitle;
    document.getElementById('courseDuration').textContent = courseData.duration || '—';
    document.getElementById('lessonCount').textContent = lessons.length;
    
    const levelLabels = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced'
    };
    document.getElementById('courseLevel').textContent = levelLabels[courseData.level] || 'Beginner';
    
    if (courseData.cover) {
        document.getElementById('courseCover').src = courseData.cover;
    }
}

/**
 * Render progress bar
 */
function renderProgress() {
    const completed = progress.completedLessons.length;
    const total = lessons.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('progressBar').style.setProperty('--progress', `${percent}%`);
    document.getElementById('progressText').textContent = `${percent}% Complete`;
}

/**
 * Render lessons list
 */
function renderLessons() {
    const container = document.getElementById('lessonsList');
    
    container.innerHTML = lessons.map((lesson, index) => {
        const isCompleted = progress.completedLessons.includes(lesson.id);
        const hasVideo = !!lesson.videoUrl;
        const hasQuiz = lesson.hasQuiz && lesson.quizQuestions.length > 0;
        
        return `
            <div class="lesson-card ${isCompleted ? 'completed' : ''}" 
                 onclick="openLesson(${index})">
                <div class="lesson-number">
                    <span>${index + 1}</span>
                </div>
                <div class="lesson-info">
                    <div class="lesson-title">${escapeHtml(lesson.title)}</div>
                    <div class="lesson-meta">
                        ${hasVideo ? '<span><span class="material-icons-round">play_circle</span> Video</span>' : ''}
                        ${hasQuiz ? '<span><span class="material-icons-round">quiz</span> Quiz</span>' : ''}
                    </div>
                </div>
                <span class="material-icons-round lesson-arrow">chevron_right</span>
            </div>
        `;
    }).join('');
}

/**
 * Render about section
 */
function renderAbout() {
    if (courseData.instructor) {
        document.getElementById('instructorName').textContent = courseData.instructor;
        if (courseData.instructorPhoto) {
            document.getElementById('instructorPhoto').src = courseData.instructorPhoto;
        }
    } else {
        document.getElementById('instructorCard').style.display = 'none';
    }
    
    const descContainer = document.getElementById('courseDescription');
    if (courseData.description) {
        // Simple markdown to HTML
        descContainer.innerHTML = parseMarkdown(courseData.description);
    }
}

/**
 * Render certificate section
 */
function renderCertificateSection() {
    if (!courseData.enableCertificate) {
        document.getElementById('tabCertificate').style.display = 'none';
        return;
    }
    
    const allLessonsCompleted = lessons.every(l => 
        progress.completedLessons.includes(l.id)
    );
    
    const allQuizzesPassed = lessons.every(l => {
        if (!l.hasQuiz || l.quizQuestions.length === 0) return true;
        const score = progress.quizScores[l.id];
        return score !== undefined && score >= courseData.passingScore;
    });
    
    const canGetCertificate = allLessonsCompleted && allQuizzesPassed;
    
    document.getElementById('certificateLocked').style.display = canGetCertificate ? 'none' : 'flex';
    document.getElementById('certificateUnlocked').style.display = canGetCertificate ? 'flex' : 'none';
    
    if (!canGetCertificate) {
        const reqList = document.getElementById('requirementList');
        reqList.innerHTML = lessons.map(lesson => {
            const isDone = progress.completedLessons.includes(lesson.id);
            const hasQuiz = lesson.hasQuiz && lesson.quizQuestions.length > 0;
            const quizPassed = !hasQuiz || (progress.quizScores[lesson.id] >= courseData.passingScore);
            
            let status = 'pending';
            let icon = 'radio_button_unchecked';
            if (isDone && quizPassed) {
                status = 'done';
                icon = 'check_circle';
            }
            
            return `
                <div class="requirement-item ${status}">
                    <span class="material-icons-round">${icon}</span>
                    ${escapeHtml(lesson.title)}
                </div>
            `;
        }).join('');
    }
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Open lesson modal
 */
function openLesson(index) {
    currentLessonIndex = index;
    const lesson = lessons[index];
    
    document.getElementById('lessonModalTitle').textContent = lesson.title;
    
    let content = '';
    
    // Video
    if (lesson.videoUrl) {
        const embedUrl = getEmbedUrl(lesson.videoUrl);
        content += `
            <div class="video-container">
                <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }
    
    // Lesson content
    content += `<div class="lesson-content">${parseMarkdown(lesson.content)}</div>`;
    
    document.getElementById('lessonModalBody').innerHTML = content;
    
    // Update button state
    const isCompleted = progress.completedLessons.includes(lesson.id);
    const btnComplete = document.getElementById('btnMarkComplete');
    
    if (lesson.hasQuiz && lesson.quizQuestions.length > 0 && !isCompleted) {
        btnComplete.textContent = 'Take Quiz';
        btnComplete.onclick = () => startQuiz(lesson);
    } else if (isCompleted) {
        btnComplete.textContent = '✓ Completed';
        btnComplete.disabled = true;
    } else {
        btnComplete.textContent = 'Mark as Complete';
        btnComplete.onclick = markLessonComplete;
        btnComplete.disabled = false;
    }
    
    // Navigation buttons
    document.getElementById('btnPrevLesson').style.visibility = index > 0 ? 'visible' : 'hidden';
    document.getElementById('btnNextLesson').style.visibility = index < lessons.length - 1 ? 'visible' : 'hidden';
    
    document.getElementById('lessonModal').classList.add('active');
}

/**
 * Close lesson modal
 */
function closeLessonModal() {
    document.getElementById('lessonModal').classList.remove('active');
}

/**
 * Navigate to previous lesson
 */
function prevLesson() {
    if (currentLessonIndex > 0) {
        openLesson(currentLessonIndex - 1);
    }
}

/**
 * Navigate to next lesson
 */
function nextLesson() {
    if (currentLessonIndex < lessons.length - 1) {
        openLesson(currentLessonIndex + 1);
    }
}

/**
 * Mark lesson as complete
 */
function markLessonComplete() {
    const lesson = lessons[currentLessonIndex];
    
    if (!progress.completedLessons.includes(lesson.id)) {
        progress.completedLessons.push(lesson.id);
        saveProgress();
        showToast('Lesson completed! 🎉');
    }
    
    renderProgress();
    renderLessons();
    renderCertificateSection();
    closeLessonModal();
}

/**
 * Start quiz for lesson
 */
function startQuiz(lesson) {
    const questions = lesson.quizQuestions;
    let currentQuestion = 0;
    let answers = [];
    
    function renderQuestion() {
        const q = questions[currentQuestion];
        
        document.getElementById('quizModalBody').innerHTML = `
            <div class="quiz-question">
                <p style="color: var(--text-secondary); margin-bottom: 8px;">
                    Question ${currentQuestion + 1} of ${questions.length}
                </p>
                <h4>${escapeHtml(q.q || q.question)}</h4>
                <div class="quiz-options">
                    ${(q.options || []).map((opt, i) => `
                        <div class="quiz-option" data-index="${i}" onclick="selectOption(this)">
                            ${escapeHtml(opt)}
                        </div>
                    `).join('')}
                </div>
            </div>
            <button class="btn-primary" id="btnNextQuestion" disabled onclick="submitAnswer()">
                ${currentQuestion === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
            </button>
        `;
    }
    
    window.selectOption = function(el) {
        document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('btnNextQuestion').disabled = false;
    };
    
    window.submitAnswer = function() {
        const selected = document.querySelector('.quiz-option.selected');
        if (!selected) return;
        
        answers.push(parseInt(selected.dataset.index));
        currentQuestion++;
        
        if (currentQuestion < questions.length) {
            renderQuestion();
        } else {
            showQuizResult(lesson, questions, answers);
        }
    };
    
    renderQuestion();
    document.getElementById('quizModal').classList.add('active');
}

/**
 * Show quiz result
 */
function showQuizResult(lesson, questions, answers) {
    const correct = questions.filter((q, i) => (q.answer || 0) === answers[i]).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= courseData.passingScore;
    
    progress.quizScores[lesson.id] = score;
    
    if (passed && !progress.completedLessons.includes(lesson.id)) {
        progress.completedLessons.push(lesson.id);
    }
    
    saveProgress();
    
    document.getElementById('quizModalBody').innerHTML = `
        <div class="quiz-result ${passed ? 'passed' : 'failed'}">
            <span class="material-icons-round">${passed ? 'celebration' : 'sentiment_dissatisfied'}</span>
            <div class="quiz-score">${score}%</div>
            <p>${correct} of ${questions.length} correct</p>
            <p style="margin-top: 8px; color: var(--text-secondary);">
                ${passed ? 'Great job! You passed the quiz.' : `You need ${courseData.passingScore}% to pass. Try again!`}
            </p>
            <button class="btn-primary" style="margin-top: 20px" onclick="closeQuizAndRefresh()">
                ${passed ? 'Continue' : 'Try Again'}
            </button>
        </div>
    `;
}

/**
 * Close quiz and refresh
 */
function closeQuizAndRefresh() {
    closeModal('quizModal');
    closeLessonModal();
    renderProgress();
    renderLessons();
    renderCertificateSection();
}

/**
 * Generate certificate
 */
function generateCertificate() {
    const name = document.getElementById('studentName').value.trim();
    if (!name) {
        showToast('Please enter your name');
        return;
    }
    
    const canvas = document.getElementById('certificateCanvas');
    const ctx = canvas.getContext('2d');
    
    // Certificate dimensions
    canvas.width = 800;
    canvas.height = 600;
    
    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);
    
    // Border
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#1976D2';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);
    
    // Inner border
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 730, 530);
    
    // Certificate title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(courseData.certificateTitle || 'Certificate of Completion', 400, 100);
    
    // Decorative line
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 130);
    ctx.lineTo(600, 130);
    ctx.stroke();
    
    // "This certifies that"
    ctx.fillStyle = '#666';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('This certifies that', 400, 180);
    
    // Student name
    ctx.fillStyle = '#1976D2';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(name, 400, 240);
    
    // "has successfully completed"
    ctx.fillStyle = '#666';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('has successfully completed', 400, 300);
    
    // Course title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(courseData.title, 400, 350);
    
    // Date
    const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    ctx.fillStyle = '#666';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(`Completed on ${date}`, 400, 420);
    
    // Organization name
    if (courseData.organizationName) {
        ctx.fillStyle = '#333';
        ctx.font = 'italic 20px Georgia, serif';
        ctx.fillText(courseData.organizationName, 400, 500);
    }
    
    // Instructor signature
    if (courseData.instructor) {
        ctx.fillStyle = '#333';
        ctx.font = 'italic 18px Georgia, serif';
        ctx.fillText(courseData.instructor, 400, 540);
        ctx.font = '14px Georgia, serif';
        ctx.fillText('Instructor', 400, 560);
    }
    
    document.getElementById('certModal').classList.add('active');
}

/**
 * Download certificate
 */
function downloadCertificate() {
    const canvas = document.getElementById('certificateCanvas');
    const link = document.createElement('a');
    link.download = `Certificate-${courseData.title.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Certificate downloaded!');
}

/**
 * Share certificate
 */
async function shareCertificate() {
    const canvas = document.getElementById('certificateCanvas');
    
    try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'certificate.png', { type: 'image/png' });
        
        if (navigator.share) {
            await navigator.share({
                title: `${courseData.title} Certificate`,
                text: `I completed ${courseData.title}!`,
                files: [file]
            });
        } else {
            downloadCertificate();
        }
    } catch (error) {
        downloadCertificate();
    }
}

/**
 * Close modal
 */
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

/**
 * Get embed URL for video
 */
function getEmbedUrl(url) {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
}

/**
 * Parse markdown to HTML (simple version)
 */
function parseMarkdown(text) {
    if (!text) return '';
    
    return text
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
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

