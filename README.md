# Backend

Aarnav Scientific backend/API, database, authentication, uploads, email, catalogue maintenance, and Prisma tooling.

## Run

```bash
npm install
npm run prisma:generate
npm run dev
```

Default local port: `3001`.

Database and server secrets belong only in this application. Existing uploaded files are in `public/uploads/`. Product image catalogue assets and product-image maintenance scripts remain backend-owned.
