# Acuitas Marketplace Plugin Development solution

This solution provides third party developers with an environment to develop their own Actuitas Marketplace Plugin in isolation before submitting it for review.

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
- **API Server** (`api-server/`): Sample partner backend that showcases how to claim a Plugin Session on the Marketplace API using the PST, then call the Marketplace API on the partner's behalf: fetch an image by identifier (`/api/images/:identifier`), patient details by identifier (`/api/patients/:id/details`), or work with a sale the host has opened (`/api/sales/:id`, `/api/sales/:id/lines`). It never opens a sale itself — that is the host's job. The session-claim logic is centralized in `src/services/marketplaceSession.ts` and shared by every route

## 🚀 Quick Start

### Prerequisites

- Node.js 22.12 or later (Node 24 LTS recommended)
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
- The host application is available at `http://localhost:4173`
- Web component at `http://localhost:9001`
- Mock API at `http://localhost:3001`

#### Hot reloading during development

For an iterative workflow with live reload, use:

```bash
npm run dev:hot:all
```

This runs all three projects with hot reload:
- **`host-app`** (`http://localhost:4173`) — Vite HMR; the browser opens automatically and the dependency cache is cleared on start, so your own host/screen edits refresh instantly.
- **web-component** (`http://localhost:9001`) — a watched production build **plus** preview. Federated remotes are only served from a build (not from `vite` dev), so this rebuilds the remote whenever you edit a widget. **Refresh the host page** to pick up the rebuilt remote — HMR cannot cross the module-federation boundary.
- **api-server** (`http://localhost:3001`) — restarts on change.

You can also run a single project's hot-reload variant: `npm run dev:hot:host`, `npm run dev:hot:web`, or `npm run dev:hot:api`.

> `npm run bp:all` remains the one-off, production-like build-and-preview run.

#### Required environment variables

