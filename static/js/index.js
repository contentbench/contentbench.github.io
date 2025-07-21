/**
 * Main JavaScript file for ContentBench website
 */

$(document).ready(function() {
    $(".navbar-burger").click(function() {
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });

    // Smooth scrolling for navigation links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });

    bulmaSlider.attach();

    animateNumbers();
    
    setupScrollAnimations();
    
    setupMethodologyInteractions();
});

/**
 * Animate number counters when they come into view
 */
function animateNumbers() {
    const observerOptions = {
        threshold: 0.7,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all title elements in boxes (our key metrics)
    document.querySelectorAll('.box .title').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Animate a single number value
 */
function animateValue(element) {
    const text = element.textContent;
    const hasPercent = text.includes('%');
    const hasK = text.includes('K');
    const hasDollar = text.includes('$');
    const hasAt = text.includes('@');
    
    // Extract numeric value
    let numericValue = parseFloat(text.replace(/[^\d.]/g, ''));
    
    if (hasK) {
        numericValue *= 1000;
    }
    
    let current = 0;
    const increment = numericValue / 60; // 60 frames for smooth animation
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        
        // Format the display value
        let displayValue = Math.floor(current);
        if (hasK && displayValue >= 1000) {
            displayValue = (displayValue / 1000).toFixed(1) + 'K';
        } else if (displayValue >= 1000) {
            displayValue = displayValue.toLocaleString();
        }
        
        if (hasPercent) {
            displayValue += '%';
        }
        if (hasDollar) {
            displayValue = '$' + displayValue;
        }
        if (hasAt) {
            displayValue += ' @ 8.7K/$';
        }
        
        element.textContent = displayValue;
    }, 16); // ~60fps
}

/**
 * Setup scroll-based animations
 */
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Observe boxes for staggered animation
    document.querySelectorAll('.box').forEach((box, index) => {
        box.style.animationDelay = `${index * 0.1}s`;
        observer.observe(box);
    });
}

/**
 * Utility function to format numbers
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Show loading spinner
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="has-text-centered"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Loading...</div>';
    }
}

/**
 * Hide loading spinner
 */
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

/**
 * Setup methodology section interactions
 */
function setupMethodologyInteractions() {
    
    // Category card interactions
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add a subtle click effect
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add navigation link to methodology in navbar
    const methodologyLink = document.querySelector('a[href="#methodology"]');
    if (methodologyLink) {
        methodologyLink.addEventListener('click', function(e) {
            e.preventDefault();
            const methodologySection = document.getElementById('methodology');
            if (methodologySection) {
                methodologySection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

/**
 * Enhanced copy to clipboard function with better formatting
 */
function copyToClipboardFormatted(text) {
    // Clean up the text formatting
    const cleanText = text
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/(\n\s*){2,}/g, '\n\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1');     // Remove italic markdown
    
    return navigator.clipboard.writeText(cleanText);
}