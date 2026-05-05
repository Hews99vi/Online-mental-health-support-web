# MindBridge Project Handover

## 1. Project Overview
This repository contains a mental health support platform with a React frontend and a Node.js/Express backend. The application supports multiple user journeys: general users seeking support, volunteer listeners, professional therapists, and administrators who review applications, moderate content, and manage platform operations.

At a product level, the platform combines self-service wellness tools with human support workflows. Users can register, manage consent, track mood, write journal entries, browse a content library, enter crisis support flows, book therapy appointments, and join live support chat. Therapists and listeners have dedicated role-based workspaces, and the system also includes optional AI-assisted mood insights and biometric emotion detection.

This handover distinguishes three kinds of statements:
- Implemented: directly supported by the code in this repository.
- Inferred: strongly suggested by architecture or naming, but not explicitly enforced everywhere.
- Not present in repository: no code or config was found to prove the capability.

## 2. Repository Structure
The repository is organized as a two-application codebase:

```text
/
├── backend/
│   ├── src/
│   │   ├── config/         # env and MongoDB connection
│   │   ├── middleware/     # auth, roles, consent, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── realtime/       # Socket.IO chat server
│   │   ├── routes/         # REST API route modules
│   │   ├── services/       # Gemini and email services
│   │   └── utils/          # response and validation helpers
│   ├── test/               # backend smoke tests
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/            # HTTP and socket wrappers
│   │   ├── app/            # providers, auth context, router, guards
│   │   ├── components/     # shared layout and UI components
│   │   ├── features/       # page-level feature modules
│   │   ├── pages/          # some role-specific page groupings
│   │   ├── mocks/          # MSW test/mock handlers
│   │   ├── tests/          # Vitest frontend tests
│   │   └── types/          # shared frontend types
│   ├── vite.config.ts
│   └── tsconfig.json
├── HANDOVER.md
└── txt
```

Implemented:
- Separate frontend and backend `package.json` files.
- Frontend dev proxy forwards `/api` and `/socket.io` to the backend on port `4000`.

Not present in repository:
- Docker setup
- deployment manifests
- CI workflows
- infrastructure-as-code

## 3. Tech Stack
### Frontend
- React 18
- TypeScript
- Vite
- React Router v6
- Socket.IO client
- CSS Modules
- Lucide icons
- Vitest + Testing Library + MSW

### Backend
- Node.js with ES modules
- Express 4
- MongoDB via Mongoose 8
- JWT authentication with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Socket.IO for realtime chat
- Nodemailer for password reset email delivery
- Google Gemini API integration for AI features

### Database
- MongoDB
- Mongoose schemas and indexes used as the only observed persistence layer

## 4. Frontend Architecture
The frontend is a Vite-based React SPA with a route-driven feature structure. The main app shell is built around `BrowserRouter`, an authentication context, route guards, and domain-based feature folders.

### Route structure and guard model
Implemented:
- Public routes: landing page, about, privacy, terms
- Guest-only auth routes: login, register, forgot password, reset password
- Authenticated routes wrapped by `ProtectedRoute`
- Role-gated routes wrapped by `RoleRoute`
- Dedicated route groups for listener, therapist, and admin workspaces
- Crisis page is intentionally accessible without authentication

### AuthContext session restoration flow
Implemented:
- On app boot, `AuthContext` reads `accessToken` from `localStorage`
- If token exists, frontend calls `/api/auth/me`
- On success, frontend restores authenticated state
- On failure, frontend clears stored tokens and resets auth state

Important note:
- The frontend has storage slots for `refreshToken`, but no backend refresh-token flow exists. Authentication is effectively JWT access-token only.

### ProtectedRoute and RoleRoute
Implemented:
- `ProtectedRoute` blocks authenticated sections until auth bootstrap finishes
- unauthenticated users are redirected to `/login?returnUrl=...`
- `RoleRoute` checks a single `user.role` value on the frontend
- unauthorized role access shows an Access Denied page instead of redirecting

Important nuance:
- The backend stores `roles` as an array, but the frontend consumes a single primary role value returned by the API.

