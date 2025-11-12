# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auralis is an AI-powered telephony platform for outbound calling and conversation monitoring. It integrates ElevenLabs Conversational AI for voice interactions and uses Firebase (Firestore + Data Connect) for persistent storage.

**Stack**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui components

## Development Commands

### Running the application
```bash
# Start both dev server (port 3001) and client (port 8080) concurrently
npm run dev

# Run only the Vite client (requires separate backend)
npm run dev:client

# Run only the Express dev server
npm run dev:server
```

### Build and lint
```bash
# Production build
npm run build

# Development build (with dev environment variables)
npm run build:dev

# Lint with ESLint
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Dual Server Architecture

The app runs with **two servers** in development:

1. **Vite dev server** (port 8080): Serves the React frontend with HMR
2. **Express dev server** (port 3001): Handles API endpoints for ElevenLabs, Twilio, and Firebase operations

The Vite config proxies `/api` requests to the Express server (see `vite.config.ts:17-23`).

In **production** (Vercel):
- Frontend is served as static files from `dist/`
- API endpoints run as Vercel serverless functions in `api/` directory
- The `api/elevenlabs-call.js` function handles outbound calls

### Frontend Structure

```
src/
├── pages/          # Route-level components
│   ├── Index.tsx           # Landing page (/)
│   ├── SignIn.tsx          # Sign-in page (/signin)
│   └── Dashboard.tsx       # Main app hub (/dashboard) - contains all sections
├── components/
│   ├── dashboard/          # Dashboard section components
│   │   ├── AgentsSection.tsx
│   │   ├── CallLogsSection.tsx
│   │   ├── ConvoLogsSection.tsx
│   │   ├── SettingsSection.tsx
│   │   └── SupportSection.tsx
│   ├── sections/           # Landing page sections
│   │   ├── CallInterface.tsx
│   │   ├── HeroSection.tsx
│   │   └── ServicesSection.tsx
│   ├── ui/                 # shadcn/ui components (59 components)
│   ├── layout/             # Layout wrappers
│   └── admin/              # Admin-related components
├── lib/                    # Services and utilities
│   ├── types.ts                    # TypeScript type definitions
│   ├── callManager.ts              # Call state management
│   ├── callsService.ts             # Call data fetching
│   ├── elevenlabsService.ts        # ElevenLabs API client
│   ├── twilioService.ts            # Twilio API client
│   ├── firebaseClient.ts           # Firebase client SDK init
│   ├── firebaseService.ts          # Firestore operations
│   ├── enhancedFirebaseService.ts  # Advanced Firestore queries
│   ├── dashboardService.ts         # Dashboard data aggregation
│   └── messagesService.ts          # Conversation messages
└── hooks/                  # Custom React hooks
```

### Backend Structure

```
api/                        # Vercel serverless functions (production)
├── elevenlabs-call.js      # Main outbound call endpoint
├── elevenlabs-agents.js
├── elevenlabs-conversations.js
├── sync-calls.js           # Firestore synchronization
├── twilio-calls.js
├── twilio-recordings.js
└── twilio/
    └── webhooks.js         # Twilio status/recording callbacks

lib/                        # Server-side utilities (shared by dev-server.js and api/)
├── firebaseAdmin.js        # Firebase Admin SDK initialization
└── serverCallsService.js   # Server-side Firestore operations

