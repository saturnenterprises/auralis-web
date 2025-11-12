# Auralis – Product Requirements Document (PRD)

## 1. Product summary
- **Product**: Auralis – AI-powered telephony platform for outbound calling, conversation monitoring, and agent operations.
- **Audience**: Operations managers, call center supervisors, CX leads, and agents.
- **Primary value**: Initiate AI-driven outbound calls, monitor real-time conversations, manage agents, review call/conversation logs, and configure system settings.
- **Platforms**: Web app (Vite + React + TypeScript + Tailwind). Backend endpoints via Express (dev) and Vercel serverless (prod). Firebase Data Connect planned.

## 2. Goals and non-goals
- **Goals**
  - Enable users to place outbound AI calls (demo and live) and track status.
  - Provide comprehensive dashboards: KPIs, call logs, conversation logs (with sentiment), and agent management.
  - Offer support workflows and a settings hub for profile, notifications, audio, and security.
  - Prepare for integration with Firebase Data Connect for persistent data and analytics.
- **Non-goals**
  - Inbound call routing/UI.
  - Deep workforce management (e.g., full WFM suite, payroll).
  - Payment/subscription handling.

## 3. Navigation and information architecture
- **Global routes (current)**:
  - `/dashboard` – Main operational hub with left sidebar sections:
    - Dashboard (default)
    - Make Call
    - Call Logs
    - Agents
    - Support
    - Convo Logs
    - Settings
- **Missing/Recommended routes**:
  - `/analytics` – Advanced analytics and reporting.
  - `/recordings` – Centralized recordings browser.
  - `/integrations` – Connectors (e.g., CRM, ticketing, storage, Twilio/ElevenLabs configuration UI).
  - `/admin` – Admin console for roles, teams, and org settings.

## 4. Roles and permissions (future-ready)
- **Admin**: Full access to all screens and configurations.
- **Supervisor**: View dashboards, logs, analytics; manage agents; limited settings.
- **Agent**: Make Call, view personal logs, limited profile settings.
- **Support**: Support section, read-only logs, create/update tickets.

## 5. Screen-by-screen requirements

### 5.1 Dashboard (Overview)
- **KPIs**:
  - Total Calls Today, Active Agents, Avg Call Duration, Call Quality Score.
- **Recent Calls list**:
  - Caller, number, duration, status (completed/missed/abandoned), time, agent, recording indicator with Play action.
- **Active Agents panel**:
  - Agent avatar initials, presence badge (available/busy/break/offline), calls today, total duration.
- **Live Call Control (demo)**:
  - Start/End and basic audio toggle.
- **Empty states and loading**:
  - Skeleton or muted card states when data is loading/unavailable.
- **Filters**:
  - Date range filter (top-level) and quick search.

### 5.2 Make Call
- **Phone input** with country selector and formatting per locale.
- **Demo Mode toggle**:
  - Demo simulates calling flow and generates fake `callId`, system + AI messages.
- **Live Mode (backend)**:
  - POST `/api/elevenlabs-call` with fully qualified E.164 phone number.
  - Success: show Connected status, `callId`, agent name, phone, timestamp.
  - Failure: show specific error; allow retry.
- **Status area**:
  - Icons for Calling, Connected, Failed; badges for Demo/Live; partial `callId` badge.
- **Conversation log** (session-local):
  - Stream of system/AI/user messages with timestamp.
- **Edge cases**:
  - Disable inputs while calling/connected.
  - Validate phone number; prevent empty submissions.

### 5.3 Call Logs
- **List of call records** with:
  - Caller, number, duration, status (completed/missed/abandoned), time, agent, recording availability.
- **Controls**:
  - Search by caller/number/agent.
  - Filters (status, agent, date range); Export CSV.
  - Play recording (opens player/modal when available).
- **Empty state**:
  - Hint to make a call or adjust filters.

### 5.4 Agents
- **Agent directory rows**:
  - Avatar initials with presence indicator, name, email, location, shift.
  - Status badge (available/busy/break/offline), calls today, total duration, rating.
  - Row actions: View Details, Edit, Disable.
- **Counters**:
  - Available, Busy, Break, Offline.
- **Actions**:
  - Add Agent (form + validation).
  - Manage Shifts (modal or dedicated sub-screen).

### 5.5 Support
- **Support tickets list**:
  - ID, title, status (open/in-progress/resolved), priority, assignee, created time, description.
- **New ticket form**:
  - Subject, priority, description; submit button.
- **Contact cards**: Emergency, Email, Live Chat.
- **FAQ section**.

### 5.6 Convo Logs (Conversation Monitor)
- **Live monitor feed**:
  - AI/Human messages, speaker labels, timestamps, sentiment badges.
- **Agent status card**:
  - Status text, indicator dot, manual refresh.
- **Make a Call** within this screen:
  - Country selector + phone input, Make/End Call buttons, active call panel with timer.
- **Actions**:
  - Start/Stop Live (demo generator), Export logs to text, Clear logs.
