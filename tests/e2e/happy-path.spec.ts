import { test, expect, type Page } from '@playwright/test';
import { SEED_USERS, SEED_USER_PASSWORD } from '../../src/lib/users';

// Seeded users (see src/lib/users.ts + scripts/seed.ts) — real email/password
// auth (tdd.md's 2026-07-28 Amendment Log entry superseded the original
// seeded pick-login this issue's title still references).
const ALICE = SEED_USERS.find((u) => u.name === 'Alice Kim')!;
const BOB = SEED_USERS.find((u) => u.name === 'Bob Rivera')!;

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(SEED_USER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('/login');
}

test('login -> create document -> autosave -> share -> shared user can access per role', async ({ page }) => {
  const uniqueText = `E2E test content ${Date.now()}`;

  // 1. Alice logs in and creates a new document.
  await login(page, ALICE.email);
  await page.locator('.dl-side-actions').getByRole('button', { name: 'New document' }).click();
  await page.waitForURL(/\/documents\/.+/);
  const docUrl = page.url();

  // 2. She types content into the editor and autosave fires.
  await page.locator('.ProseMirror').click();
  await page.keyboard.type(uniqueText);
  await expect(page.locator('.dl-tb-status[data-status="saved"]')).toBeVisible({ timeout: 10_000 });

  // 3. She shares the document with Bob as an editor.
  await page.locator('.dl-edhead').getByRole('button', { name: 'Share' }).click();
  await page.getByLabel('Collaborator email').fill(BOB.email);
  await page.getByLabel('Role').selectOption('editor');
  await page.locator('.dl-modal').getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('.dl-access-list')).toContainText(BOB.name);
  await page.getByRole('button', { name: 'Close' }).click();

  // 4. Bob logs in, opens the shared document directly, and sees Alice's content.
  await logout(page);
  await login(page, BOB.email);
  await page.goto(docUrl);
  await expect(page.locator('.ProseMirror')).toContainText(uniqueText);
  await expect(page.locator('.dl-pill[data-role]')).toHaveText('Can edit');

  // 5. As an editor, Bob can add content and autosave fires for him too.
  await page.locator('.ProseMirror').click();
  await page.keyboard.press('End');
  await page.keyboard.type(' — edited by Bob');
  await expect(page.locator('.dl-tb-status[data-status="saved"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.ProseMirror')).toContainText('edited by Bob');

  // 6. Alice demotes Bob to viewer; he loses edit access on reload.
  await logout(page);
  await login(page, ALICE.email);
  await page.goto(docUrl);
  await page.locator('.dl-edhead').getByRole('button', { name: 'Share' }).click();
  await page.getByLabel(`Role for ${BOB.name}`).selectOption('viewer');
  await expect(page.getByLabel(`Role for ${BOB.name}`)).toHaveValue('viewer');
  await page.getByRole('button', { name: 'Close' }).click();

  await logout(page);
  await login(page, BOB.email);
  await page.goto(docUrl);
  await expect(page.locator('.dl-pill[data-role]')).toHaveText('View only');
  await expect(page.locator('.dl-viewonly')).toBeVisible();
  await expect(page.locator('.dl-toolbar')).toHaveCount(0);

  // Cleanup: only the owner can delete; log back in as Alice and remove the test doc.
  await logout(page);
  await login(page, ALICE.email);
  await page.goto(docUrl);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete document' }).click();
  await page.waitForURL('/');
});