dev-server.js               # Express server for local development (port 3001)
```

### Key API Endpoints

All API endpoints are prefixed with `/api`:

- `POST /api/elevenlabs-call` - Initiate outbound call via ElevenLabs
  - Body: `{ phoneNumber: string }` (E.164 format)
  - Creates Firestore call record with status tracking
  - Returns: `{ callId, status, elevenlabsCallId, agentName, ... }`

- `GET /api/elevenlabs/conversations` - List ElevenLabs conversations
- `GET /api/elevenlabs/conversations/:id` - Get conversation details
- `GET /api/twilio/calls` - Fetch Twilio call records via REST API
- `GET /api/twilio/recordings?callSid=<sid>` - Get recordings for a call
- `POST /api/twilio/status-callback` - Twilio call status webhook
- `POST /api/twilio/recording-callback` - Twilio recording webhook
- `GET /api/test-firebase` - Test Firebase Admin SDK initialization
- `GET /api/health` - Health check

### Firebase Integration

**Firestore** is the primary datastore:
- Collections: `calls`, `conversation_messages`, `agents`, `tickets`
- Client SDK: `src/lib/firebaseClient.ts` (frontend)
- Admin SDK: `lib/firebaseAdmin.js` (backend)

**Firebase Data Connect** (planned):
- Schema: `dataconnect/schema/schema.gql` (GraphQL)
- Connector: `dataconnect/connector/` with queries/mutations
- Generated SDK: `dataconnect-generated/js/default-connector/`
- Currently scaffolded but not fully integrated

### Dashboard Navigation

The `/dashboard` route renders `Dashboard.tsx`, which contains a left sidebar with sections:

1. **Dashboard** (default) - KPIs, recent calls, active agents
2. **Make Call** - Phone input, demo/live mode toggle, call status, conversation log
3. **Call Logs** - Searchable/filterable call history with recording playback
4. **Agents** - Agent directory with status, shifts, and actions
5. **Support** - Ticket management and contact info
6. **Convo Logs** - Live conversation monitoring with sentiment analysis
7. **Settings** - Profile, notifications, audio, security preferences

All sections are rendered within the same `Dashboard.tsx` component using conditional rendering based on `activeSection` state.

## Important Patterns

### Phone Number Handling
- **Client-side**: Format with country selector (uses international format)
- **Server-side**: Validate E.164 format before calling ElevenLabs
- Phone validation utility: centralized in `src/lib/utils.ts` (or should be)

### Call Flow
1. User submits phone number in Make Call or Convo Logs section
2. Frontend POSTs to `/api/elevenlabs-call` with `{ phoneNumber }`
3. Backend generates `callId`, creates Firestore record with status `initiating`
4. Backend calls ElevenLabs API to initiate outbound call
5. Backend updates Firestore record to `calling` status with ElevenLabs callId
6. Frontend polls/subscribes to Firestore for status updates
7. Twilio webhooks update call status (`completed`, `failed`, etc.)

### Demo Mode
- Toggle in Make Call and Convo Logs sections
- Simulates calling flow with fake data (no actual API calls)
- Generates local `callId` and mock messages for testing UI

### State Management
- **React Query** (`@tanstack/react-query`) for server state caching
- **Local state** (useState) for UI interactions
- **Firestore real-time listeners** for live call/conversation updates

## Environment Variables

Required environment variables (see `.env` - **DO NOT COMMIT**):

```bash
# Twilio (for outbound calls via ElevenLabs integration)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_NUMBER=+1...

# ElevenLabs (primary calling service)
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
ELEVENLABS_PHONE_NUMBER_ID=phnum_...

# Firebase Admin SDK (server-side only)
FIREBASE_SERVICE_ACCOUNT_KEY=...

# Vercel (production)
NEXT_PUBLIC_BASE_URL=https://...
```

**Security note**: The current `.env` file contains committed secrets. In production:
- Use Vercel project environment variables
- Use Firebase Functions config for secrets
- Rotate any exposed credentials

## Common Development Tasks

### Adding a new API endpoint
1. **Development**: Add route to `dev-server.js`
2. **Production**: Create function in `api/` directory
3. Update `vercel.json` if function needs special config (timeout, memory)

### Adding a new dashboard section
1. Create component in `src/components/dashboard/`
2. Add section to sidebar nav in `Dashboard.tsx`
3. Add conditional rendering logic in main content area
4. Update section state management

### Working with Firebase
- **Client-side queries**: Use hooks in `src/lib/firebaseService.ts` or `enhancedFirebaseService.ts`
- **Server-side operations**: Import from `lib/serverCallsService.js`
- **Real-time updates**: Use Firestore listeners with `onSnapshot`

### Using shadcn/ui components
```bash
# Components are already installed in src/components/ui/
# Import as: import { Button } from "@/components/ui/button"
```

All component imports use the `@/` alias which resolves to `src/` (see `vite.config.ts:27-29`).

## Testing

No test suite is currently configured. When adding tests:
- Consider Vitest for unit tests (Vite-native)
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

## Deployment

**Platform**: Vercel

**Process**:
1. Push to repository (or use Lovable platform)
2. Vercel auto-deploys from main branch
3. Set environment variables in Vercel project settings
4. Functions in `api/` directory are deployed as serverless functions

**Build config**: See `vercel.json`
- Build command: `npm run build`
- Output: `dist/`
- SPA routing: All routes rewrite to `/index.html`

## Key Constraints and Gotchas

1. **Dual-server setup**: In dev, ensure both servers are running (`npm run dev` handles this)
2. **Phone format**: ElevenLabs requires E.164 format; validate on backend
3. **CORS**: Vercel functions need CORS headers (configured in `vercel.json:17-34`)
4. **Firebase Admin SDK**: Only initialize on server-side (Node.js), not in browser
5. **Call webhooks**: Twilio callbacks require publicly accessible URLs (use ngrok for local testing)
6. **Data Connect**: Schema exists but integration is incomplete; currently using Firestore directly

## Refactoring Priorities (from PRD.md)

1. Implement role-based access control (Admin/Supervisor/Agent/Support roles)
2. Replace demo data with Firebase Data Connect queries
3. Centralize phone validation and formatting utilities
4. Add missing screens: Analytics, Recordings Browser, Integrations, Admin Console
5. Move secrets to environment stores and rotate leaked credentials
6. Tighten CORS policies for production
7. Add error code mapping and retry logic for API calls
