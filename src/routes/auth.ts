import { Router } from 'express';
import { z } from 'zod';
import { UserStore } from '../lib/userStore';
import { RegistrationStore } from '../lib/registrationStore';
import { signUser } from '../lib/tokenService';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

export function buildAuthRouter(userStore: UserStore, registrationStore: RegistrationStore) {
  const router = Router();

  const registerSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
  });

  router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }
    try {
      const request = await registrationStore.createRequest({
        username: parsed.data.username,
        password: parsed.data.password,
      });
      return res.status(201).json({ id: request.id, username: request.username, message: '注册申请已提交，请等待审批' });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
  });

  const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
  });

  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }
    const user = await userStore.validateCredentials(parsed.data.username, parsed.data.password);
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const token = signUser(user);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    });
    return res.json({ token, user: { id: user.id, username: user.username, roles: user.roles, services: user.services } });
  });

  router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
    return res.json({ user: req.user });
  });

  const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(6),
  });

  router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }
    try {
      await userStore.changePassword(
        req.user?.sub || '',
        parsed.data.oldPassword,
        parsed.data.newPassword
      );
      return res.json({ message: '密码已更新' });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
  });

  const assignSchema = z.object({
    username: z.string(),
    services: z.array(z.string()),
    roles: z.array(z.string()).optional(),
  });

  router.post('/assign', authenticate, async (req: AuthenticatedRequest, res) => {
    if (!req.user?.roles.includes('admin')) {
      return res.status(403).json({ message: '仅管理员可分配权限' });
    }
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }
    try {
      const updated = await userStore.updateByUsername(parsed.data.username, {
        services: parsed.data.services,
        roles: parsed.data.roles,
      });
      return res.json({ message: '更新完成', user: updated });
    } catch (err) {
      return res.status(404).json({ message: (err as Error).message });
    }
  });

  return router;
}
