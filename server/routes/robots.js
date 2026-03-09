// server/routes/robots.js
// GET /api/robots — Retorna la flotilla de robots del cliente autenticado.
//
// Si el usuario tiene rol Admin (idRol = 1) → retorna todos los robots.
// Si no → retorna solo los robots del cliente asociado a su cuenta.
//
// Respuesta normalizada al formato que esperan los componentes del dashboard.

import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── GET /api/robots ──────────────────────────────────────────────────────────

router.get('/robots', async (req, res) => {
  try {
    const { idCuenta, idRol } = req.user;

    // Admin (rol 1) ve todo; otros ven solo los robots de su cliente
    const whereClause = idRol === 1
      ? {}
      : {
          cliente: {
            usuarios: {
              some: {
                correo: {
                  equals: (await prisma.cuenta.findUnique({
                    where: { idCuenta },
                    select: { correo: true },
                  }))?.correo,
                },
              },
            },
          },
        };

    const robots = await prisma.robot.findMany({
      where: whereClause,
      include: {
        marca:   { select: { marca: true } },
        estado:  { select: { estado: true } },
        fuente:  { select: { modelo: true, noSerie: true } },
        mantenimientos: {
          orderBy: { fechaMantenimiento: 'desc' },
          take: 1,
          select: { fechaMantenimiento: true },
        },
      },
      orderBy: { idRobot: 'asc' },
    });

    // Normalizar al shape que usan los componentes del dashboard
    const result = robots.map((r) => ({
      id:                  r.idRobot,
      modelo:              r.modelo,
      numero_serie_robot:  r.noSerie,
      fuente_poder:        r.fuente?.modelo  ?? null,
      numero_serie_fuente: r.fuente?.noSerie ?? null,
      marca:               r.marca.marca,
      fecha_instalacion:   r.fechaInstalacion ? r.fechaInstalacion.toISOString().split('T')[0] : null,
      celda:               r.celda ?? null,
      estado:              r.estado.estado.toLowerCase(),
      proximo_mantenimiento: r.fechaProxMant ? r.fechaProxMant.toISOString().split('T')[0] : null,
      ultimo_mantenimiento:  r.mantenimientos[0]?.fechaMantenimiento
        ? r.mantenimientos[0].fechaMantenimiento.toISOString().split('T')[0]
        : null,
      horas_operacion: r.horasOperacion,
    }));

    return res.json(result);
  } catch (err) {
    console.error('[api/robots]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener robots' });
  }
});

export default router;
