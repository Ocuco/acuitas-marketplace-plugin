# Acuitas Marketplace Plugin Development solution

This solution offers third party developers an environment to develop their own Actuitas Marketplace Plugin in isolation before submitting it for review. 

## 🏗️ Project Structure

```
vite-mf-poc/
├── host-app/              # Main host application (React + TypeScript)
├── web-component/         # Remote Web component using Lit (Remote B)
├── package.json          # Root workspace configuration
└── README.md             # This file
```

### Applications Overview

- **Acuitas Shared** (`acuitas-shared/`): Contains the plugin props type definition and Acuitas design system CSS
- **Host App** (`host-app/`): Acuitas PMS shell application that dynamically loads plugins
- **Web Component** (`web-component/`): Pure Lit-based sample web component with federation support (no React dependencies)

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

#### Option 1: Run All Projects (Recommended)
```bash
npm run bp
```
This command will:
- Build and start all three applications simultaneously
- Host app will be available at `http://localhost:4173`
- React component at `http://localhost:4173` 
- Web component at `http://localhost:4173`

#### Option 2: Development Mode (All Projects)
```bash
npm run dev:all
```
Runs all projects in development mode with hot reloading.

#### Option 3: Individual Project Control
```bash
# Run individual projects
npm run bp:host        # Host app only
npm run bp:web         # Web component only

# Development mode for individual projects
npm run dev:host       # Host app dev mode
npm run dev:web        # Web component dev mode
```

## 🔧 Available Scripts

### Root Level Scripts
- `npm run bp` - Build and preview all projects
- `npm run dev:all` - Run all projects in development mode
- `npm run build:all` - Build all projects in correct order
- `npm run install:all` - Install dependencies for all projects

### Individual Project Scripts
Each project (`host-app`, `react-component`, `web-component`) includes:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run bp` - Build and preview (build + preview combined)

## 🌐 Port Configuration

- **Host App**: `http://localhost:5173` (dev) / `http://localhost:4173` (preview)
- **Web Component**: `http://localhost:9002` (both dev and preview)

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

1. **Port Conflicts**: Ensure ports 5173, 4173, and 9002 are available
2. **Federation Loading**: Remote components must be built and running before host can load them
3. **CORS Issues**: Use the provided scripts which handle CORS properly

### Build Order
When building manually, follow this order:
1. Build remote components first (`react-component`, `web-component`)
2. Build host application last (`host-app`)

---

## 📝 License

This is a proof of concept project for demonstration purposes.
