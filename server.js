const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    // Decode URL (handle spaces in filenames)
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    
    // Get referer to determine context (admin vs main)
    const referer = req.headers.referer || '';
    const isAdminContext = referer.includes('/admin');
    
    let filePath;
    
    // Handle admin routes
    if (urlPath === '/admin' || urlPath === '/admin/') {
        filePath = path.join(__dirname, 'Admin panel', 'index.html');
    } else if (urlPath.startsWith('/admin/')) {
        // Remove /admin/ prefix and serve from Admin panel folder
        const adminFile = urlPath.slice(7);
        filePath = path.join(__dirname, 'Admin panel', adminFile);
    } else if (urlPath === '/' || urlPath === '/index.html') {
        filePath = path.join(__dirname, 'Main web', 'index.html');
    } else if (isAdminContext && !urlPath.startsWith('/Main')) {
        // Request from admin page - serve from Admin panel
        filePath = path.join(__dirname, 'Admin panel', urlPath);
    } else {
        // All other files come from Main web folder
        filePath = path.join(__dirname, 'Main web', urlPath);
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found: ' + urlPath);
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
