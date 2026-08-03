# Insurance Management Platform

A full-stack insurance administration system: register customers, issue and renew policies, record premium payments, submit and settle claims, store customer documents, and generate reporting — with role-based access for administrators, agents and customers.

**Live demo:** https://insurance-management-platform-three.vercel.app
**API health check:** https://insurance-api-d50e.onrender.com/api/health

### Demo logins

| Role          | Email               | Password    |
| ------------- | ------------------- | ----------- |
| Administrator | admin@insure.dev    | admin123    |
| Agent         | agent@insure.dev    | agent123    |
| Customer      | customer@insure.dev | customer123 |

> The API runs on Render's free tier and sleeps after a period of inactivity. The first request after idle takes 30–50 seconds to wake the service — subsequent requests are fast.

Add a dashboard screenshot here:
![Dashboard](docs/screenshot-dashboard.png)

---

## Stack

**Backend** — Flask 3 · SQLAlchemy · Flask-Migrate · Flask-JWT-Extended · Flask-Bcrypt · Marshmallow · ReportLab · PostgreSQL
**Frontend** — React 18 · Vite · React Router · Tailwind CSS · Chart.js · Axios
**Deployment** — Render (API + PostgreSQL) · Vercel (frontend)

## Modules

| Module    | What it does                                                      |
| --------- | ----------------------------------------------------------------- |
| Auth      | JWT login, three roles (administrator / agent / customer)         |
| Customers | Register, search, update, view history (staff only)               |
| Policies  | Issue, list/filter by status, renew, cancel, auto-expire          |
| Claims    | Submit, review (approve / reject) with notes                      |
| Premiums  | Record payments, track paid / pending / overdue                   |
| Documents | Upload (pdf/img/doc), list per customer, secure download          |
| Reports   | Live dashboard summary + server-generated monthly PDF (ReportLab) |

## Roles and access

Three roles share one login screen; the UI and the API both adapt to the signed-in role.

| Capability                       | Administrator | Agent | Customer |
| -------------------------------- | :-----------: | :---: | :------: |
| Dashboard & reports              |       ✓       |   ✓   |    —     |
| Manage customer registry         |       ✓       |   ✓   |    —     |
| Create / renew / cancel policies |       ✓       |   ✓   |    —     |
| Record premium payments          |       ✓       |   ✓   |    —     |
| Approve / reject claims          |       ✓       |   ✓   |    —     |
| View own policies & premiums     |       ✓       |   ✓   |    ✓     |
| Submit a claim on an own policy  |       ✓       |   ✓   |    ✓     |
| Upload / download own documents  |       ✓       |   ✓   |    ✓     |
| List all users                   |       ✓       |   —   |    —     |

---

## Design decisions

**Authorization is enforced on the server, not hidden in the UI.** When a customer calls `/policies`, `/claims`, `/premiums` or `/documents`, the API resolves their `customer_id` from the JWT and filters to records they own. Hiding controls in React is a usability measure; it is not a security boundary, so every ownership rule is duplicated in the route layer where it can actually be enforced.

**Cross-customer lookups return 404, not 403.** Fetching another customer's record by id responds as though the record does not exist. A 403 would confirm that id is real, which leaks the shape of the customer registry to anyone willing to enumerate. Returning 404 gives an attacker nothing.

**Business logic lives in `services/`, not in route handlers.** Policy renewal, expiry and report generation are pure functions over the models, so routes stay thin and the rules are testable without spinning up a request context. Marshmallow schemas sit at the boundary so validation happens before anything touches the database.

**Responses share one envelope.** Every endpoint returns `{ "success": bool, "message": str, "data": ... }`, which means the frontend has a single place to handle errors rather than branching on shape per endpoint.

---

## API overview

All routes are prefixed with `/api`. Protected routes expect `Authorization: Bearer <token>`.

