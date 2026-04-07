const { test, expect } = require('@playwright/test');

test('gemsdev can sign in and see gallery/dashboard images', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('#username', 'gemsdev');
  await page.fill('#password', 'gemsdev123');
  await Promise.all([
    page.waitForURL(/\/app(\/.*)?$/),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('http://localhost:5173/app');
  await expect(page.getByText('Recents')).toBeVisible();
  await page.screenshot({ path: '/tmp/skygems-dashboard-after-fix.png', fullPage: true });

  await page.goto('http://localhost:5173/app/gallery');
  await expect(page.getByText('Design Gallery')).toBeVisible();
  const images = page.locator('img');
  await expect(images.first()).toBeVisible();
  const imageInfo = await images.evaluateAll((nodes) => nodes.map((node) => ({ src: node.getAttribute('src'), width: node.naturalWidth, height: node.naturalHeight })).slice(0, 6));
  console.log(JSON.stringify(imageInfo, null, 2));
  await page.screenshot({ path: '/tmp/skygems-gallery-after-fix.png', fullPage: true });
});
