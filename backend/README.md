# MammaCare Backend & Database Administration

This directory contains the Express API Gateway, database schema, and migration/seeding logic for the MammaCare system.

## Stack
- **Runtime**: Node.js (v22+)
- **Database**: PostgreSQL (Dockerized)
- **ORM**: Prisma (v6+)

---

## Database Setup

The MammaCare database runs inside a Docker container. Follow these steps to run the database and load seed data:

### 1. Start the PostgreSQL Container
Make sure Docker is running, then execute this command in the **root directory** of the project:
```bash
docker-compose up -d postgres
```
*Note: This starts the PostgreSQL database on port `5433` (mapped externally to avoid conflicts with other local databases).*

### 2. Push the Schema & Sync the Database
Navigate to the `backend/` directory and sync the schema to the database:
```bash
npx prisma db push --accept-data-loss
```
*Note: This command checks your schema at `prisma/schema.prisma` and applies any updates to the database.*

### 3. Generate the Prisma Client
To compile the type definitions for the models, run:
```bash
npx prisma generate
```

### 4. Seed the Database
To populate the database with complete multi-tenant mock data (hospitals, patients, doctors, nurses, visits, and medication logs), run:
```bash
node seed.js
```

---

## Running the Backend Server

To start the API server locally on `http://localhost:5000`:
```bash
npm run dev
```

---

## Prisma Studio (Visual Database Editor)

**Prisma Studio** is the equivalent of MongoDB Compass or pgAdmin. It runs a local web application where you can visually search, filter, edit, and create records.

### How to open Prisma Studio:
1. Open your terminal in the `backend/` directory.
2. Run the following command:
   ```bash
   npx prisma studio
   ```
3. Open your browser and navigate to:
   **[http://localhost:5555](http://localhost:5555)**

### How to use Prisma Studio:
- **View Data**: Click on any model (e.g., `Patient`, `Hospital`, `Staff`) on the dashboard to open its table.
- **Filter and Sort**: Use the **Filter** and **Sort** options at the top of the table view to query specific records.
- **Edit Records**: Double-click any cell to edit its value directly.
- **Add / Delete Records**: Click **Add record** or select a row and click **Delete record** at the top right.
- **Save Changes**: After adding or editing records, click the green **Save changes** button at the top bar to commit your edits to the database.
