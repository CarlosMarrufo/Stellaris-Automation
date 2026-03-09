// server/routes/tickets.js
// GET  /api/tickets — Lista tickets del usuario autenticado.
// POST /api/tickets — Crea un nuevo ticket de servicio.
//
// Requiere autenticación JWT (middleware authRequired ya aplicado en server.js).

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── Validación POST ─────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  idRobot:        z.number().int().positive('Robot requerido'),
  tipo_servicio:  z.string().min(1, 'Tipo de servicio requerido').max(80),
  prioridad:      z.string().min(1, 'Prioridad requerida').max(50),
  descripcion:    z.string().min(1, 'Descripción requerida').max(2000),
  fecha_programada: z.string().optional().nullable(),
});

// ─── GET /api/tickets ─────────────────────────────────────────────────────────

router.get('/tickets', async (req, res) => {
  try {
    const { idCuenta, idRol } = req.user;

    // Admin ve todos; otros ven solo los suyos
    const where = idRol === 1 ? {} : { idCuenta };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        robot:          { select: { modelo: true, noSerie: true } },
        prioridad:      { select: { prioridad: true } },
        tipoSolicitud:  { select: { tipo: true } },
        estadoSolicitud:{ select: { estado: true } },
        cuenta:         { select: { nombre: true } },
      },
      orderBy: { creado: 'desc' },
      take: 100,
    });

    const result = tickets.map((t) => ({
      id:              t.idTicket,
      numero_ticket:   `TKT-${String(t.idTicket).padStart(5, '0')}`,
      robot:           `${t.robot.modelo} — ${t.robot.noSerie}`,
      tipo_servicio:   t.tipoSolicitud.tipo,
      prioridad:       t.prioridad.prioridad.toLowerCase(),
      estado:          t.estadoSolicitud.estado.toLowerCase(),
      descripcion:     t.detalle ?? '',
      fecha_creacion:  t.creado.toISOString().split('T')[0],
      fecha_programada: t.fechaProgramada ? t.fechaProgramada.toISOString().split('T')[0] : null,
      tecnico_asignado: null, // implementar cuando exista asignación
    }));

    return res.json(result);
  } catch (err) {
    console.error('[api/tickets GET]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// ─── POST /api/tickets ────────────────────────────────────────────────────────

router.post('/tickets', async (req, res) => {
  const parsed = createTicketSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error:   'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { idRobot, tipo_servicio, prioridad, descripcion, fecha_programada } = parsed.data;
  const { idCuenta } = req.user;

  try {
    // Resolver catálogos por nombre (case-insensitive)
    const [tipoSolicitud, prioridadRec, estadoAbierto] = await Promise.all([
      prisma.tipoSolicitud.findFirst({
        where: { tipo: { contains: tipo_servicio } },
      }),
      prisma.prioridad.findFirst({
        where: { prioridad: { contains: prioridad } },
      }),
      prisma.estadoSolicitud.findFirst({
        where: { estado: { contains: 'Abierto' } },
      }),
    ]);

    if (!tipoSolicitud || !prioridadRec || !estadoAbierto) {
      return res.status(422).json({
        error: 'Catálogos no encontrados. Asegúrese de haber ejecutado el seed de la base de datos.',
      });
    }

    // Verificar que el robot existe
    const robot = await prisma.robot.findUnique({ where: { idRobot } });
    if (!robot) {
      return res.status(404).json({ error: 'Robot no encontrado' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        idCuenta,
        idRobot,
        idUsuario:        1, // TODO: vincular a usuario real cuando existan registros en tabla usuario
        idPrioridad:      prioridadRec.idPrioridad,
        idTipoSolicitud:  tipoSolicitud.idTipoSolicitud,
        idEstadoSolicitud: estadoAbierto.idEstadoSolicitud,
        fechaProgramada:  fecha_programada ? new Date(fecha_programada) : null,
        detalle:          descripcion,
      },
    });

    return res.status(201).json({
      success:       true,
      numero_ticket: `TKT-${String(ticket.idTicket).padStart(5, '0')}`,
      idTicket:      ticket.idTicket,
    });
  } catch (err) {
    console.error('[api/tickets POST]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al crear el ticket' });
  }
});

export default router;
