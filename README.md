# MatchMySize Web

React + Vite frontend with a small Node/Express backend for secure Text.lk OTP requests.

## Setup

1. Copy `.env.example` to `.env`
2. Fill in the Firebase web config (`VITE_...`)
3. Fill in the backend secrets:
   - `TEXTLK_API_TOKEN`
   - `TEXTLK_SENDER_ID`
   - `FIREBASE_SERVICE_ACCOUNT_PATH`
   - `FIREBASE_PROJECT_ID`
4. Install dependencies
   - `npm install`

## Development

- Frontend + backend together: `npm run dev`
- Frontend only: `npm run dev:client`
- Backend only: `npm run dev:server`

## Production build

- Build frontend: `npm run build`
- Start Node server: `npm run start`

## Firebase hosting setup

This repo deploys in two pieces:

- Firebase Hosting serves the Vite frontend from `dist`
- Cloud Run serves the Express API under `/api/*`

Files already added for this setup:

- `firebase.json`
- `.firebaserc`
- `Dockerfile`
- `.dockerignore`
- `.env.production.example`
- `scripts/generate-production-env.mjs`
- `scripts/deploy-cloudrun.mjs`
- `scripts/deploy-hosting.mjs`

### 1. Build the frontend for hosting

1. Generate `.env.production` from `.env`
2. Build:

   ```bash
   npm run deploy:prepare
   npm run build
   ```

### 2. Deploy the API to Cloud Run

Use the same Google project as Firebase:

```bash
gcloud auth login
npm run deploy:api
```

Set these runtime environment variables on the Cloud Run service:

- `FIREBASE_PROJECT_ID`
- `TEXTLK_API_TOKEN`
- `TEXTLK_SENDER_ID`
- `TEXTLK_BASE_URL`
- `TEXTLK_OTP_TEMPLATE`
- `TEXTLK_OTP_TTL_MS`

Notes:

- Cloud Run can now use application default credentials, so you do not need to mount a Firebase service-account JSON in production.
- The Cloud Run runtime service account must have access to Firebase Auth and Firestore in your Google project.

### 3. Deploy Firebase Hosting

```bash
firebase login
npm run deploy:hosting
```

`firebase.json` is configured so:

- `/api/**` rewrites to the Cloud Run service `matchmysize-api`
- all other routes rewrite to `/index.html` for React Router

## Notes

- The frontend uses the same Firebase project and Firestore collections as the mobile app.
- Login stays phone + password.
- Signup and change-password OTP flows use Text.lk through the Node backend.
- QR scan is intentionally not included in the web build.