```
POST   /auth/register            POST   /auth/login           GET  /auth/me
GET    /customers  (search,page) POST   /customers            GET  /customers/:id
PUT    /customers/:id            GET    /customers/:id/history
GET    /policies   (status,page) POST   /policies             GET  /policies/:id
POST   /policies/:id/renew       POST   /policies/:id/cancel  GET  /policies/expiring
GET    /claims                   POST   /claims               POST /claims/:id/approve
POST   /claims/:id/reject
GET    /premiums                 POST   /premiums             GET  /premiums/overdue
GET    /documents                POST   /documents  (multipart)
GET    /documents/:id/download
GET    /reports/summary          GET    /reports/monthly.pdf
```

### Testing with Postman

Import `postman_collection.json`. Run **Auth → Login (admin)** first — a test script saves the JWT into the `token` collection variable, so every other request is authorized automatically. Point the `baseUrl` variable at either `http://localhost:5000` or the deployed API.

---

## Known limitations

- **Uploaded files and generated PDFs do not persist.** Render's free tier uses an ephemeral filesystem, so `backend/uploads/` and `backend/reports/` reset on each deploy. Object storage (S3 or equivalent) would be the production fix.
- **The API sleeps when idle.** A consequence of the free tier; the first request after inactivity is slow.
- **CORS is restricted to a single origin.** Set via the `CORS_ORIGINS` environment variable. Vercel preview deployments use different subdomains and would need to be added to the list.

---

## Running locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then edit DATABASE_URL + secrets
```

Create the database:

```bash
createdb insurance_db
# or:  psql -U postgres -c "CREATE DATABASE insurance_db;"
```

Set the connection string in `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insurance_db
```

Create tables — either seed with demo data (drops and recreates all tables):

```bash
python seed.py
```

…or use migrations for a clean schema without demo data:

```bash
export FLASK_APP=app.py
flask db init        # first time only
flask db migrate -m "initial"
flask db upgrade
```

Run it:

```bash
python app.py         # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # leave VITE_API_URL blank to use the dev proxy
npm run dev             # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so run the backend alongside it. For a production build: `npm run build` (outputs to `dist/`).

---

## Deployment

### Backend + database — Render

`render.yaml` provisions a PostgreSQL instance and the Flask API together.

1. Push the repo to GitHub.
2. In Render: **New +** → **Blueprint**, select the repo. Render reads `render.yaml`, creates the database, wires `DATABASE_URL` into the API, and generates `SECRET_KEY` / `JWT_SECRET_KEY` automatically.
3. Build runs `pip install -r requirements.txt && python init_db.py`; the service starts with `gunicorn wsgi:app`.
4. After the frontend is live, set `CORS_ORIGINS` to the exact Vercel origin (scheme included, no trailing slash) and redeploy.

To load demo data, run `seed.py` locally against the database's **External Database URL**:

```bash
export DATABASE_URL="<external database url from Render>"
python seed.py
```

### Frontend — Vercel

1. **Add New** → **Project**, import the repo, set **Root Directory** to `frontend`. `vercel.json` handles the Vite build and SPA routing.
2. Add `VITE_API_URL` = the Render API origin (no trailing slash), then deploy.

Vite inlines environment variables at build time, so changing `VITE_API_URL` requires a redeploy, not just a variable update.

---

## Project structure

```
backend/
  app.py            factory + entrypoint      models/       6 SQLAlchemy models
  config.py         env-driven config         schemas/      Marshmallow validation
  extensions.py     db, jwt, bcrypt, migrate  routes/       7 blueprints (API layer)
  seed.py           demo data                 services/     policy + report/PDF logic
  init_db.py        table creation            middleware/   role_required decorator
  requirements.txt                            utils/        responses + file helpers
frontend/
  src/
    api/client.js        axios + JWT interceptors
    context/             auth state
    components/          layout, modal, table pieces
    pages/               Login, Dashboard, Customers, Policies, Claims,
                         Premiums, Documents, Reports
```

## Notes

- Default DB is PostgreSQL. Because the app talks to the database through SQLAlchemy, `DATABASE_URL` can point at SQLite for a quick local run (`sqlite:///dev.db`) without code changes.
- Change `SECRET_KEY` and `JWT_SECRET_KEY` before deploying.
- The `postgres://` connection string Render provides is normalised to `postgresql://` in `config.py`.
