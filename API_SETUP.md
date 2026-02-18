# API Configuration & Testing

## Backend Connection

The frontend connects to the backend via `src/api/client.js`:

- **Default URL:** `http://localhost:8000/api`
- **Override:** Set `VITE_API_URL` in `.env.local` (e.g. `VITE_API_URL=http://localhost:8000/api`)

## API Endpoints (All Tested ✓)

| Endpoint | Method | Auth | Frontend Usage |
|----------|--------|------|----------------|
| `/api/token/` | POST | None | Login (Login.jsx) |
| `/api/token/refresh/` | POST | None | Token refresh |
| `/api/document-types/` | GET | JWT | List templates (App.jsx) |
| `/api/document-types/` | POST | Staff | Create template (TemplateBuilder.jsx) |
| `/api/create/` | POST | Staff | Create document (DataEntryForm.jsx) |
| `/api/verification-stats/` | GET | None | Total verified count + recently verified (VerificationTool.jsx) |
| `/api/verify/<code>/` | GET | None | Verify document (VerificationTool.jsx) |
| `/api/documents/<code>/download/` | GET | None | Download PDF (PdfPreviewer.jsx) |
| `/api/analytics/` | GET | JWT | Dashboard stats (Dashboard.jsx) |

## Running the Stack

### 1. Start Backend
```bash
cd Document_Generator_backend
source venv/bin/activate
python manage.py migrate
python manage.py runserver 8000
```

### 2. Start Frontend
```bash
cd Document_Generator
npm run dev
```

### 3. Create First User (if needed)
```bash
cd Document_Generator_backend
python manage.py createsuperuser
# Or for testing: DJANGO_SUPERUSER_USERNAME=admin DJANGO_SUPERUSER_PASSWORD=admin python manage.py createsuperuser --noinput
```

### 4. Seed Document Types (if needed)
```bash
cd Document_Generator_backend
python scripts/setup_document_types.py
```

## Test API

```bash
cd Document_Generator_backend
source venv/bin/activate
python scripts/test_api.py
```

Requires: backend running, superuser (admin/admin for default test), document types seeded.

## PDF Download

After creating a document, the backend returns `pdf_url` (e.g. `/media/documents/XXX.pdf`). The frontend:

1. **Primary:** Opens the full URL (origin + pdf_url) in a new tab
2. **Fallback:** Calls `/api/documents/<tracking>/download/` if pdf_url is not available
