# Mobile integration contract

The mobile app must use the same Spring API as the website. It must not connect directly to the authentication provider or PostgreSQL.

## Client changes

1. Register and sign in through the `/api/auth` endpoints below.
2. Store the returned access and refresh tokens using the platform's secure storage.
3. Attach `Authorization: Bearer <access token>` to protected requests.
4. Refresh expired sessions through `POST /api/auth/refresh`.
5. Send profile and measurement data only through the Spring API.
6. Keep Cloudinary upload behavior unchanged, but send the resulting URL through the profile API.

## Endpoints

| Method and path | Purpose |
|---|---|
| `POST /api/otp/request` | Send signup or signed-in change-password OTP |
| `POST /api/otp/verify` | Verify OTP session |
| `POST /api/auth/register` | Create an account after OTP and return a session |
| `POST /api/auth/login` | Sign in with phone number and password |
| `POST /api/auth/password/reset/request` | Send a reset OTP after confirming the phone belongs to an account |
| `POST /api/auth/password/reset` | Reset a password with a verified reset OTP; no active session required |
| `POST /api/auth/refresh` | Refresh an expired access token |
| `POST /api/auth/logout` | Revoke the current session |
| `GET /api/auth/me` | Get the current authenticated identity |
| `PUT /api/auth/password` | Change password after OTP |
| `GET /api/profile/me` | Get merged profile, measurements, and family members |
| `PUT/PATCH /api/profile/me` | Create or edit customer profile |
| `POST /api/profile/me/measurement-profiles` | Add a self measurement profile |
| `PUT /api/profile/me/measurement-profiles/{key}/active` | Set active self profile |
| `POST /api/profile/me/family-members` | Add family member |
| `POST /api/profile/me/family-members/{id}/measurement-profiles` | Add family measurements |
| `PUT /api/profile/me/family-members/{id}/measurement-profiles/{key}/active` | Set active family profile |
| `GET /api/catalog/bootstrap` | Load the brand-size catalog |

The response envelope is `{ "status": "success", "data": ... }`; errors use `{ "status": "error", "message": "...", "code": "..." }`.
