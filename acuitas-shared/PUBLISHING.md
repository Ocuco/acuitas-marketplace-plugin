# Publishing @acuitas/shared to Private NPM Registry

## Setup Instructions

### 1. Configure NPM Registry

First, configure your NPM client to use your private registry for the `@acuitas` scope:

```bash
npm config set @acuitas:registry http://your-private-npm-registry.com
```

### 2. Authentication (if required)

If your private registry requires authentication:

```bash
npm login --registry=http://your-private-npm-registry.com --scope=@acuitas
```

### 3. Build and Publish

```bash
cd acuitas-shared
npm run build
npm publish
```

## Version Management

Update the version before publishing:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)  
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

## Installing in Other Projects

Once published, install in your projects:

```bash
npm install @acuitas/shared
```

## Usage in Projects

### Host Application (React)

```typescript
// In main.tsx
import '@acuitas/shared/css/design-system.css';

// In components
import { PluginProps, createSamplePluginProps } from '@acuitas/shared';

const props = createSamplePluginProps({
  id: 'my-widget',
  onOpenModal: handleOpenModal,
  onCloseModal: handleCloseModal
});
```

### Federated Web Components (Lit)

```typescript
// In your web component
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PluginContext, PluginSettings, ImagingProps } from '@acuitas/shared';
import '@acuitas/shared/css/design-system.css';

@customElement('my-widget')
export class MyWidget extends LitElement {
  @property({ type: Object })
  context: PluginContext = { environment: 'SANDBOX', customerId: '', siteId: '' };
  
  @property({ type: Object })
  settings: PluginSettings = {};
  
  @property({ type: Object })
  imaging: ImagingProps = { imageIds: [] };
}
```

## Migration From Existing Projects

### Step 1: Install the shared package
```bash
npm install @acuitas/shared
```

### Step 2: Replace local type definitions
Remove local `PluginProps`, `PluginContext`, etc. type definitions and import from shared package.

### Step 3: Replace CSS imports
Replace local CSS imports with:
```typescript
import '@acuitas/shared/css/design-system.css';
```

### Step 4: Update component implementations
Use the shared types and utilities instead of local definitions.

## Changelog

### Version 1.0.0
- Initial release
- PluginProps interface for federated components
- Acuitas design system CSS
- Sample props factory function
- TypeScript declarations
