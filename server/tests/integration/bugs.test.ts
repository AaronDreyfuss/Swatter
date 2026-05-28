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

const BASE = (projectId: string) => `/api/projects/${projectId}/bugs`;

describe('POST /:projectId/bugs', () => {
  it('creates a bug and returns 201', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .post(BASE(project.id))
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Login crash',
        description: 'App crashes on login',
        expectedBehavior: 'User is logged in',
        actualBehavior: 'App crashes',
        severity: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Login crash');
    expect(res.body.status).toBe('OPEN');
    expect(res.body.assignedToId).toBeNull();
  });

  it('returns 403 for a non-member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: nonMemberToken } = await createUserWithToken({ email: `nm-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .post(BASE(project.id))
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({
        title: 'Login crash',
        description: 'App crashes on login',
        expectedBehavior: 'User is logged in',
        actualBehavior: 'App crashes',
        severity: 'HIGH',
      });

    expect(res.status).toBe(403);
  });
});

describe('GET /:projectId/bugs', () => {
  it('returns all bugs for the project', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    await createTestBug(project.id, admin.id);
    await createTestBug(project.id, admin.id, { title: 'Bug 2' });

    const res = await request(app)
      .get(BASE(project.id))
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters by status', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    await createTestBug(project.id, admin.id, { status: 'OPEN' });
    await createTestBug(project.id, admin.id, { status: 'RESOLVED' });

    const res = await request(app)
      .get(`${BASE(project.id)}?status=OPEN`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('OPEN');
  });

  it('filters by severity', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    await createTestBug(project.id, admin.id, { severity: 'HIGH' });
    await createTestBug(project.id, admin.id, { severity: 'LOW' });

    const res = await request(app)
      .get(`${BASE(project.id)}?severity=HIGH`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].severity).toBe('HIGH');
  });

  it('returns 403 for a non-member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: nonMemberToken } = await createUserWithToken({ email: `nm-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .get(BASE(project.id))
      .set('Authorization', `Bearer ${nonMemberToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /:projectId/bugs/:bugId', () => {
  it('returns the bug with comments', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);
    await createTestComment(bug.id, admin.id, { content: 'First comment' });

    const res = await request(app)
      .get(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(bug.id);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].content).toBe('First comment');
    expect(res.body.comments[0].author).toBeDefined();
  });

  it('includes assignedTo with id and email when the bug is assigned', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    await request(app)
      .patch(`${BASE(project.id)}/${bug.id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedToId: admin.id });

    const res = await request(app)
      .get(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBeDefined();
    expect(res.body.assignedTo.id).toBe(admin.id);
    expect(res.body.assignedTo.email).toBe(admin.email);
  });

  it('returns 404 for a nonexistent bug', async () => {
    const { user: admin, token } = await createUserWithToken();
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .get(`${BASE(project.id)}/nonexistent-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /:projectId/bugs/:bugId', () => {
  it('creator can update the bug', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .patch(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  it('Admin can update a bug they did not create', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, member.id);

    const res = await request(app)
      .patch(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Updated' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Admin Updated');
  });

  it('non-creator Member returns 403', async () => {
    const { user: admin } = await createUserWithToken();
    const { user: creator } = await createUserWithToken({ email: `creator-${Date.now()}@example.com` });
    const { token: otherToken } = await createUserWithToken({ email: `other-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, creator.id);

    // Add the other user as a project member directly
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${otherToken}`).send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .patch(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Unauthorized' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /:projectId/bugs/:bugId', () => {
  it('creator can delete the bug', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .delete(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(bug.id);
  });

  it('Admin can delete a bug they did not create', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, member.id);

    const res = await request(app)
      .delete(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('non-creator Member returns 403', async () => {
    const { user: admin } = await createUserWithToken();
    const { user: creator } = await createUserWithToken({ email: `creator-${Date.now()}@example.com` });
    const { token: otherToken } = await createUserWithToken({ email: `other-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    const bug = await createTestBug(project.id, creator.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${otherToken}`).send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .delete(`${BASE(project.id)}/${bug.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /:projectId/bugs/:bugId/assign', () => {
  it('Admin can assign a bug to any member', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .patch(`${BASE(project.id)}/${bug.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedToId: member.id });

    expect(res.status).toBe(200);
    expect(res.body.assignedToId).toBe(member.id);
  });

  it('Member can claim an unassigned bug', async () => {
    const { user: admin } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .patch(`${BASE(project.id)}/${bug.id}/assign`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ assignedToId: member.id });

    expect(res.status).toBe(200);
    expect(res.body.assignedToId).toBe(member.id);
  });

  it('Member cannot assign the bug to someone else', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: member1Token } = await createUserWithToken({ email: `m1-${Date.now()}@example.com` });
    const { user: member2 } = await createUserWithToken({ email: `m2-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${member1Token}`).send({ inviteCode: project.inviteCode });
    await request(app).post('/api/projects/join').set('Authorization', `Bearer ${(await request(app).post('/api/auth/login').send({ email: member2.email, password: 'password123' })).body.token}`).send({ inviteCode: project.inviteCode });
    const bug = await createTestBug(project.id, admin.id);

    const res = await request(app)
      .patch(`${BASE(project.id)}/${bug.id}/assign`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ assignedToId: member2.id });

    expect(res.status).toBe(403);
  });
});
