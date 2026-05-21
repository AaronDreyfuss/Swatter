import prisma from '../../src/lib/prisma';

export async function resetDb() {
  await prisma.comment.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}