- **Stats cards**:
  - AI messages, Human messages, Positive sentiment count, Issues detected.
- **Error logs panel** (when errors present) with Clear Logs.

### 5.7 Settings
- **Profile settings**:
  - First/Last name, Email, Phone, Department; Password change (current/new).
- **Notification preferences**:
  - Call alerts, Email updates, System maintenance, Weekly reports.
- **Audio settings**:
  - Mic level, Speaker level, Echo cancellation, Noise suppression.
- **Security settings**:
  - 2FA toggle, Session timeout select, Login history, API keys management link.
- **Save Changes** primary action.

## 6. Additional recommended screens (niche-aligned)

### 6.1 Analytics & Reports
- Time-series charts: Calls, Average duration, Answer rate, Success rate.
- Agent performance: Calls handled, AHT, CSAT (if available), sentiment breakdown.
- AI performance: Connection success, error rates, average time-to-connect.
- Export: CSV/PDF for selected ranges.

### 6.2 Recordings Browser
- Unified list of recordings with filters by date, agent, status, sentiment.
- Audio player with waveform, playback speed, and transcript (if available).
- Actions: Download, Share link (role-gated), Delete (role-gated).

### 6.3 Integrations
- ElevenLabs configuration UI (agentId, phoneNumberId) with validation.
- Twilio credentials screen (if applicable) with masked values and test connectivity.
- CRM/Ticketing connectors (e.g., HubSpot, Zendesk) toggles and mapping.
- Storage destinations for recordings (e.g., GCS, S3) + retention policy.

### 6.4 Admin Console
- User management: invite users, assign roles (Admin/Supervisor/Agent/Support).
- Teams/queues: group agents, assign skills.
- Org settings: company info, domains, allowed origins, session policies.

## 7. Data model (proposed)
Pending Firebase Data Connect schema finalization. Suggested core entities:
- **Call**:
  - id, toNumber, fromNumber, agentId, status, durationSec, startedAt, endedAt, recordingUrl, transcriptId, sentimentSummary, errorCode
- **ConversationMessage**:
  - id, callId, type (ai|human|system), content, timestamp, sentiment
- **Agent**:
  - id, name, email, status, location, shiftStart, shiftEnd, rating
- **Ticket**:
  - id, title, description, priority, status, assignee, createdAt, updatedAt, createdBy
- **User**:
  - id, role, profile fields

**Indices**:
- Calls by time, agentId, status; Messages by callId, time; Tickets by status/createdAt.

## 8. External services and environment
- ElevenLabs Conversational AI via `@elevenlabs/elevenlabs-js` for outbound calls.
- Dev API: Express on 3001; Vite proxy `/api`.
- Prod API: Vercel function `api/elevenlabs-call.js`.
- Secrets management:
  - Do not commit `.env`. Store credentials in environment-specific secret stores (Vercel project env vars, Firebase functions config, local `.env.local`). Rotate current committed secrets.

## 9. Validation and error handling
- Phone input: enforce E.164 server-side; client-side formatting by country.
- API errors: surface reason (rate limit, invalid number, auth failure) with retry.
- Empty states: clear guidance and CTAs.
- Loading states: skeletons/spinners for lists and KPI cards.

## 10. Accessibility and UX
- Keyboard accessible controls; visible focus states.
- High-contrast badges for statuses; color + icon dual encoding.
- Announce live updates (ARIA live regions) for conversation feed and status changes.

## 11. Analytics and telemetry (future)
- Track call initiation, connection status, failures.
- Track agent presence changes, ticket creation, settings changes.
- Aggregate metrics for KPI cards and analytics screens.

## 12. Security and privacy
- Role-based access control on routes/components.
- Mask PII in logs; redact sensitive data in transcripts.
- Restrict CORS to trusted origins in production.
- Recording retention and deletion policies.

## 13. Tech notes and architecture
- Frontend: React 18 + TS, shadcn UI, Tailwind; React Router; TanStack Query.
- Backend: Express (dev) + Vercel functions (prod). Planned Firebase Data Connect for persistence.
- Service worker caches static assets; long-cache headers for videos.

## 14. Refactor plan checklist
- Implement RBAC and route guarding.
- Replace demo data with Data Connect queries/mutations.
- Centralize phone validation and formatting utilities.
- Unify call initiation UX across Make Call and Convo Logs.
- Add recordings browser and analytics screens.
- Move secrets to env stores and rotate leaked credentials.
- Tighten CORS; add error code mapping and retries.

## 15. Acceptance criteria
- Users can place demo and live calls with clear status and errors.
- Dashboard, Call Logs, Convo Logs, Agents, Support, Settings meet requirements above.
- Added Analytics, Recordings, Integrations, Admin Console routes exist with basic scaffolding and navigation.
- Data persisted via Firebase Data Connect for calls, messages, agents, and tickets.
- No secrets in repo; environment variables configured per environment.

## 16. Glossary
- AHT: Average Handle Time.
- E.164: International phone number format specification.
- RBAC: Role-Based Access Control.
