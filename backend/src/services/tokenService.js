import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: '1d',
    ...options,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
