// server/routes/auth.js
// Endpoints de autenticación: login, logout, me.

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { setAuthCookie, clearAuthCookie } from '../lib/auth.js';

const router = Router();

// ─── Validación ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  correo:   z.string().email('Correo electrónico inválido').max(200),
  password: z.string().min(1, 'La contraseña es obligatoria').max(200),
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error:   'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { correo, password } = parsed.data;

  try {
    // Buscar cuenta por correo
    const cuenta = await prisma.cuenta.findUnique({
      where: { correo },
      include: { rol: true },
    });

    if (!cuenta || !cuenta.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Comparar contraseña con hash
    const passwordValid = await bcrypt.compare(password, cuenta.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar JWT y cookie
    setAuthCookie(res, cuenta);

    return res.json({
      success: true,
      user: {
        nombre: cuenta.nombre,
        correo: cuenta.correo,
        rol:    cuenta.rol.nombre,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────

router.get('/me', async (req, res) => {
  // req.user es inyectado por el middleware authRequired
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { idCuenta: req.user.idCuenta },
      include: { rol: true },
    });

    if (!cuenta || !cuenta.activo) {
      return res.status(401).json({ error: 'Cuenta no encontrada o inactiva' });
    }

    return res.json({
      user: {
        idCuenta: cuenta.idCuenta,
        nombre:   cuenta.nombre,
        correo:   cuenta.correo,
        rol:      cuenta.rol.nombre,
      },
    });
  } catch (err) {
    console.error('[auth/me]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true });
});

export default router;
