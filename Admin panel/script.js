// ============================================
// KAPZ KOLLECTIONS - ADMIN PANEL
// Production Build v2.0
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Production mode - disable console logs
const isDev = false;

// ============================================
// Check if logged in
// ============================================
if (!localStorage.getItem("adminLoggedIn") && !window.location.href.includes("index.html")) {
    window.location.href = "/admin/";
}

// ============================================
// TAB NAVIGATION
// ============================================
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = item.getAttribute("data-tab");
        switchTab(tabId);
    });
});

function switchTab(tabId) {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
    document.getElementById(tabId).classList.add("active");
}

// Make switchTab global
window.switchTab = switchTab;

// ============================================
// LOGOUT
// ============================================
window.logout = function() {
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "/admin/";
}

// ============================================
// DASHBOARD STATS
// ============================================
async function loadDashboardStats() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach(doc => products.push(doc.data()));
        
        document.getElementById("totalProducts").textContent = products.length;
        
        if (products.length > 0) {
            const avgPrice = products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / products.length;
            document.getElementById("avgPrice").textContent = `GHS ${avgPrice.toFixed(0)}`;
        }
        
        const settingsDoc = await getDoc(doc(db, "settings", "site"));
        if (settingsDoc.exists() && settingsDoc.data().lastUpdated) {
            const date = new Date(settingsDoc.data().lastUpdated);
            document.getElementById("lastUpdated").textContent = date.toLocaleDateString();
        }
        
        const recentContainer = document.getElementById("recentProducts");
        if (products.length === 0) {
            recentContainer.innerHTML = `<p class="empty-message">No products yet. Add your first product!</p>`;
        } else {
            const recent = products.slice(-5).reverse();
            recentContainer.innerHTML = recent.map(p => `
                <div class="recent-item">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                    <div class="recent-info">
                        <h4>${p.name}</h4>
                        <span class="category-tag">${p.category || 'Uncategorized'}</span>
                    </div>
                    <span class="recent-price">GHS ${p.price}</span>
                </div>
            `).join("");
        }
    } catch (error) {
        if (isDev) console.error("Error loading dashboard:", error);
        showNotification("⚠️ Connection error. Please refresh.", "error");
    }
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================
async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, "settings", "site"));
        const settings = settingsDoc.exists() ? settingsDoc.data() : {};
        
        document.getElementById("businessName").value = settings.businessName || "Kapz Kollections";
        document.getElementById("tagline").value = settings.tagline || "Sports Apparel & Sneakers Delivered Fast";
        document.getElementById("aboutText").value = settings.aboutText || "";
        document.getElementById("phone1").value = settings.phone1 || "055 673 4640";
        document.getElementById("phone2").value = settings.phone2 || "024 683 7269";
        document.getElementById("whatsapp").value = settings.whatsapp || "233556734640";
        document.getElementById("email").value = settings.email || "";
        document.getElementById("address").value = settings.address || "Shell Signboard, Spintex";
        document.getElementById("city").value = settings.city || "Accra, Ghana";
        document.getElementById("mapUrl").value = settings.mapUrl || "";
        document.getElementById("instagram").value = settings.instagram || "";
        document.getElementById("facebook").value = settings.facebook || "";
        document.getElementById("tiktok").value = settings.tiktok || "";
        document.getElementById("twitter").value = settings.twitter || "";
        document.getElementById("logoUrl").value = settings.logoUrl || "";
        document.getElementById("faviconUrl").value = settings.faviconUrl || "";
        document.getElementById("primaryColor").value = settings.primaryColor || "#22c55e";
        document.getElementById("openingHours").value = settings.openingHours || "";
        document.getElementById("closedDays").value = settings.closedDays || "";
    } catch (error) {
        if (isDev) console.error("Error loading settings:", error);
    }
}