- `VITE_PST`: Required for the `host-app` project and must contain the value of the Plugin Session Token retrieved from the Ocuco Developer Portal. The host hands this token to plugins from its `onRequestToken` callback, and uses it itself to open a sale on the Checkout screen, calling the Marketplace API directly (the plugin id for the session claim is read from the token's `plugin_id`). These tokens will be valid for 24 hours for development purposes.
- `MARKETPLACE_API_BASE_URL`: The address of the public Acuitas Marketplace API

#### Optional environment variables

`host-app`:
- `VITE_PLUGIN_ID`: The plugin id every placement renders under, passed to your web component as its `id` property exactly as Acuitas passes it. Defaults to the `plugin_id` claim of `VITE_PST`, so you only need to set it if the two differ.
- `VITE_API_URL`: Base URL of your partner backend (default `http://localhost:3001`).
- `VITE_MARKETPLACE_API_BASE_URL`: Marketplace API the host opens Checkout sales against (default `https://euint.oh.ocuco.com`).
- `VITE_CHECKOUT_PRODUCT_ID`: Catalogue product id the checkout sample's partner line is priced against. The host passes it to the plugin as `settings.productId` and stamps it on the mocked cart line, so the plugin can recognise its own line.
- `VITE_CHECKOUT_TAX_TYPE_ID`: Optional A3 tax type the partner line's VAT is recorded against, passed through as `settings.taxTypeId`.

`api-server`:
- `PLUGIN_ID`: The identifier of the plugin you're developing, which the backend claims the session with. Ocuco assigns it and it is shown on your plugin's page on the Marketplace portal. Unset, the backend claims with the `plugin_id` inside the PST it was handed — the same value, since the claim is only accepted for the plugin the token names.
- `PORT`: Port the API listens on (default `3001`).
- `CORS_ORIGIN`: Allowed browser origin (default `http://localhost:4173`, the host application).
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
   - Handles component communication through props and callbacks (`onRequestToken`, `onOpenModal`, `onCloseModal`, and on checkout `onRequestRefresh`)

## 🧩 Sample widgets

The solution ships four sample widgets that demonstrate the screen contexts a plugin can run in. All of them receive the standard `PluginProps` (see `acuitas-shared/src/types.ts`): `id`, `name`, `context`, `screen`, `settings`, the `onRequestToken` / `onOpenModal` / `onCloseModal` callbacks, plus a screen-specific payload (`imaging`, `patient` or `sale`). `context.locale` carries the user's interface language (see _Testing localisation_ below).

| Widget           | Custom element       | Exposed module         | Host screen         | Screen-specific props                                                              |
| ---------------- | -------------------- | ---------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Imaging widget   | `<imaging-widget>`   | `./Component`          | Medical Images      | `imaging` (`patientId`, `images`, `selectedImage`)                                 |
| Patient widget   | `<patient-widget>`   | `./PatientComponent`   | Patient Dashboard   | `patient` (`patientId`)                                                            |
| Dashboard widget | `<dashboard-widget>` | `./DashboardComponent` | Home Dashboard      | none (`context` + `settings` only)                                                 |
| Checkout widget  | `<checkout-widget>`  | `./CheckoutComponent`  | Checkout (new sale) | `sale` (`saleId`, `cartProductIds`, `cartItemCount`) + `onRequestRefresh` callback |

The subject types a plugin can request a token for are listed by `SubjectType` in `acuitas-shared/src/types.ts`. A token opens only the subjects and identifiers it names, and your backend's whole session runs on one token, so request every subject type your backend uses with it and nothing more. The developer docs page _Retrieving and using the plugin session token_ explains what each subject type covers and which identifiers it needs.

### Imaging widget

- Rendered in the Medical Images side panel, under a host-drawn header carrying the plugin's name, in a fixed-height box that matches Acuitas (see _Matching Acuitas's zones_ below).
- Demonstrates the token → API flow: **Analyze Image** calls `onRequestToken({ subjectTypes: ['MEDICAL-IMAGE', ...], subjectIds: [...] })`, then `GET /api/images/:identifier` with the returned token to fetch the image, and renders a result preview.
- **Show Detailed Report** opens a full-screen modal. The host portals the same widget instance into a full-screen overlay and sets `isModalOpen` on it, but draws **no title bar or close button** inside the modal, as in Acuitas: the dark title bar you see is drawn by the sample widget itself, which closes the modal through `onCloseModal`.

### Patient widget

- Rendered on the **Patient Dashboard** in two placements at once — the main grid ("Patient Insights") and the side panel ("Patient Quick View") — the same component, two placements.
- **Fetch patient details** calls `onRequestToken({ subjectTypes: ['PATIENT-DETAILS'], subjectIds: [patientId] })`, then `GET /api/patients/:id/details`, and shows the patient name inline.
- **View details** opens a self-contained modal with the full patient details.

### Dashboard widget

