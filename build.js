const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

const siteKey =
    process.env.TURNSTILE_SITE_KEY ||
    process.env.CLOUDFLARE_TURNSTILE_SITE_KEY ||
    '';

const apiEndpoint =
    process.env.DNS_API_ENDPOINT || '';

const allowedExtensions = new Set([
    '.html',
    '.css',
    '.js',
    '.png',
    '.ico',
    '.svg',
    '.webmanifest',
    '.txt',
    '.xml'
]);

// Directories to skip
const skipDirs = new Set([
    'node_modules',
    'dist',
    '.git',
    '.github'
]);

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

if (!siteKey) {
    console.warn('TURNSTILE_SITE_KEY is not set; using placeholder in HTML files');
}

/**
 * Process a file: copy or transform based on type
 */
function processFile(sourcePath, destPath) {
    const fileName = path.basename(sourcePath);
    const ext = path.extname(fileName);

    // Skip hidden files
    if (fileName.startsWith('.')) {
        return;
    }

    // Check if file should be copied
    if (!allowedExtensions.has(ext)) {
        return;
    }

    // Process HTML files - replace env variables
    if (ext === '.html') {
        let html = fs.readFileSync(sourcePath, 'utf8');
        if (siteKey) {
            html = html.replace(/YOUR_TURNSTILE_SITE_KEY/g, siteKey);
        }
        fs.writeFileSync(destPath, html);
        console.log(`Processed: ${sourcePath}`);
        return;
    }

    // Process script.js - replace API endpoint
    if (fileName === 'script.js') {
        const script = fs.readFileSync(sourcePath, 'utf8');
        const output = script.replace('__API_ENDPOINT__', apiEndpoint);
        fs.writeFileSync(destPath, output);
        console.log(`Processed: ${sourcePath}`);
        return;
    }

    // Copy other files as-is
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${sourcePath}`);
}

/**
 * Recursively process directory
 */
function processDirectory(sourceDir, destDir) {
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            // Skip excluded directories
            if (skipDirs.has(entry.name) || entry.name.startsWith('.')) {
                continue;
            }

            // Create destination directory and recurse
            fs.mkdirSync(destPath, { recursive: true });
            processDirectory(sourcePath, destPath);
        } else if (entry.isFile()) {
            processFile(sourcePath, destPath);
        }
    }
}

// Start processing from root
processDirectory(rootDir, distDir);
console.log('\nBuild complete!');