window.saveSettings = async function() {
    try {
        const settings = {
            businessName: document.getElementById("businessName").value,
            tagline: document.getElementById("tagline").value,
            aboutText: document.getElementById("aboutText").value,
            phone1: document.getElementById("phone1").value,
            phone2: document.getElementById("phone2").value,
            whatsapp: document.getElementById("whatsapp").value,
            email: document.getElementById("email").value,
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
            mapUrl: document.getElementById("mapUrl").value,
            instagram: document.getElementById("instagram").value,
            facebook: document.getElementById("facebook").value,
            tiktok: document.getElementById("tiktok").value,
            twitter: document.getElementById("twitter").value,
            logoUrl: document.getElementById("logoUrl").value,
            faviconUrl: document.getElementById("faviconUrl").value,
            primaryColor: document.getElementById("primaryColor").value,
            openingHours: document.getElementById("openingHours").value,
            closedDays: document.getElementById("closedDays").value,
            lastUpdated: new Date().toISOString()
        };

        await setDoc(doc(db, "settings", "site"), settings);
        showNotification("✅ Settings saved to Firebase!");
        loadDashboardStats();
    } catch (error) {
        if (isDev) console.error("Error saving settings:", error);
        showNotification("❌ Error saving settings", "error");
    }
}

window.handleLogoUpload = function(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("logoUrl").value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// ============================================
// PRODUCTS MANAGEMENT - SMART REAL-TIME UPDATES
// ============================================
let productsUnsubscribe = null;
let currentProducts = new Map(); // Store current products for smart updates

function initLiveProducts() {
    const container = document.getElementById("productsList");
    const countEl = document.getElementById("productCount");
    
    if (!container) return;
    
    // Unsubscribe from previous listener if exists
    if (productsUnsubscribe) productsUnsubscribe();
    
    // Set up real-time listener with smart updates
    productsUnsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
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
                // Check if product was updated
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
        
        // Update the current products map
        currentProducts = newProducts;
        
        // Get sorted products array
        const products = Array.from(newProducts.values()).sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
        
        if (countEl) countEl.textContent = products.length;
        
        // Handle empty state
        if (products.length === 0) {
            container.innerHTML = `<p class="empty-message">No products yet. Add your first product above!</p>`;
            return;
        }
        
        // Smart DOM updates
        if (removedIds.length > 0 || addedIds.length > 0 || container.children.length === 0 || container.querySelector('.empty-message')) {
            // Full re-render needed
            container.innerHTML = products.map(product => createProductCardHTML(product, addedIds.includes(product.id))).join("");
        } else if (updatedIds.length > 0) {
            // Only update changed cards
            updatedIds.forEach(id => {
                const card = container.querySelector(`[data-id="${id}"]`);
                if (card) {
                    const product = newProducts.get(id);
                    const newCard = document.createElement('div');
                    newCard.innerHTML = createProductCardHTML(product, false);
                    const newCardElement = newCard.firstElementChild;
                    newCardElement.classList.add('updating');
                    card.replaceWith(newCardElement);
                }
            });
        }
        
        // Update dashboard stats
        updateDashboardStats(products);
        
    }, (error) => {
        if (isDev) console.error("Error with live products:", error);
        showNotification("❌ Error loading products", "error");
    });
}

// Create product card HTML
function createProductCardHTML(product, isNew = false) {
    return `
        <div class="product-card ${isNew ? 'newly-added' : ''}" data-id="${product.id}">
            <div class="product-image-wrap">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
                <span class="category-badge">${product.category || 'Uncategorized'}</span>
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                ${product.description ? `<p class="description">${product.description}</p>` : ''}
                <p class="price">GHS ${product.price}</p>
                <div class="product-actions">
                    <button class="btn small edit" onclick="openEditModal('${product.id}')">✏️ Edit</button>
                    <button class="btn small delete" onclick="deleteProduct('${product.id}')">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `;
}

// Keep loadProducts as alias for compatibility
async function loadProducts() {
    // If live listener not active, start it
    if (!productsUnsubscribe) {
        initLiveProducts();
    }
}

