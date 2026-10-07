import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Emulate mobile + slow CPU + network
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 150
  });

  console.log('Measuring landing page...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcp = 0;
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });
      observer.observe({type: 'largest-contentful-paint', buffered: true});
      
      setTimeout(() => {
        resolve({
          lcp,
          nav: performance.getEntriesByType('navigation')[0].responseStart
        });
      }, 1000);
    });
  });

  console.log('LANDING PAGE METRICS:');
  console.log('LCP:', metrics.lcp);
  console.log('TTFB:', metrics.nav);

  await browser.close();
})();
