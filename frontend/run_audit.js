import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
    formFactor: 'mobile',
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      requestLatencyMs: 150,
      downloadThroughputKbps: 1.6 * 1024,
      uploadThroughputKbps: 750,
      cpuSlowdownMultiplier: 4,
    }
  };

  const urls = [
    { name: 'landing', url: 'http://localhost:4173/' },
    { name: 'products', url: 'http://localhost:4173/products' }
  ];

  for (const {name, url} of urls) {
    console.log(`Auditing ${name}...`);
    const runnerResult = await lighthouse(url, options);
    const audits = runnerResult.lhr.audits;
    console.log(`${name.toUpperCase()}:`);
    console.log(`  LCP: ${audits['largest-contentful-paint'].displayValue}`);
    console.log(`  TBT: ${audits['total-blocking-time'].displayValue}`);
    console.log(`  CLS: ${audits['cumulative-layout-shift'].displayValue}`);
    console.log(`  TTFB: ${audits['server-response-time'].displayValue}`);
  }

  await chrome.kill();
}

runLighthouse().catch(console.error);
