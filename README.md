# ClothSwap

Transform your look instantly with AI-powered clothing swapping.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Or manually edit .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_webhook_url_here
```

**NEXT_PUBLIC_N8N_WEBHOOK_URL**: The webhook endpoint URL for processing clothing swaps.
- If empty or not set, the app will run in simulation mode with a placeholder result.
- Set this to your n8n webhook URL when ready to process real requests.

## API Integration

### Webhook Payload

The application sends a FormData payload with these exact keys:

- `source_image` (required): The person's photo file
- `reference_garment` (optional): Reference clothing item image file  
- `prompt` (optional): Text description of desired garment

### Expected Response Format

The webhook should return JSON in one of these formats:

```json
{ "image_url": "https://example.com/result.jpg" }
```

```json
{ "result": { "image_url": "https://example.com/result.jpg" } }
```

```json
{ "outputUrl": "https://example.com/result.jpg" }
```

The application will automatically detect and extract the image URL from any of these response structures.

## Features

- ✅ Dual image upload (source photo + optional reference garment)
- ✅ Optional text prompt for garment descriptions
- ✅ File validation (10MB limit, image MIME types only)
- ✅ Responsive design (mobile-friendly)
- ✅ State management (idle → uploading → processing → done/error)
- ✅ Result display with download functionality
- ✅ Error handling for network failures and invalid responses
- ✅ Simulation mode when webhook URL is not configured

## File Constraints

- Maximum file size: 10MB
- Accepted formats: All image types (image/*)
- Source image is required, reference garment is optional

## Development

The app uses Next.js 14+ with App Router, TypeScript, and Tailwind CSS. All components are client-side components for real-time interactivity.

To test without a webhook:
1. Leave `NEXT_PUBLIC_N8N_WEBHOOK_URL` empty in `.env.local`
2. The app will simulate processing and show a placeholder result

## Health Check

Optional health check endpoint available at `/api/health`.