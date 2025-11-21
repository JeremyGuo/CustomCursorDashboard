import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/tokenService';

export interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof verifyToken>;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.token as string | undefined);
  if (!token) {
    return res.status(401).json({ message: '未提供凭据' });
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: '凭据无效' });
  }
}
