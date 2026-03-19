import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as path from 'path';

export async function launchBrowser() {
  if (Boolean(process.env.VERCEL)) {
    const chromiumBinPath = path.join(
      process.cwd(),
      'node_modules',
      '@sparticuz',
      'chromium',
      'bin',
    );
    const executablePath = await chromium.executablePath(chromiumBinPath);
    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  return puppeteer.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}
