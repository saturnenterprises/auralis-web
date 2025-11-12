# Auralis – Frontend/UI Specification

## 1. Technology and UI Foundation
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS + shadcn-ui component primitives
- **State/Queries**: Local state + TanStack Query (available for data fetching)
- **Routing**: React Router v6
- **Icons**: `lucide-react`
- **Media**: Custom `VercelOptimizedVideo` and `fast-video` components

## 2. Global Layout and Navigation
- **Top-level routes**
  - `/dashboard` – operational hub with left sidebar navigation
  - Within `/dashboard` screen, content switches via local state (not nested router):
    - Dashboard (default)
    - Make Call
    - Call Logs
    - Agents
    - Support
    - Convo Logs
    - Settings
- **Dashboard layout**: sticky header with search, notifications, settings; sticky left sidebar with buttons; scrollable main content.
- **Header actions**: search input, bell icon, settings icon, user avatar dropdown.
- **Sidebar buttons**: highlight active section, `variant="coral"` for active, `ghost` for inactive.

## 3. Design System and Theming
- **Tokens** (HSL variables) in `src/index.css` and `tailwind.config.ts`:
  - Colors: `--voxbay-coral`, `--voxbay-blue`, `--voxbay-gray`, brand shades
  - UI roles: `--background`, `--foreground`, `--border`, `--muted`, `--accent`, etc.
  - Shadows: `--shadow-card`, `--shadow-float`, `--shadow-glow`
  - Radius: `--radius`
- **Utility classes**
  - `.floating-card` for elevated cards with hover lift
  - `.text-gradient`, `.gradient-hero`, `.gradient-card`, `.fade-in`
- **Dark mode**: token set for `.dark` is defined; UI currently renders in light.

## 4. Common UI Components (shadcn-based)
- Buttons: variants `default`, `outline`, `ghost`, `destructive`, custom `coral`, `coral-outline`
- Inputs: `Input`, `Textarea`, `Select` (with `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`)
- Feedback: `Badge`, `Card` (`CardHeader`, `CardTitle`, `CardContent`), `Switch`, `Separator`, `Tooltip`, `Toast/Sonner`
- Icons via `lucide-react`

## 5. Screen Specifications

### 5.1 Dashboard (Overview)
- **Stats Grid**: 4 cards showing KPIs – value, delta with color coding, icon on the right.
- **Recent Calls**: list with avatar icon, caller details, number, duration, status badge, time, optional Play button if recording.
- **Active Agents**: list with initials avatar + presence dot (available/busy/break), name/email/shift, right column with counts.
- **Live Call Control** (mini panel): shows current call number and status badge; Start/End button and a volume button.
- **Interactions**
  - Hover states for list rows and buttons
  - Filter and Export buttons in Recent Calls header
- **Responsive**: grid collapses to single column on mobile; sidebar remains accessible.

### 5.2 Make Call (Call Interface)
- **Country Selector + Phone Input**
  - Country flag + dial code in `Select` alongside tel input
  - Auto-format per country; stores digits, displays formatted
- **Demo Mode Switch**
  - When on: simulate connecting, set status to Connected after delay, append system and AI messages
  - When off: call backend; update statuses/messages based on response
- **Primary CTA**
  - `Make Call` → changes to `End Call` when connected; shows spinner on connecting
- **Status Bar**
  - Left: icon by status; text (Ready/Connecting/Connected/Failed); Demo/Live badge
  - Right: partial Call ID badge when present
- **Conversation Log**
  - Bubbles for system/AI/user with colored chips and timestamps; scrollable container
- **Disabled States**
  - Disable inputs and switch while connecting or when connected

### 5.3 Call Logs
- **Toolbar**: Date Range, Export CSV; right-aligned search with icon
- **List Rows**
  - Left: icon circle + caller info + agent name (caption)
  - Middle: duration + status `Badge` color-coded
  - Right: timestamp; optional Play `Button` if `recording: true`
- **Empty/Loading**
  - Show guidance to search or adjust filters when empty; loader for async

### 5.4 Agents
- **Top Actions**: Manage Shifts (outline), Add Agent (coral)
- **Stats Cards**: Available, Busy, On Break, Offline with icon and count
- **Directory**
  - Avatar initials with presence dot, name/email/location/shift
  - Center: status `Badge` by variant mapping, rating text
  - Right: calls today, total duration, `View Details` ghost button
- **Interactivity**
  - Hover row lift; future modals for Add/Edit/Shift management

### 5.5 Support
- **Support Tickets Panel**
  - Cards per ticket: title + id, badges for priority and status, description, assignee, created time with clock icon
