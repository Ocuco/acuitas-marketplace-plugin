# API Server

A Node.js/Express API server that provides image analysis endpoints for the Acuitas Marketplace Plugin.

## Features

- **GET /api/images/:identifier** - Retrieve image data by identifier from Acuitas Marketplace API
- **GET /api/images** - List available images (optional endpoint for testing)
- Bearer token authentication
- CORS support for web component integration
- Error handling and logging
- TypeScript support

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `PORT` - Server port (default: 3001)
   - `ACUITAS_API_BASE_URL` - Acuitas Marketplace API base URL
   - `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### GET /health
Health check endpoint that returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-12T10:00:00.000Z",
  "uptime": 123.456
}
```

### GET /api/images/:identifier
Retrieve image data by identifier from the Acuitas Marketplace API.

**Headers:**
- `Authorization: Bearer <token>` - Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "image-123",
    "fileName": "scan.dcm",
    "url": "https://api.acuitas.com/downloads/...",
    "metadata": { ... }
  },
  "timestamp": "2025-09-12T10:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "timestamp": "2025-09-12T10:00:00.000Z",
    "details": "Additional error details"
  }
}
```

## Integration with Web Component

The API server is designed to work with the `sample-widget` web component. The web component:

1. Requests a token from the host application
2. Calls the API server with the token to retrieve image data
3. Processes the response and dispatches custom events

### Configuration

The web component expects the API URL to be provided in the `settings` property:

```javascript
const widget = document.querySelector('sample-widget');
widget.settings = {
  apiUrl: 'http://localhost:3001'
  // other settings...
};
```

### Custom Events

The web component dispatches these events:

- `image-analysis-complete` - When image data is successfully retrieved
- `image-analysis-error` - When an error occurs during image analysis

## Development

### Project Structure

```
api-server/
├── src/
│   ├── index.ts              # Main server file
│   ├── routes/
│   │   └── images.ts         # Image API routes
│   └── middleware/
│       ├── auth.ts           # Authentication middleware
│       └── errorHandlers.ts  # Error handling middleware
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build directory

## Error Handling

The API includes comprehensive error handling for:

- Missing or invalid authentication tokens
- Acuitas API connection issues
- Invalid image identifiers
- Network timeouts
- Internal server errors

All errors are logged to the console and returned in a standardized format.
