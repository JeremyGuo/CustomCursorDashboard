import fs from 'node:fs/promises';
import path from 'node:path';
import type { Response, NextFunction } from 'express';
import { ServiceRegistry } from '../lib/serviceRegistry';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { ensureServiceAccess } from '../middleware/requirePermission';

async function injectContext(htmlPath: string, payloadScript: string) {
  const html = await fs.readFile(htmlPath, 'utf-8');
  if (html.includes('<!-- SERVICE_CONTEXT -->')) {
    return html.replace('<!-- SERVICE_CONTEXT -->', payloadScript);
  }
  if (html.includes('</body>')) {
    return html.replace('</body>', `${payloadScript}\n</body>`);
  }
  return `${html}\n${payloadScript}`;
}

export function buildServicePageHandler(registry: ServiceRegistry) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const serviceId = req.params.serviceId;
    const service = registry.get(serviceId);
    if (!service) {
      return res.status(404).send('服务不存在');
    }
    ensureServiceAccess(service)(req, res, async (err?: unknown) => {
      if (err) return next(err);
      try {
        const context = {
          service: {
            id: service.id,
            name: service.name,
            description: service.description,
            proxy: {
              path: `/${service.id}/api`,
              target: service.proxyTarget ?? process.env.API_PROXY_TARGET,
              rewrite: service.proxyRewrite ?? '/api',
            },
          },
          user: req.user,
        };
        const payloadScript = `<script>window.__SERVICE_CONTEXT__=${JSON.stringify(context)};</script>`;
        const html = await injectContext(service.absHtmlPath, payloadScript);
        res.send(html);
      } catch (error) {
        next(error);
      }
    });
  };
}

export function buildServiceAssetHandler(registry: ServiceRegistry) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { serviceId } = req.params;
    const service = registry.get(serviceId);
    if (!service) {
      return res.status(404).send('服务不存在');
    }
    ensureServiceAccess(service)(req, res, (err?: unknown) => {
      if (err) return next(err);
      const assetPath = req.params[0] ?? '';
      const distDir = path.dirname(service.absScriptPath);
      const finalPath = path.normalize(path.join(distDir, assetPath));
      if (!finalPath.startsWith(distDir)) {
        return res.status(400).send('非法资源路径');
      }
      return res.sendFile(finalPath);
    });
  };
}
