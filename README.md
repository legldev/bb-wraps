# Burger Wrap Counter

Un MVP para contar cuantas burgers comiste durante el ano y cerrar diciembre con un resumen simple para compartir.

## Que incluye

- Cuenta privada con registro, login y cookie HTTP-only.
- Un wrap por ano o por categoria.
- Carga rapida de burgers con nombre, fecha y lugar.
- Historial ordenado por fecha.
- Borrado de burgers cargadas por error.
- Resumen con total, mes top, ultima burger y grafico mensual.
- Boton para copiar un texto de resumen.
- Link publico de solo lectura para compartir un wrap sin exponer la cuenta.
- Imagen vertical descargable/compartible para stories o redes sociales.
- API Express + React servido desde el mismo deploy.
- SQLite con Prisma, persistente si el host ofrece disco/volumen.

## Stack

- Frontend: React + Vite + React Router.
- Backend: Express 5 + TypeScript.
- DB: SQLite via Prisma + `better-sqlite3`.
- Auth: bcrypt + JWT en cookie HTTP-only.

## Desarrollo local

```bash
npm install
cp example.env .env
npm run dev:all
```

El frontend corre en `http://localhost:5173` y la API en `http://localhost:3001`.

Para crear o aplicar la base local:

```bash
cd server
DATABASE_URL="file:./dev.db" npx prisma migrate deploy
```

## Variables de entorno

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="usa-un-secreto-largo"
NODE_ENV="development"
PORT=3001
CLIENT_ORIGIN="http://localhost:5173"
```

En produccion, si usas Fly con volumen:

```bash
DATABASE_URL="file:/data/bb-wraps.db"
JWT_SECRET="un-secreto-largo-y-random"
NODE_ENV="production"
PORT=3001
```

## Deploy recomendado para SQLite

SQLite necesita un filesystem persistente. Netlify y Vercel son excelentes para frontend y funciones serverless, pero no son el mejor encaje para este proyecto tal como esta porque la DB es un archivo local que debe sobrevivir reinicios y deploys.

La opcion mas simple para mantener SQLite es desplegar el contenedor en un host con volumen persistente. Este repo ya trae `Dockerfile` y `fly.toml`.

### Fly.io

Fly ya no debe asumirse como "free tier" permanente, pero sirve muy bien para este tipo de app chica con SQLite y volumen. Revisar precios antes de dejarlo corriendo.

1. Instalar CLI:

```bash
brew install flyctl
fly auth login
```

2. Crear la app, si todavia no existe:

```bash
fly launch
```

3. Crear volumen para SQLite:

```bash
fly volumes create data --size 1 --region gru
```

4. Configurar secreto:

```bash
fly secrets set JWT_SECRET="$(openssl rand -base64 32)"
```

5. Deploy:

```bash
fly deploy
```

El `fly.toml` ya apunta `DATABASE_URL` a `/data/bb-wraps.db`, y el script de start corre `prisma migrate deploy` antes de levantar el servidor.

## Si queres usar Netlify o Vercel

Hay dos caminos razonables:

1. Deployar solo el frontend en Netlify/Vercel y mover la base a un servicio externo compatible, por ejemplo Turso/libSQL, Neon/Postgres o Netlify Database/Postgres. Esto requiere adaptar Prisma/driver y variables.
2. Reescribir el backend como funciones serverless y usar una DB administrada. Es mas "free-friendly", pero deja de ser SQLite local simple.

Para este MVP, no recomiendo subir el backend actual con SQLite local a Netlify/Vercel esperando persistencia del archivo `.db`.

## Scripts utiles

```bash
npm run dev:all      # API + web en desarrollo
npm run build        # build del frontend y backend
npm run start        # aplica migraciones y sirve API + React build
npm -w web run lint  # lint frontend
```

## Estructura

```text
server/
  prisma/
  src/index.ts
web/
  src/
Dockerfile
fly.toml
```

## Siguientes mejoras razonables

- Editar una burger existente.
- Importar/exportar CSV.
- Reset de contrasena si esto deja de ser una app para amigos.
- Rate limiting basico en login/registro.