### API wrapper behavior
Implemented in `frontend/src/api/http.ts`:
- Base path is `/api`
- Automatically attaches `Authorization: Bearer <token>`
- Sets `Content-Type: application/json` for JSON requests
- Parses API errors into a consistent `ApiError` shape
- Redirects to `/consent?reason=consent_required` on `CONSENT_REQUIRED` backend errors
- Supports `204 No Content`

### Socket client lifecycle
Implemented in `frontend/src/api/socket.ts`:
- Socket instance is lazily created
- token is pulled from `localStorage`
- same-origin socket URL is used by default so local proxy and reverse proxy setups work
- exposed helpers manage connect, disconnect, destroy, join-session, send-message, typing events, and incoming listeners

### Frontend feature domains
Implemented feature areas found in code:
- Authentication
- Dashboard and role-based home pages
- Anonymous/user-to-listener chat
- Therapist directory and onboarding
- Appointment booking and join-session flows
- Mood tracking and history
- Journal entries
- Resource library
- Consent center
- Crisis support page
- Profile management
- Admin review and analytics
- Listener tools
- Therapist tools
- AI weekly insights
- Biometric emotion check-in

## 5. Backend Architecture
The backend is an Express API server with MongoDB-backed persistence, JWT auth, modular route files, and a Socket.IO server attached to the same HTTP server.

### Boot sequence
Implemented in `backend/src/server.js`:
- connect to MongoDB
- seed roles if missing: `user`, `listener`, `therapist`, `admin`
- ensure a bootstrap admin exists
- create Express app
- attach Socket.IO server with CORS
- register chat socket handlers
- start listening on configured port

### Bootstrap admin creation
Implemented:
- If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are not provided, the app generates deterministic bootstrap admin credentials from `JWT_SECRET`
- In non-production mode, generated credentials are printed to logs
- If the user already exists but lacks `admin`, the role is added

Operational implication:
- Client handover should treat admin credential setup as a go-live task, not as something to leave to generated defaults in production.

### Route registration order and consent gating
Implemented in `backend/src/app.js`:
- Public or pre-consent routes: health, auth, consent, crisis
- Most authenticated business routes are wrapped with `enforceRequiredConsent`
- That means library, secure, profile, AI, mood, journal, chat, therapist, therapist tools, listener, appointment, admin, and dashboard routes can be blocked until required legal consent is present

### Middleware responsibilities
Implemented:
- `verifyToken`: validates JWT, loads user, blocks suspended users
- `requireRole(roleName)`: enforces a single required role
- `enforceRequiredConsent`: checks `termsAccepted` and `privacyAccepted` when a bearer token is present
- error middleware returns standard JSON error responses

### Service layer usage
Implemented:
- `services/mailer.js` handles password reset email transport
- `services/gemini.js` calls Gemini models for text and image analysis

### Socket.IO auth and chat event flow
Implemented:
- socket handshake requires JWT token
- suspended or missing users are rejected
- users join chat rooms via `joinSession`
- only session participants can join or send
- events supported: `joinSession`, `sendMessage`, `typing`
- chat messages are persisted to MongoDB before broadcast

## 6. Database Design
MongoDB is the central persistence layer. No SQL schema, Prisma schema, or secondary datastore was found.

### Core identity and account models
- `User`: primary account record with username, email, password hash, roles array, status, and listener online flag
- `Role`: seeded reference collection containing allowed role names
- `UserProfile`: user-facing profile record with display name, avatar URL, and arbitrary preferences object
- `UserConsent`: consent state for terms, privacy, biometric, AI, and analytics toggles

### Professional and support role models
- `TherapistProfile`: therapist application/profile, professional metadata, verification status, pricing, documents metadata
- `ListenerProfile`: listener application/profile, bio, languages, verification status

### Scheduling and care workflow models
- `AvailabilitySlot`: therapist time slot with booking flag
- `Appointment`: therapist-client booking linked to slot and session room details

### Messaging and support models
- `ChatSession`: live support chat between user and listener
- `ChatMessage`: persisted chat messages inside a chat session
- `TherapistClientMessage`: therapist-client secure message thread items

