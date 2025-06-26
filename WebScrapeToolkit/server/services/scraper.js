import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export class ScraperService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async captureGoogleSearch(query) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for search results to load
      await page.waitForSelector('#search', { timeout: 10000 });

      const screenshot = await page.screenshot({ fullPage: true });
      const html = await page.content();

      return { screenshot, html };
    } finally {
      await page.close();
    }
  }

  async captureWebpage(url) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const screenshot = await page.screenshot({ fullPage: true });
      const html = await page.content();

      return { screenshot, html };
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const scraperService = new ScraperService();