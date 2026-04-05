// ============================================
// KAPZ KOLLECTIONS - MAIN WEBSITE
// Production Build v2.0
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Production mode
const isDev = false;

document.addEventListener('DOMContentLoaded', function() {
    loadSiteSettings();
    initLiveProducts();
    initSmoothScroll();
});

// ============================================
// SMOOTH SCROLL FOR NAVIGATION
// ============================================
function initSmoothScroll() {
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
}

// ============================================
// LOAD SITE SETTINGS FROM FIREBASE
// ============================================
async function loadSiteSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, "settings", "site"));
        
        if (!settingsDoc.exists()) {
            return;
        }
        
        const settings = settingsDoc.data();
    
    // Update business name
    const siteName = document.querySelector(".hero-left h1");
    if (siteName && settings.businessName) {
        siteName.textContent = settings.businessName;
    }
    
    // Update tagline
    const tagline = document.querySelector(".hero-subtitle");
    if (tagline && settings.tagline) {
        tagline.textContent = settings.tagline;
    }

    // Update about text
    const aboutText = document.querySelector(".about-text");
    if (aboutText && settings.aboutText) {
        aboutText.textContent = settings.aboutText;
    }
    
    // Update phone numbers
    const phone1Elements = document.querySelectorAll(".contact-value");
    if (phone1Elements[0] && settings.phone1) {
        phone1Elements[0].textContent = settings.phone1;
    }
    if (phone1Elements[1] && settings.phone2) {
        phone1Elements[1].textContent = settings.phone2;
    }

    // Update email
    const emailEl = document.querySelector(".email-value");
    if (emailEl && settings.email) {
        emailEl.textContent = settings.email;
        emailEl.href = `mailto:${settings.email}`;
    }
    
    // Update location
    const addressElements = document.querySelectorAll(".address");
    addressElements.forEach(el => {
        if (settings.address) el.textContent = settings.address;
    });
    
    const cityElements = document.querySelectorAll(".sub-info");
    cityElements.forEach(el => {
        if (settings.city) el.textContent = settings.city;
    });

    // Update business hours
    const hoursEl = document.querySelector(".opening-hours");
    if (hoursEl && settings.openingHours) {
        hoursEl.textContent = settings.openingHours;
    }
    
    // Update WhatsApp links
    if (settings.whatsapp) {
        const waLinks = document.querySelectorAll('a[href*="wa.me"]');
        waLinks.forEach(link => {
            const currentHref = link.getAttribute("href");
            const newHref = currentHref.replace(/wa\.me\/\d+/, `wa.me/${settings.whatsapp}`);
            link.setAttribute("href", newHref);
        });
    }

    // Update social media links
    if (settings.instagram) {
        document.querySelectorAll('.social-instagram').forEach(link => link.href = settings.instagram);
    }
    if (settings.facebook) {
        document.querySelectorAll('.social-facebook').forEach(link => link.href = settings.facebook);
    }
    if (settings.tiktok) {
        document.querySelectorAll('.social-tiktok').forEach(link => link.href = settings.tiktok);
    }
    if (settings.twitter) {
        document.querySelectorAll('.social-twitter').forEach(link => link.href = settings.twitter);
    }

    // Update Google Maps
    if (settings.mapUrl) {
        const mapIframe = document.querySelector(".map-container iframe");
        if (mapIframe) {
            mapIframe.src = settings.mapUrl;
        }
    }
    
    // Update favicon
    if (settings.faviconUrl) {
        const favicon = document.querySelector("link[rel='icon']");
        if (favicon) {
            favicon.href = settings.faviconUrl;
        }
    }

    // Update logo
    if (settings.logoUrl) {
        const logo = document.querySelector(".site-logo");
        if (logo) {
            logo.src = settings.logoUrl;
        }
    }

    // Update primary color
    if (settings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
    } catch (error) {
        if (isDev) console.error("Error loading settings:", error);
    }
}

// ============================================
// LIVE PRODUCTS FROM FIREBASE - SMART REAL-TIME UPDATES
// ============================================
let whatsappNumber = "233556734640"; // Default, will be updated from settings
let currentProducts = new Map(); // Store current products for smart updates