// Update dashboard stats from products array
function updateDashboardStats(products) {
    const totalEl = document.getElementById("totalProducts");
    const avgEl = document.getElementById("avgPrice");
    const recentContainer = document.getElementById("recentProducts");
    
    if (totalEl) totalEl.textContent = products.length;
    
    if (avgEl && products.length > 0) {
        const avgPrice = products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / products.length;
        avgEl.textContent = `GHS ${avgPrice.toFixed(0)}`;
    }
    
    if (recentContainer) {
        if (products.length === 0) {
            recentContainer.innerHTML = `<p class="empty-message">No products yet. Add your first product!</p>`;
        } else {
            const recent = products.slice(0, 5);
            recentContainer.innerHTML = recent.map(p => `
                <div class="recent-item">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                    <div class="recent-info">
                        <h4>${p.name}</h4>
                        <span class="category-tag">${p.category || 'Uncategorized'}</span>
                    </div>
                    <span class="recent-price">GHS ${p.price}</span>
                </div>
            `).join("");
        }
    }
}

window.filterProducts = async function() {
    const searchTerm = document.getElementById("searchProducts").value.toLowerCase();
    const category = document.getElementById("filterCategory").value;
    
    // For filtering, we need to get current data
    const container = document.getElementById("productsList");
    const cards = container.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const desc = card.querySelector('.description')?.textContent.toLowerCase() || '';
        const cat = card.querySelector('.category-badge').textContent;
        
        const matchesSearch = !searchTerm || name.includes(searchTerm) || desc.includes(searchTerm);
        const matchesCategory = category === 'all' || cat === category;
        
        card.style.display = (matchesSearch && matchesCategory) ? '' : 'none';
    });
}

window.addProduct = async function() {
    const name = document.getElementById("productName").value.trim();
    const price = document.getElementById("productPrice").value.trim();
    const category = document.getElementById("productCategory").value;
    const description = document.getElementById("productDescription").value.trim();
    const image = document.getElementById("productImage").value.trim();
    
    if (!name || !price) {
        showNotification("❌ Please fill in product name and price!", "error");
        return;
    }
    
    // Get the add button and show loading state
    const addBtn = document.querySelector('.add-product-card .btn.primary');
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '⏳ Adding...';
    addBtn.disabled = true;
    
    try {
        await addDoc(collection(db, "products"), {
            name: name,
            price: price,
            category: category,
            description: description,
            image: image || "https://via.placeholder.com/200x200?text=No+Image",
            createdAt: new Date().toISOString()
        });
        
        // Clear form fields
        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productDescription").value = "";
        document.getElementById("productImage").value = "";
        if (document.getElementById("productImageFile")) {
            document.getElementById("productImageFile").value = "";
        }
        
        // Show success state briefly
        addBtn.innerHTML = '✅ Added!';
        addBtn.classList.add('success-state');
        
        // Smooth refresh - scroll to products list
        const productsList = document.getElementById("productsList");
        
        // Add loading overlay to products grid
        productsList.style.opacity = '0.5';
        productsList.style.pointerEvents = 'none';
        
        // Reload products with animation
        await loadProducts();
        await loadDashboardStats();
        
        // Remove loading overlay
        productsList.style.opacity = '1';
        productsList.style.pointerEvents = 'auto';
        
        // Highlight the new product (first one after reload)
        const newProduct = productsList.querySelector('.product-card');
        if (newProduct) {
            newProduct.classList.add('newly-added');
            setTimeout(() => newProduct.classList.remove('newly-added'), 2000);
        }
        
        showNotification("✅ Product added successfully!");
        
        // Reset button after delay
        setTimeout(() => {
            addBtn.innerHTML = originalText;
            addBtn.disabled = false;
            addBtn.classList.remove('success-state');
        }, 1500);
        
        // Refresh preview iframe if visible
        refreshPreviewSilently();
        
    } catch (error) {
        if (isDev) console.error("Error adding product:", error);
        showNotification("❌ Error adding product", "error");
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
    }
}

