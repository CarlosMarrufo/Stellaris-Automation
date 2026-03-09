// server/lib/auth.js
// Middleware de autenticación JWT con cookies httpOnly.

import jwt from 'jsonwebtoken';

const { JWT_SECRET, JWT_EXPIRES_IN = '8h' } = process.env;

// ─── Cookie config ──────────────────────────────────────────────────────────

const COOKIE_NAME = 'stellaris_token';

const cookieOptions = {
  httpOnly: true,                                    // No accesible desde JS
  secure:   process.env.NODE_ENV === 'production',   // Solo HTTPS en prod
  sameSite: 'strict',                                // Protección CSRF
  path:     '/api',                                  // Solo se envía a /api/*
  maxAge:   8 * 60 * 60 * 1000,                      // 8 horas en ms
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Genera un JWT y lo envía como cookie httpOnly.
 * @param {import('express').Response} res
 * @param {{ idCuenta: number, idRol: number, nombre: string, correo: string }} user
 */
export function setAuthCookie(res, user) {
  const token = jwt.sign(
    { idCuenta: user.idCuenta, idRol: user.idRol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.cookie(COOKIE_NAME, token, cookieOptions);
}

/**
 * Limpia la cookie de autenticación.
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/api' });
}

// ─── Middleware ──────────────────────────────────────────────────────────────

// Rutas que NO requieren autenticación
const PUBLIC_PATHS = ['/api/auth/login', '/api/contact', '/api/health'];

/**
 * Middleware que protege rutas privadas.
 * Lee la cookie, valida el JWT, e inyecta req.user.
 */
export function authRequired(req, res, next) {
  // Permitir rutas públicas
  if (PUBLIC_PATHS.includes(req.path)) {
    return next();
  }

  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      idCuenta: decoded.idCuenta,
      idRol:    decoded.idRol,
    };
    next();
  } catch (err) {
    // Token expirado o inválido
    return res.status(401).json({ error: 'Sesión expirada o inválida' });
  }
}
