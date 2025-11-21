const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function installBrowser() {
    console.log('=== Starting Chrome Installation for Puppeteer ===');
    
    try {
        // Set the cache directory
        const cacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(process.cwd(), '.cache', 'puppeteer');
        
        console.log(`Cache directory: ${cacheDir}`);
        
        // Create cache directory if it doesn't exist
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
            console.log('Created cache directory');
        }
        
        // Install Chrome using puppeteer
        console.log('Installing Chrome browser...');
        execSync('npx puppeteer browsers install chrome', {
            stdio: 'inherit',
            env: {
                ...process.env,
                PUPPETEER_CACHE_DIR: cacheDir
            }
        });
        
        console.log('✅ Chrome browser installed successfully!');
        
    } catch (error) {
        console.error('❌ Failed to install Chrome:', error.message);
        // Don't throw error to let the build continue
        console.log('Continuing with build despite Chrome installation failure...');
    }
}

installBrowser();