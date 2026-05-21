import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role, Severity } from '@prisma/client';
import prisma from '../../src/lib/prisma';

export async function createTestUser(overrides: {
  email?: string;
  password?: string;
  isVerified?: boolean;
} = {}) {
  const { password = 'password123', ...rest } = overrides;
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash(password, 10),
      isVerified: true,
      ...rest,
    },
  });
}

export async function createTestProject(adminId: string, overrides: {
  name?: string;
  inviteCode?: string;
} = {}) {
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
      ...overrides,
    },
  });

  await prisma.projectMember.create({
    data: {
      userId: adminId,
      projectId: project.id,
      role: Role.ADMIN,
    },
  });

  return project;
}

export async function createTestBug(projectId: string, creatorId: string, overrides: {
  title?: string;
  description?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorMessage?: string;
  severity?: Severity;
  assignedToId?: string;
} = {}) {
  return prisma.bug.create({
    data: {
      title: 'Test Bug',
      description: 'Test description',
      expectedBehavior: 'Expected behavior',
      actualBehavior: 'Actual behavior',
      severity: Severity.MEDIUM,
      projectId,
      creatorId,
      ...overrides,
    },
  });
}

export async function createTestComment(bugId: string, authorId: string, overrides: {
  content?: string;
} = {}) {
  return prisma.comment.create({
    data: {
      content: 'Test comment',
      bugId,
      authorId,
      ...overrides,
    },
  });
}
