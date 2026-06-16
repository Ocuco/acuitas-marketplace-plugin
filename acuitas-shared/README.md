# @acuitas/shared

Shared TypeScript types and design system for Acuitas medical imaging applications.

## Installation

```bash
npm install @acuitas/shared
```

## Usage

### TypeScript Types

Import the plugin interface types for federated components:

```typescript
import { PluginProps, PluginContext, ImagingProps, RemoteConfig } from '@acuitas/shared';

// Use in your federated component
interface MyComponentProps extends PluginProps {
  // Additional component-specific props
}

// Create sample props for testing
import { createSamplePluginProps } from '@acuitas/shared';

const sampleProps = createSamplePluginProps({
  id: 'my-custom-widget',
  name: 'My Custom Medical Widget'
});
```

### Design System CSS

Import the Acuitas design system in your application:

```typescript
// In your main.tsx or index.ts
import '@acuitas/shared/css/design-system.css';
```

Or in your CSS:

```css
@import '@acuitas/shared/css/design-system.css';
```

## API Reference

### PluginProps Interface

The main interface that all federated components should implement:

```typescript
interface PluginProps {
  id: string;                    // Unique plugin identifier
  name: string;                  // Human-readable plugin name
  context: PluginContext;        // Application context
  view: 'MEDICAL_IMAGES';        // View type
  maxWidth: number;              // Maximum width constraint
  maxHeight?: number;            // Optional maximum height
  settings: PluginSettings;      // Plugin-specific settings
  imaging: ImagingProps;         // Medical imaging properties
  onOpenModal: () => void;       // Modal open callback
  onCloseModal: () => void;      // Modal close callback
}
```

### PluginContext Interface

Application context information:

```typescript
interface PluginContext {
  environment: 'SANDBOX' | 'UAT' | 'PRODUCTION';
  customerId: string;
  siteId: string;
}
```

### ImagingProps Interface

Medical imaging specific properties:

```typescript
interface ImagingProps {
  imageIds: string[];  // Array of image identifiers
}
```

### RemoteConfig Interface

Configuration for federated components:

```typescript
interface RemoteConfig {
  url: string;                           // URL to remote module
  name: string;                          // Remote module name
  module: string;                        // Module path to load
  type: 'react' | 'webcomponent';       // Component type
}
```

## Design System

The package includes a comprehensive CSS design system with:

- **Design Tokens**: CSS custom properties for colors, typography, spacing
- **Components**: Buttons, forms, cards, modals, navigation
- **Utilities**: Layout, spacing, typography, color utilities
- **Responsive Design**: Mobile-first breakpoints and responsive utilities
- **Accessibility**: High contrast mode, reduced motion, focus indicators

### CSS Classes

Key utility classes available:

```css
/* Layout */
.d-flex, .d-grid, .d-block
.justify-center, .align-center
.p-sm, .p-md, .p-lg
.mb-sm, .mb-md, .mb-lg

/* Components */
.btn, .btn-primary, .btn-secondary
.card, .card-header, .card-body
.form-control, .form-group

/* Colors */
.text-primary, .text-secondary
.bg-primary, .bg-secondary
```

## Development

To build the package:

```bash
npm run build
```

To watch for changes during development:

```bash
npm run dev
```

## Publishing

This package is configured for a private NPM registry. Update the `publishConfig` in package.json with your registry URL:

```json
{
  "publishConfig": {
    "registry": "http://your-private-npm-registry.com"
  }
}
```

Then publish:

```bash
npm publish
```

## License

ISC
