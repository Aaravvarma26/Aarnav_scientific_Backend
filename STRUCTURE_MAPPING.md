# Structure Mapping

This is the separated backend/data project built only from the supplied previous project files.
The reference backend was used only to identify backend responsibility; no reference-project source, data, or assets were copied here.

Active ownership:
- `src/app/api` API route handlers
- `src/common` authentication, Prisma, mail, storage, validation and server helpers
- `prisma` database schema/seed data
- `scripts` data/media maintenance scripts
- `public/uploads` uploaded data (and retained previous backend assets needed by previous scripts/data)
- backend environment/deployment configuration

Frontend and admin UI component trees are not part of the active backend build.
Additional read-only API handlers support data that the old combined UI previously read directly through Prisma.
