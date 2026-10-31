// Temporarily copy tests/fixtures/base-ui/page.tsx to src/app/ui-migration-check/page.tsx.
// Start Next dev, open /ui-migration-check in an isolated CLI session, then run this file.
// No auth/database/API mutations. Remove the app fixture before production builds.
// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(15000);
  const url = new URL('/ui-migration-check', page.url()).href;
  const results = [], errors = [];
  const check = (value, message) => { if (!value) throw new Error(message); };
  const onError = error => errors.push(error.message);
  const button = name => page.getByRole('button', { name, exact: true });
  const hidden = locator => locator.waitFor({ state: 'hidden', timeout: 6000 });
  page.on('pageerror', onError);
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 }); await page.goto(url);
      await button('Open dialog').waitFor();
      await button('Show toast').click();
      const toast = page.locator('[data-slot="toast"]'); await toast.waitFor();
      check((await toast.textContent()).includes('Fixture saved'), 'Toast title');
      await toast.hover();
      await page.locator('[data-slot="toast-close"]').click(); await hidden(toast);
      await button('Open drawer').click();
      const drawer = page.getByRole('dialog', { name: 'Drawer check', exact: true }); await drawer.waitFor();
      await button('Open nested dialog').click();
      const nested = page.getByRole('dialog', { name: 'Nested check', exact: true }); await nested.waitFor();
      await button('Close nested dialog').click(); await hidden(nested);
      check(await drawer.isVisible(), 'Nested dialog closed its drawer');
      await button('Close drawer').click(); await hidden(drawer);
      check(await button('Disabled action').isDisabled(), 'Disabled button state');
      check(await page.getByRole('link', { name: 'Native link', exact: true }).count() === 1, 'Button link role');
      await button('Open dialog').click();
      const dialog = page.getByRole('dialog', { name: 'Dialog check', exact: true }); await dialog.waitFor();
      check(await page.getByRole('textbox', { name: 'Dialog name' }).evaluate(el => el === document.activeElement), 'Dialog initial focus');
      await page.keyboard.press('Tab'); check(await dialog.evaluate(el => el.contains(document.activeElement)), 'Dialog focus trap');
      await page.keyboard.press('Escape'); await hidden(dialog);
      check(await button('Open dialog').evaluate(el => el === document.activeElement), 'Dialog focus return');
      const alert = page.getByRole('alertdialog', { name: 'Delete fixture?' });
      await button('Open alert').click(); await alert.waitFor(); await button('Cancel alert').click(); await hidden(alert);
      await button('Open alert').click(); await button('Confirm alert').click(); await hidden(alert);
      await button('Open menu').click(); const menu = page.getByRole('menu'); await menu.waitFor();
      const item = page.getByRole('menuitemcheckbox', { name: 'Show extras' });
      await item.click(); check(await item.getAttribute('aria-checked') === 'true', 'Menu checkbox');
      check(await menu.isVisible(), 'Menu checkbox should remain open');
      await page.getByRole('menuitem', { name: 'Open dialog from menu' }).click(); await dialog.waitFor();
      await button('Close dialog').click(); await hidden(dialog); await page.keyboard.press('Escape'); await hidden(menu);
      await button('Open menu').click(); await page.getByRole('menuitem', { name: 'Perform action' }).click(); await hidden(menu);
      await page.getByText('Action performed', { exact: true }).waitFor();
      await button('Open menu').click();
      await page.getByText('Open menu form', { exact: true }).click();
      const menuForm = page.getByRole('dialog', { name: 'Menu form', exact: true }); await menuForm.waitFor();
      for (const name of ['Menu form input', 'Menu form textarea']) {
        const field = page.getByRole('textbox', { name, exact: true });
        await field.focus(); await page.keyboard.type('a b');
        check(await field.inputValue() === 'a b', `Menu swallowed text or Space: ${name}`);
        await field.press('ArrowLeft'); await page.keyboard.type('x');
        check(await field.inputValue() === 'a xb', `Menu swallowed ArrowLeft: ${name}`);
        await field.press('ArrowRight'); await page.keyboard.type('y');
        check(await field.inputValue() === 'a xby', `Menu swallowed ArrowRight: ${name}`);
        check(await field.evaluate(el => el === document.activeElement), `Menu stole dialog focus: ${name}`);
      }
      await page.keyboard.press('Escape'); await hidden(menuForm);
      check(await menu.isVisible(), 'Escape dismissed the parent menu with the form');
      await page.keyboard.press('Escape'); await hidden(menu);
      const checkbox = page.getByRole('checkbox', { name: 'Example checkbox', exact: true });
      await checkbox.press('Space'); check(await checkbox.getAttribute('aria-checked') === 'true', 'Checkbox keyboard');
      check(await page.getByRole('checkbox', { name: 'Mixed checkbox' }).getAttribute('aria-checked') === 'mixed', 'Mixed checkbox');
      const toggle = page.getByRole('switch', { name: 'Enable feature' });
      await toggle.press('Space'); check(await toggle.getAttribute('aria-checked') === 'true', 'Switch keyboard');
      const first = page.getByRole('tab', { name: 'First tab' }), second = page.getByRole('tab', { name: 'Second tab' });
      await first.focus(); await page.keyboard.press('ArrowRight'); check(await first.getAttribute('aria-selected') === 'true', 'Tabs manual activation');
      await second.press('Enter'); check(await second.getAttribute('aria-selected') === 'true', 'Tab Enter activation');
      await button('Toggle details').click(); await page.getByText('Collapsible details', { exact: true }).waitFor();
      await button('Toggle details').click(); await hidden(page.getByText('Collapsible details', { exact: true }));
      await button('Toggle details').focus(); await page.keyboard.press('Tab');
      check(await button('Hint').evaluate(el => el === document.activeElement), 'Tooltip keyboard focus');
      await page.locator('[data-slot="tooltip-content"]').waitFor(); await page.keyboard.press('Escape'); await hidden(page.locator('[data-slot="tooltip-content"]'));
      await button('Submit fixture').click(); await page.getByText('Submitted 1', { exact: true }).waitFor();
      if (width < 768) {
        await button('Toggle Sidebar').click(); const sheet = page.getByRole('dialog', { name: 'Sidebar', exact: true }); await sheet.waitFor();
        await page.waitForTimeout(250); const box = await sheet.boundingBox();
        check(box && Math.abs(box.x) < 2 && box.width <= width && Math.abs(box.height - 1000) < 3, 'Mobile sidebar geometry');
        check(await sheet.getByRole('link', { name: 'Fixture home' }).count() === 1, 'Mobile sidebar link');
        await page.screenshot({ path: '.playwright-cli/base-ui-mobile.png' }); await page.keyboard.press('Escape'); await hidden(sheet);
      } else {
        await button('Toggle Sidebar').click(); check(await page.locator('[data-slot="sidebar"][data-state]').getAttribute('data-state') === 'collapsed', 'Sidebar collapse');
        await page.keyboard.press('Control+b'); check(await page.locator('[data-slot="sidebar"][data-state]').getAttribute('data-state') === 'expanded', 'Sidebar hotkey');
        await page.screenshot({ path: '.playwright-cli/base-ui-desktop.png', fullPage: true });
      }
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow');
      results.push({ width, interactions: 'passed' });
    }
    check(errors.length === 0, errors.join('\n')); return { results, errors };
  } finally { page.off('pageerror', onError); }
}
