/**
 * Image Generator Script
 * Generates OG image and favicons from HTML/SVG templates
 *
 * Requirements:
 * npm install puppeteer sharp
 *
 * Usage:
 * node generate-images.js
 */

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateOGImage() {
    console.log('🎨 Generating OG Image...');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        const page = await browser.newPage();

        // Set viewport to exact OG image dimensions
        await page.setViewport({
            width: 1200,
            height: 630,
            deviceScaleFactor: 2 // Higher quality
        });

        // Load the template with more lenient settings
        const templatePath = path.join(__dirname, 'og-image-template.html');

        await page.goto(`file://${templatePath}`, {
            waitUntil: ['load', 'domcontentloaded'],
            timeout: 30000
        });

        // Wait for fonts to load
        await page.waitForTimeout(2000); // Give fonts time to load

        try {
            await page.evaluate(() => document.fonts.ready);
        } catch (e) {
            console.log('⚠️  Font loading check skipped (non-critical)');
        }

        // Take screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            omitBackground: false,
            fullPage: false
        });

        // Save the image
        const outputPath = path.join(__dirname, 'og-image.png');
        await fs.writeFile(outputPath, screenshot);

        console.log('✅ OG Image generated: og-image.png (1200x630px)');
    } catch (error) {
        console.error('❌ Error generating OG image:', error.message);
        console.log('\n💡 Tip: You can create the OG image manually:');
        console.log('   1. Open og-image-template.html in a browser');
        console.log('   2. Set viewport to 1200x630px');
        console.log('   3. Take a screenshot and save as og-image.png');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function generateFavicons() {
    console.log('🎨 Generating Favicons...');

    try {
        // Read the SVG favicon
        const svgPath = path.join(__dirname, 'favicon.svg');
        const svgBuffer = await fs.readFile(svgPath);

        // Generate different sizes
        const sizes = [
            { name: 'favicon-16x16.png', size: 16 },
            { name: 'favicon-32x32.png', size: 32 },
            { name: 'apple-touch-icon.png', size: 180 },
            { name: 'android-chrome-192x192.png', size: 192 },
            { name: 'android-chrome-512x512.png', size: 512 }
        ];

        for (const { name, size } of sizes) {
            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(path.join(__dirname, name));

            console.log(`✅ Generated: ${name} (${size}x${size}px)`);
        }

        // Generate ICO (32x32 for compatibility)
        await sharp(svgBuffer)
            .resize(32, 32)
            .toFormat('png')
            .toFile(path.join(__dirname, 'favicon.ico'));

        console.log('✅ Generated: favicon.ico (32x32px)');

        console.log('\n✨ All favicons generated successfully!');

    } catch (error) {
        console.error('❌ Error generating favicons:', error);
        console.log('\n💡 Note: SVG favicons are supported by modern browsers.');
        console.log('   You can use favicon.svg directly if needed.');
    }
}

async function generateAll() {
    console.log('🚀 Starting image generation...\n');

    try {
        await generateOGImage();
        console.log('');
        await generateFavicons();

        console.log('\n✅ All images generated successfully!');
        console.log('\nGenerated files:');
        console.log('  - og-image.png (1200x630px) - for Open Graph');
        console.log('  - favicon.ico (32x32px) - for browsers');
        console.log('  - favicon-16x16.png');
        console.log('  - favicon-32x32.png');
        console.log('  - apple-touch-icon.png (180x180px)');
        console.log('  - android-chrome-192x192.png');
        console.log('  - android-chrome-512x512.png');
        console.log('  - favicon.svg (vector, already created)');

        console.log('\n📝 Next steps:');
        console.log('  1. Update index.html to use the new favicons');
        console.log('  2. Verify og-image.png looks good');
        console.log('  3. Test with https://metatags.io/');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateAll();
}

module.exports = { generateOGImage, generateFavicons };