- Launched from a **tile** in a Home Dashboard category (the placement's `category`, for example "Patient Care"). Clicking the tile opens the widget **full-page inside the shell** — under the persistent navigation bar — with a host-provided **Close** button that returns to the dashboard. This mirrors how Acuitas A3 renders a partner module from a home-screen tile.
- The full-page screen also renders the **configurable side panel (CSP)** — the same chrome and width as the right panels on the Medical Images and Patient Dashboard screens — because the home-tile screen target supports one. The module itself stays full-page in the main area; the panel shows host-supplied context only.
- Receives the standard `context` (customer / site / staff, plus `contextTypes`) and `settings`; it has no screen-specific payload. It shows the context it was given and demonstrates the **Request session token** flow (`onRequestToken({ subjectTypes: [], subjectIds: [] })`) for a general plugin-session token.

### Checkout widget

- Rendered as a **full-width band inside the cart**, directly under the line items and above the totals footer — A3's in-cart marketplace zone. It styles itself (the sample renders a green "product protection" bar); the host supplies no card chrome.
- Demonstrates the **partner dynamically-priced sale line** flow end to end:
  1. `onRequestToken({ subjectTypes: ['SALE'], subjectIds: [saleId] })` — a sale-scoped token from the host.
  2. `POST /api/sales/:id/lines` on the **partner's own backend** with that token. The backend claims the Marketplace session and calls the Marketplace API's partner-line endpoint, which proxies A3's `POST api/sales/{saleId}/partnerLine`.
  3. `onRequestRefresh()` so the host refetches the sale — the cart line, the totals and the widget's own "added" state all follow from the refreshed data rather than from optimistic local state.
- Whether the plugin's product is **already in the cart** comes from the host through `sale.cartProductIds` / `sale.cartItemCount`, matched against `settings.productId`. The host keeps these in sync with the cart including unsaved local edits, so the widget reflects the user adding or removing lines immediately.
- **View line** opens a full-screen modal with the added line's detail; as with the imaging widget, the host portals the same widget instance into the overlay and sets `isModalOpen` on it.
- On the host side the Checkout screen first shows a **product picker** (defaulted spectacle / contact lens lines) and an **Open sale** button, which opens a real sale by calling the Marketplace API's `POST api/v1/sales` **from the host**, not through the partner backend — in Acuitas the practice opens the sale and the plugin is only handed its `saleId`. The lines default to the sandbox's priced products (Default Lens at £150.00, Default Contact Lens at £100.00); product ids are left to the Marketplace API's configured defaults, so you never need real A3 product GUIDs. The cart line the plugin adds and the totals are **mocked in the shell** (A3 itself is not running here), driven by the plugin's refresh request.

### Testing localisation

Acuitas passes the logged-in user's interface language to every widget as `context.locale`, a BCP-47 tag such as `fr-FR` (occasionally just a language, such as `en`). The shell's header has a **language selector** offering the same languages as the Acuitas interface. Picking one:

- switches the shell's own navigation into that language (English, French, Dutch and German are translated; the others fall back to English),
- sets `<html lang>`, and
- passes the new `context.locale` to every widget on the page **without a reload**, so you can check that your widget re-renders in the new language.

The choice is remembered in the browser (`localStorage`); the first visit picks the browser's language when Acuitas offers it, otherwise `en-GB`. The sample widgets show the locale they received and format dates and prices with `Intl` (see `web-component/src/locale.ts`). The **dashboard widget** (open the _Partner Insights_ tile on the Home Dashboard) has a _Localisation_ card that shows the whole pattern: a greeting translated into English, French, Dutch and German, chosen by matching `locale` against those languages with an English fallback, and dates, times, numbers, prices and relative times formatted by `Intl` for any locale. Pick Swedish to see the fallback. The developer docs page _Web component properties_ explains how to match `locale` against the languages your widget supports.

### Declaring where a plugin renders

Plugin placement is declarative. `host-app/src/config/plugin-placements.ts` is the single registry that maps each placement to:
- its **`placementId`**, a key for that place in the registry — it appears in the partner module's URL and is never passed to the plugin,
- **which screen** it appears on (`HOME` | `MEDICAL_IMAGES` | `PATIENT` | `CHECKOUT`),
- **which section** of that screen (`MAIN` | `SIDE_PANEL`),
- the **`settings`** Ocuco configured for your plugin on the Marketplace portal (see below),
- for `HOME` tiles, the **category** the launcher tile appears in (and an optional `tileIcon`), and
- its federation `RemoteConfig` (remote `url`, container `name`, exposed `module`, and `elementTag` — the custom element your module registers, for example `snappit-widget`; it defaults to the sample widget's tag for that screen).

Every screen reads it, including the Medical Images side panel. To host your own remote, add or change an entry here — no other host code needs to change.

Every placement renders under **one plugin id** — `VITE_PLUGIN_ID`, or the `plugin_id` claim of your `VITE_PST`. That is what Acuitas does: it passes your Marketplace plugin id as the component's `id` property and mints every PST for it, whatever `pluginId` your widget sends in `onRequestToken`. So `this.id` reads the same here as in Acuitas, and it is the id your backend claims the session with.

### Plugin settings

A plugin's `settings` dictionary holds the settings **Ocuco** configured for your plugin on the Marketplace portal; partner accounts cannot add or edit them, so ask the Marketplace team for a new one. Acuitas adds `plugin-id` and `supported-contexts` of its own and passes the rest through unchanged.

In the shell you act as the portal: put the setting in the placement's `settings` and the host passes it, plus the same two Acuitas adds, to your widget.

### Matching Acuitas's zones

The shell sizes its plugin zones the way Acuitas does (see _Plugin render zones_ on the developer portal), so a layout that fits here fits in Acuitas:
- The page never renders narrower than **1650px**; below that it scrolls sideways.
- The side panel gives a plugin a **fixed-height box**: 159px, or 175px from 1735px wide, or 191px from 1900px wide (Acuitas's 15.92rem at its stepped root font size). Your component's wrapper fills it (`height: 100%`).
- `screen.maxWidth` / `screen.maxHeight` are fixed hints of `400` × `400` in the side panel, as Acuitas passes them.

### Screens & URLs

The host uses client-side routing, so each screen has its own URL and a page refresh keeps you on the same screen:
- Home Dashboard — `http://localhost:4173/home` (the default screen)
- Medical Images — `http://localhost:4173/medical-images`
- Patient Dashboard — `http://localhost:4173/patient`
- Checkout / new sale — `http://localhost:4173/checkout`
- Partner module (full-page, launched from a Home tile) — `http://localhost:4173/home/plugin/:placementId`

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

### Packaging for the Marketplace

The web components a build ships are declared once, in `components` in `web-component/vite.config.ts`: the module key the host asks for, the source file that registers the element, and its custom-element tag. The federation `exposes` is built from it, and so is the `marketplace.json` the build writes into `dist/`.

```bash
cd web-component
npm run package   # builds, then writes marketplace-upload/<name>-<version>.zip
```

Upload that zip on your plugin's **Web Components** page in the Marketplace portal. The portal reads `marketplace.json` from it and fills in the entry file, module export, component name and version (from `package.json`), so you only add release notes. Bump `version` in `web-component/package.json` before each upload.

The build fails if a tag in `components` is not registered anywhere in the code, which would otherwise show as an empty area inside Acuitas.

#### Passing the security scan

Every upload is scanned before Ocuco reviews it, and the portal also checks the zip as soon as you pick it, so you see the same findings first. The checks are listed, with how to fix each one, on the developer site under **UI plugins → Web components → Security checks**. This sample passes with no errors or warnings. To keep yours that way:

- **Declare the origins you call with a fixed address** in `connect` in `vite.config.ts`, for example `marketplaceManifest({ components, connect: ['https://api.partner.example'] })`. A request to any other fixed origin is an error that blocks approval. An address read from your plugin's settings, as `settings.apiUrl` is here, doesn't need declaring. A new origin is shown to the Ocuco reviewer before approval.
- **Ship readable code.** The sample builds with `minify: false`. If you minify, include the `.map` files in the zip, or the scan raises a warning.
- **Stay inside your element.** Keep data out of `localStorage` and `sessionStorage`, don't query or change the host page outside your own shadow root, and render HTML with Lit templates rather than `innerHTML` or `unsafeHTML`.
- **Ship all your code in the zip.** Loading scripts from another site, `eval` and `new Function` are errors, because the code that runs would no longer be the code that was reviewed.

### Sample partner backend endpoints

Every route takes the host-issued token as `Authorization: Bearer <PST>`, claims the Marketplace session with it, and then calls the Marketplace API with the same ticket. A replayed claim (`ticket.replayed`) is treated as a valid session, so claiming the same PST from more than one route is safe.

| Endpoint                        | Marketplace API call                 | Purpose                                                        |
| ------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `GET /api/images/:identifier`   | image by identifier                  | Fetch a medical image the imaging widget was granted access to |
| `GET /api/patients/:id/details` | patient details                      | Fetch patient details for the patient widget                   |
| `GET /api/sales/:id`            | `GET api/v1/sales/{id}/open`         | Read the current cart/order for a sale                         |
| `POST /api/sales/:id/lines`     | `POST api/v1/sales/{id}/partnerLine` | Add a partner, dynamically-priced line to an open sale         |

`GET /health` is also exposed for liveness checks.

## 📋 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 4173 (host), 9001 (web component), and 3001 (API) are available. The host uses `strictPort`, so it will fail rather than silently move off 4173 (the API's CORS origin expects `http://localhost:4173`).
2. **Federation Loading**: Remote components must be **built** and running before the host can load them — a remote served by `vite` dev (rather than a build + preview) will not expose a working `remoteEntry.js`. Use `npm run dev:hot:all` or `npm run bp:all`, both of which serve the remote from a build.
3. **CORS Issues**: Use the provided scripts which handle CORS properly
4. **401 / "PST validation failed" on the API**: the PST is valid for 24 hours — get a fresh one into `VITE_PST`. Use **Get PST** on your plugin's page on the Marketplace portal, so the token names your plugin. A **503** with `Retry-After` means the token could not be checked at that moment: retry the same request with the same PST. If claims time out on a cold instance, raise `MARKETPLACE_SESSION_CLAIM_TIMEOUT_MS`.
5. **Checkout screen has no sale**: the plugin only renders once a sale is open — pick products and press **Open sale** first. If opening fails, check `VITE_PST` and `VITE_MARKETPLACE_API_BASE_URL` — the host opens the sale itself, so the partner backend's settings do not affect it.
6. **`ticket.plugin_id_mismatch` (400) on the session claim**: the plugin id you claimed with is not the `plugin_id` inside the PST. The claim must name the plugin the token was issued for, so take the PST from that plugin's page on the Marketplace portal, and leave `PLUGIN_ID` unset (the api-server then claims with the token's own `plugin_id`) or set it to the same value. The `pluginId` your widget passes to `onRequestToken` has no part in this: Acuitas mints the token for the plugin it is hosting, and the shell hands out `VITE_PST` as it stands.
7. **`SELF_SIGNED_CERT_IN_CHAIN` / `unable to get local issuer certificate` from the api-server**: the sample backend verifies TLS certificates, as your production backend must. The sandbox's certificate is valid, so this error means a corporate proxy is re-signing traffic on your network. Trust your system's certificate store instead of turning verification off: start the api-server with `NODE_OPTIONS=--use-system-ca` (Node 22.15+ / 23.8+), or point `NODE_EXTRA_CA_CERTS` at the proxy's root certificate. Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` or `rejectUnauthorized: false`.

### Build Order

When building manually, follow this order:
1. Build the shared package first (`acuitas-shared`) — both the host and the widgets consume it
2. Build the remote components (`web-component`)
3. Build host application (`host-app`)
4. Build mock API application (`api-server`)

---

## 📝 License

Copyright 2026 Ocuco Ltd. Licensed under the [Apache License, Version 2.0](./LICENSE). You can use, change and copy this code, including in your own commercial plugins. Keep the license and the [NOTICE](./NOTICE) file with any copy.

The license does not cover:
- **The Acuitas Design System** (`acuitas-shared/css/acuitas-design-system.css`), which has its own [license](./acuitas-shared/css/LICENSE): you can use it only to build, test and distribute plugins for the Acuitas Marketplace.
- **Ocuco's trademarks**: the Ocuco and Acuitas names and the Ocuco logos. You can say that your plugin is built for Acuitas, but you cannot use the logos in your own plugin or product.
- **The sample images** in `host-app/src/assets/imaging`, which are provided only so that you can run the development kit.

See [NOTICE](./NOTICE) for the details and for the third-party files in this repository.
