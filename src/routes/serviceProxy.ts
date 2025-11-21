import { createProxyMiddleware } from 'http-proxy-middleware';
import type { NextFunction, Response } from 'express';
import { ServiceRegistry } from '../lib/serviceRegistry';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { ensureServiceAccess } from '../middleware/requirePermission';

export function buildServiceProxy(registry: ServiceRegistry) {
  const defaultTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const serviceId = req.params.serviceId;
    const service = registry.get(serviceId);
    if (!service) {
      return res.status(404).json({ message: '服务不存在' });
    }
    ensureServiceAccess(service)(req, res, (err?: unknown) => {
      if (err) return next(err);
      const target = service.proxyTarget ?? defaultTarget;
      const rewriteBase = service.proxyRewrite ?? '/api';
      const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(`/${serviceId}/api`, rewriteBase),
      });
      return proxy(req, res, next);
    });
  };
}
