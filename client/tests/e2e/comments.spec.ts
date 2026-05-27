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

async function joinProject(
  request: APIRequestContext,
  token: string,
  inviteCode: string
): Promise<void> {
  await request.post('/api/projects/join', {
    data: { inviteCode },
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createBug(
  request: APIRequestContext,
  token: string,
  projectId: string
): Promise<{ id: string }> {
  const res = await request.post(`/api/projects/${projectId}/bugs`, {
    data: {
      title: 'Test bug',
      description: 'Test description',
      expectedBehavior: 'It works',
      actualBehavior: 'It does not work',
      severity: 'MEDIUM',
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function createComment(
  request: APIRequestContext,
  token: string,
  projectId: string,
  bugId: string,
  content: string
): Promise<{ id: string; content: string }> {
  const res = await request.post(`/api/projects/${projectId}/bugs/${bugId}/comments`, {
    data: { content },
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

test('post a comment and see it appear', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Comment Project');
  const bug = await createBug(request, token, project.id);

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}/bugs/${bug.id}`);

  await page.getByPlaceholder('Write a comment...').fill('This is my comment');
  await page.getByRole('button', { name: 'Post comment' }).click();

  await expect(page.getByText('This is my comment')).toBeVisible();
});

test('edit a comment and see the changes reflected', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Edit Comment Project');
  const bug = await createBug(request, token, project.id);
  await createComment(request, token, project.id, bug.id, 'Original comment');

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}/bugs/${bug.id}`);

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Original comment' })
    .getByRole('button', { name: 'Edit' })
    .click();

  // edit textarea is inside <li>, new comment textarea is inside <form>. No overlap
  await page.locator('li textarea').fill('Updated comment');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Updated comment')).toBeVisible();
  await expect(page.getByText('Original comment')).not.toBeVisible();
});

test('delete a comment and see it removed', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Delete Comment Project');
  const bug = await createBug(request, token, project.id);
  await createComment(request, token, project.id, bug.id, 'Comment to delete');

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}/bugs/${bug.id}`);

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Comment to delete' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await page.getByRole('button', { name: 'Yes, delete' }).click();

  await expect(page.getByText('Comment to delete')).not.toBeVisible();
});

test('non-author cannot see edit button on someone else\'s comment', async ({
  page,
  request,
}) => {
  const authorEmail = `author${Date.now()}@example.com`;
  const memberEmail = `member${Date.now()}@example.com`;

  const { token: authorToken } = await createVerifiedUser(request, authorEmail);
  const project = await createProject(request, authorToken, 'Multi-user Comment Project');
  const bug = await createBug(request, authorToken, project.id);
  await createComment(request, authorToken, project.id, bug.id, 'Author comment');

  const { token: memberToken, user: memberUser } = await createVerifiedUser(
    request,
    memberEmail
  );
  await joinProject(request, memberToken, project.inviteCode);

  await loginAs(page, memberToken, memberUser);
  await page.goto(`/projects/${project.id}/bugs/${bug.id}`);

  await expect(page.getByText('Author comment')).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Author comment' }).getByRole('button', { name: 'Edit' })
  ).not.toBeVisible();
});
