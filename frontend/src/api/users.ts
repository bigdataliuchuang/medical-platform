import { get, post } from './request';
import instance from './request';

export interface UserRecord {
  id: number;
  username: string;
  role: string;
  is_active: number;
  created_at: string;
}

export interface RoleDef {
  value: string;
  label: string;
  permissions: string[];
}

const IS_DEMO = !import.meta.env.VITE_API_BASE_URL;

const DEMO_USERS: UserRecord[] = [
  { id: 1, username: 'admin',    role: 'admin',     is_active: 1, created_at: '2026-01-01T00:00:00' },
  { id: 2, username: 'analyst1', role: 'analyst',   is_active: 1, created_at: '2026-02-15T08:30:00' },
  { id: 3, username: 'dr_wang',  role: 'clinician', is_active: 1, created_at: '2026-03-01T09:00:00' },
  { id: 4, username: 'auditor1', role: 'auditor',   is_active: 1, created_at: '2026-03-20T10:00:00' },
  { id: 5, username: 'dr_li',    role: 'clinician', is_active: 0, created_at: '2026-04-01T11:00:00' },
];

const DEMO_ROLES: RoleDef[] = [
  { value: 'admin',     label: '超级管理员', permissions: ['/', '/dq', '/mpi', '/drug', '/expense', '/inpatient', '/dev-assistant', '/semantic-layer', '/lineage', '/admin'] },
  { value: 'analyst',   label: '数据分析师', permissions: ['/', '/dq', '/mpi', '/drug', '/expense', '/inpatient', '/semantic-layer', '/lineage'] },
  { value: 'clinician', label: '临床工作者', permissions: ['/', '/drug', '/expense', '/inpatient'] },
  { value: 'auditor',   label: '审计员',     permissions: ['/', '/dq', '/lineage'] },
];

export function listUsers(): Promise<UserRecord[]> {
  if (IS_DEMO) return Promise.resolve(DEMO_USERS);
  return get<UserRecord[]>('/api/users/');
}

export function listRoles(): Promise<RoleDef[]> {
  if (IS_DEMO) return Promise.resolve(DEMO_ROLES);
  return get<RoleDef[]>('/api/users/roles');
}

export function createUser(username: string, password: string, role: string): Promise<UserRecord> {
  if (IS_DEMO) return Promise.resolve({ id: Date.now(), username, role, is_active: 1, created_at: new Date().toISOString() });
  return post<UserRecord>('/api/users/', { username, password, role });
}

export function updateUser(id: number, data: { role?: string; password?: string; is_active?: boolean }): Promise<UserRecord> {
  if (IS_DEMO) return Promise.resolve(DEMO_USERS.find(u => u.id === id) ?? DEMO_USERS[0]);
  return instance.patch<UserRecord, UserRecord>(`/api/users/${id}`, data);
}

export function deleteUser(id: number): Promise<void> {
  if (IS_DEMO) return Promise.resolve();
  return instance.delete(`/api/users/${id}`);
}