### Care-plan and self-tracking models
- `ClientResourceAssignment`: therapist-to-client resource assignment tracking
- `MoodEntry`: mood score, tags, note, timestamp
- `JournalEntry`: freeform journal content
- `LibraryItem`: content library items with type, category, body, tags, publication status
- `Report`: moderation/reporting record for abuse or issues

### Security model
- `PasswordResetToken`: one-time reset token hash with expiry and `usedAt`

### Relationship summary
Implemented relationships inferred from schema refs:
- one `User` to one `UserProfile`
- one `User` to one `UserConsent`
- one `User` to zero or one `TherapistProfile`
- one `User` to zero or one `ListenerProfile`
- one therapist `User` to many `AvailabilitySlot`
- one appointment links one client `User`, one therapist `User`, and one slot
- one `ChatSession` links one end user and one listener
- one `ChatSession` to many `ChatMessage`
- one therapist-client pair to many `TherapistClientMessage`
- one therapist-client pair to many `ClientResourceAssignment`
- one user to many mood and journal entries

## 7. Authentication and Authorization
This system uses bearer-token JWT authentication.

### Implemented authentication model
- Registration creates a normal `user` account only
- Login accepts email or username plus password
- Passwords are hashed with bcrypt
- JWT contains `sub` and `roles`
- Logout is stateless and returns `204`; no token revocation store was found
- Password reset is email-based using hashed reset tokens in MongoDB

### Important auth observations
- Implemented: JWT-only authentication
- Implemented: no refresh-token endpoint or server-side refresh flow
- Implemented: suspended users are blocked in both HTTP and socket auth
- Inferred: clients are expected to log in again when access token expires

## 8. User Roles and Permissions
Implemented system roles:
- `user`
- `listener`
- `therapist`
- `admin`

### Role priority
Implemented role priority used by the backend and frontend:
- `admin`
- `therapist`
- `listener`
- `user`

This priority determines the single primary role returned to the frontend and used for route gating.

### Permission summary
- `user`: standard end-user flows, mood/journal/library/chat/booking/profile/consent
- `listener`: support chat queue, online availability, active chats, chat history
- `therapist`: therapist profile, availability, appointment management, client summaries, secure client messaging, client mood access, resource assignment
- `admin`: user suspension, therapist/listener approvals, content management, reports, analytics

### Role escalation
Implemented:
- Users sign up only as `user`
- Listener and therapist roles are gained through application plus admin approval workflows

Important nuance:
- `requireRole` checks for exact role membership on the backend
- frontend `RoleRoute` checks the single primary role field returned by the API

## 9. API Design and Request Handling
The backend exposes a REST-style API under `/api`.

### Response format
Implemented:
- success: `{ ok: true, message?, data? }`
- error: `{ ok: false, error: { message, code, details? } }`

### Request handling style
Implemented:
- route modules grouped by business domain
- inline validation in route handlers
- common validation helpers for required fields, email, and password length
- lean Mongoose reads used frequently for response shaping

### Major route families
- Auth: register, login, me, logout, forgot-password, reset-password
- Consent: fetch and update user consent
- Crisis: public crisis resources
- Profile: fetch/update user profile
- Mood: create and list entries
- Journal: CRUD entries
- Library: public/consent-gated browsing plus admin CRUD
- Chat: queue, assign, message history, send message, close, listener availability
- Therapist: application, profile, availability, therapist listing
- Therapist tools: client messages, mood insights, resource assignments, client summary
- Listener: application, self profile, approved listener directory
- Appointments: create, confirm, cancel, reschedule, notes, join details
- Admin: analytics, user management, listener/therapist approvals, reports
- Dashboard: role-based summary payload

### Consent gating
Implemented:
- most authenticated routes are blocked if `termsAccepted` or `privacyAccepted` are false
- auth, consent, and crisis routes remain reachable

## 10. Real-Time Chat Architecture
The platform includes a live chat flow between a user and a listener.

