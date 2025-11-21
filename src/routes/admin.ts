import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { UserStore } from '../lib/userStore';
import { RegistrationStore } from '../lib/registrationStore';
import { ServiceRegistry } from '../lib/serviceRegistry';

function requireAdmin(req: AuthenticatedRequest, res: any, next: any) {
  if (!req.user?.roles.includes('admin')) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}

export function buildAdminRouter(
  userStore: UserStore,
  registrationStore: RegistrationStore,
  serviceRegistry: ServiceRegistry
) {
  const router = Router();

  router.use(authenticate);
  router.use(requireAdmin);

  router.get('/users', (req, res) => {
    const users = userStore.list().map((u) => ({
      id: u.id,
      username: u.username,
      roles: u.roles,
      services: u.services,
      createdAt: u.createdAt,
    }));
    res.json({ users });
  });

  router.patch('/users/:userId', async (req: AuthenticatedRequest, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user?.sub;
      
      // 禁止管理员修改自己的权限
      if (targetUserId === currentUserId) {
        return res.status(403).json({ message: '不能修改自己的权限' });
      }
      
      const updated = await userStore.updateUser(targetUserId, {
        roles: req.body.roles,
        services: req.body.services,
      });
      res.json({ user: updated });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  router.delete('/users/:userId', async (req: AuthenticatedRequest, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user?.sub;
      
      // 禁止管理员删除自己
      if (targetUserId === currentUserId) {
        return res.status(403).json({ message: '不能删除自己的账号' });
      }
      
      await userStore.deleteUser(targetUserId);
      res.json({ message: '用户已删除' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  router.get('/registration-requests', (req, res) => {
    const requests = registrationStore.list('pending').map((r) => ({
      id: r.id,
      username: r.username,
      status: r.status,
      createdAt: r.createdAt,
    }));
    res.json({ requests });
  });

  router.post('/registration-requests/:requestId/approve', async (req: AuthenticatedRequest, res) => {
    try {
      const request = await registrationStore.approve(
        req.params.requestId,
        userStore,
        req.user?.sub || ''
      );
      res.json({ request });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  router.post('/registration-requests/:requestId/reject', async (req: AuthenticatedRequest, res) => {
    try {
      const request = await registrationStore.reject(
        req.params.requestId,
        req.user?.sub || '',
        req.body.reason
      );
      res.json({ request });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  router.get('/services', (req, res) => {
    const services = serviceRegistry.list().map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      requiredRoles: s.requiredRoles,
      proxyTarget: s.proxyTarget,
      proxyRewrite: s.proxyRewrite,
    }));
    res.json({ services });
  });

  router.patch('/services/:serviceId', async (req: AuthenticatedRequest, res) => {
    try {
      const serviceId = req.params.serviceId;
      const updates = req.body;
      await serviceRegistry.updateService(serviceId, updates);
      res.json({ message: '服务配置已更新' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  return router;
}

