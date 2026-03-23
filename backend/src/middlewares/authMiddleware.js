import { verifyAccessToken } from '../services/tokenService.js';

export function requireAuth(request, _response, next) {
  const authorization = request.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const payload = verifyAccessToken(token);
    request.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    next(error);
  }
}
