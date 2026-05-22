export type Role = 'ADMIN' | 'MEMBER';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface User {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  inviteCode?: string; // only returned for Admins
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  role: Role;
  userId: string;
  projectId: string;
  createdAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  errorMessage: string | null;
  severity: Severity;
  status: BugStatus;
  projectId: string;
  creatorId: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  bugId: string;
  authorId: string;
  author?: Pick<User, 'id' | 'email'>;
  createdAt: string;
  updatedAt: string;
}
