import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { ServiceRuntime } from '../types';

export function ensureServiceAccess(service: ServiceRuntime) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: '未登录' });
    }
    const hasService = user.services.includes(service.id);
    const hasRole = service.requiredRoles.some((role) => user.roles.includes(role));
    const isAdmin = user.roles.includes('admin');
    if (!isAdmin && !hasService && !hasRole) {
      return res.status(403).json({ message: '无访问该服务的权限' });
    }
    return next();
  };
}
