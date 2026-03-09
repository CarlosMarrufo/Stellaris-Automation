// server/prisma/seed.js
// Ejecutar: npx prisma db seed
//
// Pobla las tablas de catálogo, importa 3,601 refacciones,
// y crea un usuario administrador inicial.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ─── 1. Roles ───────────────────────────────────────────────────────────────
  const roles = ['Admin', 'Usuario'];
  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { idRol: roles.indexOf(nombre) + 1 },
      update: {},
      create: { nombre },
    });
  }
  console.log(`✓ Roles: ${roles.join(', ')}`);

  // ─── 2. Marcas ──────────────────────────────────────────────────────────────
  const marcas = ['Panasonic', 'Yaskawa', 'Fanuc'];
  for (const marca of marcas) {
    await prisma.marca.upsert({
      where: { idMarca: marcas.indexOf(marca) + 1 },
      update: {},
      create: { marca },
    });
  }
  console.log(`✓ Marcas: ${marcas.join(', ')}`);

  // ─── 3. Estados de robot ────────────────────────────────────────────────────
  const estadosRobot = ['Operativo', 'Mantenimiento', 'Falla', 'Inactivo'];
  for (const estado of estadosRobot) {
    await prisma.estadoRobot.upsert({
      where: { idEstado: estadosRobot.indexOf(estado) + 1 },
      update: {},
      create: { estado },
    });
  }
  console.log(`✓ Estados robot: ${estadosRobot.join(', ')}`);

  // ─── 4. Prioridades ────────────────────────────────────────────────────────
  const prioridades = ['Baja', 'Media', 'Alta', 'Critica'];
  for (const prioridad of prioridades) {
    await prisma.prioridad.upsert({
      where: { idPrioridad: prioridades.indexOf(prioridad) + 1 },
      update: {},
      create: { prioridad },
    });
  }
  console.log(`✓ Prioridades: ${prioridades.join(', ')}`);

  // ─── 5. Tipos de solicitud ──────────────────────────────────────────────────
  const tiposSolicitud = ['Preventivo', 'Correctivo', 'Diagnóstico', 'Post-colisión', 'Optimización'];
  for (const tipo of tiposSolicitud) {
    await prisma.tipoSolicitud.upsert({
      where: { idTipoSolicitud: tiposSolicitud.indexOf(tipo) + 1 },
      update: {},
      create: { tipo },
    });
  }
  console.log(`✓ Tipos solicitud: ${tiposSolicitud.join(', ')}`);

  // ─── 6. Estados de solicitud ────────────────────────────────────────────────
  const estadosSolicitud = ['Abierto', 'En proceso', 'Resuelto', 'Cancelado'];
  for (const estado of estadosSolicitud) {
    await prisma.estadoSolicitud.upsert({
      where: { idEstadoSolicitud: estadosSolicitud.indexOf(estado) + 1 },
      update: {},
      create: { estado },
    });
  }
  console.log(`✓ Estados solicitud: ${estadosSolicitud.join(', ')}`);

  // ─── 7. Categorías de refacción ─────────────────────────────────────────────
  const categorias = [
    'Antorcha y Consumibles',
    'Robot y Controlador',
    'Fuente de poder y Enfriamiento',
    'Eje Externo',
    'Alimentador de Alambre',
  ];
  for (const nombre of categorias) {
    await prisma.categoriaRefaccion.upsert({
      where: { idCategoria: categorias.indexOf(nombre) + 1 },
      update: {},
      create: { nombre },
    });
  }
  console.log(`✓ Categorías refacción: ${categorias.length} categorías`);

  // ─── 8. Importar refacciones ────────────────────────────────────────────────
  const refaccionesPath = join(__dirname, 'refacciones.json');
  const refaccionesData = JSON.parse(readFileSync(refaccionesPath, 'utf-8'));

  // Obtener IDs de categorías y marca Panasonic
  const categoriasDB = await prisma.categoriaRefaccion.findMany();
  const catMap = Object.fromEntries(categoriasDB.map(c => [c.nombre, c.idCategoria]));

  const panasonic = await prisma.marca.findFirst({ where: { marca: 'Panasonic' } });
  if (!panasonic) throw new Error('Marca Panasonic no encontrada');

  // Verificar si ya hay refacciones
  const existingCount = await prisma.refaccion.count();
  if (existingCount > 0) {
    console.log(`⏭ Refacciones: ya existen ${existingCount} registros, saltando importación`);
  } else {
    // Insertar en lotes de 500 para eficiencia
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < refaccionesData.length; i += BATCH_SIZE) {
      const batch = refaccionesData.slice(i, i + BATCH_SIZE).map(r => ({
        idCategoria: catMap[r.categoria],
        idMarca: panasonic.idMarca,
        noParte: r.noParte,
        descripcion: r.descripcion || null,
        stockActual: 0,
        precioVenta: 0,
      }));

      await prisma.refaccion.createMany({ data: batch });
      inserted += batch.length;
      process.stdout.write(`\r  Importando refacciones: ${inserted}/${refaccionesData.length}`);
    }
    console.log(`\n✓ Refacciones: ${inserted} registros importados`);
  }

  // ─── 9. Cuenta administrador inicial ────────────────────────────────────────
  const adminEmail = 'admin@stellarisautomation.com';
  const existingAdmin = await prisma.cuenta.findUnique({ where: { correo: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('StellarisTempAdmin2026!', 10);
    await prisma.cuenta.create({
      data: {
        idRol: 1, // Admin
        nombre: 'Administrador',
        passwordHash,
        correo: adminEmail,
      },
    });
    console.log(`✓ Cuenta admin creada: ${adminEmail}`);
    console.log('  ⚠️  IMPORTANTE: Cambiar la contraseña temporal después del primer login');
  } else {
    console.log(`⏭ Cuenta admin ya existe: ${adminEmail}`);
  }

  console.log('\n✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
