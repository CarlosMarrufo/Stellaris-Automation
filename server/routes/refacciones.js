// server/routes/refacciones.js
// GET /api/refacciones — Catálogo de refacciones con búsqueda y paginación.
//
// Query params:
//   search    — filtra por noParte o descripcion (LIKE %search%)
//   categoria — id de categoría (número)
//   skip      — registros a omitir (paginación, default 0)
//   take      — registros a retornar (default 50, máx 200)
//
// Respuesta: { data: [...], total: N }

import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── GET /api/refacciones ────────────────────────────────────────────────────

router.get('/refacciones', async (req, res) => {
  try {
    const search    = String(req.query.search    ?? '').trim();
    const categoria = req.query.categoria ? parseInt(req.query.categoria, 10) : undefined;
    const skip      = Math.max(0, parseInt(req.query.skip ?? '0', 10));
    const take      = Math.min(200, Math.max(1, parseInt(req.query.take ?? '50', 10)));

    const where = {
      activo: true,
      ...(categoria && !isNaN(categoria) ? { idCategoria: categoria } : {}),
      ...(search ? {
        OR: [
          { noParte:     { contains: search } },
          { descripcion: { contains: search } },
        ],
      } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.refaccion.findMany({
        where,
        skip,
        take,
        include: {
          categoria: { select: { nombre: true } },
          marca:     { select: { marca: true } },
        },
        orderBy: { noParte: 'asc' },
      }),
      prisma.refaccion.count({ where }),
    ]);

    // Normalizar al shape que esperan los componentes del dashboard
    const result = data.map((r) => ({
      id:               r.idRefaccion,
      codigo:           r.noParte,
      nombre:           r.descripcion ?? r.noParte,
      categoria:        r.categoria.nombre,
      marca_compatible: r.marca.marca,
      stock_disponible: r.stockActual,
      stock_minimo:     0,          // sin mínimo definido por ahora
      precio_venta:     Number(r.precioVenta),
      disponible:       r.stockActual > 0,
    }));

    return res.json({ data: result, total });
  } catch (err) {
    console.error('[api/refacciones]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener refacciones' });
  }
});

export default router;
