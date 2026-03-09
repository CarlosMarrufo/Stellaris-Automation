// server/lib/prisma.js
// Instancia compartida de Prisma Client.
// Importar: import prisma from '../lib/prisma.js';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