### Implemented chat workflow
- user requests a session via `/api/chat/queue`
- backend checks if user already has an open session
- if a listener is online, the backend chooses the least-loaded listener
- listeners can also claim queued sessions
- messages are stored in `ChatMessage`
- realtime delivery happens over Socket.IO room `chat:<sessionId>`
- typing indicators are transient socket events
- session closure is persisted in `ChatSession`

### Access model
Implemented:
- only participants in a chat session can join its room or send messages
- listeners must already be assigned to the session

### Notable limitation
- No evidence of chat transcript encryption at rest beyond standard database storage
- No evidence of message retention policy or moderation automation in repository

## 11. AI and Biometric Features
The app includes two optional AI-assisted wellness features backed by Gemini.

### AI mood summary
Implemented:
- endpoint: `/api/ai/mood-summary`
- requires authenticated user plus `aiConsent === true`
- frontend `WeeklyInsightPanel` can submit recent mood entries
- backend can fall back to the last 14 mood entries from MongoDB
- Gemini is prompted to return JSON with summary text, suggestions, and disclaimer
- invalid AI responses return `204` rather than unsafe content

### Biometric emotion detection
Implemented:
- endpoint: `/api/ai/emotion-detect`
- requires authenticated user plus `biometricConsent === true`
- frontend can capture a selfie from camera or uploaded image
- backend sends image plus context to Gemini vision model
- backend normalizes response to dominant emotion, confidence list, and disclaimer

### AI request handling and safeguards
Implemented:
- explicit JSON-only prompting
- server-side normalization of AI output
- provider configuration failure returns `503`
- provider runtime failure returns `502`
- disclaimers are required in normalized AI responses

### Privacy caveats
Implemented:
- frontend explicitly tells users images are not stored
- backend does not persist captured biometric images in observed code
- mood entries are persisted
- AI summaries themselves were not observed being persisted

Important caveat:
- Although images are not stored by the app code, they are sent to Gemini for analysis. This should be disclosed clearly to the client and end users.

## 12. Consent and Privacy Controls
Consent is a first-class feature in this platform.

### Implemented consent fields
- `termsAccepted`
- `privacyAccepted`
- `biometricConsent`
- `aiConsent`
- `analyticsConsent`

### Consent enforcement
Implemented:
- legal consent (`termsAccepted` and `privacyAccepted`) gates most authenticated API modules
- AI and biometric features each have their own additional consent checks
- frontend also reacts to `CONSENT_REQUIRED` errors by redirecting to consent settings

### Privacy observations
- Implemented: consent preferences are stored per user
- Implemented: biometric consent is opt-in
- Implemented: AI insights consent is opt-in/out through consent settings
- Not present in repository: cookie banner, audit log of consent changes beyond document timestamps, formal privacy policy version tracking

## 13. Appointments and Therapist Workflow
The therapy workflow is built around therapist verification, availability, booking, and follow-up.

### Therapist lifecycle
Implemented:
- user applies to become therapist
- admin reviews and approves/rejects
- approved therapist creates availability slots
- user books a slot
- therapist confirms, cancels, reschedules, and adds therapist notes
- join information is generated for a Jitsi room shortly before appointment time

### Appointment model
Implemented states:
- `requested`
- `confirmed`
- `cancelled`
- `completed`

### Session handling
Implemented:
- current session provider is `jitsi`
- room names are deterministically derived and randomized using appointment/user data plus secret material
- join URL becomes available within a configured time window before session start

### Therapist tools
Implemented therapist-only tools:
- client list derived from appointments
- client appointment history
- therapist notes per appointment
- therapist-client secure message history
- client mood history and average calculations
- resource assignment catalog and status updates
- client summary endpoint

## 14. Admin and Moderation Features
Administrators have the broadest access in the system.

### Implemented admin functions
- approve/reject therapist applications
- approve/reject listener applications
- list users
- suspend/unsuspend users
- create and close reports
- create, update, and delete library content
- analytics endpoint with aggregate counts and recent trends

### Moderation and analytics
Implemented:
- report records include reporter, target type/id, reason, and status
- analytics include counts for users, therapists, listeners, bookings, mood entries, reports, and library content
- trend series are aggregated over recent days using MongoDB aggregation

