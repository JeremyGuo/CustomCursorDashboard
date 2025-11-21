import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { RegistrationRequest } from '../types';
import { DATA_DIR } from '../utils/paths';
import { UserStore } from './userStore';

const REQUESTS_PATH = path.join(DATA_DIR, 'registrationRequests.json');

async function ensureFile() {
  try {
    await fs.access(REQUESTS_PATH);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(REQUESTS_PATH, '[]');
  }
}

export class RegistrationStore {
  private requests: RegistrationRequest[] = [];

  async init() {
    await ensureFile();
    const raw = await fs.readFile(REQUESTS_PATH, 'utf-8');
    this.requests = JSON.parse(raw) as RegistrationRequest[];
  }

  list(status: RegistrationRequest['status'] = 'pending') {
    return this.requests.filter((req) => req.status === status);
  }

  private async persist() {
    await fs.writeFile(REQUESTS_PATH, JSON.stringify(this.requests, null, 2));
  }

  async createRequest({ username, password }: { username: string; password: string }) {
    const duplicate = this.requests.find((req) => req.username === username && req.status === 'pending');
    if (duplicate) {
      throw new Error('已有待审批的注册申请');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const request: RegistrationRequest = {
      id: randomUUID(),
      username,
      passwordHash,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.requests.push(request);
    await this.persist();
    return request;
  }

  async approve(requestId: string, userStore: UserStore, reviewerId: string) {
    const request = this.requests.find((req) => req.id === requestId);
    if (!request) throw new Error('申请不存在');
    if (request.status !== 'pending') throw new Error('申请已处理');
    await userStore.createUserFromHash({
      username: request.username,
      passwordHash: request.passwordHash,
      roles: ['user'],
      services: [],
    });
    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewerId = reviewerId;
    await this.persist();
    return request;
  }

  async reject(requestId: string, reviewerId: string, reason?: string) {
    const request = this.requests.find((req) => req.id === requestId);
    if (!request) throw new Error('申请不存在');
    if (request.status !== 'pending') throw new Error('申请已处理');
    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewerId = reviewerId;
    request.reason = reason;
    await this.persist();
    return request;
  }
}
