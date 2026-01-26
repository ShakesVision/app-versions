// Portfolio App
(function() {
    'use strict';

    // Initialize
    function init() {
        animateOnScroll();
        parseSkills();
    }

    // Animate elements on scroll
    function animateOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            .project-card,
            .section-title,
            .bio,
            .skills,
            .contact-info {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            
            .project-card:nth-child(1) { transition-delay: 0.1s; }
            .project-card:nth-child(2) { transition-delay: 0.2s; }
            .project-card:nth-child(3) { transition-delay: 0.3s; }
            .project-card:nth-child(4) { transition-delay: 0.4s; }
        `;
        document.head.appendChild(style);

        // Observe elements
        document.querySelectorAll('.project-card, .section-title, .bio, .skills, .contact-info').forEach(el => {
            observer.observe(el);
        });
    }

    // Parse skills from comma-separated string to tags
    function parseSkills() {
        const skillsList = document.querySelector('.skills-list');
        if (!skillsList) return;

        // Skills might be in a single span, split by comma
        const skillsText = skillsList.textContent.trim();
        if (skillsText && !skillsList.querySelector('.skill-tag')) {
            const skills = skillsText.split(',').map(s => s.trim()).filter(s => s);
            skillsList.innerHTML = skills.map(skill => 
                `<span class="skill-tag">${skill}</span>`
            ).join('');
        }
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();

