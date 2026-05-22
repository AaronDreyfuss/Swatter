import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { resetDb } from '../helpers/setupDb';
import { createTestUser, createTestProject, createTestBug, createTestComment } from '../helpers/factories';

vi.mock('../../src/lib/resend', () => ({
  default: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

beforeEach(async () => {
  await resetDb();
});

async function createUserWithToken(overrides: { email?: string } = {}) {
  const user = await createTestUser(overrides);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'password123' });
  return { user, token: res.body.token as string };
}

const BASE = (projectId: string, bugId: string) =>
  `/api/projects/${projectId}/bugs/${bugId}/comments`;

describe('POST /:projectId/bugs/:bugId/comments', () => {
  it('creates a comment and returns 201', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .post(BASE(project.id, bug.id))
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is a comment' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('This is a comment');
    expect(res.body.author).toBeDefined();
  });

  it('returns 403 for a non-member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: nonMemberToken } = await createUserWithToken({ email: `nm-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .post(BASE(project.id, bug.id))
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({ content: 'Should not work' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /:projectId/bugs/:bugId/comments/:commentId', () => {
  it('author can update their comment', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);
    const comment = await createTestComment(bug.id, admin.id);

    const res = await request(app)
      .patch(`${BASE(project.id, bug.id)}/${comment.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Updated content');
  });

  it('Admin cannot edit someone else\'s comment', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);
    const comment = await createTestComment(bug.id, member.id);

    const res = await request(app)
      .patch(`${BASE(project.id, bug.id)}/${comment.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Admin edit attempt' });

    expect(res.status).toBe(403);
  });

  it('non-author Member cannot edit the comment', async () => {
    const { user: admin } = await createUserWithToken();
    const { user: author } = await createUserWithToken({ email: `author-${Date.now()}@example.com` });
    const { token: otherToken } = await createUserWithToken({ email: `other-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${otherToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);
    const comment = await createTestComment(bug.id, author.id);

    const res = await request(app)
      .patch(`${BASE(project.id, bug.id)}/${comment.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Unauthorized edit' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent comment', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .patch(`${BASE(project.id, bug.id)}/nonexistent-id`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Update' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /:projectId/bugs/:bugId/comments/:commentId', () => {
  it('author can delete their comment and receives the deleted record', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);
    const comment = await createTestComment(bug.id, admin.id);

    const res = await request(app)
      .delete(`${BASE(project.id, bug.id)}/${comment.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(comment.id);
  });

  it('Admin can delete someone else\'s comment and receives the deleted record', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);
    const comment = await createTestComment(bug.id, member.id);

    const res = await request(app)
      .delete(`${BASE(project.id, bug.id)}/${comment.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(comment.id);
  });

  it('non-author non-admin Member returns 403', async () => {
    const { user: admin } = await createUserWithToken();
    const { user: author } = await createUserWithToken({ email: `author-${Date.now()}@example.com` });
    const { token: otherToken } = await createUserWithToken({ email: `other-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${otherToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);
    const comment = await createTestComment(bug.id, author.id);

    const res = await request(app)
      .delete(`${BASE(project.id, bug.id)}/${comment.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent comment', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .delete(`${BASE(project.id, bug.id)}/nonexistent-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
