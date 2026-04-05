# Kapz Kollections 🛍️

A modern e-commerce website for sports apparel and sneakers with a real-time admin panel.

## Features

### Main Website

- 🛒 Product catalog with real-time updates
- 📱 WhatsApp ordering integration
- 🎨 Modern, responsive design
- ⚡ Instant product sync (no refresh needed)

### Admin Panel

- 📊 Dashboard with stats overview
- 🛍️ Product management (Add, Edit, Delete)
- ⚙️ Site settings configuration
- 💾 Backup & restore functionality
- 🔐 Password protection
- 👁️ Live preview

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: Firebase Firestore
- **Real-time**: Firestore onSnapshot listeners
- **Hosting**: Any static hosting (GitHub Pages, Netlify, Vercel, Firebase Hosting)

## Project Structure

```
Kapz Kollections/
├── Admin panel/
│   ├── index.html          # Admin login page
│   ├── dashboard.html      # Admin dashboard
│   ├── script.js           # Admin logic
│   ├── style.css           # Admin styles
│   └── firebase-config.js  # Firebase config
├── Main web/
│   ├── index.html          # Main website
│   ├── script.js           # Website logic
│   ├── style.css           # Website styles
│   ├── favicon.svg         # Site favicon
│   └── firebase-config.js  # Firebase config
└── README.md
```

## Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Get your config from Project Settings > Your Apps

### 2. Update Firebase Config

Replace the config in both `firebase-config.js` files:

- `Admin panel/firebase-config.js`
- `Main web/firebase-config.js`

### 3. Firestore Rules

Set these rules in Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - public read, admin write
    match /products/{product} {
      allow read: if true;
      allow write: if true; // Add authentication for production
    }
    // Settings - public read, admin write
    match /settings/{setting} {
      allow read: if true;
      allow write: if true; // Add authentication for production
    }
  }
}
```

### 4. Deploy

Upload to any static hosting:

- **GitHub Pages**: Push to `gh-pages` branch
- **Netlify**: Connect repo and deploy
- **Firebase Hosting**: `firebase deploy`
- **Vercel**: Import project

## Usage

### Admin Panel

1. Navigate to `Admin panel/index.html`
2. Login with password (default: `1234`)
3. Manage products and settings

### Main Website

1. Navigate to `Main web/index.html`
2. Products sync automatically from Firebase
3. Click "Order Now" to order via WhatsApp

## Default Admin Password

- **Password**: `1234`
- Change it in Admin Panel > Security

## License

MIT License - Feel free to use for your projects!

---

Built with ❤️ for Kapz Kollections
