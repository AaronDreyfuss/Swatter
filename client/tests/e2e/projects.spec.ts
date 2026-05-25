import { test, expect, APIRequestContext, Page } from '@playwright/test';

const password = 'password123';

async function createVerifiedUser(
  request: APIRequestContext,
  email: string
): Promise<{ token: string; user: { id: string; email: string } }> {
  await request.post('/api/auth/register', { data: { email, password } });
  const codeRes = await request.get(
    `/api/test/verification-code?email=${encodeURIComponent(email)}`
  );
  const { verificationCode: code } = await codeRes.json();
  const verifyRes = await request.post('/api/auth/verify', { data: { email, code } });
  return verifyRes.json();
}

async function createProject(
  request: APIRequestContext,
  token: string,
  name: string
): Promise<{ id: string; name: string; inviteCode: string }> {
  const res = await request.post('/api/projects', {
    data: { name },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function loginAs(
  page: Page,
  token: string,
  user: { id: string; email: string }
): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user }
  );
}

test('create a project and see it appear in the list', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  await loginAs(page, token, user);

  await page.goto('/projects');
  await page.getByLabel('Project name').fill('My Test Project');
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByRole('button', { name: 'My Test Project' })).toBeVisible();
});

test('join a project via invite code and see it appear in the list', async ({
  page,
  request,
}) => {
  const ownerEmail = `owner${Date.now()}@example.com`;
  const memberEmail = `member${Date.now()}@example.com`;

  const { token: ownerToken } = await createVerifiedUser(request, ownerEmail);
  const project = await createProject(request, ownerToken, 'Shared Project');

  const { token: memberToken, user: memberUser } = await createVerifiedUser(
    request,
    memberEmail
  );
  await loginAs(page, memberToken, memberUser);

  await page.goto('/projects');
  await page.getByLabel('Invite code').fill(project.inviteCode);
  await page.getByRole('button', { name: 'Join project' }).click();

  await expect(page.getByRole('button', { name: 'Shared Project' })).toBeVisible();
});

test('invalid invite code shows a user facing error message', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  await loginAs(page, token, user);

  await page.goto('/projects');
  await page.getByLabel('Invite code').fill('INVALID1');
  await page.getByRole('button', { name: 'Join project' }).click();

  await expect(page.getByText('Invalid invite code')).toBeVisible();
});

test('clicking a project navigates to ProjectDetail', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Clickable Project');
  await loginAs(page, token, user);

  await page.goto('/projects');
  await page.getByRole('button', { name: 'Clickable Project' }).click();

  await expect(page).toHaveURL(`/projects/${project.id}`);
});
