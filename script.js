// ========== SPINSPORTS - JAVASCRIPT ==========

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== SMOOTH SCROLL FOR NAVIGATION ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ========== FADE-IN ANIMATION ON SCROLL ==========
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in class to elements
    const fadeElements = document.querySelectorAll('.product-card, .step, .delivery-feature, .location-card');
    fadeElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // ========== LAZY LOADING IMAGES ==========
    const images = document.querySelectorAll('.product-image img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));

    // ========== HERO PARALLAX EFFECT ==========
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', () => {
        if (window.innerWidth > 768) {
            const scrolled = window.pageYOffset;
            hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
        }
    });

    // ========== WHATSAPP BUTTON TRACKING ==========
    const whatsappButtons = document.querySelectorAll('.whatsapp-btn, .contact-whatsapp-btn, .floating-whatsapp');
    
    whatsappButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Track button clicks (can integrate with analytics)
            console.log('WhatsApp button clicked:', this.href);
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // ========== PRODUCT CARD HOVER EFFECT (MOBILE SUPPORT) ==========
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.classList.add('touch-hover');
        });
        
        card.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-hover');
            }, 300);
        });
    });

    // ========== FLOATING BUTTON VISIBILITY ==========
    const floatingBtn = document.querySelector('.floating-whatsapp');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Show floating button after scrolling past hero
        if (scrollTop > window.innerHeight * 0.5) {
            floatingBtn.style.opacity = '1';
            floatingBtn.style.pointerEvents = 'auto';
        } else {
            floatingBtn.style.opacity = '0.7';
        }
        
        lastScrollTop = scrollTop;
    });

    // ========== ADD CSS FOR FADE-IN ANIMATION ==========
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .fade-in-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .touch-hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }
    `;
    document.head.appendChild(style);

    // ========== PRELOAD CRITICAL IMAGES ==========
    const preloadImages = [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80'
    ];
    
    preloadImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    console.log('🏟️ SpinSports website loaded successfully!');
});

// ========== HELPER FUNCTION: FORMAT WHATSAPP MESSAGE ==========
function generateWhatsAppLink(productName, price, phoneNumber = '233XXXXXXXXX') {
    const message = encodeURIComponent(`Hi, I want to order ${productName} (GHS ${price})`);
    return `https://wa.me/${phoneNumber}?text=${message}`;
}

// ========== HELPER FUNCTION: ADD NEW PRODUCT ==========
function createProductCard(product) {
    const { name, price, image, badge = null } = product;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${image}" alt="${name}">
            ${badge ? `<span class="product-badge">${badge}</span>` : ''}
        </div>
        <div class="product-info">
            <h3 class="product-name">${name}</h3>
            <p class="product-price">GHS ${price}</p>
            <a href="${generateWhatsAppLink(name, price)}" class="whatsapp-btn" target="_blank">
                <span class="wa-icon">📱</span> Order on WhatsApp
            </a>
        </div>
    `;
    
    return card;
}
