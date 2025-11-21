import jwt from 'jsonwebtoken';
import { AuthTokenPayload, User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'insecure-secret';
const TOKEN_TTL = '8h';

export function signUser(user: User) {
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    roles: user.roles,
    services: user.services,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
