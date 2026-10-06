# Using @acuitas/shared

`@acuitas/shared` is **not published** to npm or to any registry. It is marked `"private": true` so it cannot be
published by accident. Projects consume it **by path** from a clone of this repository:

```json
{
  "dependencies": {
    "@acuitas/shared": "file:../acuitas-shared"
  }
}
```

Build it once after cloning, or after changing it (`npm run install:all` at the repository root does this):

```bash
cd acuitas-shared
npm install
npm run build
```

If Ocuco decides to publish the package, this file is where the registry and the publishing steps will be
documented, and `"private": true` will be removed.

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
