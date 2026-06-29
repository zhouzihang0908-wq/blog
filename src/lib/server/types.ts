export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface DbUser extends AuthUser {
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentViewer {
  id: string;
  role: UserRole;
}

export interface BlogEnv {
  dbPath: string;
  sessionSecret: string;
  adminEmail?: string;
  adminPassword?: string;
  publicOrigin?: string;
}