### Not present in repository
- role-based admin audit logs
- fine-grained admin permissions
- multi-admin approval workflows

## 15. Environment Variables and Setup
### Observed environment variables
From `.env.example` and runtime config:
- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

Additional env vars implied by code but not included in `.env.example`:
- `APP_BASE_URL`
- `PASSWORD_RESET_TTL_MINUTES`
- `SESSION_BASE_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL_TEXT`
- `GEMINI_MODEL_VISION`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`

### Local run shape
Implemented defaults:
- backend runs on `http://localhost:4000`
- frontend dev server runs on `http://localhost:3000`
- Vite proxies `/api` and `/socket.io` to backend

### Setup dependencies
Client or next maintainer will need:
- MongoDB instance
- strong JWT secret
- optional but recommended SMTP server for password reset
- Gemini API key for AI features
- public frontend base URL for reset links

## 16. Build, Test, and Readiness Status
These notes are based on commands executed against this repository during handover preparation.

### Verified command results
- Frontend build: `npm run build` in `frontend/` passed
- Frontend tests: `npm test -- --run` in `frontend/` partially failed
- Backend tests: `npm test` in `backend/` failed in this environment

### Frontend build result
Implemented and verified:
- production build completes successfully

Observed warning:
- Vite warns that the main JS chunk is larger than 500 kB after minification, suggesting code-splitting improvements

### Frontend test result
Observed:
- most tests passed
- `src/tests/WeeklyInsightPanel.test.tsx` failed
- failure reason observed: `TypeError: localStorage.clear is not a function`

Additional observed warnings:
- React Router future flag warnings
- `act(...)` warnings in `CrisisPage` tests

### Backend test result
Observed:
- smoke test exists
- test failed in sandbox because it attempted to bind a listener socket/server
- observed error included `listen EPERM: operation not permitted 0.0.0.0`

Important interpretation:
- This specific backend failure is environment-related in the current sandbox, but it still means backend test coverage/readiness should be revalidated in a normal local or CI environment before client delivery.

## 17. Known Gaps, Risks, and Handover Notes
### Confirmed gaps in repository
- no deployment configuration was found
- no CI workflow was found
- no infrastructure definitions were found
- no refresh-token auth flow exists
- no file upload/storage implementation was found for therapist verification documents; only document metadata is stored
- no payment gateway integration was found
- no formal monitoring, logging pipeline, or alerting setup was found

### Delivery risks
- Therapist document handling appears metadata-only, so if real file uploads are expected, that is not yet implemented here
- AI features depend on Gemini configuration and external service availability
- Password reset depends on SMTP configuration
- Frontend test suite is not fully green
- Backend tests need rerun outside sandbox
- Large frontend bundle may impact load performance

### Handover notes for the client
- This is a functioning application codebase with strong feature breadth, but it should not be described as fully production-operational unless deployment, secrets management, monitoring, and final QA are completed
- Consent is deeply integrated and should be part of onboarding, legal review, and privacy messaging
- Generated admin credentials should be replaced with explicit production credentials

## 18. Appendix: Endpoint Inventory and Major Models
### Endpoint inventory
#### Public or pre-consent endpoints
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/signin`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/crisis/resources`
- `GET /api/therapists`
- `GET /api/therapists/:id`
- `GET /api/therapists/:id/availability`
- `GET /api/listeners`
- `GET /api/library`
- `GET /api/library/:id`

