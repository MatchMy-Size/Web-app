# MatchMySize

MatchMySize is organized as a modular-monolith system with one Spring Boot backend for the web and mobile clients.

```text
.
├── frontend/       React + Vite website (Netlify)
├── backend/        Spring Boot modular monolith (Render)
├── netlify.toml
└── render.yaml
```

## Architecture

- **Clients:** the website and mobile app communicate only with the Spring API.
- **Authentication:** Spring performs Supabase Auth registration, login, refresh, logout, and password operations. Clients never receive Supabase project credentials.
- **Application API:** Spring modules cover identity, OTP, profiles, measurements, family members, and catalog data.
- **Database:** Supabase PostgreSQL, managed by Flyway migrations and accessed only by Spring.
- **Catalog ownership:** every product/size record has a required PostgreSQL foreign key to its seller account; deleting a seller with catalog data is restricted.
- **Images:** Cloudinary uploads remain unchanged.
- **SMS:** Text.lk is called only by Spring.

Legacy customer accounts were intentionally reset. Seller and super-admin identities and profiles were retained in Supabase, but they require a password reset before their first Supabase login because the previous password hashes are not portable. New customer accounts must be created through the OTP registration API.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and fill in the server values.
2. Copy `frontend/.env.example` to `frontend/.env` and set the backend URL and Cloudinary values.
3. Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

4. Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The browser opens at `http://localhost:5173`; the Spring API listens at `http://localhost:8080`.

## Production

- Render reads `render.yaml` and builds `backend/Dockerfile`.
- Netlify reads `netlify.toml`, builds `frontend/`, and applies the SPA fallback.
- Add the values documented in each `.env.example` to the relevant provider dashboard. Never commit real credentials.
