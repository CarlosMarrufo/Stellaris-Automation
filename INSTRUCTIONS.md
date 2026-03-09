# Stellaris Automation — Bitácora de Configuración

**Proyecto:** stellarisautomation.com
**Servidor:** Contabo VPS, Ubuntu con Apache + MariaDB
**Stack:** Vite + React (frontend) / Express.js + Prisma ORM (backend)
**Última actualización:** 2026-03-05

---

## RESUMEN DE LO COMPLETADO

### Fase 1 — Limpieza de Vercel y Base44 ✅

- **Archivos eliminados:** `api/contact.js`, `vercel.json`, `src/api/base44Client.js`, `src/lib/app-params.js`, `src/lib/AuthContext.jsx`, `src/lib/NavigationTracker.jsx`, `src/components/UserNotRegisteredError.jsx`
- **vite.config.js:** Removido plugin base44, solo queda `react()`
- **package.json (raíz):** Removidas dependencias `@base44/sdk` y `@base44/vite-plugin`
- **src/App.jsx:** Removido `AuthProvider` wrapper
- **Dashboard components:** Removidos imports de base44 en `RefaccionesTab`, `PreciosTab`, `PerfilFlotillaTab`, `ResumenVidaTab`, `TicketTab`, `TicketsPendientesTab`. Los `queryFn` ahora retornan `async () => []` (mock temporal hasta conectar API real)
- **Verificación:** `grep` confirma cero referencias a `base44`, `vercel`, `AuthContext`, `NavigationTracker` en `src/`

### Fase 2 — Prisma ORM y Datos Iniciales ✅

- **server/prisma/schema.prisma:** 14 modelos creados (7 catálogos + 7 tablas principales). Usa `@map()` para snake_case en MySQL y camelCase en JS
- **server/prisma/refacciones.json:** 3,601 refacciones extraídas de `DB Structure.xlsx` (todas Panasonic, 5 categorías)
- **server/prisma/seed.js:** Semilla para catálogos, refacciones (en lotes de 500), y cuenta admin
- **server/lib/prisma.js:** Instancia compartida de PrismaClient
- **server/package.json:** Reescrito con dependencias nuevas: `@prisma/client`, `bcrypt`, `cookie-parser`, `jsonwebtoken`, `zod`, `prisma` (dev)
- **server/.env.example:** Agregadas variables `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Cuenta admin seed:** `admin@stellarisautomation.com` / `StellarisTempAdmin2026!`

### Fase 3 — Autenticación JWT ✅

- **server/lib/auth.js:** Middleware JWT con httpOnly cookies. Cookie `stellaris_token`, secure en prod, sameSite strict, path `/api`, maxAge 8h
- **server/routes/auth.js:** Endpoints `POST /login`, `GET /me`, `POST /logout` usando Prisma
- **server/server.js:** Integrado `cookieParser`, `authRequired` middleware, rutas de auth. Paths públicos: `/api/auth/login`, `/api/contact`, `/api/health`
- **src/pages/ClientLogin.jsx:** Reescrito para JWT — usa `fetch('/api/auth/login', { credentials: 'include' })`, campos `correo`/`password`
- **src/pages/Dashboard.jsx:** Reescrito — `checkAuth()` usa `fetch('/api/auth/me')`, `handleLogout()` usa `fetch('/api/auth/logout')`. Sin localStorage

### Infraestructura — Base de datos sandbox ✅

- Base de datos `stellaris_dev` creada en servidor de producción (MariaDB)
- Usuario: `stellaris_dev` / `StellarisD3v2026!`
- Conexión desde Windows local via **túnel SSH**: `ssh -L 3306:127.0.0.1:3306 sistemas@stellarisautomation.com`
- `bind-address` en servidor: **debe revertirse a `127.0.0.1`** (ver pendientes)
- `DATABASE_URL` local: `mysql://stellaris_dev:StellarisD3v2026!@localhost:3306/stellaris_dev`

---

## PENDIENTES

### Inmediatos (ejecutar en Windows local con túnel SSH activo)

1. **Revertir bind-address** en servidor SSH:
   - Editar `/etc/mysql/mariadb.conf.d/50-server.cnf` → cambiar `0.0.0.0` a `127.0.0.1`
   - `sudo systemctl restart mysql`

2. **Limpiar dependencias en raíz del proyecto:**
   ```bash
   npm uninstall @base44/sdk @base44/vite-plugin && npm install
   ```

3. **Crear `server/.env`** con:
   ```
   DATABASE_URL="mysql://stellaris_dev:StellarisD3v2026!@localhost:3306/stellaris_dev"
   JWT_SECRET="<string aleatorio de 32+ caracteres>"
   JWT_EXPIRES_IN="8h"
   ```

4. **Instalar dependencias del servidor:**
   ```bash
   cd server
   npm install
   ```

5. **Ejecutar migraciones y seed de Prisma:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

6. **Levantar servidor y probar:**
   ```bash
   node server.js
   ```
   En otra terminal: `npm run dev` (frontend Vite)

### Fase 4 — Despliegue en producción (servidor Ubuntu)

