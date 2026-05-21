import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export const joinProjectSchema = z.object({
  inviteCode: z.string().length(8, 'Invite code must be 8 characters'),
});

export const changeMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type JoinProjectInput = z.infer<typeof joinProjectSchema>;
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