// Silent preview refresh (doesn't interrupt user)
function refreshPreviewSilently() {
    const previewFrame = document.getElementById("previewFrame");
    if (previewFrame && previewFrame.contentWindow) {
        try {
            previewFrame.contentWindow.location.reload();
        } catch (e) {
            // Cross-origin, just reset src
            previewFrame.src = previewFrame.src;
        }
    }
}

// ============================================
// EDIT MODAL
// ============================================
window.openEditModal = async function(productId) {
    try {
        const productDoc = await getDoc(doc(db, "products", productId));
        if (!productDoc.exists()) {
            showNotification("❌ Product not found", "error");
            return;
        }
        
        const product = productDoc.data();
        
        document.getElementById("editIndex").value = productId;
        document.getElementById("editName").value = product.name;
        document.getElementById("editPrice").value = product.price;
        document.getElementById("editCategory").value = product.category || "Other";
        document.getElementById("editDescription").value = product.description || "";
        document.getElementById("editImage").value = product.image;
        document.getElementById("editImagePreview").src = product.image;
        
        document.getElementById("editModal").classList.add("show");
    } catch (error) {
        if (isDev) console.error("Error opening edit modal:", error);
        showNotification("❌ Error loading product", "error");
    }
}

window.closeEditModal = function() {
    document.getElementById("editModal").classList.remove("show");
}

