# Acuitas Marketplace Plugin Development solution

This solution offers third party developers an environment to develop their own Actuitas Marketplace Plugin in isolation before submitting it for review. 

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
- **Host App** (`host-app/`): Acuitas PMS shell application that dynamically loads plugins
- **Web Component** (`web-component/`): Pure Lit-based sample web component with federation support (no React dependencies)
- **API Server** (`api-server/`): Sample backend API that showcases how to claim a Plugin Session on the Marketplace API and get an image by its identifier using the PST

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

#### Required environment variables
- `VITE_PST`: Required for the `web-component` project and must contain the value of the Plugin Session Token retrieved from the Marketplace Developer portal. These tokens will be valid for 24 hours for development purposes.
- `PLUGIN_ID`: Required for the `api-server` project, the identifier of the plugin you're developing. You'll be assigned a plugin identifier by Ocuco, it will be available on the Marketplace Developer portal.
- `ACUITAS_API_BASE_URL`: The public Acuitas Marketplace API url

These environment can either be set per project using `.env` files, or set on the workstation itself. 

### Module Federation Flow

1. **Web Component Remote**: Exposes pure web components (Lit) via federation
2. **Host Application**: 
   - Dynamically imports remote components
   - Provides React wrapper for web components (`WebComponentWrapper.tsx`)
   - Handles component communication via props and callbacks

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

1. **Port Conflicts**: Ensure ports 5173, 4173, and 9001 are available
2. **Federation Loading**: Remote components must be built and running before host can load them
3. **CORS Issues**: Use the provided scripts which handle CORS properly

### Build Order
When building manually, follow this order:
1. Build remote components first (`react-component`, `web-component`)
2. Build host application (`host-app`)
3. Build mock API application (`api-server`)

---

## 📝 License

This is a proof of concept project for demonstration purposes.
