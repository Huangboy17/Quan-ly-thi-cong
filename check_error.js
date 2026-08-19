const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Page loaded');
    
    // We can't easily login without knowing credentials, but we can see if it throws an error immediately on load.
    // Or we can just type something into the email and password and click login.
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@yourdomain.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for network idle or 3 seconds
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    console.log('HTML length:', html.length);
  } catch (err) {
    console.error('SCRIPT_ERROR:', err);
  } finally {
    await browser.close();
  }
})();
