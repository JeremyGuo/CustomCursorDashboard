import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { ensureServiceAccess } from '../middleware/requirePermission';
import { ServiceRegistry } from '../lib/serviceRegistry';

export function buildServiceApiRouter(registry: ServiceRegistry) {
  const router = Router();

  router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
    const list = registry
      .list()
      .filter((service) => {
        const hasRole = service.requiredRoles.some((role) => req.user?.roles.includes(role));
        const hasService = req.user?.services.includes(service.id);
        return Boolean(hasRole || hasService || req.user?.roles.includes('admin'));
      })
      .map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        docs: {
          api: `/api/services/${service.id}/docs/api`,
          plan: `/api/services/${service.id}/docs/plan`,
          workblook: `/api/services/${service.id}/docs/workblook`,
        },
      }));
    res.json({ services: list });
  });

  router.get('/:serviceId/docs/:docType', authenticate, (req: AuthenticatedRequest, res, next) => {
    const service = registry.get(req.params.serviceId);
    if (!service) return res.status(404).json({ message: '服务不存在' });
    ensureServiceAccess(service)(req, res, async (err?: unknown) => {
      if (err) return next(err);
      const mapping: Record<string, string> = {
        api: service.apiDocPath,
        plan: service.planPath,
        workblook: service.workblookPath,
      };
      const filePath = mapping[req.params.docType];
      if (!filePath) return res.status(404).json({ message: '未知文档类型' });
      try {
        const exists = await fs.stat(filePath).then(() => true).catch(() => false);
        if (!exists) {
          return res.status(404).json({ message: '文档不存在' });
        }
        return res.sendFile(path.resolve(filePath));
      } catch (error) {
        return res.status(500).json({ message: (error as Error).message });
      }
    });
  });

  return router;
}
