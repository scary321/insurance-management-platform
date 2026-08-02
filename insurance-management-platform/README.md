# Insurance Management Platform

A full-stack insurance administration system: register customers, issue and renew
policies, record premium payments, submit and settle claims, store customer
documents, and generate reporting — with role-based access for administrators,
agents and customers.

**Stack**

- **Backend** — Flask 3 · SQLAlchemy · Flask-Migrate · Flask-JWT-Extended · Flask-Bcrypt · Marshmallow · ReportLab · PostgreSQL
- **Frontend** — React 18 · Vite · React Router · Tailwind CSS · Chart.js · Axios

---

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

---

## Roles & access

Three roles share one login screen; the UI and the API both adapt to the signed-in role.

| Capability                       | Administrator | Agent | Customer |
| -------------------------------- | :-----------: | :---: | :------: |
| Dashboard & reports              |      yes      |  yes  |    —     |
| Manage customer registry         |      yes      |  yes  |    —     |
| Create / renew / cancel policies |      yes      |  yes  |    —     |
| Record premium payments          |      yes      |  yes  |    —     |
| Approve / reject claims          |      yes      |  yes  |    —     |
| View **own** policies & premiums |      yes      |  yes  |   yes    |
| Submit a claim on an own policy  |      yes      |  yes  |   yes    |
| Upload / download own documents  |      yes      |  yes  |   yes    |
| List all users                   |      yes      |   —   |    —     |

**Customer self-service is ownership-enforced on the server**, not just hidden in the UI.
When a customer calls `/policies`, `/claims`, `/premiums` or `/documents`, the API filters
to records tied to their own `customer_id` (resolved from the JWT). Fetching another
customer's record by id returns `404` — existence never leaks — and a customer filing a
claim against a policy they do not own, or recording a payment, is rejected. The React app
mirrors this: customers get a "My policies / claims / premiums / documents" navigation and a
personal home built from their own data, with all staff-only controls removed.

## 1. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then edit DATABASE_URL + secrets
```

### Create the PostgreSQL database

```bash
createdb insurance_db
# or:  psql -U postgres -c "CREATE DATABASE insurance_db;"
```

Set the connection string in `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insurance_db
```

### Create tables

Either seed with demo data (drops and recreates all tables):

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

### Run

```bash
python app.py         # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

**Demo logins** (created by `seed.py`)

| Role          | Email               | Password    |
| ------------- | ------------------- | ----------- |
| Administrator | admin@insure.dev    | admin123    |
| Agent         | agent@insure.dev    | agent123    |
| Customer      | customer@insure.dev | customer123 |

---

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env    # leave VITE_API_URL blank to use the dev proxy
npm run dev             # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so run the backend
alongside it. For a production build: `npm run build` (outputs to `dist/`).

---

## API overview

All routes are prefixed with `/api`. Protected routes expect
`Authorization: Bearer <token>`. Responses share a common envelope:
`{ "success": bool, "message": str, "data": ... }`.

```
POST   /auth/register            POST   /auth/login          GET  /auth/me
GET    /customers  (search,page) POST   /customers           GET  /customers/:id
PUT    /customers/:id            GET    /customers/:id/history
GET    /policies   (status,page) POST   /policies            GET  /policies/:id
POST   /policies/:id/renew       POST   /policies/:id/cancel  GET  /policies/expiring
GET    /claims                   POST   /claims               POST /claims/:id/approve
POST   /claims/:id/reject
GET    /premiums                 POST   /premiums             GET  /premiums/overdue
GET    /documents                POST   /documents  (multipart)
GET    /documents/:id/download
GET    /reports/summary          GET    /reports/monthly.pdf
```

---

## Project structure

```
backend/
  app.py            factory + entrypoint      models/       6 SQLAlchemy models
  config.py         env-driven config         schemas/      Marshmallow validation
  extensions.py     db, jwt, bcrypt, migrate  routes/       7 blueprints (API layer)
  seed.py           demo data                 services/     policy + report/PDF logic
  requirements.txt                            middleware/   role_required decorator
  .env.example                                utils/        responses + file helpers
frontend/
  src/
    api/client.js        axios + JWT interceptors
    context/             auth state
    components/          layout, modal, table pieces
    pages/               Login, Dashboard, Customers, Policies, Claims,
                         Premiums, Documents, Reports
```

---

## API testing (Postman)

Import `postman_collection.json` into Postman. Run **Auth > Login (admin)** first —
a test script saves the JWT into the `token` collection variable, so every other
request is authorized automatically. Point the `baseUrl` variable at your
environment (defaults to `http://localhost:5000`).

## Deployment (Render + Vercel)

The repo ships with blueprint configs for a one-click-ish deploy.

### Backend + database - Render

`render.yaml` provisions a free PostgreSQL instance and the Flask API together.

1. Push this repo to GitHub.
2. In Render: **New + > Blueprint**, select the repo. Render reads `render.yaml`,
   creates the `insurance-db` database, wires `DATABASE_URL` into the API, and
   generates `SECRET_KEY` / `JWT_SECRET_KEY` automatically.
3. Build runs `pip install -r requirements.txt`; `init_db.py` creates the tables
   on pre-deploy; the service starts with `gunicorn wsgi:app`.
4. After the frontend is live, set the API's `CORS_ORIGINS` env var to your Vercel
   URL (e.g. `https://your-app.vercel.app`) and redeploy.

To load demo data on Render, open the service **Shell** and run `python seed.py`.

### Frontend - Vercel

1. In Vercel: **Add New > Project**, import the repo, set **Root Directory** to
   `frontend`. `vercel.json` handles the Vite build and SPA routing.
2. Add an environment variable **`VITE_API_URL`** = your Render API origin
   (no trailing slash), then deploy.

> Render's free tier sleeps on inactivity, so the first request after idle can take
> a few seconds to wake the API. The `postgres://` connection string Render provides
> is normalised to `postgresql://` automatically in `config.py`.

## Notes

- Default DB is **PostgreSQL** per the project spec. Because the app talks to the
  database through SQLAlchemy, you can point `DATABASE_URL` at SQLite for a quick
  local run (`sqlite:///dev.db`) without code changes.
- Change `SECRET_KEY` and `JWT_SECRET_KEY` before deploying.
- Uploaded files are stored under `backend/uploads/`; generated PDFs under
  `backend/reports/`. Both are git-ignored.
