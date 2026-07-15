import { test, expect } from '@playwright/test';

const churchUsername = 'grace-community';
const eventSlug = 'youth-camp-2026';
const transactionId = 'tx-e2e-event-001';

const eventPageData = {
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
  event: {
    id: 'event-1',
    title: 'Youth Camp 2026',
    description: 'Camp fundraiser',
    slug: eventSlug,
    status: 'active',
    target_amount: 100000,
    paid_gross: 10000
  },
  platform_fee_kes: 2
};

const paymentCreated = {
  transaction_id: transactionId,
  status: 'awaiting_payment',
  gross_amount: 100,
  fee: 2,
  total_amount: 102,
  status_url: `/api/pay/${churchUsername}/events/${eventSlug}/transactions/${transactionId}`,
  poll_interval_seconds: 1,
  max_poll_seconds: 90
};

test.describe('event payment status polling', () => {
  test('transitions from awaiting to paid for event contributions', async ({ page }) => {
    await page.route(`**/api/pay/${churchUsername}/events/${eventSlug}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(eventPageData)
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

    let pollCount = 0;
    await page.route(
      `**/api/pay/${churchUsername}/events/${eventSlug}/transactions/${transactionId}`,
      async (route) => {
        pollCount += 1;
        const body =
          pollCount < 2
            ? paymentCreated
            : {
                ...paymentCreated,
                status: 'paid',
                mpesa_ref: 'EVTREF001',
                paid_at: new Date().toISOString()
              };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body)
        });
      }
    );

    await page.goto(`/pay/${churchUsername}/events/${eventSlug}`);
    await expect(page.getByText('Youth Camp 2026')).toBeVisible();

    await page.getByPlaceholder('712345678').fill('708374149');
    await page.getByLabel(/Amount \(KES\)/i).fill('100');
    await page.getByRole('button', { name: 'Pay Now' }).click();

    await expect(page.getByText(/prompt sent/i)).toBeVisible();
    await expect(page.getByText(/was successful/i)).toBeVisible({
      timeout: 15_000
    });
    await expect(page.getByText('Thank you!')).toBeVisible();
  });
});