- **Submit Ticket Panel**
  - Subject `Input`, Priority `select`, Description `Textarea`, Submit `Button`
- **Contact Cards**: Emergency (phone), Email, Live Chat
- **FAQ**: collapsible-like list (current simple cards) with question + answer

### 5.6 Convo Logs (Conversation Monitor)
- **Header Controls**: Start/Stop Live (toggles demo generator), Export, Clear
- **AI Agent Status Card**
  - Indicator dot with pulsing for active, status text, refresh button, icons for states
- **Make a Call** section
  - Same country selector + phone input; Make/End buttons; active call panel with timer and animated dot
- **Live Conversation Monitor**
  - Scrollable monospace list; each message shows icon (AI/Human), speaker, timestamp, optional sentiment badge, and content
- **Stats Cards**: AI messages count, Human messages count, Positive sentiment, Issues detected
- **Error Logs** (conditional): red panel with log lines and Clear button

### 5.7 Settings
- **Save Changes** primary button in header
- **Profile Settings**: First/Last name, Email, Phone, Department `select`, password fields
- **Notification Preferences**: switches for Call Alerts, Email Updates, System Maintenance, Weekly Reports
- **Audio Settings**: range sliders for Mic/Speaker; switches for Echo Cancellation and Noise Suppression
- **Security Settings**: 2FA `Enable` button, Session Timeout `select`, Login History button, API Keys button

## 6. Component States and Feedback
- **Buttons**: disabled during async operations; show spinners where applicable
- **Inputs**: disabled while call is active/connecting
- **Badges**: map status-to-variant consistently across screens
- **Toasts**: use shadcn/Sonner for success/error notifications (e.g., call initiation results)
- **Modals**: planned for Add Agent, Manage Shifts, Play Recording details (future)

## 7. Responsiveness
- **Mobile**: single-column layouts; sidebar buttons stack; inputs full-width; reduce paddings
- **Tablet**: two-column grids where applicable
- **Desktop**: full grid; sticky header and sidebar; generous gutters and card spacing

## 8. Accessibility
- **Keyboard**: tabbable controls, visible focus rings
- **ARIA**: live regions for conversation updates and status changes (planned)
- **Contrast**: badges/colors paired with icons and text for non-color users
- **Labels**: all inputs and switches have visible labels

## 9. Animations and Micro-interactions
- Hover lift on `.floating-card`
- Pulse indicator for live/active states
- Fade-in entrance for hero/sections (where included)
- Spinner `Loader2` icon during async states

## 10. Visual Language
- **Typography**: Inter; sizes via Tailwind; headings bold; secondary text uses `text-muted-foreground`
- **Color**: primary coral for CTAs, blue accent for secondary emphasis, neutral grays for layout
- **Iconography**: `lucide-react` consistent stroke style

## 11. Reuse and Consistency
- Use common components for repeated patterns:
  - KPI Card, List Row, Status Badge mapping, Country Phone input, Call Status bar
- Centralize status-to-variant and status-to-color helpers to avoid drift

## 12. Error, Empty, and Loading Patterns
- **Errors**: inline card banners or toasts with actionable messages
- **Empty**: descriptive text with next-step CTA (e.g., start a call, adjust filters)
- **Loading**: skeleton or spinner; avoid layout shift with fixed card heights

## 13. Routing and Navigation Behavior
- Single-page dashboard with local tab state for sections (no page reloads)
- Back/forward browser navigation remains on `/dashboard`; section selection is not encoded in URL (could be enhanced later)
- Global routes for non-dashboard pages can be added without breaking the layout

## 14. Theming and Variants
- Respect Tailwind tokens; avoid hard-coded hex values
- Provide `coral` and `coral-outline` variants for high-attention CTAs
- Map status → variant consistently:
  - success/available → `default`
  - warning/break/neutral → `secondary`
  - danger/missed/error → `destructive`
  - offline/unknown → `outline`

## 15. Frontend Integration Points (no backend details)
- Call initiation: fire `fetch('/api/elevenlabs-call')` in Live mode (UI shows states based on response)
- No other backend coupling required for this UI spec; replace mock data with data layer later

## 16. Future UI Enhancements (scaffolding-ready)
- Add tabs or nested routes to preserve section in URL (e.g., `/dashboard?tab=agents`)
- Recording player modal with waveform and transcript panel
- Agent detail drawer with timeline and KPIs
- Analytics dashboards with charts (line/bar/pie) using `recharts`
- Integrations page with cards and connect toggles

---
This document specifies only the frontend/UI surfaces, interactions, visual rules, and state handling expected in the Auralis web app. It intentionally omits backend/storage specifics and focuses on what users see and do in the interface.
