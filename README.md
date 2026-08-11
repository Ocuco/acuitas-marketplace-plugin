# Acuitas Marketplace Plugin Development solution

This solution offers third party developers an environment to develop their own Actuitas Marketplace Plugin in isolation before submitting it for review. 

To view the Market Place API documentation and to get more information on how to build Acuitas Marketplace plugins please visit the [Acuitas Marketplace developer site](https://dev.ocuco.com).

## 🏗️ Project Structure

```
vite-mf-poc/
├── acuitas-shared/        # Shared plugin props types + Acuitas design system CSS
├── host-app/              # Main host application (React + TypeScript)
├── web-component/         # Remote Web component using Lit (Remote B)
├── api-server/            # Backend API (Express + TypeScript)
├── package.json          # Root workspace configuration
└── README.md             # This file
```

### Applications Overview

- **Acuitas Shared** (`acuitas-shared/`): Contains the plugin props type definition and Acuitas design system CSS
- **Host App** (`host-app/`): Acuitas PMS shell application that dynamically loads plugins. Mimics four A3 screens — the **Home Dashboard**, **Medical Images**, the **Patient Dashboard** and **Checkout** (new sale) — so plugins can be developed against the contexts they will run in
- **Web Component** (`web-component/`): Pure Lit-based sample web components with federation support (no React dependencies). Ships **four** sample widgets — an **imaging widget**, a **patient widget**, a **dashboard widget** and a **checkout widget** — exposed from a single federation remote
- **API Server** (`api-server/`): Sample partner backend that showcases how to claim a Plugin Session on the Marketplace API using the PST, then call the Marketplace API on the partner's behalf: fetch an image by identifier (`/api/images/:identifier`), patient details by identifier (`/api/patients/:id/details`), or work with an open sale (`/api/sales`, `/api/sales/:id`, `/api/sales/:id/lines`). The session-claim logic is centralized in `src/services/marketplaceSession.ts` and shared by every route

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   cd vite-mf-poc
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   This installs dependencies for the root workspace and all sub-projects, and builds `acuitas-shared` (which the host and the widgets both consume).

### Running the Applications

```bash
npm run bp:all
```
This command will:
- Build and start all three applications simultaneously
- Host app will be available at `http://localhost:4173`
- Web component at `http://localhost:9001` 
- Mock API at `http://localhost:3001`

#### Hot reloading during development

For an iterative workflow with live reload, use:

```bash
npm run dev:hot:all
```

This runs all three projects with hot reload:
- **host-app** (`http://localhost:4173`) — Vite HMR; the browser opens automatically and the dependency cache is cleared on start, so your own host/screen edits refresh instantly.
- **web-component** (`http://localhost:9001`) — a watched production build **plus** preview. Federated remotes are only served from a build (not from `vite` dev), so this rebuilds the remote whenever you edit a widget. **Refresh the host page** to pick up the rebuilt remote — HMR cannot cross the module-federation boundary.
- **api-server** (`http://localhost:3001`) — restarts on change.

You can also run a single project's hot-reload variant: `npm run dev:hot:host`, `npm run dev:hot:web`, or `npm run dev:hot:api`.

> `npm run bp:all` remains the one-off, production-like build-and-preview run.

#### Required environment variables
- `VITE_PST`: Required for the `host-app` project and must contain the value of the Plugin Session Token retrieved from the Marketplace Developer portal. The host hands this token to plugins from its `onRequestToken` callback, and uses it itself to open a sale on the Checkout screen. These tokens will be valid for 24 hours for development purposes.
- `PLUGIN_ID`: Required for the `api-server` project, the identifier of the plugin you're developing. You'll be assigned a plugin identifier by Ocuco, it will be available on the Marketplace Developer portal.
- `MARKETPLACE_API_BASE_URL`: The public Acuitas Marketplace API url

#### Optional environment variables

`host-app`:
- `VITE_API_URL`: Base URL of your partner backend (default `http://localhost:3001`).
- `VITE_CHECKOUT_PRODUCT_ID`: Catalogue product id the checkout sample's partner line is priced against. The host passes it to the plugin as `settings.productId` and stamps it on the mocked cart line, so the plugin can recognise its own line.
- `VITE_CHECKOUT_TAX_TYPE_ID`: Optional A3 tax type the partner line's VAT is recorded against, passed through as `settings.taxTypeId`.

`api-server`:
- `PORT`: Port the API listens on (default `3001`).
- `CORS_ORIGIN`: Allowed browser origin (default `http://localhost:4173`, the host app).
- `MARKETPLACE_SESSION_CLAIM_TIMEOUT_MS`: Timeout for the session claim (default `30000`). The claim triggers PST validation on the Marketplace API, which on a cold instance performs first-time OIDC/JWKS discovery plus a tenant subscription lookup — a short timeout aborts that mid-flight and surfaces as a "PST validation failed" rather than a real auth failure.

These environment variables can either be set per project using `.env` files, or set on the workstation itself. The `api-server` also reads `.env.local` (loaded first, so it wins over `.env`) for developer-specific overrides.

### Module Federation Flow

1. **Web Component Remote**: A single federation remote (container name `imagingWidget`, served at `http://localhost:9001/assets/remoteEntry.js`) exposes **four** Lit web components:
   - `./Component` → `<imaging-widget>`
   - `./PatientComponent` → `<patient-widget>`
   - `./DashboardComponent` → `<dashboard-widget>`
   - `./CheckoutComponent` → `<checkout-widget>`
2. **Host Application**: 
   - Dynamically imports the remote modules
   - Wraps each web component in a thin React wrapper that passes `PluginProps` as element properties (`host-app/src/ImagingWebComponentWrapper.tsx`, `host-app/src/PatientWebComponentWrapper.tsx`, `host-app/src/DashboardWebComponentWrapper.tsx`, `host-app/src/CheckoutWebComponentWrapper.tsx`)
   - Handles component communication via props and callbacks (`onRequestToken`, `onOpenModal`, `onCloseModal`, and on checkout `onRequestRefresh`)

## 🧩 Sample widgets

The solution ships four sample widgets that demonstrate the screen contexts a plugin can run in. All of them receive the standard `PluginProps` (see `acuitas-shared/src/types.ts`): `id`, `name`, `context`, `screen`, `settings`, the `onRequestToken` / `onOpenModal` / `onCloseModal` callbacks, plus a screen-specific payload (`imaging`, `patient` or `sale`).

| Widget | Custom element | Exposed module | Host screen | Screen-specific props |
|--------|----------------|----------------|-------------|-----------------------|
| Imaging widget | `<imaging-widget>` | `./Component` | Medical Images | `imaging` (`patientId`, `images`, `selectedImage`) |
| Patient widget | `<patient-widget>` | `./PatientComponent` | Patient Dashboard | `patient` (`patientId`) |
| Dashboard widget | `<dashboard-widget>` | `./DashboardComponent` | Home Dashboard | none (`context` + `settings` only) |
| Checkout widget | `<checkout-widget>` | `./CheckoutComponent` | Checkout (new sale) | `sale` (`saleId`, `cartProductIds`, `cartItemCount`) + `onRequestRefresh` callback |

The subject types a plugin can request a token for are `MEDICAL-IMAGE`, `PATIENT-DETAILS`, `CONFIGURATION-CAMERA` and `SALE` (`SubjectType` in `acuitas-shared/src/types.ts`). Always request the narrowest subject and identifier your feature needs — the token the host returns is scoped to it.

### Imaging widget
- Rendered in the **Tools** section of the Medical Images right panel.
- Demonstrates the token → API flow: **Analyze Image** calls `onRequestToken({ subjectTypes: ['MEDICAL-IMAGE', ...], subjectIds: [...] })`, then `GET /api/images/:identifier` with the returned token to fetch the image, and renders a result preview.
- **Show Detailed Report** opens a full-screen modal. The modal chrome (dark title bar with the plugin name) is provided by the host, which portals the same widget instance into a full-screen overlay and sets `isModalOpen` on it.

### Patient widget
- Rendered on the **Patient Dashboard** in two placements at once — the main grid ("Patient Insights") and the side panel ("Patient Quick View") — the same component, two placements.
- **Fetch patient details** calls `onRequestToken({ subjectTypes: ['PATIENT-DETAILS'], subjectIds: [patientId] })`, then `GET /api/patients/:id/details`, and shows the patient name inline.
- **View details** opens a self-contained modal with the full patient details.

### Dashboard widget
- Launched from a **tile** in a Home Dashboard category (the placement's `category`, e.g. "Patient Care"). Clicking the tile opens the widget **full-page inside the shell** — under the persistent navigation bar — with a host-provided **Close** button that returns to the dashboard. This mirrors how Acuitas A3 renders a partner module from a home-screen tile.
- The full-page screen also renders the **configurable side panel (CSP)** — the same chrome and width as the right panels on the Medical Images and Patient Dashboard screens — because the home-tile screen target supports one. The module itself stays full-page in the main area; the panel shows host-supplied context only.
- Receives the standard `context` (customer / site / staff, plus `contextTypes`) and `settings`; it has no screen-specific payload. It shows the context it was given and demonstrates the **Request session token** flow (`onRequestToken({ subjectTypes: [], subjectIds: [] })`) for a general plugin-session token.

### Checkout widget
- Rendered as a **full-width band inside the cart**, directly under the line items and above the totals footer — A3's in-cart marketplace zone. It styles itself (the sample renders a green "product protection" bar); the host supplies no card chrome.
- Demonstrates the **partner dynamically-priced sale line** flow end to end:
  1. `onRequestToken({ subjectTypes: ['SALE'], subjectIds: [saleId] })` — a sale-scoped token from the host.
  2. `POST /api/sales/:id/lines` on the **partner's own backend** with that token. The backend claims the Marketplace session and calls the Marketplace API's partner-line endpoint, which proxies A3's `POST api/sales/{saleId}/partnerLine`.
  3. `onRequestRefresh()` so the host refetches the sale — the cart line, the totals and the widget's own "added" state all follow from the refreshed data rather than from optimistic local state.
- Whether the plugin's product is **already in the cart** comes from the host via `sale.cartProductIds` / `sale.cartItemCount`, matched against `settings.productId`. The host keeps these in sync with the cart including unsaved local edits, so the widget reflects the user adding or removing lines immediately.
- **View line** opens a full-screen modal with the added line's detail; as with the imaging widget, the host portals the same widget instance into the overlay and sets `isModalOpen` on it.
- On the host side the Checkout screen first shows a **product picker** (defaulted spectacle / contact lens lines) and an **Open sale** button, which calls `POST /api/sales` to open a real sale via the Marketplace API and returns its `saleId`. Product details are optional — the Marketplace API fills them from its configured dev defaults, so you never need real A3 product GUIDs. The cart line the plugin adds and the totals are **mocked in the shell** (A3 itself is not running here), driven by the plugin's refresh request.

### Declaring where a plugin renders

Plugin placement is declarative. `host-app/src/config/plugin-placements.ts` is the single registry that maps each plugin instance to:
- **which screen** it appears on (`HOME` | `MEDICAL_IMAGES` | `PATIENT` | `CHECKOUT`),
- **which section** of that screen (`MAIN` | `SIDE_PANEL`),
- for `HOME` tiles, the **category** the launcher tile appears in (and an optional `tileIcon`), and
- its federation `RemoteConfig` (remote `url`, container `name`, exposed `module`).

To host your own remote, add or change an entry here — no other host code needs to change.

### Screens & URLs

The host uses client-side routing, so each screen has its own URL and a page refresh keeps you on the same screen:
- Home Dashboard — `http://localhost:4173/home` (the default screen)
- Medical Images — `http://localhost:4173/medical-images`
- Patient Dashboard — `http://localhost:4173/patient`
- Checkout / new sale — `http://localhost:4173/checkout`
- Partner module (full-page, launched from a Home tile) — `http://localhost:4173/home/plugin/:pluginId`

## 🛠️ Development

### Project Structure Details

Each sub-project follows standard Vite conventions:
- `src/` - Source code
- `public/` - Static assets  
- `vite.config.ts` - Vite configuration with federation setup
- `tsconfig.json` - TypeScript configuration

### Federation Configuration

The federation setup allows:
- **Host App**: Consumes remote components dynamically
- **Web Component**: Exposes web components for federation

### Sample partner backend endpoints

Every route takes the host-issued token as `Authorization: Bearer <PST>`, claims the Marketplace session with it, and then calls the Marketplace API with the same ticket. A replayed claim (`ticket.replayed`) is treated as a valid session, so claiming the same PST from more than one route is safe.

| Endpoint | Marketplace API call | Purpose |
|----------|----------------------|---------|
| `GET /api/images/:identifier` | image by identifier | Fetch a medical image the imaging widget was granted access to |
| `GET /api/patients/:id/details` | patient details | Fetch patient details for the patient widget |
| `POST /api/sales` | `POST api/v1/sales` | Open a sale from the picked products (used by the shell, not the plugin) |
| `GET /api/sales/:id` | `GET api/v1/sales/{id}/open` | Read the current cart/order for a sale |
| `POST /api/sales/:id/lines` | `POST api/v1/sales/{id}/partnerLine` | Add a partner, dynamically-priced line to an open sale |

`GET /health` is also exposed for liveness checks.

## 📋 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 4173 (host), 9001 (web component), and 3001 (API) are available. The host uses `strictPort`, so it will fail rather than silently move off 4173 (the API's CORS origin expects `http://localhost:4173`).
2. **Federation Loading**: Remote components must be **built** and running before the host can load them — a remote served by `vite` dev (rather than a build + preview) will not expose a working `remoteEntry.js`. Use `npm run dev:hot:all` or `npm run bp:all`, both of which serve the remote from a build.
3. **CORS Issues**: Use the provided scripts which handle CORS properly
4. **401 / "PST validation failed" on the API**: the PST is single-use per claim window and valid for 24 hours — refresh it from the Developer portal into `VITE_PST`. If the failure is intermittent on the first request after an idle period, it is the cold-start validation cost rather than a bad token; raise `MARKETPLACE_SESSION_CLAIM_TIMEOUT_MS`.
5. **Checkout screen has no sale**: the plugin only renders once a sale is open — pick products and press **Open sale** first. If opening fails, check `VITE_PST`, `PLUGIN_ID` and `MARKETPLACE_API_BASE_URL`.

### Build Order
When building manually, follow this order:
1. Build the shared package first (`acuitas-shared`) — both the host and the widgets consume it
2. Build the remote components (`web-component`)
3. Build host application (`host-app`)
4. Build mock API application (`api-server`)

---

## 📝 License

This is a proof of concept project for demonstration purposes.
