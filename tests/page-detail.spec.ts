import { test, expect } from '@playwright/test';

/**
 * Minimal schema fixture for the engineering_projects category.
 */
const SCHEMA_FIXTURE = {
  id: 'engineering_projects',
  name: 'Engineering Projects',
  pages: [
    {
      id: 'site_plan',
      name: 'Site Plan',
      blocks: [
        { id: 'site_drawing', label: 'Site Drawing Upload', order: 0, type: 'file' },
        { id: 'site_description', label: 'Site Description', order: 1, type: 'markdown' },
        { id: 'approved', label: 'Site Plan Approved', order: 2, type: 'checkbox' },
      ],
    },
  ],
};

/**
 * A page data fixture that is missing the categoryId field — this simulates
 * the state produced by the bug where CreatePageDialog saved with categoryId: ''.
 */
const PAGE_DATA_MISSING_CATEGORY = {
  jobId: 'TEST-JOB-001',
  pageNumber: '1',
  categoryId: '',   // intentionally empty to reproduce the bug
  pageSchemaId: 'site_plan',
  values: {
    site_drawing: '',
    site_description: '',
    approved: false,
  },
};

/**
 * A job fixture for TEST-JOB-001 — provides the correct categoryId
 * that the fallback logic in PageDetail should look up.
 */
const JOB_FIXTURE = {
  id: 'TEST-JOB-001',
  categoryId: 'engineering_projects',
  createdAt: 1704067200000,
};

test.describe('PageDetail — handles missing categoryId on newly created page', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock data before the app boots so Firebase is never called
    await page.addInitScript((mocks) => {
      (window as any).__dbServiceMocks__ = mocks;
    }, {
      schemas: { engineering_projects: SCHEMA_FIXTURE },
      jobs: { 'TEST-JOB-001': JOB_FIXTURE },
      pages: { 'TEST-JOB-001': { '1': PAGE_DATA_MISSING_CATEGORY } },
    });
  });

  test('loads page detail without error when categoryId is missing from page data', async ({ page }) => {
    await page.goto('/#/page/TEST-JOB-001/1');

    // The page should NOT redirect away — it should show the page schema name
    await expect(page.getByRole('heading', { name: 'Site Plan', level: 1 })).toBeVisible({ timeout: 10000 });

    // Verify the job/page identifier is shown
    await expect(page.getByText('TEST-JOB-001 / Page 1')).toBeVisible();

    // Verify no error toast appears
    await expect(page.getByText('Schema not found')).not.toBeVisible();
    await expect(page.getByText('Job not found')).not.toBeVisible();

    // Verify the fields from the schema are rendered
    await expect(page.getByText('Site Description')).toBeVisible();
    await expect(page.getByText('Site Plan Approved')).toBeVisible();
  });

  test('does not navigate away when categoryId is missing from page data', async ({ page }) => {
    await page.goto('/#/page/TEST-JOB-001/1');

    // Wait for the page to settle
    await page.waitForTimeout(3000);

    // Should still be on the page detail route, not redirected to '/'
    expect(page.url()).toContain('/page/TEST-JOB-001/1');
  });
});

test.describe('PageDetail — handles page with valid categoryId (regression)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((mocks) => {
      (window as any).__dbServiceMocks__ = mocks;
    }, {
      schemas: { engineering_projects: SCHEMA_FIXTURE },
      jobs: { 'JOB-VALID': { id: 'JOB-VALID', categoryId: 'engineering_projects', createdAt: 1704067200000 } },
      pages: {
        'JOB-VALID': {
          '1': {
            jobId: 'JOB-VALID',
            pageNumber: '1',
            categoryId: 'engineering_projects',
            pageSchemaId: 'site_plan',
            values: { site_drawing: '', site_description: 'Test description', approved: false },
          },
        },
      },
    });
  });

  test('loads page detail normally when categoryId is present', async ({ page }) => {
    await page.goto('/#/page/JOB-VALID/1');

    await expect(page.getByRole('heading', { name: 'Site Plan', level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('JOB-VALID / Page 1')).toBeVisible();
    await expect(page.getByText('Test description')).toBeVisible();
  });
});