window.handleEditImageUpload = function(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("editImage").value = e.target.result;
            document.getElementById("editImagePreview").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

window.saveEditProduct = async function() {
    const productId = document.getElementById("editIndex").value;
    const saveBtn = document.querySelector('.modal-footer .btn.primary');
    const originalText = saveBtn.innerHTML;
    
    saveBtn.innerHTML = '⏳ Saving...';
    saveBtn.disabled = true;
    
    try {
        await updateDoc(doc(db, "products", productId), {
            name: document.getElementById("editName").value,
            price: document.getElementById("editPrice").value,
            category: document.getElementById("editCategory").value,
            description: document.getElementById("editDescription").value,
            image: document.getElementById("editImage").value,
            updatedAt: new Date().toISOString()
        });
        
        saveBtn.innerHTML = '✅ Saved!';
        
        setTimeout(async () => {
            closeEditModal();
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            
            // Smooth refresh
            const productsList = document.getElementById("productsList");
            productsList.style.opacity = '0.5';
            
            await loadProducts();
            await loadDashboardStats();
            
            productsList.style.opacity = '1';
            
            // Highlight updated product
            const updatedCard = document.querySelector(`[data-id="${productId}"]`);
            if (updatedCard) {
                updatedCard.classList.add('newly-added');
                setTimeout(() => updatedCard.classList.remove('newly-added'), 2000);
            }
            
            refreshPreviewSilently();
        }, 500);
        
        showNotification("✅ Product updated!");
    } catch (error) {
        if (isDev) console.error("Error updating product:", error);
        showNotification("❌ Error updating product", "error");
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

window.deleteProduct = async function(productId) {
    if (!confirm("🗑️ Delete this product?")) return;
    
    // Find the card and add deleting animation
    const card = document.querySelector(`[data-id="${productId}"]`);
    if (card) {
        card.classList.add('deleting');
    }
    
    try {
        await deleteDoc(doc(db, "products", productId));
        
        // Animate card removal
        if (card) {
            card.style.transform = 'scale(0.8)';
            card.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        await loadProducts();
        await loadDashboardStats();
        showNotification("✅ Product deleted!");
        
        refreshPreviewSilently();
    } catch (error) {
        if (isDev) console.error("Error deleting product:", error);
        showNotification("❌ Error deleting product", "error");
        if (card) {
            card.classList.remove('deleting');
            card.style.transform = '';
            card.style.opacity = '';
        }
    }
}

window.handleImageUpload = function(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("productImage").value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// ============================================
// PREVIEW
// ============================================
window.openMainSite = function() {
    window.open("/", "_blank");
}

window.refreshPreview = function() {
    const iframe = document.getElementById("previewFrame");
    iframe.src = iframe.src;
    showNotification("🔄 Preview refreshed!");
}

// ============================================
// BACKUP & RESTORE
// ============================================
window.exportData = async function() {
    try {
        const settingsDoc = await getDoc(doc(db, "settings", "site"));
        const settings = settingsDoc.exists() ? settingsDoc.data() : {};
        
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach(docSnap => {
            products.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        const data = {
            settings: settings,
            products: products,
            exportDate: new Date().toISOString(),
            version: "2.0-firebase"
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kapz-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification("✅ Backup downloaded!");
    } catch (error) {
        if (isDev) console.error("Error exporting:", error);
        showNotification("❌ Error exporting", "error");
    }
}

window.importData = async function(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!confirm("⚠️ This will overwrite all data. Continue?")) {
        input.value = "";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.settings) {
                await setDoc(doc(db, "settings", "site"), data.settings);
            }
            
            const existingProducts = await getDocs(collection(db, "products"));
            for (const docSnap of existingProducts.docs) {
                await deleteDoc(doc(db, "products", docSnap.id));
            }
            
            if (data.products) {
                for (const product of data.products) {
                    const { id, ...productData } = product;
                    await addDoc(collection(db, "products"), productData);
                }
            }
            
            loadSettings();
            loadProducts();
            loadDashboardStats();
            showNotification("✅ Data imported!");
        } catch (err) {
            if (isDev) console.error("Error importing:", err);
            showNotification("❌ Invalid backup file!", "error");
        }
    };
    reader.readAsText(file);
    input.value = "";
}

window.resetAllData = async function() {
    if (!confirm("⚠️ Delete ALL data?")) return;
    if (!confirm("🚨 FINAL WARNING: This cannot be undone!")) return;
    
    try {
        const products = await getDocs(collection(db, "products"));
        for (const docSnap of products.docs) {
            await deleteDoc(doc(db, "products", docSnap.id));
        }
        await deleteDoc(doc(db, "settings", "site"));
        
        loadSettings();
        loadProducts();
        loadDashboardStats();
        showNotification("🗑️ All data reset!");
    } catch (error) {
        if (isDev) console.error("Error resetting:", error);
        showNotification("❌ Error resetting", "error");
    }
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message, type = "success") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();
    
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add("show"), 10);
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal events
document.addEventListener("click", (e) => {
    const modal = document.getElementById("editModal");
    if (e.target === modal) closeEditModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
});

// ============================================
// SECURITY
// ============================================
function loadSecurityStatus() {
    const customPassword = localStorage.getItem("adminPassword");
    const lastChanged = localStorage.getItem("passwordLastChanged");
    
    const typeEl = document.getElementById("passwordType");
    const lastChangedEl = document.getElementById("passwordLastChanged");
    
    if (typeEl) {
        typeEl.textContent = customPassword ? "Custom" : "Default";
        if (customPassword) typeEl.classList.add("custom");
    }
    
    if (lastChangedEl) {
        lastChangedEl.textContent = lastChanged ? new Date(lastChanged).toLocaleDateString() : "Never";
    }
}

window.changePassword = function() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const storedPassword = localStorage.getItem("adminPassword") || "1234";
    
    if (currentPassword !== storedPassword) {
        showNotification("❌ Current password incorrect!", "error");
        return;
    }
    if (newPassword.length < 4) {
        showNotification("❌ Password must be 4+ characters!", "error");
        return;
    }
    if (newPassword !== confirmPassword) {
        showNotification("❌ Passwords don't match!", "error");
        return;
    }
    
    localStorage.setItem("adminPassword", newPassword);
    localStorage.setItem("passwordLastChanged", new Date().toISOString());
    
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    
    loadSecurityStatus();
    showNotification("✅ Password changed!");
}

window.showResetInstructions = function() {
    alert(`🔄 PASSWORD RESET:

1. Press F12 (Developer Tools)
2. Go to Application → Local Storage
3. Delete "adminPassword"
4. Refresh and login with: 1234`);
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    initLiveProducts();  // Use real-time listener instead of loadProducts
    loadDashboardStats();
    loadSecurityStatus();
});
