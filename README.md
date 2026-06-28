# Clinic Appointment Manager

Full-stack monorepo for managing clinic doctors, patients, and appointments.

## Structure

```
clinic-management/
├── docker-compose.yml    # PostgreSQL
├── .env                  # Environment variables
├── backend/              # Django REST API
└── frontend/             # Angular Material SPA
```

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Angular CLI (`npm i -g @angular/cli`)
- Docker Desktop
- pip / virtualenv

## Setup

### 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000/`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

The Angular app runs at `http://localhost:4200/`.

**Default logins:**
- Admin: `admin` / `admin123`
- Doctor: email from doctor record / `pass123`

**Role-based UI:**
- **Admin** -> Dashboard, Doctor Management, Patient Management, Appointment Scheduler
- **Doctor** -> My Appointments (read-only)

## API Documentation

Interactive API docs are available via Swagger UI and ReDoc:

| URL | Description |
|-----|-------------|
| `http://127.0.0.1:8000/api/docs/` | Swagger UI (interactive testing) |
| `http://127.0.0.1:8000/api/redoc/` | ReDoc (read-only docs) |
| `http://127.0.0.1:8000/api/schema/` | OpenAPI 3 JSON schema |

### Test APIs in Swagger UI

1. Open `http://127.0.0.1:8000/api/docs/`
2. Expand `POST /api/auth/token/` and click **Try it out**
3. Submit credentials, e.g. `{"username": "admin", "password": "admin123"}`
4. Copy the `access` token from the response
5. Click **Authorize** (top right) and paste **only the raw token** (no `Bearer ` prefix)
6. Try protected endpoints such as `GET /api/doctors/` or `POST /api/appointments/`

Appointment filters appear in Swagger automatically: `status`, `doctor`, `patient`.

## Roles and Access

The API supports two roles:

| Role | Login | Access |
|------|-------|--------|
| **Admin / Staff** | Django superuser or `is_staff=True` user | Full CRUD on doctors, patients, and appointments |
| **Doctor** | Auto-created when admin adds a doctor | Read-only access to **their own** appointments only |

### Doctor login flow

When admin creates a doctor via `POST /api/doctors/` or Django admin, a login account is auto-created:

- **Username**: doctor's email
- **Password**: default `pass123` (returned once in the create response as `generated_password`; password change can be added later)

Share those credentials with the doctor. They can then log in via `POST /api/auth/token/` and call `GET /api/doctor/appointments/` to see only their appointments (no query params needed).

Doctors **cannot** access `/api/doctors/`, `/api/patients/`, or create/update/delete appointments.

## Authentication

Obtain JWT tokens:

```bash
POST http://127.0.0.1:8000/api/auth/token/
Content-Type: application/json

{
  "username": "your_superuser",
  "password": "your_password"
}
```

Use the access token in requests:

```
Authorization: Bearer <access_token>
```

Refresh token:

```bash
POST http://127.0.0.1:8000/api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/token/` | Login (JWT) |
| POST | `/api/auth/token/refresh/` | Refresh JWT |
| GET | `/api/auth/me/` | Current user role (admin/doctor) |
| GET | `/api/dashboard/stats/` | Admin dashboard analytics (staff only) |
| GET/POST | `/api/doctors/` | List / create doctors (staff only) |
| GET/PUT/PATCH/DELETE | `/api/doctors/<id>/` | Doctor detail (staff only) |
| GET/POST | `/api/patients/` | List / create patients (staff only) |
| GET/PUT/PATCH/DELETE | `/api/patients/<UHID>/` | Patient detail by UHID (staff only) |
| GET/POST | `/api/appointments/` | List / create appointments (staff); doctors read own only |
| GET/PUT/PATCH/DELETE | `/api/appointments/<id>/` | Appointment detail (staff); doctors read own only |
| GET | `/api/doctor/appointments/` | Doctor's own appointments (doctor JWT only) |

### Appointment filters

- `GET /api/appointments/?status=Scheduled`
- `GET /api/appointments/?doctor=<id>`
- `GET /api/appointments/?patient=UHID000001`

### Patient registration (UHID)

Each patient receives a unique **UHID** at registration (e.g. `UHID000001`). It is auto-generated and read-only.

- Patient detail URLs use UHID: `/api/patients/UHID000001/`
- Appointments reference the patient by UHID when booking or editing: `"patient": "UHID000001"`
- Filter appointments by patient UHID: `?patient=UHID000001`

## Models

- **Doctor**: name, email, specialization, linked login user (auto-created)
- **Patient**: uhid (auto-assigned at registration), name, email, phone
- **Appointment**: doctor, patient, date, time, status (`Scheduled`, `Completed`, `Cancelled`)

Double-booking is prevented via a unique constraint on `(doctor, date, time)`.

## Admin

Django admin is available at `http://127.0.0.1:8000/admin/` using the superuser credentials.
