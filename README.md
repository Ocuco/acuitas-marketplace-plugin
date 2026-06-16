# Acuitas Marketplace Plugin Development solution

This solution offers third party developers an environment to develop their own Actuitas Marketplace Plugin in isolation before submitting it for review. 

To view the Market Place API documentation and to get more information on how to build Acuitas Marketplace plugins please visit the [Acuitas Marketplace developer site](https://dev.ocuco.com).

## 🏗️ Project Structure

```
vite-mf-poc/
├── host-app/              # Main host application (React + TypeScript)
├── web-component/         # Remote Web component using Lit (Remote B)
├── api-server/            # Backend API (React + TypeScript)
├── package.json          # Root workspace configuration
└── README.md             # This file
```

### Applications Overview

- **Acuitas Shared** (`acuitas-shared/`): Contains the plugin props type definition and Acuitas design system CSS
- **Host App** (`host-app/`): Acuitas PMS shell application that dynamically loads plugins. Mimics three A3 screens — the **Home Dashboard**, **Medical Images** and the **Patient Dashboard** — so plugins can be developed against the contexts they will run in
- **Web Component** (`web-component/`): Pure Lit-based sample web components with federation support (no React dependencies). Ships **three** sample widgets — an **imaging widget**, a **patient widget** and a **dashboard widget** — exposed from a single federation remote
- **API Server** (`api-server/`): Sample backend API that showcases how to claim a Plugin Session on the Marketplace API using the PST, then fetch an image by identifier (`/api/images/:identifier`) or patient details by identifier (`/api/patients/:id/details`). The session-claim logic is centralized in `src/services/marketplaceSession.ts` and shared by both routes

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
   This installs dependencies for the root workspace and all three sub-projects.

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
- `VITE_PST`: Required for the `web-component` project and must contain the value of the Plugin Session Token retrieved from the Marketplace Developer portal. These tokens will be valid for 24 hours for development purposes.
- `PLUGIN_ID`: Required for the `api-server` project, the identifier of the plugin you're developing. You'll be assigned a plugin identifier by Ocuco, it will be available on the Marketplace Developer portal.
- `ACUITAS_API_BASE_URL`: The public Acuitas Marketplace API url

These environment can either be set per project using `.env` files, or set on the workstation itself. 

### Module Federation Flow

1. **Web Component Remote**: A single federation remote (container name `imagingWidget`, served at `http://localhost:9001/assets/remoteEntry.js`) exposes **three** Lit web components:
   - `./Component` → `<imaging-widget>`
   - `./PatientComponent` → `<patient-widget>`
   - `./DashboardComponent` → `<dashboard-widget>`
2. **Host Application**: 
   - Dynamically imports the remote modules
   - Wraps each web component in a thin React wrapper that passes `PluginProps` as element properties (`host-app/src/ImagingWebComponentWrapper.tsx`, `host-app/src/PatientWebComponentWrapper.tsx`)
   - Handles component communication via props and callbacks (`onRequestToken`, `onOpenModal`, `onCloseModal`)

## 🧩 Sample widgets (imaging & patient)

The solution ships two sample widgets that demonstrate the two screen contexts a plugin can run in. Both receive the standard `PluginProps` (see `acuitas-shared/src/types.ts`): `id`, `name`, `context`, `screen`, `settings`, the `onRequestToken` / `onOpenModal` / `onCloseModal` callbacks, plus a screen-specific payload (`imaging` or `patient`).

| Widget | Custom element | Exposed module | Host screen | Screen-specific props |
|--------|----------------|----------------|-------------|-----------------------|
| Imaging widget | `<imaging-widget>` | `./Component` | Medical Images | `imaging` (`patientId`, `images`, `selectedImage`) |
| Patient widget | `<patient-widget>` | `./PatientComponent` | Patient Dashboard | `patient` (`patientId`) |
| Dashboard widget | `<dashboard-widget>` | `./DashboardComponent` | Home Dashboard | none (`context` + `settings` only) |

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
- Receives the standard `context` (customer / site / staff) and `settings`; it has no screen-specific payload. It shows the context it was given and demonstrates the **Request session token** flow (`onRequestToken({ subjectTypes: [], subjectIds: [] })`) for a general plugin-session token.

### Declaring where a plugin renders

Plugin placement is declarative. `host-app/src/config/plugin-placements.ts` is the single registry that maps each plugin instance to:
- **which screen** it appears on (`HOME` | `MEDICAL_IMAGES` | `PATIENT`),
- **which section** of that screen (`MAIN` | `SIDE_PANEL`),
- for `HOME` tiles, the **category** the launcher tile appears in (and an optional `tileIcon`), and
- its federation `RemoteConfig` (remote `url`, container `name`, exposed `module`).

To host your own remote, add or change an entry here — no other host code needs to change.

### Screens & URLs

The host uses client-side routing, so each screen has its own URL and a page refresh keeps you on the same screen:
- Home Dashboard — `http://localhost:4173/home` (the default screen)
- Medical Images — `http://localhost:4173/medical-images`
- Patient Dashboard — `http://localhost:4173/patient`
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

## 📋 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 4173 (host), 9001 (web component), and 3001 (API) are available. The host uses `strictPort`, so it will fail rather than silently move off 4173 (the API's CORS origin expects `http://localhost:4173`).
2. **Federation Loading**: Remote components must be **built** and running before the host can load them — a remote served by `vite` dev (rather than a build + preview) will not expose a working `remoteEntry.js`. Use `npm run dev:hot:all` or `npm run bp:all`, both of which serve the remote from a build.
3. **CORS Issues**: Use the provided scripts which handle CORS properly

### Build Order
When building manually, follow this order:
1. Build remote components first (`react-component`, `web-component`)
2. Build host application (`host-app`)
3. Build mock API application (`api-server`)

---

## 📝 License

This is a proof of concept project for demonstration purposes.