- Configurar Apache: ProxyPass `/api/` → `localhost:4000`
- VirtualHost con SSL (Let's Encrypt) para stellarisautomation.com
- Build del frontend: `npm run build` → servir `dist/` con Apache
- PM2: `pm2 start server.js --name stellaris-api`
- `.env` de producción con credenciales reales y JWT_SECRET fuerte
- `npx prisma migrate deploy` (en producción, NO `migrate dev`)

### Fase 5 — Documentación

- Actualizar archivos Word del proyecto con la nueva arquitectura
- Documentar flujo de deploy y mantenimiento

### Funcionalidad pendiente (post-deploy)

- Conectar dashboard components a API real (reemplazar `async () => []` por endpoints reales)
- Implementar endpoints CRUD para: Refacciones, Robots, Tickets, Mantenimientos, VentaRefacciones
- Configurar Microsoft Graph API para el formulario de contacto
- Cambiar contraseña de cuenta admin después del primer login

---

---

## PLAN DE ACCIÓN — Estado por tarea

| # | Tarea | Responsable | Estado |
|---|-------|-------------|--------|
| 1 | Agregar plan de acción a INSTRUCTIONS.md | Claude | ✅ Hecho |
| 2 | Separar env vars críticas de opcionales en `server/server.js` (MS Graph → WARN) | Claude | ✅ Hecho |
| 3 | Agregar proxy `/api → 4000` en `vite.config.js` para desarrollo local | Claude | ✅ Hecho |
| 4 | Crear `server/routes/robots.js` — `GET /api/robots` | Claude | ✅ Hecho |
| 5 | Crear `server/routes/refacciones.js` — `GET /api/refacciones` | Claude | ✅ Hecho |
| 6 | Crear `server/routes/tickets.js` — `GET + POST /api/tickets` | Claude | ✅ Hecho |
| 7 | Registrar nuevas rutas en `server/server.js` | Claude | ✅ Hecho |
| 8 | Conectar `PerfilFlotillaTab` + `ResumenVidaTab` → `GET /api/robots` | Claude | ✅ Hecho |
| 9 | Conectar `RefaccionesTab` + `PreciosTab` → `GET /api/refacciones` | Claude | ✅ Hecho |
| 10 | Conectar `TicketsPendientesTab` → `GET /api/tickets` + `TicketTab` → `POST` | Claude | ✅ Hecho |
| 11 | `npm install` (raíz) + `cd server && npm install` + `npx prisma generate` | Claude | ✅ Hecho |
| 12 | Commit de todos los cambios | Claude | ✅ Hecho |
| 13 | Crear `server/.env` con credenciales reales | **Usuario** | ⬜ Pendiente |
| 14 | Levantar túnel SSH y ejecutar `prisma migrate dev --name init` + `db seed` | **Usuario** | ⬜ Pendiente |
| 15 | Revertir `bind-address` a `127.0.0.1` en servidor MariaDB | **Usuario** | ⬜ Pendiente |
| 16 | Validar en producción: login, dashboard, formulario de contacto | **Usuario** | ⬜ Pendiente |

---

## VALIDACIONES

### Código fuente

- [ ] `grep -r "base44" src/` → debe retornar vacío
- [ ] `grep -r "vercel" src/` → debe retornar vacío
- [ ] `grep -r "localStorage" src/` → debe retornar vacío
- [ ] `grep -r "AuthContext\|AuthProvider" src/` → debe retornar vacío
- [ ] `grep -r "NavigationTracker\|UserNotRegisteredError\|app-params" src/` → debe retornar vacío
- [ ] Verificar que `vite.config.js` no tenga imports de base44
- [ ] Verificar que `package.json` (raíz) no tenga `@base44/sdk` ni `@base44/vite-plugin`

### Base de datos

- [ ] Túnel SSH conecta correctamente: `ssh -L 3306:127.0.0.1:3306 sistemas@stellarisautomation.com`
- [ ] `mysql -u stellaris_dev -p -h 127.0.0.1 stellaris_dev` conecta a través del túnel
- [ ] `npx prisma migrate dev --name init` crea las 14 tablas sin errores
- [ ] `npx prisma db seed` importa catálogos + 3,601 refacciones + cuenta admin
- [ ] Verificar en MySQL: `SELECT COUNT(*) FROM refaccion;` → 3,601
- [ ] Verificar en MySQL: `SELECT * FROM cuenta WHERE correo='admin@stellarisautomation.com';` → existe con password_hash

### Autenticación JWT

- [ ] `POST /api/auth/login` con credenciales correctas → responde 200 + cookie `stellaris_token`
- [ ] `POST /api/auth/login` con credenciales incorrectas → responde 401
- [ ] `GET /api/auth/me` con cookie válida → retorna datos del usuario
- [ ] `GET /api/auth/me` sin cookie → responde 401
- [ ] `POST /api/auth/logout` → limpia cookie
- [ ] `GET /api/health` → responde 200 sin autenticación (path público)
- [ ] Dashboard redirige a login si no hay sesión
- [ ] Dashboard muestra nombre/correo del usuario autenticado
- [ ] Botón "Cerrar Sesión" limpia cookie y redirige a login

### Servidor Express

- [ ] `node server.js` inicia sin errores en puerto 4000
- [ ] Variables requeridas (`DATABASE_URL`, `JWT_SECRET`) se validan al iniciar
- [ ] Rate limiting funciona en rutas de auth

### Frontend

- [ ] `npm run dev` compila sin errores ni warnings de imports rotos
- [ ] `npm run build` genera el bundle de producción sin errores
- [ ] Todas las rutas del SPA cargan correctamente
- [ ] Login funciona con correo y contraseña
- [ ] Dashboard tabs cargan (aunque con datos vacíos por ahora)

---

## NOTAS TÉCNICAS

- **Túnel SSH obligatorio** para desarrollo local: el puerto 3306 del servidor no está expuesto al exterior. Siempre conectar via `ssh -L 3306:127.0.0.1:3306 sistemas@stellarisautomation.com`
- **Prisma workflow:** Cambios al schema → `npx prisma migrate dev --name descripcion` (local) → commit → `npx prisma migrate deploy` (producción)
- **Categorías de refacciones:** Cutting, Power Source, Torch & Consumables, Welding Wire, Wire Feeding (mapeadas desde inglés en el Excel original)
- **bind-address del servidor MariaDB** debe permanecer en `127.0.0.1` por seguridad
