# Hair Salon Management

This repository contains a Flask backend and React + Vite frontend for managing salon services, appointments, inventory, and users.

Quick start (development):

- Backend (virtualenv):

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python app.py
```

- Frontend:

```bash
cd frontend
npm install
npm run dev
```

Run tests:

```bash
cd backend
pytest
```

Production (example using Gunicorn + Eventlet):

```bash
pip install -r requirements.txt
gunicorn -k eventlet -w 1 app:app
```

Environment variables:

- SECRET_KEY=
- JWT_SECRET_KEY=
- DATABASE_URL=
- MYSQL_HOST=
- MYSQL_PORT=3306
- MYSQL_USER=
- MYSQL_PASSWORD=
- MYSQL_DB=

- MAIL_SERVER=
- MAIL_PORT=587
- MAIL_USERNAME=
- MAIL_PASSWORD=
- MAIL_USE_TLS=True
- MAIL_USE_SSL=False
- MAIL_DEFAULT_SENDER=
- MAIL_DEBUG=False
- MAIL_SUPPRESS_SEND=False

- CORS_ORIGINS=*
- FRONTEND_URL=http://localhost:5173
- VITE_API_BASE_URL=http://localhost:5000/api
- VITE_PORT=5173
