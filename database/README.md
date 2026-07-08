# Database

This folder contains database initialization scripts and migration helpers.

- `init.sql`: Creates the salon_app database.

To initialize the database:

1. Create the MySQL database:
   ```sql
   source init.sql;
   ```
2. Update `backend/.env` with your MySQL credentials.
