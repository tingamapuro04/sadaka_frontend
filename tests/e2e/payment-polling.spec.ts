import { test, expect } from '@playwright/test';

const churchUsername = 'grace-community';
const transactionId = 'tx-e2e-polling-001';

const payPageData = {
  church: {
    id: 'church-1',
    name: 'Grace Community',
    username: churchUsername,
    phone: '254712345678',
    groups_enabled: false,
    withdrawal_method: 'phone',
    withdrawal_number: '254712345678',
    payment_url: `http://localhost/pay/${churchUsername}`
  },
  categories: [
    { id: 'cat-1', name: 'Tithe' },
    { id: 'cat-2', name: 'Offering' }
  ],
  groups: [],
  platform_fee_kes: 2
};

const paymentCreated = {
  transaction_id: transactionId,
  status: 'awaiting_payment',
  gross_amount: 100,
  fee: 2,
  total_amount: 102,
  status_url: `/api/v1/pay/${churchUsername}/transactions/${transactionId}`,
  poll_interval_seconds: 1,
  max_poll_seconds: 120
};

async function mockPayPageRoutes(page: import('@playwright/test').Page) {
  await page.route(`**/api/v1/pay/${churchUsername}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payPageData)
      });
      return;
    }

    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(paymentCreated)
      });
      return;
    }

    await route.fallback();
  });
}

async function fillAndSubmitPayment(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('712345678').fill('708374149');
  await page.getByPlaceholder('0').first().fill('100');
  await page.getByRole('button', { name: 'Pay Now' }).click();
}

test.describe('payment status polling', () => {
  test('transitions from awaiting to paid when status endpoint updates', async ({ page }) => {
    await mockPayPageRoutes(page);

    let pollCount = 0;
    await page.route(`**/api/v1/pay/${churchUsername}/transactions/${transactionId}`, async (route) => {
      pollCount += 1;
      const body =
        pollCount < 2
          ? paymentCreated
          : {
              ...paymentCreated,
              status: 'paid',
              mpesa_ref: 'QWE123ABC',
              paid_at: new Date().toISOString()
            };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body)
      });
    });

    await page.goto(`/pay/${churchUsername}`);
    await expect(page.getByRole('heading', { name: 'Grace Community' })).toBeVisible();

    await fillAndSubmitPayment(page);

    await expect(page.getByRole('heading', { name: 'Check your phone' })).toBeVisible();
    await expect(page.getByText('Prompt sent')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible({
      timeout: 10_000
    });
    await expect(page.getByText('QWE123ABC')).toBeVisible();
    expect(pollCount).toBeGreaterThanOrEqual(2);
  });

  test('transitions from awaiting to failed with M-Pesa reason', async ({ page }) => {
    await mockPayPageRoutes(page);

    await page.route(`**/api/v1/pay/${churchUsername}/transactions/${transactionId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...paymentCreated,
          status: 'failed',
          failure_reason: 'The balance is insufficient for the transaction.'
        })
      });
    });

    await page.goto(`/pay/${churchUsername}`);
    await fillAndSubmitPayment(page);

    await expect(page.getByRole('heading', { name: 'Check your phone' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Payment could not be completed' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('The balance is insufficient for the transaction.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });
});