function initLiveProducts() {
    const container = document.querySelector(".products-grid");
    
    if (!container) {
        console.log("Products container not found");
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-products">
            <p>⏳ Loading products...</p>
        </div>
    `;
    
    // Get WhatsApp number from settings first
    getDoc(doc(db, "settings", "site")).then(settingsDoc => {
        if (settingsDoc.exists()) {
            whatsappNumber = settingsDoc.data().whatsapp || whatsappNumber;
        }
    });
    
    // Set up real-time listener with smart updates
    onSnapshot(collection(db, "products"), (snapshot) => {
        const newProducts = new Map();
        
        snapshot.forEach(docSnap => {
            newProducts.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        
        // Detect changes
        const addedIds = [];
        const removedIds = [];
        const updatedIds = [];
        
        // Find added and updated products
        newProducts.forEach((product, id) => {
            if (!currentProducts.has(id)) {
                addedIds.push(id);
            } else {
                const oldProduct = currentProducts.get(id);
                if (JSON.stringify(oldProduct) !== JSON.stringify(product)) {
                    updatedIds.push(id);
                }
            }
        });
        
        // Find removed products
        currentProducts.forEach((product, id) => {
            if (!newProducts.has(id)) {
                removedIds.push(id);
            }
        });
        
        // Update current products map
        currentProducts = newProducts;
        
        // Sort by newest first
        const products = Array.from(newProducts.values()).sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
        
        // If no products, show empty state
        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-products">
                    <p>🛍️ Products coming soon!</p>
                    <p class="sub">Check back later for our amazing collection.</p>
                </div>
            `;
            return;
        }
        
        // Smart DOM updates - only update what changed
        const isFirstLoad = container.querySelector('.loading-products') || container.querySelector('.empty-products');
        
        if (isFirstLoad || removedIds.length > 0 || addedIds.length > products.length / 2) {
            // Full re-render for first load, removals, or many additions
            container.innerHTML = products.map(product => 
                createProductCardHTML(product, addedIds.includes(product.id))
            ).join("");
        } else {
            // Smart update - only add new items and update changed ones
            addedIds.forEach(id => {
                const product = newProducts.get(id);
                const productIndex = products.findIndex(p => p.id === id);
                const newCard = document.createElement('div');
                newCard.innerHTML = createProductCardHTML(product, true);
                const cardElement = newCard.firstElementChild;
                
                if (productIndex === 0) {
                    container.insertBefore(cardElement, container.firstChild);
                } else {
                    const prevProduct = products[productIndex - 1];
                    const prevCard = container.querySelector(`[data-id="${prevProduct.id}"]`);
                    if (prevCard) {
                        prevCard.after(cardElement);
                    } else {
                        container.appendChild(cardElement);
                    }
                }
            });
            
            // Update changed cards
            updatedIds.forEach(id => {
                const card = container.querySelector(`[data-id="${id}"]`);
                if (card) {
                    const product = newProducts.get(id);
                    const newCard = document.createElement('div');
                    newCard.innerHTML = createProductCardHTML(product, false);
                    card.replaceWith(newCard.firstElementChild);
                }
            });
        }
        
    }, (error) => {
        if (isDev) console.error("Error with live products:", error);
        container.innerHTML = `
            <div class="empty-products">
                <p>⚠️ Unable to load products</p>
                <p class="sub">Please check your connection and try again.</p>
            </div>
        `;
    });
}

// Create product card HTML
function createProductCardHTML(product, isNew = false) {
    return `
        <div class="product-card ${isNew ? 'newly-added' : ''}" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/280x280?text=No+Image'">
                ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${product.description ? `<p class="product-desc">${product.description}</p>` : ''}
                <p class="price">GHS ${product.price}</p>
                <a href="https://wa.me/${whatsappNumber}?text=Hi,%20I%20want%20to%20order%20the%20${encodeURIComponent(product.name)}%20(GHS%20${product.price})" class="btn primary" target="_blank">Order Now</a>
            </div>
        </div>
    `;
}

// Keep old function as alias for compatibility
async function loadSiteProducts() {
    initLiveProducts();
}

// ============================================
// INJECT UTILITY STYLES
// ============================================
const fadeStyle = document.createElement("style");
fadeStyle.textContent = `
    .loading-products {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #94a3b8;
    }
    .loading-products p {
        font-size: 1.2rem;
        animation: loadingPulse 1.5s ease-in-out infinite;
    }
    @keyframes loadingPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .empty-products {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #94a3b8;
    }
    .empty-products p {
        font-size: 1.5rem;
        margin-bottom: 10px;
    }
    .empty-products .sub {
        font-size: 1rem;
        color: #64748b;
    }
    .product-category {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 12px;
        background: rgba(0,0,0,0.7);
        color: var(--primary-color, #22c55e);
        font-size: 0.8rem;
        border-radius: 20px;
    }
    .product-image {
        position: relative;
    }
    .product-desc {
        font-size: 0.9rem;
        color: #94a3b8;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(fadeStyle);
