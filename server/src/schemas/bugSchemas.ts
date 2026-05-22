import { z } from 'zod';

export const createBugSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  expectedBehavior: z.string().min(1, 'Expected behavior is required'),
  actualBehavior: z.string().min(1, 'Actual behavior is required'),
  errorMessage: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedToId: z.string().optional(),
});

export const updateBugSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  expectedBehavior: z.string().min(1).optional(),
  actualBehavior: z.string().min(1).optional(),
  errorMessage: z.string().nullable().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
  assignedToId: z.string().nullable().optional(), // null clears the assignment
});

export const getBugsQuerySchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export type CreateBugInput = z.infer<typeof createBugSchema>;
export type UpdateBugInput = z.infer<typeof updateBugSchema>;
export type GetBugsQuery = z.infer<typeof getBugsQuerySchema>;
