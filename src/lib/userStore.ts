import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { User } from '../types';
import { DATA_DIR } from '../utils/paths';

const USERS_PATH = path.join(DATA_DIR, 'users.json');

async function ensureFile() {
  try {
    await fs.access(USERS_PATH);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(USERS_PATH, '[]');
  }
}

export class UserStore {
  private users: User[] = [];

  async init() {
    await ensureFile();
    const raw = await fs.readFile(USERS_PATH, 'utf-8');
    this.users = JSON.parse(raw) as User[];
    if (!this.users.find((u) => u.username === 'admin')) {
      console.log('[userStore] 创建默认管理员 admin/admin123');
      await this.createUser({
        username: 'admin',
        password: 'admin123',
        roles: ['admin'],
        services: [],
      });
    }
  }

  private async persist() {
    await fs.writeFile(USERS_PATH, JSON.stringify(this.users, null, 2));
  }

  async createUser({
    username,
    password,
    roles = ['user'],
    services = [],
  }: {
    username: string;
    password: string;
    roles?: string[];
    services?: string[];
  }) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.createUserFromHash({ username, passwordHash, roles, services });
  }

  async createUserFromHash({
    username,
    passwordHash,
    roles = ['user'],
    services = [],
  }: {
    username: string;
    passwordHash: string;
    roles?: string[];
    services?: string[];
  }) {
    const exists = this.users.find((u) => u.username === username);
    if (exists) throw new Error('用户名已存在');
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username,
      passwordHash,
      roles,
      services,
      createdAt: now,
    };
    this.users.push(user);
    await this.persist();
    return user;
  }

  async validateCredentials(username: string, password: string) {
    const user = this.users.find((u) => u.username === username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  getById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  getByUsername(username: string) {
    return this.users.find((u) => u.username === username) ?? null;
  }

  list() {
    return this.users;
  }

  async updateUser(userId: string, updates: Partial<Pick<User, 'roles' | 'services'>>) {
    const target = this.getById(userId);
    if (!target) throw new Error('用户不存在');
    if (updates.roles) {
      target.roles = Array.from(new Set(updates.roles));
    }
    if (updates.services) {
      target.services = Array.from(new Set(updates.services));
    }
    await this.persist();
    return target;
  }

  async updateByUsername(username: string, updates: Partial<Pick<User, 'roles' | 'services'>>) {
    const target = this.getByUsername(username);
    if (!target) throw new Error('用户不存在');
    return this.updateUser(target.id, updates);
  }

  async updatePassword(userId: string, newPassword: string) {
    const target = this.getById(userId);
    if (!target) throw new Error('用户不存在');
    target.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.persist();
    return target;
  }

  async createUserFromHash({
    username,
    passwordHash,
    roles = ['user'],
    services = [],
  }: {
    username: string;
    passwordHash: string;
    roles?: string[];
    services?: string[];
  }) {
    const exists = this.users.find((u) => u.username === username);
    if (exists) throw new Error('用户名已存在');
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username,
      passwordHash,
      roles,
      services,
      createdAt: now,
    };
    this.users.push(user);
    await this.persist();
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = this.getById(userId);
    if (!user) throw new Error('用户不存在');
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new Error('当前密码错误');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.persist();
    return user;
  }

  async deleteUser(userId: string) {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('用户不存在');
    this.users.splice(index, 1);
    await this.persist();
  }
}
