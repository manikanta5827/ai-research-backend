const puppeteer = require('puppeteer');

async function getTopUrls(query, num = 5) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Hit the DuckDuckGo
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        await page.waitForSelector('[data-testid="result"]', { timeout: 10000 });

        const urls = await page.evaluate((maxResults) => {
            const results = document.querySelectorAll('[data-testid="result"]');
            const urlList = [];

            for (let i = 0; i < Math.min(results.length, maxResults); i++) {
                const result = results[i];
                const link = result.querySelector('h2 a[href]');
                if (link && link.href) {
                    urlList.push(link.href);
                }
            }

            return urlList;
        }, num);

        return urls;

    } catch (error) {
        console.error("Error searching:", error.message);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = getTopUrls;
