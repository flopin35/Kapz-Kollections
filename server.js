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
    
    let filePath;
    
    // Handle admin routes
    if (urlPath === '/admin' || urlPath === '/admin/') {
        filePath = path.join(__dirname, 'Admin panel', 'index.html');
    } else if (urlPath.startsWith('/admin/')) {
        filePath = path.join(__dirname, 'Admin panel', urlPath.slice(7));
    } else if (urlPath === '/' || urlPath === '/index.html') {
        filePath = path.join(__dirname, 'Main web', 'index.html');
    } else {
        // Check if file exists in Main web folder first
        const mainWebPath = path.join(__dirname, 'Main web', urlPath);
        const rootPath = path.join(__dirname, urlPath);
        
        if (fs.existsSync(mainWebPath)) {
            filePath = mainWebPath;
        } else if (fs.existsSync(rootPath)) {
            filePath = rootPath;
        } else {
            filePath = mainWebPath; // Default to Main web
        }
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