#### Authenticated user endpoints
- `GET /api/auth/me`
- `GET /api/users/me`
- `POST /api/auth/logout`
- `GET /api/consent/me`
- `PUT /api/consent/me`
- `GET /api/profile/me`
- `PUT /api/profile/me`
- `POST /api/mood`
- `GET /api/mood`
- `GET /api/mood/history`
- `POST /api/journal`
- `GET /api/journal`
- `GET /api/journal/:id`
- `PUT /api/journal/:id`
- `DELETE /api/journal/:id`
- `GET /api/chat/me/open`
- `POST /api/chat/queue`
- `GET /api/chat/:sessionId/messages`
- `POST /api/chat/:sessionId/messages`
- `POST /api/chat/:sessionId/close`
- `POST /api/reports`
- `GET /api/dashboard/me`
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/appointments/me`
- `POST /api/appointments/:id/cancel`
- `POST /api/appointments/:id/reschedule`
- `GET /api/appointments/:id`
- `GET /api/appointments/:id/join`
- `POST /api/ai/mood-summary`
- `POST /api/ai/emotion-detect`

#### Listener endpoints
- `POST /api/listener/apply`
- `GET /api/listener/me`
- `GET /api/listener/online`
- `PUT /api/listener/online`
- `GET /api/listener/chats/active`
- `GET /api/listener/chats/history`
- `POST /api/chat/:sessionId/assign`
- `GET /api/secure/listener`

#### Therapist endpoints
- `POST /api/therapist/apply`
- `POST /api/therapists/apply`
- `GET /api/therapist/me`
- `PUT /api/therapist/me`
- `POST /api/therapist/availability`
- `GET /api/therapist/availability`
- `GET /api/appointments/therapist`
- `GET /api/therapist/clients`
- `GET /api/therapist/clients/:clientId/appointments`
- `POST /api/appointments/:id/confirm`
- `POST /api/appointments/:id/notes`
- `PUT /api/appointments/:id/notes`
- `DELETE /api/appointments/:id/notes`
- `GET /api/therapist/resources/catalog`
- `GET /api/therapist/clients/:clientId/messages`
- `POST /api/therapist/clients/:clientId/messages`
- `GET /api/therapist/clients/:clientId/mood`
- `GET /api/therapist/clients/:clientId/resources`
- `POST /api/therapist/clients/:clientId/resources`
- `PUT /api/therapist/resource-assignments/:id`
- `GET /api/therapist/clients/:clientId/summary`
- `GET /api/secure/therapist`

#### Admin endpoints
- `GET /api/admin/analytics`
- `GET /api/admin/listeners`
- `POST /api/admin/listeners/:id/approve`
- `POST /api/admin/listeners/:id/reject`
- `GET /api/admin/users`
- `POST /api/admin/users/:id/suspend`
- `POST /api/admin/users/:id/unsuspend`
- `GET /api/admin/reports`
- `POST /api/admin/reports/:id/close`
- `GET /api/admin/therapists`
- `POST /api/admin/therapists/:id/approve`
- `POST /api/admin/therapists/:id/reject`
- `POST /api/admin/library`
- `PUT /api/admin/library/:id`
- `DELETE /api/admin/library/:id`
- `GET /api/secure/admin`

### Major model quick reference
- `User`: account identity, roles, auth status, listener availability
- `Role`: allowed role catalogue
- `UserProfile`: presentation layer profile/preferences
- `UserConsent`: legal and optional consent state
- `TherapistProfile`: therapist application, verification, pricing, credentials metadata
- `ListenerProfile`: listener application and review state
- `AvailabilitySlot`: therapist schedule slot
- `Appointment`: booked therapist-client session
- `ChatSession`: live support chat assignment and status
- `ChatMessage`: stored messages for listener-user chat
- `TherapistClientMessage`: stored therapist-client secure message
- `ClientResourceAssignment`: therapist-assigned resource tracking
- `MoodEntry`: daily mood tracking
- `JournalEntry`: journaling content
- `LibraryItem`: admin-managed content library
- `Report`: moderation/safety report
- `PasswordResetToken`: one-time password reset token hash

## Client Handover Checklist
- Provision MongoDB and confirm connection string
- Set explicit production `JWT_SECRET`
- Set explicit `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`
- Configure `APP_BASE_URL` for password reset links
- Configure SMTP for password reset delivery
- Configure `GEMINI_API_KEY` and chosen Gemini model names if AI features are required
- Confirm whether therapist verification requires real document uploads rather than metadata only
- Re-run backend tests outside sandbox
- Fix frontend failing `WeeklyInsightPanel` tests
- Review bundle-size/code-splitting opportunities before production
- Validate all consent/legal copy with client or legal owner
- Confirm deployment, domain, SSL, monitoring, backups, and incident response because those were not present in this repository
