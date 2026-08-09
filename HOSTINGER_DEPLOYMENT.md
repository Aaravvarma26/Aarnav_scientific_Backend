# Backend deployment

Domain: `https://api.api.aarnavscientific.co.in`
Frontend: `https://aarnavscientific.co.in`

1. Create an empty Hostinger MySQL database.
2. Import `aarnav_latest_mysql_phpmyadmin.sql` in phpMyAdmin.
3. Upload this backend folder to the backend Node.js application.
4. Copy `.env.production` values into Hostinger environment variables and replace all placeholders.
5. Build command: `npm ci && npx prisma generate && npm run build`
6. Start command: `npm run start`
7. Verify: `https://api.api.aarnavscientific.co.in/api/health`

Do not run the seed after importing the supplied SQL unless you intentionally want seed upserts to run again.
